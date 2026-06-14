---
id: whip-moat
title: Tại sao Whip sẽ thắng
sidebar_label: 🏆 Tại sao Whip thắng
sidebar_position: 2
---

# Tại sao Whip sẽ thắng — 5 Moat

> **Moat** = thứ khiến đối thủ khó copy, dù họ có tiền và kỹ sư.
> Mỗi moat dưới đây có lý do kỹ thuật cụ thể **vì sao Adobe/CapCut không thể làm được trong 2 năm**.
> Quan trọng hơn: 5 moat này **khuếch đại lẫn nhau** — không phải 5 feature độc lập.

---

## Moat 1 — Semantic Temporal Graph (Kiến trúc dữ liệu mới)

### Vấn đề của mọi editor hiện tại

Premiere, DaVinci, CapCut đều lưu timeline như **mảng thời gian tuyệt đối**:

```
zoom_keyframe: { t: 12.4s, scale: 1.15 }
subtitle:      { start: 12.4s, end: 14.0s }
```

Hai thứ này không có quan hệ gì trong data. Cắt lại câu nói → `subtitle` dời sang 14.0s nhưng `zoom_keyframe` vẫn ở 12.4s. Phải sửa tay. Mỗi lần chỉnh nội dung là animation vỡ. Đây là vấn đề 30 năm của After Effects — không thể fix mà không rebuild từ đầu.

### Whip: Semantic Temporal Graph + Two-Phase Pipeline

**Bước 1 — Ingestion (chạy 1 lần khi add video, background):**

```
Video → Ingestion Worker (local, không upload)
    Audio: Whisper ONNX (WebGPU) → Word[] {id: uuid, w, start, end}
           Web Audio API         → Acoustic[] {t, energy, pitch}
           pyannote ONNX         → Speaker[] {speakerId, start, end}
    Video: MediaPipe FaceLandmarker  → FaceEvent[] {t, expression, lookAt}
           MediaPipe GestureRecognizer → GestureEvent[] {t, gesture}
           MediaPipe PoseLandmarker   → PoseEvent[] {t, motion_delta}

→ OntologyGraph (typed semantic graph, SQLite local):
    Objects: Word, FaceEvent, GestureEvent, TemporalSpan, BehaviorNode
    Links:   PART_OF, ANCHORED_TO, CROSS_MODAL, FOLLOWS, CONTAINS
    Provenance: source, confidence, modelId trên mọi object
```

**Bước 2 — Edit (compute thuần từ graph, không có model inference):**

```
User cut tại Word[w_042]
  → mark words[w_042...].visible = false          ← O(1)
  → query BehaviorNodes anchored to visible words  ← O(n)
  → recompile keyframes                            ← O(n)
  Không API call. Không model inference. Thuần compute.
```

**Tại sao đây là moat:**
- Anchor vào `word_id` (stable UUID) thay vì timestamp → **cut-proof**: cắt bỏ 10 từ → behaviors tự co theo, không vỡ
- Typed graph với provenance → agent traverse được, không cần RAG
- Adobe cần **rebuild lại từ đầu** — 30 năm C++ monolith không thể refactor sang graph
- CapCut không có động cơ — họ target casual user, không cần semantic precision

---

## Moat 2 — Local-First + Browser-Native Compute (Video không rời máy)

### Vấn đề hiện tại

- Premiere/DaVinci: cài 10-30GB, cần GPU mạnh, không web
- CapCut web: dùng WebAssembly + WebCodecs cho rendering (solid) nhưng AI features là **server-side ByteDance infrastructure** — data sovereignty concern, U.S. operations đang bị scrutiny
- Descript: audio-centric, Whisper qua OpenAI API (cloud), Temporal.io backend cho AI jobs
- **Mọi web editor**: AI analysis = gửi video lên cloud → latency cao, tốn tiền, data leak
- TwelveLabs: video understanding API tốt nhất hiện tại, nhưng video phải upload → $12/30 phút

### Whip: Zero-Upload AI + Dense Local Signals

**Signal extraction local (ingestion-time, 1 lần khi import):**
```
MediaPipe (WebGL2 delegate) chạy qua toàn bộ video 1 lần
→ FaceEvent[] + GestureEvent[] + PoseEvent[] cache vào OntologyGraph
→ $0, không upload frame nào, không phụ thuộc cloud

Whisper ONNX (WASM+SIMD — faster than WebGPU for decoder loop)
→ Word[] với UUID per word, confidence per word
→ ~5.9s cho 60s audio trên desktop, $0

Benchmark thực: WASM+SIMD beats WebGPU cho Whisper vì autoregressive
decoder bottleneck. GPU underutilized giữa decode steps.
(nguồn: Transformers.js issue #894, Mac M2 benchmark)
```

**GPUExternalTexture zero-copy render:**
```
File SSD → WebCodecs (hardware decode) → VideoFrame
                                              │ GPUExternalTexture (zero-copy)
                                              │ CPU không touch pixel
                                              ▼
                                         GPU Texture → WGSL Shader → Canvas
```
CPU gần như idle trong render. WebGPU compute: ~1ms/frame desktop (vs 10–20ms JS pixel loop).
Benchmark: web.dev AI Video Upscaler case study — 250k MAU, 10,000 videos/ngày, $0 server cost.

**Storage tiered — file chục GB không crash (implement 06/2026, đã sửa từ "OPFS là tất cả"):**

> ⚠️ OPFS KHÔNG phải "chân ái" cho mọi thứ. Copy bản gốc 20GB VÀO OPFS = nhân đôi đĩa + crash
> (đã đụng thật). Mỗi tầng lưu trữ làm 1 nhiệm vụ:

| Tầng | Giữ gì | Vì sao |
|---|---|---|
| **File System Access handle** (IndexedDB) | **bản GỐC** (chục GB) | trỏ file trên đĩa, **0 copy**. `<video src=blobURL>` stream byte-range → không full-load RAM (~2–4GB limit). Reload xin lại quyền 1 click. |
| **OPFS** | **derived nhỏ-mà-nóng**: proxy 540p, poster, graph, transcript | nhanh nhất browser (sync access handle), đọc liên tục lúc edit. KHÔNG để bản gốc to ở đây. |
| **RAM** | chỉ frame đang decode + UI state | encoder/poster serialize 1/lần + memory guard auto-pause khi >2.2GB |

```
Edit:   preview chạy PROXY 540p (mượt). Original chỉ stream khi cần.
Export: re-point compositor về GỐC 4K (full-res). Proxy chỉ lo preview.
Observe: pipelineLog (JSON, sống qua crash) + observe-state + memory guard (Moat #5).
```

Files: `assetHandles.ts` (handle store), `proxyTranscode.ts` (WebCodecs 540p), `assetStore.ts` (OPFS proxy/poster),
`observe.ts` + `pipelineLog.ts` (memory guard + log). Chi tiết: `whip-architecture.md` §Storage.

**Chi phí AI thực tế:**
- MediaPipe (gesture/expression/pose): **$0**, WebGL2 local
- Whisper ONNX (transcription): **$0**, WASM+SIMD local
- RMBG (background removal): **$0**, WebGPU compute local
- Claude Haiku (text-only synthesis): ~$0.001/phút
- Deepgram (transcription fallback nếu cần): $0.004/phút
- **30 phút video: ~$0.03 tổng**. TwelveLabs: $12. CapCut AI: $5+ server cost.

**Tại sao đây là moat:**
- WebCodecs + GPUExternalTexture + OPFS pipeline cần expertise browser internals sâu — không copy được
- MediaPipe WebGL2 ingestion-time (toàn bộ video, dense signals) chưa có editor nào làm được
- Privacy moat: video không rời máy → unbeatable cho enterprise, legal, medical content
- CapCut có WebAssembly pipeline tương tự cho rendering, nhưng AI vẫn server-side ByteDance — trust issue chết người ở Western market

---

## Moat 3 — Agent Thật Sự Điều Khiển Được (Semantic MCP)

### Vấn đề với "AI edit" hiện tại

Mọi "AI edit" hiện tại là **pipeline, không phải agent**: upload → cloud process → download. AI không *hiểu* timeline — nó produces output.

- **Descript Underlord**: text edit → video follow. Đúng hướng, nhưng text-only. Không có visual semantic, không có behaviors, không có cross-modal understanding.
- **adb-mcp** (Adobe Premiere qua MCP): UI automation fragile, không semantic. Agent gọi `click_button("Cut")` không phải `cut_at_word("w_042")`.
- **VideoEdit MCP** (videoeditmcp.com — 2025): agent-native, expose NLE semantics (tracks, clips, keyframes). Tốt nhất hiện tại về **agent interface**, nhưng vẫn **timecode-based**. Không có OntologyGraph, không có word_id anchoring, không có cross-modal signals. Agent biết "cắt tại giây 14.2" không biết "cắt sau câu vừa rồi".
- **JianYing MCP** (CapCut desktop Python wrapper): template automation, không creative reasoning.

### Whip: Agent Làm Việc Trên Semantic Layer — Khác Hoàn Toàn

**VideoEdit MCP (best competitor):**
```
agent → split_clip(clipId, t=14.2)        ← timecode, không semantic
agent → set_keyframe(prop="scale", t=14.2, value=1.15)  ← pixel, không intent
```

**Whip MCP:**
```
agent → cut_at_word(wordId="w_3f8a2b")     ← word UUID, stable sau mọi edits
agent → synthesize_behaviors("span_003")   ← output: BehaviorNode[] với intents
agent → apply_creator_style()              ← calibrate theo Style Graph
```

**Sự khác biệt cốt lõi:** VideoEdit MCP biết *vị trí* trong timeline. Whip MCP biết *ý nghĩa* của nội dung tại vị trí đó.

**Anthropic multi-agent pattern:**
```
Orchestrator Agent
    │
    ├── Analyzer Agent
    │     Tools: get_temporal_spans(), get_span_detail()
    │     Input: OntologyGraph slice (không phải toàn bộ — progressive disclosure)
    │     Output: semantic understanding — readable, reviewable, auditable
    │
    ├── Editor Agent
    │     Input: Analyzer output + Creator Style Graph
    │     Output: BehaviorNode[] với open editorial intents
    │     Pattern: propose → evaluate → refine (self-iterate)
    │
    └── Validator Agent
          Input: BehaviorNode[] + project constraints
          Output: approve / conflict flags / alternatives
```

**Không RAG.** OntologyGraph là typed structured data — relationships explicit, agent query deterministic. `project.whip` JSON fits in 200K context window (Karpathy file-based pattern).

**Tại sao đây là moat:**
- VideoEdit MCP là closest competitor — timecode-based vs semantic-based là architectural gap, không phải feature gap
- CapCut không có MCP, không có semantic graph — AI của họ chỉ là server-side template preset
- Adobe Premiere MCP là UI automation fragile — không phải semantic
- **Whip Script (video programming language)**: agent generate `.ws` code → runtime execute → video out. Không có competitor nào có layer này

---

## Moat 4 — Creator Lock-in Thật Sự (Semantic Style Graph)

> **Trạng thái implement 13/06/2026:** Đã có **thư viện WhipStyle + recommendation** (bước 1 của moat).
> Creator Style Graph học-theo-thời-gian (Bayesian, bên dưới) là ĐÍCH, chưa làm.
>
> **ĐÃ CÓ (`src/engine/whipStyles.ts`):** 6 WhipStyle = recipe đầy đủ (caption font/màu/pacing/highlight +
> look + cutTightness + brollDensity + punchZoom). `recommendStyles(footageSummary)` rank theo input type
> (talking-head/montage/...). Whip It phân tích input → auto-apply style hợp nhất; user đổi qua `StylePicker`.
> Caption có 5 highlight mode (color/box/underline/scale/bounce) render trong compositor.
>
> **CHƯA (research-grade):** phân tích VISION từ video mẫu (OCR caption sample + scene-cut detection +
> font-match) để replicate "y chang" 1 reference reel. Hiện recommend theo input type, không clone từ sample.
> Style Graph học per-creator Bayesian cũng chưa làm.

### Vấn đề với lock-in hiện tại

Lock-in của Premiere/CapCut = định dạng file (`.prproj`, `.capcut`). Lock-in **yếu** vì creator export video là xong.

### Whip: Data Moat Tích Lũy Theo Thời Gian

Sau mỗi project, Whip extract **Creator Style Graph** — fingerprint editing của creator:

```
Creator Style Graph (per creator, cross-project, stored serverside):
  cut_rhythm: {
    preferredCutOffset: -0.08s,    // hay cut 80ms trước beat, không phải đúng beat
    silenceThreshold: 0.3s,        // cắt dead air > 300ms
    paceTarget: 2.8,               // cuts/giây trung bình
  }
  motion_signature: {
    zoomIntensity: 1.10,           // subtle zoom, không phải 1.2x
    easeProfile: "expo_out_soft",  // không phải smoothPunch
    driftAmplitude: 0.008,         // handheld drift nhẹ
  }
  caption_voice: {
    stylePack: "loud",
    pacingMode: "chunk",
    fontWeight: 900,
    energyThreshold: 0.72,         // từ nào highlight
  }
  energy_curve: {
    buildDuration: 0.28,           // 28% đầu build up
    peakPosition: 0.65,            // peak ở 65% video
    releaseStyle: "gradual",
  }
  color_signature: {
    liftB: -0.02, saturation: 0.85,
    bloomThreshold: 0.75,
  }
```

**Cách hoạt động:**
1. Creator edit project → engine observe decisions (vị trí cut, zoom amount, caption timing)
2. Sau mỗi project: update Style Graph (Bayesian update, không overwrite)
3. Project tiếp theo: `synthesize_behaviors()` nhận Style Graph như prior → output personalized
4. Creator thấy: "Whip hiểu tôi muốn gì" → không cần re-configure mỗi lần

**Cách tạo lock-in:**
- Creator chuyển sang Premiere: mang file được, mang không được AI đã học về họ
- Style Graph ngày càng chính xác hơn → output ngày càng ít cần chỉnh → không muốn chuyển
- **Network effect phụ**: Style Graph anonymous được aggregate → Whip học "style của creator trên 100k subscriber" → feed vào recipe marketplace

**Tại sao đây là moat:**
- Data compound theo thời gian — không thể "clone" dù có code
- Không ai có dataset editing pattern của hàng triệu creator nếu không build platform trước
- Adobe/CapCut không có cross-project learning architecture

---

## Moat 5 — Thread Architecture & Zero Latency

### Vấn đề performance của browser app

Browser có 1 Main Thread. Mọi JavaScript, UI, animation đều chạy trên đó. 1 tác vụ nặng → UI đơ.

Mọi web editor hiện tại bị bottleneck bởi design này: CapCut web lag khi cắt video dài, Descript đơ khi AI processing.

### Whip: 5 Luồng Hoạt Động Độc Lập

```
UI Thread        → React render, input. Không bao giờ chạy code nặng.
                   Chỉ nhận typed diffs từ State Worker.
                   Mục tiêu: luôn ≥60fps, kể cả khi AI đang xử lý nền.

State Worker     → OntologyGraph SQLite. Event sourcing. Single source of truth.
                   Nhận mutations → compute → emit minimal diffs → UI Thread.
                   Xử lý graph queries, resolve anchors, validate constraints.

Render Worker    → WebGPU + OffscreenCanvas. GPUExternalTexture zero-copy.
                   Nhận render commands, không nhận state.
                   4K 60fps, CPU gần như idle.

Ingestion Worker → Whisper ONNX + MediaPipe. Chạy 1 lần khi video added.
                   Progressive emit: Word[] xong trước → UI update,
                   VisualEvent[] xong sau → UI update thêm.
                   Không block gì cả.

AI Worker        → LLM synthesis on-demand, Style Graph update.
                   Hoàn toàn async. Result cache vào OntologyGraph.
                   Retry tự động nếu fail, không ảnh hưởng edit session.

MCP SharedWorker → Agent interface. Chạy trong SharedWorker,
                   tất cả tab Whip đều connect được cùng 1 session.
```

**Kết quả thực tế:** Dù AI đang phân tích 30 phút video phía sau, user kéo keyframe vẫn 60fps mượt. Dù export đang chạy, timeline vẫn scrub instant. **Demo video là bằng chứng tốt nhất.**

**Tại sao đây là moat:**
- Cần expertise sâu về browser internals, SharedWorker, OffscreenCanvas, WebGPU
- Không thể outsource — mỗi phần phụ thuộc nhau, phải design đồng thời
- Một khi chạy tốt, UX gap với đối thủ là không thể giải thích bằng lời — phải dùng mới thấy

---

## Tại Sao 5 Moat Khuếch Đại Lẫn Nhau

```
Moat 1 (Semantic Graph)
    │ OntologyGraph là input cho agent
    ▼
Moat 3 (MCP Agent)
    │ Agent observe editing decisions
    ▼
Moat 4 (Creator Lock-in)
    │ Style Graph improve BehaviorNode generation
    ▼
Moat 1 (lại) → output tốt hơn → creator dùng nhiều hơn → loop

Moat 2 (Local WebGPU)
    │ Ingestion Worker fill OntologyGraph
    ▼
Moat 1 → richer signals → better behaviors

Moat 5 (Thread Architecture)
    │ Giữ 60fps khi Moat 2 đang ingest + Moat 3 đang synthesize
    ▼
UX tốt → creator dùng nhiều → Moat 4 tích lũy nhanh hơn
```

**Pitch một câu cho YC:**
*"Chúng tôi đang xây dựng ngôn ngữ lập trình cho video — thay vì thao tác thời gian, creator thao tác ý nghĩa. Adobe cần 5 năm để rebuild. Chúng tôi đang làm ngay bây giờ, và mỗi video được edit trên Whip làm cho Whip hiểu creator đó tốt hơn."*

---

## Unicorn Thesis — 3 Lớp Doanh Thu

**TAM thật sự:** Video editing software ~$2.1B. Developer tools ~$50B. Digital advertising ~$600B.

Whip không chỉ là editor — nó là infrastructure. 3 lớp:

```
L1: Editor ($30/tháng sub)
    → Creators dùng Whip GUI
    → TAM: $2.1B video software

L2: Platform API ($0.10/min video processed)
    → Developers build AI video tools trên Whip MCP + Whip Script runtime
    → "Stripe cho video" — không ai phải tự build video engine
    → TAM: $50B developer tools

L3: Ad Synthesis Engine (revenue share + render credit)
    → Creator Style Graph × Viewer Segment → N personalized ad variants
    → "Một brief → 10,000 personalized clips, mỗi clip style của 1 creator"
    → TAM: $600B digital ads
```

**Tại sao Whip có thể là $1B unicorn:**
1. **Market timing đúng:** Creator economy × AI × WebGPU × agent-native tooling tất cả mature 2026
2. **Technical moat thật sự:** Kiến trúc semantic graph — không phải feature hơn, kiến trúc khác — Adobe cần rebuild từ đầu
3. **Data flywheel:** Mỗi project → Style Graph tốt hơn → output tốt hơn → retention cao → more data → loop — compound không thể clone
4. **Whip Script:** "Video programming language" = developer platform play. Mọi AI agent muốn produce video gọi Whip runtime
5. **Distribution:** "Made with Whip" watermark trên video viral → 0-cost acquisition. Creator recommend cho creator.
6. **CapCut vulnerability:** ByteDance data sovereignty = Western market opening. Whip local-first = natural replacement

---

## SOTA 2026 — Model Stack Cập Nhật

> Docs gốc reference một số model đã thay đổi. Update này giữ đúng stack thực tế Q2/2026.

### Transcription (Ingestion Worker)
| Model | Cách dùng | Status |
|---|---|---|
| **Whisper ONNX (WASM+SIMD)** | Primary — local, $0, ~5.9s/60s audio | ✅ Production |
| **Deepgram Nova-3** | Fallback cloud — nếu user cần tốc độ real-time hoặc accent khó | $0.004/phút |
| **Parakeet-TDT 0.6B** (NVIDIA ONNX) | Thử nghiệm — 97% accuracy, 1 giây cho 60 giây audio | 🔄 Eval v2 |

**Quyết định kiến trúc:** WASM+SIMD vẫn beats WebGPU cho Whisper autoregressive loop. Không thay đổi.

### Visual Understanding (Ingestion Worker)
| Signal | Model | Status |
|---|---|---|
| Face / expression / gaze | **MediaPipe FaceLandmarker v2** (WebGL2) | ✅ Production |
| Gesture / pose | **MediaPipe GestureRecognizer + PoseLandmarker** | ✅ Production |
| Object segmentation | **SAM2 ONNX** (WebGPU compute) — thay thế Roto Brush approach | 🔄 P1 target |
| Background removal | **RMBG-2.0** (WebGPU, local) — không upload | 🔄 P1 target |
| Scene/content understanding | **Florence-2 ONNX** (WASM) — caption + grounding, chạy local | 🔄 V2 |

**Note:** TwelveLabs đã deprecated trong stack — replaced bởi frame sampling + Florence-2/Gemini (xem `whip-mvp-scope.md`).

### LLM Synthesis (AI Worker)
| Task | Model | Lý do |
|---|---|---|
| Behavior synthesis (`synthesize_behaviors`) | **Claude Haiku 4.5** | $0.001/phút, context window đủ cho OntologyGraph slice |
| Editorial intent ("Whip It" Art Director) | **Claude Sonnet 4.6** | Reasoning tốt hơn cho CompositionBrief generation |
| Whip Script generation | **Claude Sonnet 4.6** | Code gen quality cần Sonnet |
| Visual layout + style decision | **Gemini 2.5 Flash** | Multimodal — nhận frame samples, quyết định visual composition |

**Pattern chuẩn:** Orchestrator (Sonnet) → phân việc cho Analyzer (Haiku), Editor (Sonnet), Validator (Haiku). Không dùng RAG — OntologyGraph là structured data, agent query trực tiếp.

### Image Generation (Asset Layer)
| Use case | Model | Lý do |
|---|---|---|
| Background / scene asset | **FLUX.1 Kontext** (API) | Edit-aware generation — nhất quán với existing visual context |
| Character / product cutout | **Seedream 3.0** (API) hoặc **Ideogram v3** | Quality + RMBG-ready |
| Vector graphic / icon | **Recraft v3** (API) | SVG output — scale không vỡ |

### Video Generation (generate_asset())
| Use case | Model |
|---|---|
| B-roll generation | **Kling 2.0 API** hoặc **Wan 2.1** |
| Avatar / talking head | **HeyGen API** (nếu cần lip sync) |
| Live action extend | **Runway Gen-4 API** |

**Kiến trúc:** Whip không cạnh tranh với generation model — gọi họ như supplier. `generate_asset(prompt, style_context)` → trả về asset ID → import vào OntologyGraph.

---

## Counter-Thesis — Nếu Đối Thủ Làm Được X

> Phần này bắt buộc phải có. Không phân tích counter-thesis = không hiểu moat của mình.

### Scenario 1: CapCut build semantic anchoring trong 12 tháng
**Xác suất:** Thấp-trung. ByteDance có engineer, nhưng incentive structure khác.

**Phân tích:** CapCut target 700M casual user. Semantic graph phục vụ creator chuyên nghiệp — segment nhỏ hơn, ARPU cao hơn. ByteDance ưu tiên mass feature (video gen, avatar, filter) hơn architectural depth.

**Nhưng nếu họ làm:** Whip vẫn thắng bởi (1) Style Graph đã tích lũy qua số lượng projects, (2) Privacy moat không fixable dù CapCut có semantic graph — data vẫn lên server Trung Quốc, (3) MCP + Whip Script ecosystem đã có switching cost.

**Response nếu xảy ra:** Đẩy nhanh L2 API — khi developer ecosystem đã hình thành, CapCut GUI improvement không ảnh hưởng Whip platform.

---

### Scenario 2: Adobe mua VideoEdit MCP hoặc startup tương tự + tích hợp semantic layer
**Xác suất:** Trung bình. Adobe có pattern mua acquisition (Figma failed, Frame.io thành công).

**Phân tích:** Ngay cả khi Adobe mua, tích hợp vào C++ monolith mất 2-3 năm. Adobe có pattern: mua → bury → legacy. Premiere CC vẫn là 30 năm codebase.

**Response:** Creator market không chờ Adobe. Whip cần 100K creator trước khi Adobe có thể tích hợp acquisition.

---

### Scenario 3: Apple Final Cut Pro ra browser version + on-device AI (Neural Engine)
**Xác suất:** Thấp. Apple không có history làm web app cho pro tools.

**Phân tích:** Neural Engine của Apple có thể chạy Whisper + MediaPipe nhanh hơn WASM. Nhưng Final Cut = Mac/iPad only, không cross-platform.

**Response:** Whip cross-platform (Windows Chrome, Android Chrome) là lợi thế mà Apple không thể match.

---

### Scenario 4: Open-source project build semantic video editor (Hugging Face / community)
**Xác suất:** Trung bình dài hạn (3-5 năm).

**Phân tích:** Open-source có thể replicate Moat 1, 2, 5. Không thể replicate Moat 4 (Style Graph data per-creator) vì data cần người dùng thật sử dụng.

**Response:** Tốc độ và Style Graph data flywheel là khoảng cách không thể bắt kịp bằng code. OSS build được engine, không build được dataset 1M creator profiles.

---

## Mobile & Safari — Gap Cần Thừa Nhận

**Hiện trạng (Q2/2026):**
- Chrome desktop (Windows/Mac/Linux): WebGPU ✅ GA
- Safari macOS 17+: WebGPU ✅ (tháng 11/2025, limited support)
- Firefox: WebGPU ✅ (tháng 11/2025)
- **Chrome Android:** WebGPU ⚠️ experimental, không stable
- **Safari iOS:** WebGPU ❌ không có (WKWebView limitation)
- **CapCut mobile app:** Native, không bị giới hạn browser

**Impact thực tế:** Creator TikTok edit trên điện thoại là segment Whip chưa đánh được ở v1. Đây là gap thật.

**Mitigation strategy:**
1. **V1 target: Desktop creator** — podcast editor, course creator, coach. Họ dùng laptop/desktop, Chrome/Edge. WebGPU không phải issue.
2. **WASM fallback cho mobile:** Ingestion Worker có thể dùng WASM+SIMD thay WebGPU cho MediaPipe — chậm hơn ~3×, nhưng chạy được trên mobile Chrome. Render Worker fallback sang PixiJS/WebGL2 (đã có).
3. **V2 mobile:** Khi Chrome Android WebGPU stable (estimate Q4/2026), Whip mobile tự nhiên.
4. **iOS:** PWA với WebGL2 fallback. Không cần App Store. Core feature (caption + SmartLink + behaviors) chạy được trên WebGL2.

**Positioning:** Whip v1 là desktop-first, không mobile-first. Đây là honest positioning, không phải limitation — desktop creator là segment trả tiền nhiều hơn (professional workflow).
