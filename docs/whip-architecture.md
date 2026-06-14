---
id: whip-architecture
title: Kiến trúc SOTA 2026
sidebar_label: 🏗 Kiến trúc 2026
sidebar_position: 3
---

# Kiến trúc SOTA 2026

> Trang này giải thích *tại sao* Whip chọn từng công nghệ và chúng liên kết thế nào thành một hệ thống không thể copy rời từng phần.
> Đây không phải danh sách feature — đây là **lý luận kiến trúc** cho nhà đầu tư và kỹ sư senior.

---

## Bức tranh toàn cảnh

```
┌──────────────────────────────────────────────────────────────────────┐
│  TRÌNH DUYỆT (local — máy của creator, video không rời máy)          │
│                                                                      │
│  ┌─────────────┐   ┌──────────────────┐   ┌────────────────────┐    │
│  │  UI Thread  │   │  Render Worker   │   │   State Worker     │    │
│  │  React UI   │   │  WebGPU          │   │   OntologyGraph    │    │
│  │  60fps luôn │   │  GPUExternalTex  │   │   SQLite (local)   │    │
│  │  Zustand    │   │  OffscreenCanvas │   │   Event log        │    │
│  └──────┬──────┘   └────────┬─────────┘   └─────────┬──────────┘    │
│         │                  │                        │               │
│         └──────────────────┼────────────────────────┘               │
│                            │ SharedWorker                           │
│                   ┌────────▼────────┐                               │
│                   │  MCP Server     │ ← agent / Claude Code attach  │
│                   │  Semantic tools │                               │
│                   └────────┬────────┘                               │
│                            │                                        │
│         ┌──────────────────┼──────────────────┐                    │
│         ▼                  ▼                  ▼                    │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │    OPFS     │  │   Ingestion      │  │   AI Worker      │       │
│  │  File proxy │  │   Worker         │  │   (on-demand)    │       │
│  │  720p cache │  │   Whisper ONNX   │  │   LLM synthesis  │       │
│  │  byte-range │  │   MediaPipe      │  │   Style learning │       │
│  └─────────────┘  └──────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS (chỉ khi cần — persist/share/collab)
               ┌──────────────────────────────────────────┐
               │  Elixir/Phoenix — collab, event backup   │
               │  PostgreSQL — project metadata           │
               │  R2/S3 — asset storage khi share         │
               └──────────────────────────────────────────┘
```

**Nguyên tắc vàng:** Mọi thứ latency-critical (scrub, preview, AI nhẹ, render) chạy **hoàn toàn local**. Server chỉ lo cái không real-time (auth, persist, share, collab).

---

## 1. Hai Phase Tách Biệt — Ingestion vs Edit

Đây là insight kiến trúc quan trọng nhất, phân biệt Whip với mọi editor hiện tại.

### Phase 1 — Ingestion (chạy 1 lần khi add video, background)

```
Video file added
      │
      ├─── Ingestion Worker (background, không block UI)
      │         │
      │    ┌────┴────────────────────────────────────────────┐
      │    │  Audio pipeline                                 │
      │    │    WebCodecs → PCM                             │
      │    │    Whisper ONNX (WebGPU) → Word[]              │
      │    │      {id: uuid, w, start, end, confidence}     │
      │    │    Web Audio API → Acoustic[]                  │
      │    │      {t, energy, pitch, rms} per 10ms          │
      │    │    pyannote ONNX → Speaker[]                   │
      │    │      {speakerId, start, end}                   │
      │    │                                                │
      │    │  Visual pipeline                               │
      │    │    WebCodecs → VideoFrame[] (hardware decode)  │
      │    │    MediaPipe FaceLandmarker →                  │
      │    │      FaceEvent[] {frameT, expression, lookAt}  │
      │    │    MediaPipe GestureRecognizer →               │
      │    │      GestureEvent[] {frameT, gesture}          │
      │    │    MediaPipe PoseLandmarker →                  │
      │    │      PoseEvent[] {frameT, motion_delta}        │
      │    └────────────────────────────────────────────────┘
      │         │ all local, $0, hardware-accelerated
      │         ▼
      │    OntologyGraph (SQLite, State Worker)
      │    → TemporalSpan[] aggregated từ signals
      │         │
      │    AI Worker (LLM synthesis — 1 lần)
      │    → Claude Haiku nhận TEXT SUMMARY (không phải pixel)
      │      "Span 00:00–00:45: energy=0.9, gesture=pointing,
      │       words='đây là điều quan trọng nhất', tone=emphatic"
      │    → BehaviorNode[] với open editorial intents
      │    → lưu vào OntologyGraph
      │
      DONE. Video đã được semantic-indexed.
      User bắt đầu edit được ngay với partial results.
```

### Phase 2 — Edit (compute thuần, không có model inference)

```
User cut tại Word w_042
      │
      ├─ mark Word[w_042...].visible = false          O(1)
      ├─ query: BehaviorNodes với anchor trong visible words  O(n)
      ├─ update TemporalSpan boundaries               O(n)
      └─ CompileRender() → keyframes                  O(n)

Không có API call.
Không có model inference.
Không có frame processing.
Thuần compute từ OntologyGraph đã index.
```

**Analogy:** Elasticsearch không re-parse document mỗi lần search. Whip không re-run MediaPipe mỗi lần user kéo timeline.

---

## 2. OntologyGraph — Não của Hệ Thống

Thay vì lưu timeline như mảng thời gian (CapCut/Premiere), Whip lưu một **đồ thị ngữ nghĩa có kiểu** (typed semantic graph):

```
Object Types:
  Word          → 1 từ transcribed, stable UUID, visible/hidden state
  FaceEvent     → 1 khoảnh khắc visual: expression, lookAt, landmarks
  GestureEvent  → 1 gesture được detect: pointing, open_hands, nodding
  PoseEvent     → body motion intensity tại thời điểm t
  Acoustic      → energy/pitch/rms tại t (10ms resolution)
  TemporalSpan  → aggregated semantic closure [start, end] chứa tất cả signals
  BehaviorNode  → editorial intent do LLM generate, anchored to word_id
  EditorialDecision → user override của BehaviorNode (không xóa original)

Link Types (typed edges):
  Word          --[PART_OF]-->     TemporalSpan
  FaceEvent     --[PART_OF]-->     TemporalSpan
  GestureEvent  --[PART_OF]-->     TemporalSpan
  TemporalSpan  --[CONTAINS]-->    TemporalSpan   (hierarchy: chapter > section)
  TemporalSpan  --[FOLLOWS]-->     TemporalSpan   (sequence)
  BehaviorNode  --[ANCHORED_TO]--> Word | VisualEvent
  BehaviorNode  --[CROSS_MODAL]--> BehaviorNode   (audio+visual trigger cùng intent)
  EditorialDecision --[OVERRIDES]-> BehaviorNode

Provenance trên mọi object:
  { source: "whisper_onnx" | "mediapipe" | "claude_haiku" | "human" | "agent",
    confidence: 0–1, modelId, createdAt }
```

Agent traverse graph này để ra quyết định editorial — không cần RAG, không cần vector search, vì **relationships đã explicit**.

---

## 3. Thread Architecture — UI Không Bao Giờ Bị Treo

> **Implement 13/06/2026 — chống crash thật (Moat #5 = no-crash, đã trả giá nhiều lần):**
> - **Whisper = WASM, KHÔNG WebGPU** (research SOTA + transformers.js #860: WebGPU Whisper leak tensor →
>   GPU mất device → crash). WASM on-device giữ Moat #2; whisper-tiny + audio cap 150s → vài giây.
> - **GPU contention — SUSPEND không chỉ pause:** Whip It transcribe → `compositor.suspend()` RELEASE mọi
>   video decoder + texture GPU (không chỉ pause render loop — texture 4K vẫn nằm GPU mem là đủ gây crash khi
>   WASM/audio spike). Resume = setProject lại khi `whipBusy` false. Timeline (DOM) vẫn hiện cut.
> - **ErrorBoundary** (main.tsx): uncaught render error (PixiJS throw khi webgl-lost) → banner "Try again"
>   (soft recover, KHÔNG mất project) thay vì trắng/reload app. Beacon `react.error` để soi.
> - **Video memory (compositor):** `preload="metadata"` (KHÔNG "auto" — auto nuốt cả file 4K vào RAM → OOM).
>   LRU evict: tối đa `MAX_VIDEOS=8` decoder sống cùng lúc; video URL đổi (proxy thay gốc) → unload+rebuild.
> - **Decode gate concurrency=1** cho probe/poster/proxy (native decode mem không hiện JS heap → guard mù).
> - **Scrub:** `fastSeek` (keyframe-nearest) thay `currentTime` exact → mượt với 4K.
> - **Memory guard** (`observe.ts`): JS heap >2.2GB → auto pause queue nền. Crash-capture (window.error/webgl.lost/
>   pagehide → beacon `/__plog`) để soi crash sống qua reload. Self-test: `npm run stress` (Playwright, 23GB no-crash).
> - Bên dưới là KIẾN TRÚC ĐÍCH (SQLite State Worker, OffscreenCanvas Render Worker) — chưa chuyển hết sang worker.


```
UI Thread        → React render, input. KHÔNG chạy code nặng. Luôn ≥60fps.
                   Nhận diffs từ State Worker, không nhận toàn bộ state.

State Worker     → OntologyGraph SQLite, event sourcing.
                   Nhận mutations → compute → emit diffs → UI Thread.
                   Là single source of truth.

Render Worker    → WebGPU + OffscreenCanvas.
                   GPUExternalTexture: VideoFrame → GPU texture, CPU không touch pixel.
                   4K 60fps, pin tiêu thụ giảm 60%.

Ingestion Worker → Whisper ONNX + MediaPipe. Chạy khi video added.
                   Progressive: audio xong trước → emit Word[] → UI update.
                   Visual xong sau → emit VisualEvent[] → UI update thêm.

AI Worker        → LLM synthesis (on-demand). Gọi khi ingestion xong.
                   Nhận text summary, trả BehaviorNode[].
                   Kết quả cache vào OntologyGraph, không gọi lại.

MCP Server       → SharedWorker. Agent và user cùng nhìn 1 OntologyGraph.
                   Expose semantic actions, không expose UI operations.
```

Message schema giữa workers: **diffs only** (không serialize toàn bộ state), typed (Zod schema), versioned (optimistic concurrency).

---

## 4. AI Layer — Local-First, Zero Video Upload

**Nguyên tắc không thể thỏa hiệp:** Video file không bao giờ rời máy user.

| Model | Input | Chạy ở đâu | Backend | Cost |
|---|---|---|---|---|
| Whisper ONNX (base) | PCM audio | Ingestion Worker | **WASM+SIMD** (faster than WebGPU on decoder loop) | $0 |
| MediaPipe FaceLandmarker | VideoFrame (local) | Ingestion Worker | **WebGL2 delegate** (WebGPU support in progress #5029) | $0 |
| MediaPipe GestureRecognizer | VideoFrame (local) | Ingestion Worker | WebGL2 delegate | $0 |
| MediaPipe PoseLandmarker | VideoFrame (local) | Ingestion Worker | WebGL2 delegate | $0 |
| pyannote ONNX | PCM audio | Ingestion Worker | WASM | $0 |
| RMBG | Image frame (local) | AI Worker | WebGPU compute | $0 |
| Claude Haiku | **Text only** — structured summary | AI Worker → API | Claude API | ~$0.001/phút video |
| Deepgram (fallback transcription) | Audio only | API | Cloud | $0.004/phút |

**Không có model nào nhận pixel từ video file lên cloud.** MediaPipe xử lý pixel local trả structured data. Claude chỉ nhận text summary.

30 phút video: tổng chi phí AI ≈ **$0.03**. So sánh TwelveLabs: $12/30 phút.

> **Honest note — Whisper backend:** Community benchmarks (Transformers.js issue #894) trên Mac M2 cho thấy Whisper-base WASM+SIMD (~5.9s/60s audio) nhanh hơn WebGPU (~9.5s/60s audio). Lý do: autoregressive decoder loop là bottleneck — GPU underutilized giữa các decode step. WebGPU thắng cho parallelizable workloads (ViT encoder, diffusion), WASM thắng cho sequential decoder. Whisper-base WASM là lựa chọn đúng.

> **Honest note — MediaPipe backend:** MediaPipe Tasks for Web dùng TFLite WASM + WebGL2 delegate làm default. Native WebGPU backend đang trong progress (GitHub issue #5029). Face mesh và hand tracking chạy 50–300 FPS trên desktop; BlazePose Heavy (full body) gần hơn 20–60 FPS. Whip dùng WebGL2 path hiện tại, sẽ migrate sang WebGPU khi stable.

### Tại sao không dùng Gemini/GPT-Vision để analyze frames?

Frame sampling → cloud vision model = *pixel → text description*. Đây **không phải** semantic understanding vì:
- Mất temporal continuity giữa các frames
- Cloud model mô tả *what it sees*, không hiểu *flow* qua thời gian
- Chi phí cao, video data gửi lên cloud
- MediaPipe chạy TRÊN MỌI FRAME local, cho dense temporal signal (30fps × duration) tốt hơn sparse sampling

### Về Temporal Grounding — Honest Assessment

UniTime (NeurIPS 2025) là SOTA cho temporal grounding nhưng cần 7B+ parameter model — **không chạy được in-browser 2026**. Smallest viable: ~1B params (Qwen2-VL-1B class), latency 5–30s trên GPU server cho 60s clip.

Whip V1 approach: Claude Haiku nhận **text summary** của signals → semantic spans. Accuracy thấp hơn UniTime nhưng:
- Runs on-device (text synthesis, không phải video understanding)
- Latency < 2s cho summary
- V2 path: khi WebNN (Web Neural Network API — Chrome 128+) mature và edge models shrink → migrate sang on-device grounding

---

## 5. Storage — Reference + Proxy + Stream (implement 06/2026)

> **Bài học đã trả giá:** copy bản gốc 20GB VÀO OPFS = nhân đôi đĩa + decode 95 video cùng lúc → **crash thật**.
> OPFS không phải "chân ái" cho mọi thứ. Mỗi tầng 1 nhiệm vụ (SOTA-2026, Chromium):

```
BẢN GỐC (chục GB)  → File System Access handle (IndexedDB), 0 copy, để yên trên đĩa
   │ <video src=blobURL> stream byte-range — KHÔNG full-load (RAM tab ~2–4GB)
   ▼
Preview/edit  → PROXY 540p (OPFS, nhẹ, scrub mượt)        ← đụng liên tục
Export        → re-point compositor về GỐC 4K (full-res)   ← đụng hiếm
```

**File-by-file (mỗi thứ làm gì):**
- `assetHandles.ts` — lưu `FileSystemFileHandle` của bản gốc vào IndexedDB. Reload → `queryPermission`/`requestPermission` (gesture) re-link. `getAssetUrl` ưu tiên handle → fallback OPFS.
- `proxyTranscode.ts` — `<video>` decode (native) → canvas 540p → `VideoEncoder` H.264 → `mp4-muxer`. Video-only (audio từ gốc). Lazy: chỉ transcode clip lên timeline/preview.
- `assetStore.ts` — OPFS chỉ giữ DERIVED: `proxy-<id>`, poster. Không chứa gốc to.
- `pipelineLog.ts` + `observe.ts` — JSON log (sống qua crash, beacon `/__plog`) + **memory guard**: RAM >2.2GB → tự pause queue nền (back-off, Moat #5). Poster/proxy serialize 1/lần → không OOM khi import folder lớn.

**Import:** `showDirectoryPicker`/`showOpenFilePicker` → handle (Chromium). Safari/FF cũ → fallback input + OPFS copy.

Tab browser giới hạn RAM ~2-4GB. File 50GB → crash mọi editor khác. Whip không full-load vào RAM, không copy gốc, edit trên proxy.

---

## 6. Agent Architecture — SOTA 2026 (Anthropic Pattern)

Whip không implement "AI suggest → user click accept". Whip implement **agent thực sự execute** trên semantic layer.

Theo Anthropic workshop 2025: **specialized sub-agents > single generalist agent**.

```
Orchestrator Agent
      │
      ├── Analyzer Agent
      │     Tools: get_temporal_spans(), get_span_detail(), get_visual_events()
      │     Input: OntologyGraph slice (không phải toàn bộ)
      │     Output: semantic understanding — text, có thể review
      │
      ├── Editor Agent
      │     Input: Analyzer output + Creator Style Graph
      │     Output: BehaviorNode[] với open editorial intents
      │     Pattern: propose → evaluate → refine (tự iterate)
      │
      └── Validator Agent
            Input: BehaviorNode[] + project constraints
            Output: approve / conflict flags / alternatives
```

**Không RAG.** Agent dùng typed tools để query OntologyGraph — data là structured, relationships là explicit, không cần vector similarity. File-based (Karpathy pattern): `project.whip` JSON fit trong context window cho small-medium projects; typed tools expose slice cho large projects.

---

## 7. Storage — Phân Tầng

> Hiện tại (06/2026): gốc = File System Access handle (§5); OPFS giữ `proxy-<id>` 540p + poster;
> graph trong `project.whip` JSON; undo = in-memory stack. Dòng dưới là ĐÍCH (SQLite/events.log chưa làm).

```
Local (realtime):
  OPFS/nodes/        ← (đích) mỗi OntologyGraph object = 1 file (concurrent write safe)
  OPFS/events.log    ← (đích) append-only (infinite undo/redo)
  SQLite (wa-sqlite) ← (đích) semantic index, query nhanh, pgvector cho Moat 4
  OPFS/proxy-<id>    ← video proxy 540p (ĐÃ CÓ)

Server (on-demand):
  PostgreSQL         ← event log backup, project metadata
  R2/S3              ← asset storage khi share/export
  Elixir/Phoenix     ← collab sync, auth
```

---

## 8. So Sánh: Whip vs Mọi Đối Thủ

| | Premiere | CapCut Web | Descript | VideoEdit MCP | Whip |
|---|---|---|---|---|---|
| State model | Mảng thời gian | Mảng thời gian | Text-centric | Frame/timecode | **Semantic graph** |
| Video processing | CPU | WebAssembly/local | Server upload | FFmpeg local | **WebCodecs+WebGL2** |
| AI understanding | Cloud Sensei | Server-side AI | Transcript (Whisper) | None | **Local signals (MediaPipe+Whisper)** |
| Agent interface | Partial (adb-mcp, fragile) | Không | Không | ✅ MCP (timecode-based) | **Semantic MCP (word_id)** |
| Cut invariance | Không | Không | Partial (text edit) | Không | **Word-ID anchored** |
| Creator learning | Không | Không | Không | Không | **Style Graph (data flywheel)** |
| Cross-modal signals | Không | Không | Không | Không | **Audio+Visual+Caption** |
| File limit | ~8GB RAM | Upload limit | Upload limit | OS limit | **Unlimited (OPFS byte-range)** |
| Cost/30min | N/A | ~$5 server | ~$5 AI | $0 (FFmpeg) | **~$0.03 AI** |
| Open vocabulary behaviors | Không | Không | Không | Không | **LLM-generated intents** |

**VideoEdit MCP** (videoeditmcp.com) là tool closest đến Whip về agent-native design, nhưng expose timecode-based operations, không semantic. Không có OntologyGraph, không có word_id anchoring, không có creator style learning.
