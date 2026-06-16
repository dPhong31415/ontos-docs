---
id: whip-action-surface
title: Action Surface — 1 cửa cho mọi input
sidebar_label: 🎯 Action Surface
sidebar_position: 5
---

# Action Surface — Target thống nhất + Capability registry

> **Vấn đề gốc (Phong, 16/06/2026):** Whip có cả chục module mạnh (analyze-reference, sample-analyze,
> script-graphics, score-moment, scene-vlm…) nhưng **chả ở đâu trong UI/UX để xài**. Mỗi module bị khoá cứng
> vào 1 flow (Whip It button / phải click vô source). Cần **1 module dùng được nhiều LOẠI + SỐ LƯỢNG input**.

> **Quyết định:** dựng **Action Surface** làm xương sống — capability không còn mồ côi. Đây cũng chính là
> bề mặt MCP (Moat #3): đăng ký 1 lần → vừa cho người (UI), vừa cho agent (tool).

---

## 1. Nguyên tắc

1. **Mọi input quy về 1 `Target`.** Người dùng chọn gì cũng được (clip, cut, source-range, nhiều clip, region) — engine chỉ thấy 1 hình dạng.
2. **Mỗi capability tự khai báo** `accepts(target)` + `run(target)`. Không hard-wire vào flow.
3. **Một registry, nhiều cửa.** Context-menu, Cmd+K palette, Actions panel — đều đọc cùng registry.
4. **Registry = MCP tool list.** Cùng metadata phục vụ cả UI lẫn agent (Moat #3).
5. **Selection có sẵn → Target resolver**, không đẻ hệ chọn mới (reuse `selection[]`, `selectedSemId`, marquee).

---

## 2. Target model

Mọi selection/input resolve về:

```ts
type TargetKind = "clip" | "range" | "source" | "multi" | "region" | "timeline";

interface Target {
  kind: TargetKind;
  clipIds?: string[];        // clip | multi
  assetId?: string;          // source (asset gốc) — sống sót khi xoá clip
  srcStart?: number;         // source-time (sample mark-in) — neo theo NGUỒN, ko theo clip
  srcEnd?: number;           // source-time (sample mark-out)
  tStart?: number;           // timeline-time (range/region)
  tEnd?: number;
}
```

Phủ đủ các ca Phong nêu:
- **1 clip** → `{kind:"clip", clipIds:[id]}`
- **1 đoạn cut trong timeline** → `{kind:"range", clipIds:[id], tStart, tEnd}`
- **Sample (mark in/out trên source)** → `{kind:"source", assetId, srcStart, srcEnd}` ← neo nguồn ⇒ xoá clip vẫn còn (xem [[whip-data-model]])
- **Nhiều clip cùng lúc** → `{kind:"multi", clipIds:[…]}`
- **Region / cả timeline** → `{kind:"region"|"timeline", tStart, tEnd}`

### Selection → Target resolver
`resolveTarget(state): Target` đọc state hiện có:
- `selection.length===1` → `clip`; `>1` → `multi`.
- `selectedSemId` (SEM pill) → `source` (assetId + span srcStart/srcEnd).
- previewSource + mark in/out → `source`.
- marquee range / region → `range`/`region`.

→ **Marquee (#6) trở thành 1 input của resolver**, không phải feature lẻ.

---

## 3. Capability registry

```ts
interface Capability<R = unknown> {
  id: string;                         // "analyze.reference" | "sample.analyze" | "graphics.fromScript"
  label: string;                      // hiện UI
  group: "analyze" | "generate" | "edit" | "style";
  accepts: (t: Target) => boolean;    // lọc action hợp lệ theo selection
  inputSchema?: JSONSchema;           // = schema MCP tool (Moat #3)
  run: (t: Target, ctx: Ctx) => Promise<R>;
}

const registry = new Map<string, Capability>();
export function registerCapability(c: Capability) { registry.set(c.id, c); }
export function capabilitiesFor(t: Target) { return [...registry.values()].filter((c) => c.accepts(t)); }
```

Mỗi module hiện có **đăng ký 1 lần** → tự xuất hiện ở mọi cửa + cho agent.

---

## 4. Module → Capability (migration map)

| Module hiện có | Capability id | accepts | Ghi chú |
|---|---|---|---|
| analyze-reference | `analyze.reference` | clip/source video | "Build like this" thành action, ko chỉ nút |
| (sample) phân tích đoạn | `sample.analyze` | source (mark in/out) | neo nguồn — Phong: xoá clip vẫn còn |
| script-graphics (#17) | `graphics.fromScript` | clip/source/timeline có caption | hook + graphic cue |
| score-moment | `moment.score` | range/clip | chọn frame đắt trong đoạn |
| scene-vlm / ground | `semantic.ground` | source/clip | hiểu nghĩa cảnh |
| broll-intent | `broll.suggest` | clip/region | chỗ chèn b-roll |
| addPainStack | `graphics.painStack` | timeline (đặt @playhead) | preset GRAPH (Source+Repeater+Fill), KHÔNG còn template cứng — xem `whip-vector.md` |
| vector SOP (P3) | `graphics.vector` | clip/shape (Target hạng nhất) | addNode/setParam/connect/editPath — agent author graph; xem `whip-vector.md` |
| **Whip It (flagship)** | `story.whip` | timeline/clip/source/multi | chạy pipeline sẵn (trigger autoWhipReq); nút to = shortcut |

→ Sample, caption-graphics, marquee **không còn mồ côi** — chúng là `accepts` + `run` cắm vào registry.

### Unify loading: 1 HUD duy nhất (ActionRun)
Mọi capability dài (gồm **Whip It**) dùng CHUNG `ActionRun` HUD (`ActionStatus.tsx`): multi-step (done✓/active/pending) +
note + nút **Stop** (= `actionCancel`/abort) + non-blocking (palette đóng ngay, cue/caption hiện DẦN). Whip It mirror
phase/status/flow/ground → ActionRun (mascot orb + b-roll thumbnail giữ nguyên). Bỏ WhipItOverlay riêng → hết 2 hệ loading.
`CapCtx { signal, progress({step,note}) }` truyền vào `run()`.

---

## 5. UI surfaces (cùng 1 registry)

1. **Right-click** lên selection → `capabilitiesFor(target)` → menu (chỉ action hợp lệ).
2. **Cmd+K command palette** → search mọi capability, chạy trên `resolveTarget()`.
3. **Actions panel** (right panel) → phản ánh target hiện tại + nút action theo `group`.

Bám [[whip-ux-map]]: action nặng → progress thật, undo gộp, đặt đúng chỗ.

---

## 6. MCP mapping (Moat #3)

`Capability.inputSchema` = JSONSchema của MCP tool. Một adapter xuất `registry` → MCP tool list:
agent gọi `sample.analyze({assetId, srcStart, srcEnd})` **đúng y** action người bấm. Xem [[whip-mcp]].

---

## 7. Phased build

- **P0 — Lõi:** `Target` + `resolveTarget` + `registry` + `capabilitiesFor`. (Thuần, test headless.)
- **P1 — Cmd+K palette** chạy trên target; cắm 2-3 capability thật (analyze.reference, graphics.fromScript, sample.analyze).
- **P2 — Right-click context menu** + Actions panel.
- **P3 — MCP adapter** (registry → tool list) cho agent.
- **P4 — Migrate** mọi module rời vào registry; gỡ flow hard-wire.

---

## 8. Liên kết moat
- **Moat #1** (semantic): Target `source` neo theo nguồn → action sống trên graph, ko theo clip.
- **Moat #3** (agent/MCP): registry = tool list → người & agent dùng chung capability.
- Chống phân mảnh: "nhiều module vô hình" → **1 cửa, nhiều input** = thứ Phong yêu cầu.
