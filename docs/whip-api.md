---
id: whip-api
title: Command API
sidebar_label: 🔌 Command API
sidebar_position: 5
---

# Command API

> Mọi thay đổi project đi qua **một command layer**. GUI, agent, MCP đều phát cùng command.
> Đây là bản **client-side** của [Kinetic Action Engine](./ontology-kinetic.md) — cùng shape,
> chạy in-memory thay vì Postgres.

---

## Vì sao command là first-class

Nếu để UI sửa thẳng project state, agent và undo sẽ vỡ. Khi mọi mutation là **command có schema**:

```
                    ┌─→ GUI    (nút bấm / kéo handle)
command  ───────────┼─→ Agent  (LLM quyết định)
(1 định nghĩa)      ├─→ MCP    (tool ngoài gọi vào)
                    └─→ REST   (chỉ khi cần server, vd render farm)
```

→ **Undo/redo free** (command log), **agent-safe** (zod validate), **audit** (before/after),
**MCP free** (parameter_schema = MCP input schema). Giống hệt 3-doors của Kinetic.

---

## Command engine — `bus.invoke(cmd, params)`

```
invoke(command_name, params)

 1. RESOLVE   tra command trong registry → không có → {error: unknown_command}
 2. VALIDATE  zod.parse(schema, params) → sai → {error: invalid_params, details}
 3. PRECOND   eval preconditions (clip tồn tại? track đúng kind?)
              sai → {error: precondition, ...}
 4. APPLY     produce(project, draft => { mutate draft }) — Immer, immutable
              push {before, after, cmd, params} vào undo stack
 5. NOTIFY    Zustand emit → Render Engine repaint; (Electron: autosave debounce)
 6. RESULT    {ok, project}  — LỖI: không mutate gì, state nguyên vẹn
```

**Quy tắc:** validate trước, mutate sau. Lỗi giữa chừng → không để lại state nửa vời (Immer lo).
Khác Kinetic ở chỗ: **không có credit/entitlement ở client** — cái đó chỉ áp cho server-side
action (export 4K, AI job) qua Ontos, xem [Ontology Reuse](./whip-ontology-reuse.md).

---

## Command primitives

```ts
// ── timeline ──
addClip(track, asset, { start, in?, end? })
splitClip(clipId, t)
trimClip(clipId, { start?, end?, in? })
moveClip(clipId, track, start)
rippleDelete(clipId)                       // xóa + dồn gap
duplicateClip(clipId)

// ── smart animation (tầng chính — xem whip-behaviors) ──
bindRegion({ from, to } | { transcript: "..." })   // tạo region anchor (derive từ lời nói)
addCue({ t, kind })                        // cue điểm (emphasis…)
addBehavior(target, type, { bind, params })// gắn behavior vào anchor → compiler sinh keyframe
setBehaviorParam(behaviorId, key, value)
removeBehavior(behaviorId)
bakeBehavior(behaviorId)                    // đông cứng → keyframe tay (ngắt khỏi anchor)

// ── transform / animate (low-level — thường là output, hoặc override) ──
setKeyframe(clipId, prop, { t, v, ease })  // override 1 điểm / chỉnh tay
removeKeyframe(clipId, prop, t)
setEase(clipId, prop, t, ease)             // bezier handle (curve editor — khi cần)
applyPreset(clipId, presetId, params)      // smoothZoomIn, whipPan… (preset = behavior cố định)

// ── effects / transitions ──
addEffect(clipId, type, params)
setEffectParam(clipId, effectId, key, value)
addTransition(clipA, clipB, type, duration)

// ── text ──
addText(track, { text, start, end, preset })
setText(clipId, { text?, font?, size?, color? })

// ── speed ──
setSpeed(clipId, factor)                   // 0.5 = slow-mo; ramp = keyframe speed

// ── audio ──
setGain(clipId, db)
setGainAutomation(clipId, keyframes)       // ducking tay
addAudioFx(clipId, { type: "eq"|"compressor"|"limiter", ...params })
detachAudio(clipId)                        // tách audio khỏi video clip

// ── project ──
setCanvas({ resolution, aspect, fps })
undo() / redo()
render({ range?, out, preset })            // export — xem dưới
```

Mỗi command có một zod schema. Registry export ra **TS types** (autocomplete cho GUI) **và**
**JSON schema** (cho MCP) từ cùng một nguồn.

---

## REST (chỉ khi có server)

Phần lớn Whip không cần server. REST chỉ xuất hiện khi tích hợp Ontos:

```
POST /apps/whip/projects                    tạo project (persistence)
GET  /apps/whip/projects/:id                load .whip JSON
PUT  /apps/whip/projects/:id                save (versioned)
POST /apps/whip/projects/:id/share          link share (như NDA của portfolio)

# server-side actions = action_type thật của Ontos (có credit_cost):
POST /apps/whip/actions/render_cloud        render farm 4K (credit_cost)
POST /apps/whip/actions/auto_captions       Whisper job (async, credit_cost)
POST /apps/whip/actions/auto_punch_in       LLM phân tích → trả keyframes
```

→ Các action **client-side** (kéo keyframe) **không** lên server. Các action **nặng/AI/tốn tiền**
mới thành `action_type` Ontos để mượn entitlement + credit + audit. Ranh giới này là cốt lõi —
xem [Ontology Reuse](./whip-ontology-reuse.md).

---

## Undo = audit = agent transparency

Command log không chỉ để undo. Nó là **nhật ký agent đã làm gì**:

```
[12:03:01] applyPreset(c1, smoothZoomIn, {amount:1.1})   ← agent
[12:03:01] addText(txt1, {text:"...", preset:"lowerThird"}) ← agent
[12:03:05] setEase(c1, scale, 2.0, [0.16,1,0.3,1])        ← human chỉnh tay
```

Bạn xem agent cut gì, sửa lại bất kỳ bước nào. Đây là `action_logs` của Kinetic, phiên bản client.
