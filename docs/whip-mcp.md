---
id: whip-mcp
title: MCP & Agent Skills
sidebar_label: 🤖 MCP & Agent
sidebar_position: 6
---

# MCP & Agent Skills

> Cái làm Whip "agentic": [Command API](./whip-api.md) expose ra thành **MCP tools**.
> Agent đọc project, gọi command, engine cập nhật — không phải chat, là **execute**.
> Cover 2 use case: production complex (thay AE) và short-form viral (thay CapCut).

---

## MCP server = Command registry auto-gen

```
command registry (zod schema)
        │
        ├─→ TS types        (GUI autocomplete)
        ├─→ JSON schema     ──▶  MCP tool list
        └─→ command bus          (1 command = 1 tool, schema = input schema)
```

Thêm command → tự có MCP tool. Không maintain 2 nơi. Cùng triết lý
"[1 schema → MCP + REST + UI](./ontology-kinetic.md)" của Ontos.

---

## Hai chế độ chạy

```
┌─ Chế độ A: Browser (live editing) ─────────────────────────────┐
│  Whip đang mở → MCP server chạy trong SharedWorker             │
│  Claude Code / agent attach qua stdio hoặc WebSocket           │
│  → agent và user cùng nhìn 1 timeline, thay đổi realtime       │
└─────────────────────────────────────────────────────────────────┘

┌─ Chế độ B: Headless (batch / CI) ──────────────────────────────┐
│  Engine chạy không UI (Node + headless WebCodecs/canvas)       │
│  load .whip → commands → render() → xuất mp4                   │
│  → "cắt 100 clip từ 100 transcript" hoàn toàn tự động          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tool surface đầy đủ

```
# ── Đọc trạng thái (agent cần đọc trước khi làm) ─────────────────
whip.get_project()
  → project.whip hiện tại (đầy đủ)
  
whip.get_timeline_summary()
  → { duration, trackCount, clips: [{id,label,start,end,hasCaption,hasBehavior}],
      gaps: [{start,end}], totalSilence: number }
  → KHÔNG dump toàn bộ JSON — tiết kiệm token

whip.get_transcript(clipId)
  → { blocks: [{text, start, end, speakerId, words:[]}] }
  → dùng để phân tích nội dung trước khi ra quyết định

whip.get_clip_detail(clipId)
  → { asset, effects[], behaviors[], keyframes_summary, speed, blend }

# ── "Whip It" editorial pipeline (F11) ───────────────────────────
whip.whip_it({ recipe? })
  → trigger full AI editorial pipeline:
    transcript → LLM Art Director → CompositionBrief
    → asset gen (Seedream/Recraft) → RMBG → overlay → behaviors → animate
  → recipe: "iman_editorial" | "hormozi_bold" | "ali_clean"
             | "mrbeast_energy" | "gawx_cinematic"
  → returns: { compositionsCreated: number, assetsGenerated: number }

whip.set_style_profile({ recipeId? } | { refVideoId? })
  → extract StyleProfile từ 5 frames của reference video (vision LLM)
  → hoặc set từ recipe preset

whip.generate_asset({ description, style?, type: "raster"|"vector" })
  → Seedream 5.0 (raster) / Recraft (vector) + RMBG nếu raster
  → returns: { assetId, previewUrl }

whip.remove_background(assetId)
  → local RMBG WebGPU → transparent PNG
  → returns: { assetId }  (asset mới, giữ original)

whip.magic_mask(clipId, { x, y, frameT? })
  → SAM2 segment + track → returns { maskId }
  → dùng maskId cho: pin_overlay_to_mask, replace_background, callout_arrow

whip.pin_overlay_to_mask(overlayClipId, maskId)
  → overlay tự track theo mask bounding box qua toàn clip

whip.replace_background(clipId, maskId, { replacement })
  → replacement: "blur" | "#color" | { assetId }

whip.apply_composition(compositionJson)
  → apply CompositionBrief array vào timeline

# ── Smart animation (tầng chính — bind motion vào nội dung) ──────
whip.bind_region(clipId, { from, to, label? } | { transcript })
whip.add_cue(clipId, { t, kind })
whip.add_behavior(targetClipId, type, { bind, params })
whip.set_behavior_param(behaviorId, key, value)
whip.bake_behavior(behaviorId)

# ── Timeline ──────────────────────────────────────────────────────
whip.add_clip / split_clip / trim_clip / move_clip
whip.ripple_delete / duplicate_clip / group_clips
whip.reframe_for_aspect(clipId, aspect, { subject? })
whip.reframe_project(aspect, { subject? })

# ── Compositing (AE-level) ────────────────────────────────────────
whip.set_blend_mode(clipId, mode)   # screen|multiply|overlay|add|soft_light
whip.add_effect(clipId, type, params)
whip.set_effect_param(clipId, effectId, key, value)   # value có thể là Keyframe[]
whip.set_mask(clipId, maskId)

# ── Caption ───────────────────────────────────────────────────────
whip.auto_captions(clipId, { language?, speakerLabels? })
whip.import_captions(trackId, assetId)         # import SRT/VTT
whip.export_captions(captionTrackId, format)   # srt | vtt | txt
whip.translate_captions(captionTrackId, lang)  # tạo track mới
whip.set_caption_style(captionTrackId, stylePack)

# ── Audio ─────────────────────────────────────────────────────────
whip.set_speed(clipId, factor)
whip.set_speed_ramp(clipId, keyframes)         # [{t,speed}]
whip.set_pitch_lock(clipId, enabled)           # giữ pitch khi speed thay đổi
whip.auto_duck(musicClipId, voiceTrackId, { duckDb, attackMs, releaseMs })
whip.add_audio_fx(clipId, { type: "eq"|"compressor"|"noiseRemoval"|"limiter", ...})

# ── Low-level overrides ───────────────────────────────────────────
whip.set_keyframe / remove_keyframe / copy_keyframes
whip.apply_preset / set_ease
whip.add_transition

# ── Xuất ─────────────────────────────────────────────────────────
whip.render({ range?, out, preset, watermark? })
```

---

## Agent Skills — composite workflows

Skills = compose nhiều command primitive. Agent dùng skill thay vì rải từng lệnh.
**Không rải keyframe** — tạo anchors + behaviors → compiler lo keyframe.

### Skills short-form viral (thay CapCut)

| Skill | Làm gì | Implementation |
|---|---|---|
| `autoCaptions` | Caption word-by-word + SmartLink | Deepgram → `bind_region` per word |
| `autoCutOnSilence` | Cắt dead air, dồn pacing | VAD → `split_clip` + `ripple_delete` |
| `autoPunchIn` | Punch zoom mỗi điểm nhấn (Ali Abdaal look) | emphasis cue → `add_behavior(punchOnEmphasis)` |
| `beatSync` | Snap cut / zoom vào beat nhạc | DSP beat map → `add_behavior(beatPulse)` |
| `autoDuck` | Hạ nhạc khi có giọng nói | VAD → `set_gain_automation` nhạc |
| `autoReframe9x16` | Reframe sang 9:16 giữ mặt | MediaPipe face → `reframe_for_aspect` |
| `whipItViralShort` | 1-click: caption + zoom + graphic + music duck | `whip_it` + `auto_duck` + `set_speed_ramp` |

### Skills production complex (thay AE)

| Skill | Làm gì | Implementation |
|---|---|---|
| `autoZoomOnMention` | Zoom in khi đề cập đến X | transcript match → `bind_region` + `add_behavior(zoomToRegion)` |
| `autoSequenceGraphics` | Graphic 1-2-3 map theo đoạn nói | region → `add_behavior(sequenceReveal)` |
| `autoReframe` | Giữ speaker giữa frame khi zoom | MediaPipe → `add_behavior(followSubject)` |
| `applyLook` | Apply Gawx / Ali Abdaal / Hormozi look | `add_effect(colorCorrect)` + `add_effect(bloom)` + ... |
| `brollComposite` | B-roll overlay với opacity fade trên talking head | `add_clip(overlay)` + opacity keyframes + `set_blend_mode` |
| `calloutTracker` | Callout arrow bám vật thể khi camera di chuyển | `magic_mask` → `pin_overlay_to_mask` |
| `virtualBackground` | Thay nền (virtual bg) | `magic_mask(speaker)` → `replace_background` |

---

## Production workflow examples

### Workflow 1 — Editorial talking-head (AE-level)

> *"Grade cinematic Gawx, thêm callout vào laptop lúc 48s, reframe về 9:16 cho Reels"*

```
1. get_timeline_summary()
   → { duration: 142, clips: [{id:"c1", start:0, end:142}], ... }

2. get_transcript("c1")
   → xem nội dung, xác định sections

3. applyLook("c1", "gawx_cinematic")
   → add_effect(c1, "colorCorrect", { saturation:0.85, liftB:-0.02 })
   → add_effect(c1, "filmGrain",    { amount:0.15 })
   → add_effect(c1, "bloom",        { threshold:0.75, intensity:0.3 })

4. magic_mask("c1", { x: 0.62, y: 0.45, frameT: 48.2 })
   → { maskId: "mask_laptop" }

5. apply_composition([{
     type: "callout_arrow", t: 48, duration: 5,
     data: { text: "MacBook Pro M4", direction: "left" },
     maskId: "mask_laptop"
   }])

6. reframe_for_aspect("c1", "9:16", { subject: "face" })

7. render({ out: "final_9x16.mp4", preset: "h264_1080" })
```

---

### Workflow 2 — Short-form viral từ 1h podcast (CapCut-level)

> *"Lấy 5 đoạn hay nhất từ podcast 1 giờ, 9:16, caption loud, Hormozi style"*

```
1. auto_captions("c1", { speakerLabels: true })
   → transcript đầy đủ với SPEAKER_00 / SPEAKER_01

2. auto_cut_on_silence("c1", { threshold: -40, minSilence: 0.4 })
   → cắt 40 đoạn dead air, tiết kiệm ~8 phút

3. get_transcript("c1")
   → agent đọc transcript → chọn 5 hook moments theo criteria:
     (có số liệu, có câu gây tranh cãi, có revelation, có before/after, có CTA)

4. for each moment [0:45-1:45, 18:20-19:10, ...]:
   a. add_clip(trimmed range)
   b. reframe_for_aspect(clip, "9:16", { subject: "face" })
   c. set_caption_style(track, "loud")
   d. set_style_profile({ recipeId: "hormozi_bold" })
   e. whip_it({ recipe: "hormozi_bold" })
   f. auto_duck(music, voice, { duckDb: -14 })
   g. render({ out: "viral_clip_N.mp4" })
```

---

### Workflow 3 — Edge cases phức tạp

#### Multi-speaker interview

```
auto_captions("c1", { speakerLabels: true })
// → SPEAKER_00 (Host) blocks và SPEAKER_01 (Guest) blocks
set_caption_style("cap1", "clean")
// speakerMap: SPEAKER_00 = trắng dưới, SPEAKER_01 = tím trên
// Khi cắt clip: SmartLink chỉ relink blocks của speaker đúng với segment
```

#### Speed ramp viral + caption sync

```
set_speed_ramp("c1", [{ t:5, speed:1 }, { t:5.5, speed:0.3 }, { t:7, speed:1 }])
set_pitch_lock("c1", true)   // audio không bị pitch-down
// Caption system tự detect speedKeys → stretch word timestamps × (1/0.3)
// "Bí mật" bình thường 0.3s → trên timeline thành 1s, vẫn sync miệng
```

#### B-roll compositing (không che speaker hoàn toàn)

```
add_clip("ov1", "a_broll", { start: 18, end: 26 })
set_blend_mode("c_broll", "normal")
set_keyframe("c_broll", "opacity", { t:18, v:0 })
set_keyframe("c_broll", "opacity", { t:18.4, v:0.85, ease:"smooth" })
// 85% opacity → speaker vẫn thấy mờ bên dưới b-roll
// Dùng magic_mask(speaker) → replace_background(blur) nếu muốn tách hoàn toàn
```

#### Import transcript sẵn có (không re-transcribe)

```
// User có sẵn SRT file
import_captions("cap1", "a_srt")
// blocks được fill từ SRT (không có word-level → 1 block = 1 subtitle line)
// SmartLink vẫn set srcAsset + srcIn → survive clip move
// Nếu cần word-level sau: chạy auto_captions() → merge với SRT timing
```

---

## Phân tầng: client vs server (Ontos)

```
CLIENT — free, local, realtime           SERVER (Ontos) — async, có credit
─────────────────────────────────        ─────────────────────────────────
beat_sync (DSP, < 50ms)                  auto_captions   (Deepgram API, $0.06/video)
auto_punch_in (local LLM nhỏ)            whip_it         (full pipeline, $0.30/video)
auto_cut_on_silence (VAD local)          translate_captions (LLM, $0.02/lang)
auto_duck (Web Audio)                    render_cloud    (4K GPU farm, $0.10/min)
set_blend_mode / add_effect              magic_mask_batch (SAM2 server, heavy)
reframe_for_aspect (MediaPipe)
remove_background (RMBG local WebGPU)
```

Skill nhẹ / realtime → client (free). Skill nặng / tốn tiền → action_type Ontos (credit + audit).
Ranh giới này đảm bảo UI luôn 60fps dù AI đang chạy phía sau.
