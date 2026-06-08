---
id: whip-features
title: Tính năng & Luồng Logic
sidebar_label: 🎯 Tính năng
sidebar_position: 4
---

# Tính năng & Luồng Logic Chi Tiết

> Mỗi tính năng có: mô tả ngắn, tại sao quan trọng, luồng logic step-by-step, và trạng thái hiện tại.

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

5. User split clip (S key / chuột phải)
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

## F11 — Dynamic Motion Graphics & Asset System ❌ (Roadmap v2)

**Là gì:** Hệ thống đồ họa động (lower thirds, callout boxes, animated stats, product overlays) được drive bởi dữ liệu và semantic context — không phải kéo PNG từ Google vào.

**Vấn đề hiện tại creator phải làm:**
```
1. Cần lower third → vào AE làm tay (30-60 phút)
   hoặc search Envato/Google → tải file → import → resize → recolor → set keyframe
2. Cần animated stat "10,000 users" → lại AE hoặc MotionArray
3. Cần product callout → lại tìm template → chỉnh từng cái
→ Trung bình 1-2 giờ chỉ để dàn layout graphics cho 1 video
```

**Giải pháp 3 layer:**

### Layer 1 — Template library (data-driven)

Thay vì "tìm file rồi kéo vào", graphics là **component nhận data**:

```
lower_third {
  name: "Nguyễn Văn A"
  title: "CEO, Whip"
  style: "minimal_dark"      // chọn từ library
  animation: "slide_up"
  duration: 3.0
}

stat_counter {
  value: 10000
  label: "users"
  format: "count_up"         // đếm từ 0 → 10,000
  duration: 1.5
  color: "#7c6af7"
}

callout_box {
  text: "Tính năng mới!"
  arrow_direction: "left"
  target_region: { x: 0.3, y: 0.4, w: 0.2, h: 0.1 }
}
```

User chọn style, điền data, hệ thống render. Không phải chỉnh từng pixel.

**Template categories cần có:**
- Lower thirds (10+ styles: minimal, bold, neon, glassmorphism, corporate)
- Stat displays (counter, bar, percentage ring, comparison)
- Callout & arrows (highlight box, speech bubble, pointer arrow)
- Title cards (intro slide, section break, outro)
- Product overlays (product floating với shadow/glow)
- Social proof (follower count, rating stars, quote)
- Progress / timeline infographic

### Layer 2 — Semantic auto-suggest

Kết hợp với semantic analysis (F10), graphics tự được gợi ý:

```
Audio transcript: "Xin chào, tôi là Phong, CEO của Whip"
→ Whisper detect: speaker introduction pattern + name + title
→ System suggest: lower_third { name: "Phong", title: "CEO của Whip" }
→ Anchor: phoneme "tôi là Phong" → xuất hiện đúng lúc

Audio: "chúng tôi đã đạt 10,000 người dùng"
→ Detect: number + metric mention
→ Suggest: stat_counter { value: 10000, label: "người dùng" }
→ Anchor: semantic_keyword "10,000 người dùng"
```

User chỉ cần click "Yes" thay vì tìm template thủ công.

### Layer 3 — AI generate khi không có template

Khi không có template phù hợp, user mô tả bằng text:

```
Luồng:
1. User: "cần graphic timeline 3 bước: Research → Design → Build"
2. System gửi prompt lên Claude:
   "Generate a Pixi.js component code for a 3-step timeline graphic
    with animation. Steps: Research, Design, Build. Dark theme, purple accent."
3. Claude trả về Pixi component code
4. Whip sandbox eval → render trong compositor
5. User thấy kết quả ngay, có thể regenerate hoặc edit data
```

**Kỹ thuật quan trọng:** Code được sandboxed eval (không chạy arbitrary code) — chỉ cho phép Pixi API calls, không có network/filesystem access.

### Edge cases quan trọng

**Brand consistency:**
- User set brand colors + font 1 lần trong Project Settings
- Tất cả templates tự inherit brand palette
- Override per-component nếu cần

**Multi-aspect ratio:**
- Template 16:9 phải re-layout sang 9:16 tự động
- Lower third 9:16 phải ngắn hơn để không che mặt
- Pixi component nhận `{ w, h, aspect }` → layout adaptive

**Motion tracking (advanced):**
- Callout arrow cần "trỏ vào sản phẩm khi camera di chuyển"
- Cần track object position per-frame
- Local MediaPipe object tracking → bounding box per frame → anchor callout

**Template marketplace (post-v2):**
- Creator publish template → khác dùng (`import { CuChuyenCanh } from "@whip/templates"`)
- npm-style ecosystem
- Revenue share cho template creator

### Trạng thái thực tế
- ✅ **Có sẵn**: shape primitives (rect/ellipse), text overlay với style đầy đủ
- ✅ **Có sẵn**: Pixi compositor — có thể render custom component
- ❌ **Chưa có**: Template library UI
- ❌ **Chưa có**: Data-driven component system
- ❌ **Chưa có**: Semantic auto-suggest cho graphics
- ❌ **Chưa có**: AI generate component
- ❌ **Chưa có**: Motion tracking cho callout
