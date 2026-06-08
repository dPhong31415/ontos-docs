---
id: whip-features
title: Tính năng & Luồng Logic
sidebar_label: 🎯 Tính năng
sidebar_position: 4
---

# Tính năng & Luồng Logic Chi Tiết

> Mỗi tính năng có: mô tả ngắn, tại sao quan trọng, luồng logic step-by-step, và trạng thái hiện tại.
> Trạng thái P0/P1/P2 và so sánh với AE/CapCut/DaVinci: xem [MVP Status & Roadmap](./whip-mvp-scope).

---

## F1 — Multi-track Timeline ✅

**Là gì:** Giao diện dòng thời gian nhiều track chồng lên nhau — video phía trên, audio phía dưới, giống Premiere/DaVinci.

**Tại sao quan trọng:** Cơ sở của mọi NLE (Non-Linear Editor). Không có multi-track thì không phải editor thật.

**Luồng logic:**

```
1. User kéo file vào MediaPool
   → Asset được đăng ký vào store (id, src, duration, w, h)

2. User kéo asset xuống timeline
   → Tạo Clip mới { id, asset, start, end, in, track }
   → Clip được thêm vào Track tương ứng (video/audio)

3. User kéo clip trên timeline (move)
   → Clip.start và Clip.end cập nhật
   → Nếu SmartLink bật: caption anchored vào clip này tự tính lại

4. User trim cạnh clip (drag left/right edge)
   → Clip.in (in-point) hoặc độ dài thay đổi
   → Constraint system check: clip có "neo" (anchor) vào clip khác không?
   → Propagate thay đổi theo DAG

5. User split clip (B/W key hoặc Cmd+K)
   → Clip gốc split thành 2 clip tại đúng điểm playhead
   → Audio track tương ứng cũng split nếu detached = false

6. Ripple delete (xóa + lấp khoảng trống)
   → Xóa clip
   → Tất cả clip phía sau tự trượt lên lấp khoảng trống
   → Anchored elements tự tính lại position
```

**Files liên quan:** `src/components/Timeline.tsx`, `src/store/store.ts`

---

## F2 — Keyframe Animation + Bezier Easing ✅

**Là gì:** Hệ thống animate thuộc tính (scale, position, rotation, opacity) theo thời gian với đường cong bezier. Giống After Effects graph editor.

**Tại sao quan trọng:** Tạo ra chuyển động "có hồn" — không cứng đờ như CapCut.

**Luồng logic:**

```
1. User click "Add Keyframe" tại thời điểm t
   → Keyframe { t, v, ease } được thêm vào clip.properties[prop]

2. User kéo giá trị tại thời điểm t2 khác
   → Keyframe thứ 2 tự động tạo

3. Render engine tính giá trị tại thời điểm t_now:
   → Tìm 2 keyframe gần nhất (trước và sau t_now)
   → Interpolate: v = lerp(v1, v2, ease(t_norm))
   → ease = bezier curve từ preset (smooth, snappyBack, settle...)

4. Behavior system viết keyframe tự động:
   → source = "compiled:<behavior_id>"
   → Khi behavior thay đổi: xóa tất cả "compiled:*" keyframe → generate lại
   → Keyframe manual (source = "manual") không bao giờ bị xóa
```

**Preset easing:**
- `linear` — tốc độ đều, cứng
- `smooth` — ease in-out mượt
- `smoothPunch` — ease in mạnh, ease out nhanh (zoom viral)
- `snappyBack` — bắn ra nhanh, quay về springy
- `settle` — overshoots rồi settle về vị trí

**Files liên quan:** `src/engine/interpolate.ts`, `src/engine/ease.ts`

---

## F3 — Auto-Viral Caption (Word-Level) ✅

**Là gì:** Tự động bóc băng video thành subtitle word-by-word, với highlight từ đang được nói, nhiều style preset viral (loud, clean, cinematic, terminal).

**Tại sao quan trọng:** Caption word-level = feature #1 creator TikTok/Reels cần. Làm tay mất 30-60 phút/video. Whip làm trong 30 giây.

**Luồng logic:**

```
1. User click "Auto Caption" trên clip audio/video

2. CaptionService.autoCaptionFromAudio():
   a. Check cache (localStorage): đã transcribe asset này chưa?
      → Cache hit: trả về ngay, không tốn API
      → Cache miss: tiếp tục

   b. Extract audio từ clip (Web Audio API → WAV/MP3 nhẹ)

   c. POST lên VITE_CAPTION_API (Cloudflare Worker)
      → Backend gọi Deepgram với word timestamps
      → LLM chunk thành blocks (nhóm 3-5 từ logic)
      → Trả về: blocks[] với words[{w, start, end}]

   d. Tag mỗi block với source link:
      { srcAsset, srcIn, srcDur } → để SmartLink hoạt động

   e. Offset sang timeline time: timeline_t = srcTime + clipOffset

3. Blocks được render bởi PixiJS:
   a. Tại mỗi frame t: tìm block active (start <= t <= end)
   b. Trong block: highlight từ đang được nói (t trong word.start..end)
   c. Apply style pack (font, size, color, stroke, glow, gradient)
   d. Animate: fade in block, highlight word chạy theo audio

4. Khi user cắt/dời clip audio:
   → SmartLink detect: clip.asset + in-point thay đổi
   → Tính lại timeline offset cho tất cả blocks thuộc asset đó
   → Không cần re-transcribe, chỉ offset lại
```

**Style packs:**
- `loud` — chữ to, uppercase, glow vàng/cam (TikTok viral)
- `clean` — chữ nhỏ, white, backdrop tối (podcast style)
- `cinematic` — serif font, fade nhẹ (documentary)
- `terminal` — monospace, màu xanh (tech/dev content)

**Files liên quan:** `src/engine/captionService.ts`, `src/engine/captions.ts`, `src/components/CaptionPanel.tsx`

---

## F4 — SmartLink: Caption Tự Bám Audio ✅

**Là gì:** Khi bạn cắt, split, hoặc dời clip audio, toàn bộ caption của audio đó tự tính lại vị trí trên timeline — không cần chỉnh tay.

**Tại sao quan trọng:** Đây là điểm đau lớn nhất của CapCut. CapCut ghim caption theo giây tuyệt đối → chỉnh audio là hỏng caption.

**Luồng logic:**

```
1. Caption block được lưu kèm:
   { srcAsset: "asset_001", srcIn: 2.3, srcDur: 1.4 }
   → "Block này thuộc asset_001, bắt đầu tại giây 2.3 trong source"

2. Khi clip audio bị dời (start thay đổi):
   → SmartLink scan tất cả caption blocks có srcAsset = clip.asset
   → Tính lại: newTimelineStart = clip.start + (srcIn - clip.in)
   → Update block.start và block.end

3. Khi clip audio bị split:
   → 2 clip mới, cùng asset nhưng khác in/out
   → SmartLink assign lại từng block cho đúng clip segment
   → Blocks không bị duplicate hay mất

4. Khi clip audio bị xóa:
   → SmartLink mark blocks là "orphaned"
   → UI hiển thị cảnh báo, user chọn xóa hay giữ
```

---

## F5 — Smart Behaviors (Auto-Animate) ✅

**Là gì:** Thay vì tự tay set keyframe, bạn chọn "Behavior" — ví dụ "Zoom in khi người nói nhấn mạnh" — và hệ thống tự generate keyframe tương ứng theo vị trí trong timeline.

**Tại sao quan trọng:** Edit talking-head luôn cần zoom-punch, pan smooth. Làm tay mất 5-10 phút mỗi clip. Behavior làm trong 2 giây.

**Luồng logic:**

```
1. User chọn clip → Add Behavior → chọn "zoomToRegion"
   Parameters: { region: "region_001", scale: 1.15, duration: 0.3 }

2. Behavior system (behaviors.ts) compile:
   a. Lấy region.start, region.end từ timeline
   b. Generate keyframes:
      t = region.start - 0.1: { scale: 1.0, ease: "smooth" }
      t = region.start + 0.1: { scale: 1.15, ease: "snappyBack" }
      t = region.end: { scale: 1.0, ease: "settle" }
   c. Gắn source = "compiled:zoomToRegion_001"

3. Khi region thay đổi (user kéo marker):
   → Xóa tất cả keyframes có source = "compiled:zoomToRegion_001"
   → Compile lại từ đầu với region position mới
   → UI cập nhật tức thì

4. Blend khi 2 behaviors overlap:
   → Crossfade 0.3s giữa 2 behavior
   → Không bị hard-cut keyframe
```

**Behaviors có sẵn:**
- `zoomToRegion` — zoom in vào một đoạn (thường là câu nhấn mạnh)
- `sequenceReveal` — reveal từng phần tử theo thứ tự
- `punchOnEmphasis` — nảy nhẹ khi có cue (nhịp / từ khóa)

---

## F6 — Effects & Signature Look ✅

**Là gì:** Stack visual effects chạy trên GPU shader: bloom, chromatic aberration, film grain, vignette, color correction, light leaks.

**Tại sao quan trọng:** "Signature look" = visual identity của creator. Người xem nhìn vào biết ngay video của ai.

**Luồng logic:**

```
1. User thêm Effect vào clip hoặc composition
   Effect { type: "bloom", params: { threshold: 0.7, intensity: 0.4 } }

2. Compositor render order:
   a. Render video frame lên texture
   b. Apply effects theo thứ tự stack:
      texture → bloom shader → chromaticAberration shader → ... → output
   c. Mỗi effect là WGSL (WebGPU) hoặc WebGL fragment shader

3. User chỉnh params real-time:
   → Slider update params
   → Shader re-run với params mới
   → Preview cập nhật tức thì (không cần export)
```

---

## F7 — Export via WebCodecs ✅

**Là gì:** Export video ra file MP4 (H.264) ngay trong trình duyệt, không cần server, không upload file.

**Tại sao quan trọng:** Privacy (file không rời máy), tốc độ (không chờ upload), cost (không tốn server).

**Luồng logic:**

```
1. User click Export → chọn resolution, format, bitrate

2. Export engine bắt đầu:
   a. Tạo VideoEncoder (WebCodecs API) với config H.264
   b. Tạo AudioEncoder tương tự

3. Frame-by-frame loop:
   a. Tính tất cả active clips tại frame t
   b. Compositor render frame lên OffscreenCanvas
   c. OffscreenCanvas.transferToImageBitmap() → ImageBitmap
   d. VideoEncoder.encode(ImageBitmap, { keyFrame: t % 30 === 0 })

4. Audio encoding:
   a. Mix tất cả audio tracks (Web Audio OfflineContext)
   b. AudioEncoder.encode(audioData)

5. Mux video + audio:
   → mp4-muxer ghép encoded chunks thành file MP4
   → Trả về Uint8Array

6. User download:
   → URL.createObjectURL(blob) → a.click()
```

---

## F8 — Semantic Analysis (Video Understanding) ⚠️ Đang rethink

**Là gì:** Phân tích nội dung video để hiểu "đoạn này nói về gì, ai đang nói, cảm xúc gì" — tạo ra Regions/Anchors semantic thay vì chỉ có timestamps.

**Tại sao quan trọng:** Đây là bước đầu tiên để có **Semantic Temporal Graph** — core moat của Whip.

---

### ⚠️ Vấn đề với TwelveLabs (implementation hiện tại)

Whip hiện có `engine/twelvelabs.ts` gọi TwelveLabs API — nhưng cách này **mâu thuẫn trực tiếp** với kiến trúc local-first:

```
TwelveLabs flow:
  Video (50GB từ máy user) → UPLOAD lên server TwelveLabs → xử lý 1-5 phút → trả về chapters

Vấn đề:
  ✗ Video rời máy user (privacy)
  ✗ Upload 50GB = không thực tế
  ✗ 1-5 phút chờ = UX tệ
  ✗ CORS issues từ browser → cần proxy
  ✗ Cost per-video không scale
```

**Kết luận:** TwelveLabs sẽ bị **replace hoàn toàn** bằng approach dưới đây.

---

### ✅ SOTA 2026 — Frame Sampling + Local/LLM Vision

Thay vì upload toàn bộ video, chỉ cần **sample một số frames** (ảnh tĩnh) và gửi lên vision API. Video không rời máy.

**Luồng logic đúng:**

```
1. User click "Analyze" trong Content View

2. Frame Sampler (local, Web Worker):
   a. WebCodecs decode video tại các mốc 10%, 25%, 50%, 75%, 90%
   b. Trả về 5-10 ImageBitmap (ảnh nhẹ, không phải video)

3. Audio Transcription (local):
   a. Whisper tiny chạy WebGPU (local, không upload)
   b. → words[] với timestamps → full transcript

4. Vision Analysis (gửi frame, không gửi video):
   POST /api/analyze với:
   { frames: [base64_jpg × 5], transcript: "..." }

   Server gọi Gemini 2.0 Flash hoặc Claude với:
   "Đây là 5 frames và transcript. Xác định: scenes, topics, emotional arc, key moments"
   → chapters[], scene_types[], keywords[]

5. Kết quả về client:
   Regions: [{ id, label: "Giới thiệu sản phẩm", start: 0, end: 8.5, source: "vision" }]
   → User bind Behavior vào Region
   → Future: convert sang semantic anchor trong DAG
```

**Tại sao tốt hơn TwelveLabs:**
- Video không rời máy (chỉ 5 ảnh nhỏ được gửi)
- Response trong 3-5 giây thay vì 1-5 phút
- Cost thấp hơn nhiều (5 ảnh vs toàn bộ video)
- Không cần specialized vendor — dùng Gemini/Claude sẵn có

**Trade-off:** Kém accurate hơn TwelveLabs cho phân tích temporal chi tiết (TwelveLabs xem toàn bộ video). Nhưng đủ cho use case của Whip (tìm chapters, detect scene type).

**Khi nào cần TwelveLabs-level accuracy:** Chỉ khi có features như "tìm tất cả khoảnh khắc user cười" hay "detect object trong video" — những thứ cần full temporal understanding. Ở giai đoạn MVP, frame sampling là đủ.

---

## F9 — MCP Agent Interface 🔄

**Là gì:** Giao diện chuẩn để AI agent (Claude, GPT) điều khiển editor bằng tool calls — split clip, add behavior, apply preset, render — không phải text prompt mơ hồ.

**Tại sao quan trọng:** Đây là bước từ "AI gợi ý" sang "AI thực thi". Creator chỉ cần nói "edit theo style này" và AI làm toàn bộ.

**Luồng logic (target):**

```
1. MCP Server khởi động trong SharedWorker
   → Register tools: get_project, split_clip, add_behavior, apply_preset, render...

2. Claude/agent gọi MCP:
   get_project() → { duration, tracks_summary, caption_blocks_count, ... }
   // Chỉ summary, không dump toàn bộ JSON → tiết kiệm token

3. Agent phân tích → ra quyết định:
   split_clip("clip_001", at=5.0)
   add_behavior("zoomToRegion", target="clip_001", region=detected_emphasis)
   apply_caption_style("loud")

4. State Worker thực thi từng tool:
   → Validate input (Zod schema)
   → Apply mutation
   → Emit event vào event log
   → Return result

5. Agent nhận kết quả → tiếp tục hoặc adjust
```

**Hiện tại:** Tools được define trong `src/mcp/tools.ts` nhưng chưa có MCP server thật. `window.whip` expose store cho automation tạm thời.

---

## F10 — Semantic Anchor DAG ❌ (Roadmap v2)

**Là gì:** Hệ thống anchor đầy đủ nơi mọi phần tử timeline đều có "neo" semantic thay vì neo theo giây tuyệt đối.

**Tại sao quan trọng:** Đây là core moat #1 của Whip. Khi có đầy đủ, 1 cú cắt clip tự động cập nhật toàn bộ timeline.

**Luồng logic (target):**

```
1. User cắt 3 giây đầu video (TRIM_START)

2. State Worker detect mutation
   → Tính downstream nodes qua DAG edges
   → Downstream: [super_name, broll_001, sfx_001, bgm_001, ...]

3. Dispatch agents (concurrent):
   Wave 1 (song song):
     - logic_agent: tính lại relative_time anchors
     - semantic_agent: tìm lại keyword anchor trong transcript
     - music_agent: recalculate beat preservation

   Wave 2 (sau wave 1):
     - caption_agent: re-resolve phoneme anchors
     - sfx_agent: re-snap SFX vào transition center

4. Mỗi agent trả về delta (thay đổi nhỏ):
   { op: "update", node_id: "super_name", field: "resolved.start", value: 2.0 }

5. State Worker apply tất cả deltas
   → SQLite update
   → UI re-render chỉ các nodes bị ảnh hưởng
```

**Anchor types:**
- `free` — absolute time, không neo vào gì (CapCut style)
- `relative_time` — offset cố định tính từ event của node khác
- `node_event` — neo vào start/end/center của node khác
- `phoneme` — neo vào âm vị cụ thể trong audio
- `semantic_keyword` — neo vào lúc người nói một từ/cụm từ
- `beat_grid` — neo vào beat map của nhạc

---

## F11 — "Whip It" — AI Editorial Motion Graphics ❌ (Roadmap v1)

**Là gì:** Bấm một nút, AI biến talking-head video nhàm chán thành editorial video theo phong cách Iman Gadzhi / Alex Hormozi — kinetic typography, full-screen section cards, animated stats, geometric overlays, rhythm-driven graphics — trong vài phút. Không cần AE. Không cần design skill.

**Vấn đề hiện tại creator phải làm thủ công:**
```
1. Xem lại transcript → chọn đoạn nào cần graphic
2. Vào AE hoặc Canva → làm từng graphic thủ công (1-2 giờ)
3. Search Envato/Google → tải template → import → resize → recolor → keyframe
4. Đồng bộ graphic với audio beat/phoneme bằng tay
5. Lặp lại cho mỗi section
→ 1 video 3-5 phút = 4-8 giờ production trong AE
```

Whip giải quyết toàn bộ pipeline này bằng 1 nút: **Whip It**.

---

### Luồng "Whip It" — End-to-End

```
User upload talking-head video
         │
         ▼
   [Bấm "Whip It"]
         │
         ▼  ← Tùy chọn (trước khi chạy)
   ┌─────────────────────────────────────────┐
   │ Option A: Upload video tham chiếu style │
   │           (copy phong cách của creator  │
   │            này vào video của mình)      │
   │                                         │
   │ Option B: Chọn Template Recipe          │
   │           [Iman Editorial] [Hormozi Bold│
   │           [Ali Clean] [MrBeast Energy]  │
   │           [Gawx Cinematic]              │
   └─────────────────────────────────────────┘
         │
         ▼ Phase 1 — Phân tích local (không gửi video lên cloud)
   ┌──────────────────────────────────────────┐
   │ Whisper tiny (WebGPU local):             │
   │   → transcript + word timestamps         │
   │   → prosody (nhịp nói, điểm nhấn mạnh)  │
   │                                          │
   │ DSP beat detection (Web Worker):         │
   │   → beat map + BPM + energy curve        │
   │                                          │
   │ MediaPipe face/gaze (WebGPU local):      │
   │   → gaze direction, cut points tốt       │
   │   → speaker bounding box per-frame       │
   └──────────────────────────────────────────┘
         │
         ▼ Phase 2 — LLM Art Director
   ┌──────────────────────────────────────────┐
   │ Input lên LLM (Claude/Gemini):           │
   │   • transcript + prosody                 │
   │   • StyleProfile (từ ref video hoặc      │
   │     Template Recipe params)              │
   │   • energy curve + beat timestamps       │
   │   KHÔNG gửi video — chỉ text + metadata │
   │                                          │
   │ LLM trả về CompositionBrief:             │
   │   [                                      │
   │     { t: 0-3s,   type: "hook_graphic",   │
   │       desc: "Bold stat: $10M trong 12 tháng" },│
   │     { t: 3-18s,  type: "talking_head",   │
   │       caption_style: "loud" },           │
   │     { t: 18-24s, type: "section_card",   │
   │       headline: "Sai lầm #1" },          │
   │     { t: 24-35s, type: "broll_suggest",  │
   │       visual: "office hustle montage" }, │
   │     { t: 35-40s, type: "kinetic_list",   │
   │       items: ["Research", "Build", "Ship"]},│
   │     ...                                  │
   │   ]                                      │
   └──────────────────────────────────────────┘
         │
         ▼ Phase 3 — Tạo và kéo assets
   ┌──────────────────────────────────────────┐
   │ Với mỗi graphic moment:                  │
   │                                          │
   │ Path A — Raster assets (photo-real):     │
   │   CompositionBrief → text prompt         │
   │   → Seedream 5.0 / Flux API              │
   │   → PNG image                            │
   │   → RMBG model (local WebGPU):           │
   │     background removal → transparent PNG │
   │   → import vào Pixi layer               │
   │                                          │
   │ Path B — Vector assets (clean graphics): │
   │   CompositionBrief → vector prompt       │
   │   → Recraft / Ideogram API               │
   │   → SVG file                             │
   │   → import trực tiếp vào Pixi           │
   │   (không cần bg removal — cleaner)       │
   │                                          │
   │ Path C — Pure Pixi (code-gen):           │
   │   LLM generate Pixi component code       │
   │   → sandboxed eval (Pixi API only)       │
   │   → render in compositor                 │
   │   (stat counters, progress bars,         │
   │    geometric shapes, text animations)    │
   └──────────────────────────────────────────┘
         │
         ▼ Phase 4 — Animate + Semantic Sync
   ┌──────────────────────────────────────────┐
   │ Gắn behaviors vào assets:                │
   │   • Beat sync: asset xuất hiện đúng beat │
   │   • Phoneme sync: word highlight theo    │
   │     miệng người nói                      │
   │   • Energy sync: scale/opacity theo      │
   │     loudness curve của audio             │
   │                                          │
   │ Transition style từ StyleProfile:        │
   │   • Gadzhi: hard cut + slide in fast     │
   │   • Gawx: crossfade + glow pulse         │
   │   • Hormozi: snap zoom + text impact     │
   └──────────────────────────────────────────┘
         │
         ▼ Kết quả
   User thấy toàn bộ edit trong timeline
   → Review + fine-tune
   → Export
```

---

### StyleProfile — Trích xuất phong cách từ video tham chiếu

Khi user upload video tham chiếu (không phải video của họ):

```
Input: video tham chiếu (chỉ sample vài frame)
         │
         ▼ Frame sampling (5-10 frames, không upload video)
Vision model (Claude/Gemini) phân tích:
   → color_palette: ["#0a0a0a", "#ffffff", "#7c6af7"]
   → typography: { font: "Montserrat Black", case: "upper", size: "large" }
   → motion_style: "fast_cut"  // slow_burn | fast_cut | rhythmic | cinematic
   → energy: "high"            // calm | medium | high
   → graphic_density: "heavy"  // minimal | medium | heavy
   → signature_moves: ["zoom_punch", "text_slam", "color_flash"]

Output: StyleProfile JSON
→ Template Recipe mới được tạo từ video này
→ LLM Art Director dùng StyleProfile để generate CompositionBrief phù hợp
```

---

### Template Recipes — Baked-in styles

Cho user không có video tham chiếu:

| Recipe | Đặc trưng | Graphic elements |
|---|---|---|
| **Iman Editorial** | Hard cut, full-screen section cards, kinetic text, stat slams | Bold section headers, number reveals, minimal geometric overlays |
| **Hormozi Bold** | High contrast, impact text, lots of callouts | Big orange text, call-to-action boxes, metric counters |
| **Ali Clean** | Subtle zoom, lower thirds, educational | Clean lower thirds, chapter cards, annotation arrows |
| **MrBeast Energy** | Fast cut, colorful overlays, energetic | Bright stickers, quick transitions, score counters |
| **Gawx Cinematic** | Slow burn, atmospheric, art-house | Moody overlays, grain, vignette, minimal text |

---

### Magic Mask / Segmentation (SAM2)

Module tách biệt, dùng trong và ngoài "Whip It":

```
Cách dùng:
1. User click vào bất kỳ đối tượng trong video frame
2. SAM2 (Segment Anything Model 2) segment object đó
3. Mask được track qua toàn bộ clip (per-frame bounding box)

Use cases:
  • Tách speaker khỏi background → blur/replace background
  • Callout arrow chỉ vào sản phẩm → arrow auto-track khi camera di chuyển
  • Overlay chỉ xuất hiện trên object cụ thể (không che toàn frame)
  • Highlight/glow quanh mặt người nói

Kỹ thuật:
  SAM2 chạy local via WebGPU Worker (model ~50MB)
  hoặc server-side nếu cần accuracy cao
```

---

### Composition JSON — Pixi Renderer Reads

CompositionBrief compile thành Composition JSON mà Pixi renderer đọc:

```jsonc
{
  "compositions": [
    {
      "t": 0, "duration": 3.0,
      "type": "stat_reveal",
      "data": { "value": "$10M", "label": "in 12 months" },
      "style": "hormozi_impact",
      "animation": { "in": "text_slam", "ease": "expo_out" },
      "beatSync": true
    },
    {
      "t": 18.5, "duration": 5.0,
      "type": "section_card",
      "data": { "title": "Sai lầm #1", "subtitle": "Mà 90% founder mắc phải" },
      "style": "iman_editorial",
      "animation": { "in": "slide_up", "out": "cut" }
    },
    {
      "t": 35.0, "duration": 8.0,
      "type": "kinetic_list",
      "data": { "items": ["Research", "Build", "Ship"] },
      "style": "ali_clean",
      "animation": { "in": "stagger_reveal", "phonemeSync": true }
    }
  ]
}
```

**Pixi renderer nhận JSON này → render frame-perfect** — không phải AE, không phải HTML/CSS.

---

### Tại sao đây là v1 moat (không phải v2)

CapCut không có cái này. AE đòi hỏi skill + 4-8 giờ. Opus Clip chỉ cắt, không làm graphic.

Whip "Whip It" = **đây là cái mà creator trả tiền** — không phải keyframe editor, không phải caption. Creator trả tiền để ra video đẹp nhanh. Graphic pipeline chính là "nhanh".

Nếu không có F11, Whip chỉ là "CapCut với keyframe tốt hơn" — không đủ moat.

---

### Trạng thái thực tế
- ✅ **Có sẵn**: shape primitives (rect/ellipse), text overlay với style đầy đủ
- ✅ **Có sẵn**: Pixi compositor — render custom component
- ✅ **Có sẵn**: Behaviors (zoomToRegion, sequenceReveal) — animated overlays hoạt động
- ✅ **Có sẵn**: LLM API integration (Deepgram + Claude Haiku qua CF Worker)
- ❌ **Chưa có**: "Whip It" orchestration flow (Phase 1-4 trên)
- ❌ **Chưa có**: StyleProfile extraction từ reference video
- ❌ **Chưa có**: Seedream/Flux image generation integration
- ❌ **Chưa có**: RMBG background removal (local WebGPU)
- ❌ **Chưa có**: SAM2 magic mask / segmentation
- ❌ **Chưa có**: CompositionBrief → Composition JSON compiler
- ❌ **Chưa có**: Template Recipe library (5 recipes trên)

**Docs liên quan:**
- [MVP & Roadmap](./whip-mvp-scope) — P1 checklist cho F11 sub-items
- [Smart Animation](./whip-behaviors) — behaviors là engine dưới Phase 4
- [MCP & Agent](./whip-mcp) — `whip_it`, `set_style_profile`, `apply_composition` tools
- [Project Document & Schema](./whip-data-model) — CompositionBrief JSON schema đầy đủ
- [Content View](./whip-content-view) — UI entry point cho nút "Whip It"
