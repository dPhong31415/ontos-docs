---
id: whip-mcp
title: MCP & Agent Skills
sidebar_label: 🤖 MCP & Agent
sidebar_position: 6
---

# MCP & Agent Skills

> Cái làm Whip "agentic": [Command API](./whip-api.md) expose ra thành **MCP tools**. Claude Code
> (hoặc agent bất kỳ) đọc `project.whip`, gọi command, engine cập nhật. Cùng mô hình
> [Ontology Agent & MCP](./ontology-agent-mcp.md).

---

## MCP server = Command registry, không viết tay

Vì mỗi command đã có zod schema, MCP server **auto-gen** từ registry:

```
command registry (zod)
        │
        ├─→ TS types        (GUI autocomplete)
        ├─→ JSON schema     ──┐
        └─→ command bus       │
                              ▼
                    MCP tool list  (1 command = 1 tool, schema = input schema)
```

Thêm một command → tự có MCP tool, agent thấy ngay. Không maintain tool list riêng. Đây đúng là
insight "[1 parameter_schema → MCP + REST + UI](./ontology-kinetic.md)" của Ontos áp vào client.

---

## Hai chế độ chạy MCP

```
┌─ Chế độ A: Desktop (Electron) ─────────────────────────────┐
│  Whip mở project → expose MCP server local (stdio/ws)      │
│  Claude Code attach → gọi tool → engine repaint trực tiếp  │
│  → agent và bạn cùng nhìn một timeline, realtime           │
└────────────────────────────────────────────────────────────┘

┌─ Chế độ B: Headless (CI / batch) ──────────────────────────┐
│  Engine chạy không UI (Node + headless WebCodecs/canvas)   │
│  Agent: load .whip → commands → render() → xuất mp4        │
│  → "cut 50 video từ 50 transcript" tự động                 │
└────────────────────────────────────────────────────────────┘
```

---

## Tool surface (MCP)

```
# đọc trạng thái
whip.get_project()                  → project.whip hiện tại (agent "nhìn" timeline)
whip.get_timeline_summary()         → tóm tắt token-nhẹ: clip, cut, duration, gaps
whip.get_transcript(clipId)         → transcript + timestamp (sau autoCaptions)

# smart animation (tầng chính agent dùng — bind motion vào nội dung)
whip.bind_region / add_cue / add_behavior / set_behavior_param / bake_behavior

# mutate low-level (= Command API, mỗi command 1 tool)
whip.add_clip / split_clip / trim_clip / move_clip / ripple_delete
whip.set_keyframe / apply_preset / set_ease     # override khi cần tay
whip.add_effect / add_transition / add_text / set_speed
whip.set_gain / set_gain_automation / add_audio_fx

# skill cấp cao (compose anchors + behaviors — xem dưới)
whip.auto_zoom_on_mention / auto_punch_in / auto_sequence_graphics
whip.auto_cut_on_silence / beat_sync / auto_captions / auto_reframe / auto_duck

# xuất
whip.render({ range?, out, preset })
```

`get_timeline_summary` quan trọng: agent **không** nuốt cả JSON khổng lồ mỗi lần — nó đọc bản
tóm tắt token-nhẹ, chỉ zoom vào clip cần sửa. (Pattern materialized-view của Ontos.)

---

## Agent skills — magic cho talking-head

Skill = **compose nhiều command primitive**. Đây là chỗ Whip vượt mọi NLE:

Skill **không rải keyframe** — nó tạo **anchors + behaviors** ([Smart Animation](./whip-behaviors.md)),
compiler lo keyframe. Agent làm việc ở tầng *ý nghĩa*:

| Skill | Làm gì | Dùng gì (tầng behavior) |
|---|---|---|
| `autoZoomOnMention` | nhắc tới gì → zoom in, nói xong → zoom out | transcript match → `bindRegion` + `addBehavior(zoomToRegion)` |
| `autoCutOnSilence` | cắt khoảng lặng, dồn pacing | VAD / transcript → `splitClip` + `rippleDelete` |
| `autoPunchIn` | punch vào mỗi điểm nhấn (look Abi Abdallah) | emphasis cue → `addBehavior(punchOnEmphasis)` |
| `autoSequenceGraphics` | map graphic 1-2-3 theo đoạn nói | region → `addBehavior(sequenceReveal)` |
| `beatSync` | snap cut/zoom vào beat | beat anchor → `addBehavior(beatPulse)` |
| `autoCaptions` | caption word-by-word | Whisper → `addText` + cue mỗi chữ |
| `autoReframe` | giữ speaker giữa khung khi zoom | MediaPipe → `addBehavior(followSubject)` |
| `autoDuck` | hạ nhạc dưới giọng nói | VAD voice → `setGainAutomation` nhạc |

> **Vì sao behavior là giao diện tự nhiên cho agent:** agent gắn ~5 behavior (đọc được, review được)
> thay vì phát `setKeyframe` × 200 (dễ sai, không review nổi). Bạn duyệt ở tầng "zoom khi nói về X",
> không phải bảng keyframe.

**Workflow thật:**
> *"Import interview này, cắt dead air, punch-in mỗi ý mới, thêm caption, sync b-roll vào beat"*
> → agent phát ~40 command đã validate → bạn fine-tune trong GUI.

---

## Phân tầng: skill nào client, skill nào Ontos

```
CLIENT (free, local, realtime)        ONTOS (async, có credit, server)
────────────────────────────         ─────────────────────────────────
beatSync (beat detect đủ nhẹ)         autoCaptions  (Whisper — nặng, $)
autoPunchIn (LLM nhỏ, local)          autoReframe   (MediaPipe batch)
autoCutOnSilence (VAD nhẹ)            render_cloud  (4K render farm, $)
autoDuck                              → action_type, credit_cost, audit
```

Skill nặng/tốn tiền (transcribe, face-track batch, cloud render) → thành **action_type Ontos**
để mượn billing + entitlement. Skill nhẹ realtime → ở client. Ranh giới: [Kiến trúc](./whip-architecture).
