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

## F8 — TwelveLabs Semantic Analysis 🔄

**Là gì:** Gửi video lên TwelveLabs (video AI) để phân tích semantic: chapters, scene types, keywords, timestamps quan trọng.

**Tại sao quan trọng:** Đây là bước đầu tiên để có **Semantic Temporal Graph** — AI hiểu "đoạn này nói về gì" thay vì chỉ biết "frame 450 tại giây 15".

**Luồng logic:**

```
1. User click "Analyze Video" trong Content View

2. TwelveLabs.analyzeVideo(assetUrl):
   a. Gọi /api/tl proxy (avoid CORS, giữ API key server-side)
   b. Tạo TwelveLabs index (1 lần per project)
   c. Upload video → tạo task
   d. Poll until status = "ready" (1-5 phút)
   e. Gọi summarize(type="chapter") → chapters[]

3. Chapters được convert thành Regions:
   { id, label, start, end, source: "twelvelabs" }

4. User có thể bind Behavior vào Region:
   "Zoom in khi AI detect chapter về sản phẩm"

5. Future: region được convert thành semantic anchor trong DAG
```

**Lưu ý kỹ thuật:** TwelveLabs indexing là async (vài phút) và có thể bị CORS từ browser → cần chạy qua proxy hoặc server-side. Đây là lý do feature này là 🔄 (scaffold, chưa hoàn thiện UX).

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
