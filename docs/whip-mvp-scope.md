---
id: whip-mvp-scope
title: MVP Status & Roadmap
sidebar_label: ✅ MVP & Roadmap
sidebar_position: 5
---

# MVP Status & Roadmap

> Audit thật sự từ codebase — không chung chung. Mỗi tính năng có test case cụ thể, edge case nào chưa xử lý, và gap nào cần fix trước launch.

---

## 1. Timeline Interactions

### ✅ Hoạt động tốt
- **Drag clip**: Kéo clip sang trái/phải, cross-track (video↔video, audio↔audio), giữ nguyên in-point
- **Trim cạnh clip**: Kéo 8px cạnh trái/phải, hiện bracket khi đụng src boundary (`atSrcStart`/`atSrcEnd`)
- **Snap to clip edges + playhead**: Ngưỡng 8px, có toggle bật/tắt, `magnetMain` mode ưu tiên track V1
- **Multi-select**: Shift+click additive, marquee 2D (kéo vùng chọn), group move giữ relative positions
- **Zoom/pan**: Cmd+wheel zoom trục time (giữ cursor), Shift+wheel pan ngang, middle-button pan
- **Keyboard**: B/W = razor split all, Cmd+K = split selected, Q = trim left, E = trim right
- **Ripple delete khi split/cut**: Hoạt động khi `rippleEnabled = true`
- **Playhead click**: Click ruler để set playhead, Cmd+click snap

### ⚠️ Partial
- **Group drag**: Chỉ cùng track kind — không thể kéo nhóm video+audio cùng lúc sang track khác
- **Ripple trim**: Ripple chỉ chạy khi **split/cut**, KHÔNG chạy khi **trim cạnh clip** — đây là gap lớn
- **Waveform scroll**: Hiện chỉ clip trong viewport, không optimize infinite scroll

### ❌ Chưa có — cần cho launch
| Gap | Impact | Ưu tiên |
|---|---|---|
| Snap to beat / BPM grid | Creator hay dùng khi sync nhạc | P1 |
| Multi-clip trim | Không thể trim nhiều clip cùng lúc | P1 |
| Slip/slide (trim 2 cạnh giữ độ dài) | Workflow pro cơ bản | P1 |
| Right-click context menu (cut/copy/paste/disable) | UX cơ bản | P1 |
| Cmd+C/Cmd+V copy-paste clip | Mọi editor đều có | P1 |
| Cmd+Z / Cmd+Shift+Z undo/redo keybindings | **Undo/redo có trong store nhưng không có shortcut** | P0 🔴 |
| Marker/cue hiển thị trên ruler | project.cues tồn tại nhưng không render | P2 |
| Disabled clip dimming trên timeline | toggleClipDisabled hoạt động nhưng không có visual feedback | P2 |
| Track lock | Tránh edit nhầm | P2 |
| Link/unlink audio track | detachAudio có, reattach không có | P2 |
| Drag source từ MediaPool tự tạo track mới | Phải tạo track tay rồi mới drag vào | P1 |

---

## 2. Store / Command System

### ✅ Hoạt động tốt
86 actions, tất cả implement bằng Immer draft + gesture-based undo grouping. Các nhóm đều đủ:
- Clip manipulation, keyframe, caption, behavior, track, project — xem [`store.ts`](https://github.com/dPhong31415/whip)

### ❌ Chưa có
| Gap | Ghi chú |
|---|---|
| `copyClips` / `pasteClips` | Clipboard chưa implement |
| `selectAll` / `deselectAll` | Chỉ có `clearSelection` |
| `setProjectDuration` | Duration tự tính từ clip cuối, không set tay được |
| Auto-relink caption khi clip di chuyển | `relinkCaptionsToAudio` tồn tại nhưng phải gọi thủ công |

---

## 3. Engine Render (Compositor)

### Test cases ✅ pass được
- 1 video clip + transform keyframe (scale/position/rotation/opacity) → render đúng
- Text clip với font/size/color/weight/letterSpacing/stroke/gradient/shadow/glow → đúng
- Shape clip (rect/ellipse/background) với fill + stroke → đúng
- Per-glyph stagger reveal (staggerReveal, glyphBlurIn, glyphSpringUp) → đúng
- Overlay (caption/super/disclaimer) timed text → đúng
- Speed constant (0.25x → 4x) → render đúng cả export lẫn preview
- Speed ramp (speedKeys) → **render và export đúng** (dùng Simpson rule integration)
- Effect stack (bloom, film grain, chromatic aberration, vignette, color correct, light leak, lens distortion) → đúng
- Constraint "Pin to" clip khác → đúng per-frame
- Hidden/disabled clip → bị skip đúng

### ⚠️ Edge cases chưa xử lý
- **zoomBlur**: Dùng uniform blur thay vì radial zoom blur thật → blur không đúng hướng khi camera zoom
- **lensDistortion**: Sampling ngoài biên = black → clip viền thay vì wrap/extend
- **colorCorrect `liftBlacks`**: Map về `brightness(1 + v)` — approximate, không phải DaVinci-style lift curve
- **Effect params**: Tất cả effects **static** — không keyframe được (không thể animate `bloom.intensity` over time)

### ❌ Chưa có
| Gap | Impact |
|---|---|
| Blend modes per-clip (multiply, screen, overlay...) | Motion graphic cơ bản |
| Shadow/drop-shadow per-clip (không phải chỉ text) | Layering |
| Effect keyframing (animate param theo thời gian) | Dynamic look |
| Motion blur | Fast motion strobing |
| Nested composition (pre-comp) | Complex scene management |
| Real-time effect preview khi kéo slider | UX — hiện phải scrub để thấy |

---

## 4. Keyframe & Graph Editor

### ✅ Hoạt động tốt
- 4 properties có keyframe: `scale` (number), `position` (vec2), `rotation` (number), `opacity` (number)
- 8 easing presets + custom cubic-bezier (Newton-Raphson solver, frame-perfect)
- Manual keyframe (`source="manual"`) không bị xóa khi behavior recompile
- Compiled keyframe (`source="compiled:*"`) tự regenerate khi behavior thay đổi
- Scale/opacity multiply với compiled, position/rotation additive — blend đúng

### ⚠️ Partial
- Timeline hiển thị diamond indicator cho manual keyframe → nhưng chỉ visual, không drag/edit được trên timeline
- **Graph panel referenced trong store nhưng không có UI graph editor trong codebase** → đây là gap quan trọng

### ❌ Chưa có — cần cho SOTA 2026
| Gap | Impact |
|---|---|
| **Graph editor UI** (drag handle bezier curve) | P0 🔴 — không có cách edit curve ngoài preset |
| Keyframe drag trên timeline | Phải xóa rồi add lại |
| Copy/paste keyframe giữa clips | Workflow cơ bản |
| Keyframe snap to beat | Creator sync motion với nhạc |
| Trim-aware keyframe warning | Keyframe bị xóa âm thầm khi trim |
| Audio automation keyframe UI | gain, EQ over time |
| Properties thiếu keyframe: `lensDistortion.amount`, `bloom.intensity`, `grain.opacity`, clip-level effects | Dynamic look bắt buộc |

---

## 5. Audio System

### ✅ Hoạt động tốt
- AudioClock drift-resistant (dùng `AudioContext.currentTime`)
- Playback tất cả audio clips với đúng in-point, speed constant, gain
- `smartDucking`: Gain automation tự duck nhạc khi có voice clip
- `autoCutSilence`: Detect silence → split clip tại boundary
- Waveform render (peak cache) trong timeline
- Export audio: OfflineAudioContext mix tất cả tracks + gain automation baked in
- Mute per-clip và per-track

### ⚠️ Gap quan trọng
- **Speed ramp KHÔNG áp dụng cho audio** — audio playback dùng constant `clip.speed`. Video có thể ramp 0.5x→2x nhưng audio vẫn chạy thẳng. Export cũng vậy.
- **Pan**: Tất cả clips mono-center, không có L/R pan

### ❌ Chưa có
| Gap | Impact |
|---|---|
| Audio pitch correction khi speed ramp | Creator slow-mo mà voice không bị pitch down |
| EQ / compressor / limiter UI | Đã scaffold trong schema nhưng không có UI + WebAudio wiring |
| Crossfade tự động giữa clips | Mọi NLE đều có |
| Stereo pan per-clip | Mixing cơ bản |
| Loudness metering (LUFS) | Chuẩn broadcast/platform |
| Multi-track stems export | Chỉ có stereo mix |

---

## 6. Auto-Viral Caption

### ✅ Hoạt động tốt
- Deepgram API → word-level timestamps → CaptionBlock[] với `words[{w, start, end}]`
- Chunk 360s để tránh 413 payload limit
- localStorage cache per asset (tránh re-transcribe = tiết kiệm API cost)
- Progress streaming callback (incremental update per chunk)
- SmartLink: blocks tag `{srcAsset, srcIn, srcDur}` → survive clip move/trim
- `relinkCaptionsToAudio()` recalc timeline offset từ source anchor
- 4 style packs: loud, clean, cinematic, terminal
- Demo fallback khi không có API key
- Per-block style override (stored correctly trong schema)

### ⚠️ Bug quan trọng
- **Per-block style override KHÔNG được render** — compositor line 479 đọc `st.style` (track-level), không đọc `b.style` (block-level). User chỉnh từng block nhưng không thấy thay đổi → confusing UX
- **Word-level highlight không tích hợp với caption blocks** — glyph presets chạy trên toàn text clip, không phải word-by-word trong caption block

### ❌ Chưa có
| Gap | Impact |
|---|---|
| Auto-relink khi clip move (phải gọi tay) | SmartLink không tự trigger |
| Caption timing editor UI (graphical) | Chỉ có text edit start/end |
| Speaker label / diarization | Interview với 2 người |
| WebVTT / SRT export | Creator cần file phụ đề |
| Bold/italic/color inline trong text | Highlight từ khóa |
| Real-time transcription (streaming) | Không cần chờ full file |
| Auto-translate | Kênh đa ngôn ngữ |

---

## 7. Smart Behaviors

### ✅ 32+ behaviors hoạt động đầy đủ
Chi tiết: zoomToRegion, smoothPunchIn, subtleDrift, springCrashZoom, pendulumSwing, kineticPop, hormoziPop, whipPan, handheldDrift, cameraShake, gawxJitter, maskRevealUp, elasticSmear, splitReveal, karaokeSlide, flipCascade, crossDissolve, dipToBlack, wipe, per-glyph stagger...

Behavior overlap blending hoạt động (crossfade 0.3s).

### ⚠️ Partial
- **punchOnEmphasis**: Chỉ hoạt động khi `project.cues[]` có data. Nếu không có cue → behavior silently do nothing, không có warning
- **Param edit real-time**: `setBehaviorParam` trong store hoạt động nhưng **không có UI slider/input** → user không tự adjust amount/duration/direction được

### ❌ Chưa có
| Gap | Impact |
|---|---|
| **Behavior parameter UI (sliders)** | P0 🔴 — không expose params ra UI |
| Batch apply behavior to multi-clip | Phải apply từng clip một |
| Transition preview on hover | UX |
| Ease override per behavior | Hardcoded curves |
| Audio behaviors (volume ramp, filter sweep) | Sound design |

---

## 8. Export

### ✅ Hoạt động tốt
- WebCodecs H.264 + AAC, mp4-muxer
- Frame-accurate: `seekAndWait()` đảm bảo đúng frame trước khi encode
- Audio mix: OfflineAudioContext, gain automation baked in
- Watermark free tier, resolution scale (0.5x, 1x)
- Render range (in/out points)
- Progress callback 0→1

### ⚠️ Edge cases
- AAC only — không có fallback nếu browser không support
- Cực kỳ lớn (4K + >10 phút) có thể hang vì không có memory management

### ❌ Chưa có
| Gap | Impact |
|---|---|
| Speed ramp audio trong export | Audio không match video ramp |
| ProRes / transparent alpha | Agency workflow |
| GIF / WebP animation | Social posts |
| Batch export (multiple range) | Reels từ 1 video dài |
| 2-pass encoding | Quality vs size |

---

## 9. MVP Launch Checklist

### P0 — Fix bugs blocking mọi flow (phải xong trước launch)
- [ ] **Cmd+Z / Cmd+Shift+Z**: Bind undo/redo keyboard shortcut — store có sẵn, chỉ cần wire
- [ ] **Per-block caption style render**: Fix compositor line 479 đọc `b.style` thay vì chỉ `st.style`
- [ ] **Right-click context menu**: Cut, Copy, Paste, Delete, Disable
- [ ] **Drag source từ MediaPool tự tạo track**: Không force user tạo track trước
- [ ] **Blend modes per-clip**: Không có = không thể composite BẤT KỲ layer nào — blocks F11

### P1 — Tính năng v1 cần có để đủ moat vs CapCut/AE
- [ ] **Background removal** — local RMBG model (WebGPU) — Creator cần, CapCut có → [F11](./whip-features)
- [ ] **Magic mask / SAM2** — click object → segment → track — cần cho precise overlay → [F11](./whip-features)
- [ ] **Audio noise removal** — talking-head pain #1, CapCut có
- [ ] **"Whip It" pipeline v1** — LLM Art Director + image gen + RMBG + overlay + animate → [F11 chi tiết](./whip-features) · [MCP tools](./whip-mcp)
- [ ] **Image generation integration** — Seedream 5.0 / Flux API + RMBG + import to layer → [F11](./whip-features)
- [ ] **StyleProfile extraction từ reference video** — 5 frames → vision LLM → StyleProfile JSON → [F11](./whip-features)
- [ ] **Template Recipe library** — 5 recipes: Iman/Hormozi/Ali/MrBeast/Gawx → [F11](./whip-features)
- [ ] **MCP agent interface** — tools auto-gen từ command registry, SharedWorker + headless mode → [F9](./whip-features) · [MCP docs](./whip-mcp)
- [ ] **Graph editor UI** — bezier curve drag/edit — để claim AE parity → [F2](./whip-features)
- [ ] **Behavior parameter sliders UI** — params không expose ra UI hiện tại → [F5](./whip-features)
- [ ] **Ripple trim** — không chỉ ripple cut → [F1](./whip-features)
- [ ] **Snap to beat** — Creator sync nhạc
- [ ] **Auto-relink caption khi clip move** — SmartLink phải trigger tự động → [F4](./whip-features)
- [ ] **Speed ramp audio pitch correction** — slow-mo không pitch-down

> **F8 Semantic Analysis** ([xem chi tiết](./whip-features)): TwelveLabs đã deprecated → thay bằng frame sampling + Gemini/Claude. Engine có sẵn, không cần P-item riêng — tích hợp vào Whip It Phase 1 (frame sampler + transcript → LLM Art Director).

### P2 — Post-launch polish (sau khi có users)
- [ ] Marker display trên ruler
- [ ] Audio EQ/compressor UI
- [ ] Effect keyframing (animate effect params over time)
- [ ] Copy/paste clip (Cmd+C/V)
- [ ] Crossfade auto giữa clips
- [ ] Transition hover preview
- [ ] Multi-aspect ratio reflow cho templates (16:9 ↔ 9:16)

---

## So sánh tính năng — AE / CapCut / Whip

> Đây là bảng **tận răng** để biết v1 cần có gì để đủ moat. Tính năng nào Whip cần có nhưng chưa có → là việc cần làm.

### Nhóm 1 — Core editing (phải ngang AE/CapCut)

| Feature | Adobe AE | CapCut | DaVinci Lite | **Whip live** | **Whip v1 target** |
|---|---|---|---|---|---|
| Multi-track timeline | ✅ | ✅ | ✅ | ✅ | ✅ |
| Keyframe animation | ✅ Full | Basic | ✅ Full | ✅ Full | ✅ |
| Graph editor (bezier UI) | ✅ | ❌ | ✅ | ❌ | ✅ P1 |
| Blend modes per-layer | ✅ 30+ | ✅ Basic | ✅ | ❌ | ✅ P0 🔴 |
| Effect keyframing | ✅ | ❌ | ✅ | ❌ | ✅ P1 |
| Speed ramp | ✅ | ✅ | ✅ | ✅ video | ✅ + audio P1 |
| Copy/paste clip | ✅ | ✅ | ✅ | ❌ | ✅ P1 |
| Ripple trim | ✅ | ✅ | ✅ | ⚠️ cut only | ✅ P1 |
| Nested comp / pre-comp | ✅ | ❌ | ✅ | ❌ | ❌ v2 |
| Motion blur | ✅ | ❌ | ✅ | ❌ | ❌ v2 |

### Nhóm 2 — AI-powered features (đây là chiến trường 2026)

| Feature | Adobe AE | CapCut | DaVinci Lite | **Whip live** | **Whip v1 target** |
|---|---|---|---|---|---|
| Auto caption word-level | ❌ | ✅ | ❌ | ✅ **SmartLink** | ✅ |
| Caption bám audio khi cắt | ❌ | ❌ | ❌ | ✅ **moat** | ✅ |
| Smart behaviors (auto-animate) | ❌ | Preset only | ❌ | ✅ 32+ | ✅ + param UI |
| Agent/MCP controllable | ❌ | ❌ | ❌ | 🔄 scaffold | ✅ |
| Background removal | ❌ (3rd party) | ✅ | ✅ | ❌ | ✅ P1 |
| Magic mask / segmentation | ❌ (Roto Brush) | ✅ Basic | ✅ | ❌ | ✅ P1 |
| Audio noise removal | ❌ (3rd party) | ✅ | ✅ | ❌ | ✅ P1 |
| Auto cut silence | ❌ | ✅ | ✅ | ✅ | ✅ |
| "Whip It" one-click editorial | ❌ | ❌ | ❌ | ❌ | ✅ **moat** P0 |

### Nhóm 3 — Motion graphics (Whip vs AE)

| Feature | Adobe AE | CapCut | DaVinci Lite | **Whip live** | **Whip v1 target** |
|---|---|---|---|---|---|
| Image generation + overlay | ❌ (Firefly plugin) | ❌ | ❌ | ❌ | ✅ Seedream/Flux P1 |
| Background removal cho assets | ❌ (plugin) | ✅ | ✅ | ❌ | ✅ RMBG local P1 |
| Vector graphic gen | ❌ | ❌ | ❌ | ❌ | ✅ Recraft/Ideogram P1 |
| Style extraction từ ref video | ❌ | ❌ | ❌ | ❌ | ✅ StyleProfile P1 |
| Template recipe library | ❌ (Motion Bro) | ✅ preset | ❌ | ❌ | ✅ 5 recipes P1 |
| SAM2 magic mask tracking | ❌ (Roto Brush) | ❌ | ❌ | ❌ | ✅ P1 |
| Beat/phoneme sync graphic | ❌ manual | ❌ | ❌ | ✅ behaviors | ✅ |

### Nhóm 4 — Platform / Distribution

| Feature | Adobe AE | CapCut | DaVinci Lite | **Whip live** | **Whip v1 target** |
|---|---|---|---|---|---|
| Browser, không cài app | ❌ | ✅ web | ❌ | ✅ **moat** | ✅ |
| Export local không upload | ✅ | ❌ cloud | ✅ | ✅ | ✅ |
| Semantic Anchor DAG | ❌ | ❌ | ❌ | ❌ | ❌ v2 |
| WebGPU zero-copy 4K | ❌ | ❌ | ❌ | ❌ | ❌ v2 |
| OPFS 50GB no crash | ❌ | ❌ | ❌ | ⚠️ partial | ❌ v2 full |
| CRDT collaboration | ❌ | ✅ | ❌ | ❌ | ❌ v3 |

---

### Kết luận: v1 cần thêm gì để đủ moat

Những tính năng dưới đây **từng đánh dấu v2/v3 nhưng cần kéo lên v1** — thiếu 1 trong số này Whip không thể cạnh tranh với CapCut cho tệp creator target:

| Feature | Tại sao phải v1 |
|---|---|
| **Blend modes** | Không có blend modes = không thể làm BẤT KỲ overlay/composite nào. Block mọi motion graphic |
| **Background removal** | CapCut có. Đây là feature số 1 creator talking-head cần (green screen, virtual background) |
| **Magic mask / SAM2** | Cần để overlay chính xác theo subject. Thiếu = callouts/product overlay trông amateur |
| **"Whip It" pipeline** | Đây là LÝ DO creator trả tiền. Không có thì Whip chỉ là editor |
| **Image gen + RMBG** | Không có thì F11 rỗng. Creator vẫn phải search Google cho assets |
| **Audio noise removal** | CapCut có. Talking-head creator luôn cần (microphone noise, fan noise) |
| **Graph editor UI** | Để claim parity với AE. Hiện tại keyframe engine có nhưng không có UI để edit |

**Những gì giữ v2:**
- WebGPU zero-copy (PixiJS/WebGL vẫn đủ cho ≤ 1080p v1)
- OPFS full 50GB proxy (import video bình thường vẫn đủ cho v1)
- Semantic Anchor DAG (SmartLink đã cover 80% use case)
- CRDT collaboration (single-user trước)
- Nested composition (scene grouping đủ cho v1)
