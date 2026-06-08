---
id: whip-architecture
title: Kiến trúc SOTA 2026
sidebar_label: 🏗 Kiến trúc 2026
sidebar_position: 3
---

# Kiến trúc SOTA 2026

> **SOTA** = State of the Art = tiêu chuẩn kỹ thuật tốt nhất hiện tại (2026).
> Trang này giải thích *tại sao* Whip chọn từng công nghệ và chúng hoạt động cùng nhau thế nào.

---

## Bức tranh toàn cảnh

```
┌─────────────────────────────────────────────────────────────┐
│  TRÌNH DUYỆT (local — máy của creator)                      │
│                                                             │
│  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐ │
│  │  UI Thread   │  │  Render Worker  │  │  State Worker  │ │
│  │              │  │                 │  │                │ │
│  │  React UI    │  │  WebGPU         │  │  Yjs CRDT      │ │
│  │  Zustand     │  │  Zero-copy      │  │  Event log     │ │
│  │  60fps mượt  │  │  VideoFrame     │  │  DAG graph     │ │
│  └──────┬───────┘  └────────┬────────┘  └───────┬────────┘ │
│         │                   │                   │          │
│         └───────────────────┼───────────────────┘          │
│                             │ SharedWorker                 │
│                    ┌────────▼────────┐                      │
│                    │  MCP Server     │  ← agent interface  │
│                    │  (tool calls)   │                      │
│                    └────────┬────────┘                      │
│                             │                               │
│         ┌───────────────────┼──────────────────┐           │
│         │                   │                  │           │
│  ┌──────▼──────┐   ┌────────▼──────┐   ┌───────▼──────┐   │
│  │    OPFS     │   │  SQLite (DB)  │   │  AI Worker   │   │
│  │  File SSD   │   │  Semantic idx │   │  Whisper     │   │
│  │  proxy mp4  │   │  pgvector     │   │  on WebGPU   │   │
│  └─────────────┘   └───────────────┘   └──────┬───────┘   │
└────────────────────────────────────────────────┼───────────┘
                                                 │ HTTPS (on demand)
                              ┌──────────────────┴──────────┐
                              │  CLOUD (chỉ khi cần)        │
                              │  Elixir/Phoenix GenServer   │
                              │  → collab, persist, share   │
                              │                             │
                              │  Modal GPU (heavy AI only)  │
                              │  → video LLM, stem sep      │
                              │                             │
                              │  PostgreSQL + R2/S3         │
                              │  → events, assets           │
                              └─────────────────────────────┘
```

**Nguyên tắc vàng:** Mọi thứ latency-critical (kéo keyframe, scrub, preview 60fps, AI nhẹ) chạy **hoàn toàn trong trình duyệt**. Server chỉ lo cái không real-time (login, lưu, share, AI nặng).

---

## 1. Thread Architecture — Tại sao UI không bao giờ bị treo

### Vấn đề cần giải quyết

Browser có 1 **Main Thread** (luồng chính) chạy tất cả: UI, JavaScript, animation. Nếu một tác vụ nặng (decode video, chạy AI) chạy trên luồng này → UI đơ, không kéo được gì.

### Giải pháp: 4 luồng độc lập

**UI Thread** (Main Thread)
- Chỉ vẽ giao diện React, nhận input từ user
- KHÔNG bao giờ chạy code nặng
- Mục tiêu: luôn ≥ 60fps

**Render Worker** (Web Worker + OffscreenCanvas)
- `OffscreenCanvas` = canvas không gắn vào DOM, chạy trong Worker
- WebGPU render chạy hoàn toàn trong Worker này
- Nhận lệnh từ UI Thread qua `postMessage`, render và trả về frame

**State Worker** (Web Worker)
- Quản lý toàn bộ project state (Yjs CRDT document)
- Xử lý event sourcing, tính toán DAG graph
- Giao tiếp với AI Worker và MCP Server

**AI Worker** (Web Worker)
- Chạy Whisper (transcription) và vision model trên WebGPU
- Gọi LLM API khi cần quyết định semantic phức tạp
- Hoàn toàn tách biệt, không ảnh hưởng UI

### Cách chúng giao tiếp

```
UI Thread ──postMessage──▶ State Worker ──tools──▶ MCP Server
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
             Render Worker           AI Worker
          (frame lên canvas)      (analysis, LLM calls)
```

---

## 2. Zero-Copy Pipeline — Render 4K không qua CPU

### Vấn đề với WebGL cũ (đang dùng)

Hiện tại Whip dùng PixiJS/WebGL. Flow render một frame:

```
Video file → CPU decode → CPU sao chép pixel → GPU texture → Render
                ↑ bottleneck ở đây — CPU phải đụng vào từng pixel
```

Với video 4K, mỗi frame có 8.3 triệu pixel. CPU copy 8.3M pixel × 30fps = **249M pixel/giây** → tốn tài nguyên, pin cạn nhanh, frame drop.

### Giải pháp: WebGPU + GPUExternalTexture (Roadmap v2)

**WebCodecs** = Web API decode video bằng phần cứng (GPU hoặc chip decode riêng), ra `VideoFrame`.

**GPUExternalTexture** = WebGPU API map `VideoFrame` trực tiếp thành GPU texture — CPU không sao chép pixel.

```
Video file → WebCodecs decode (phần cứng) → VideoFrame
                                                 │ GPUExternalTexture (zero-copy)
                                                 ▼
                                           GPU Texture → WGSL Shader → Render
```

**Kết quả:** CPU gần như không làm gì trong quá trình render. 4K 60fps mượt. Pin tiêu thụ ít hơn 60%.

### Trạng thái hiện tại

- ✅ **Đang dùng**: PixiJS + WebGL — hoạt động ổn cho đến 1080p
- ❌ **Roadmap v2**: WebGPU zero-copy pipeline — cần khi target 4K + file lớn

---

## 3. OPFS — Xử lý file 50GB không crash

### Vấn đề

Tab trình duyệt giới hạn RAM ~2-4GB (V8 Heap Limit). Load file 50GB từ máy quay Sony → crash ngay.

### Giải pháp: File System Access API + OPFS (Roadmap v2)

**File System Access API**: Trình duyệt xin quyền đọc file trực tiếp từ ổ cứng user, không tải vào RAM.

**OPFS** (Origin Private File System): Vùng lưu trữ riêng của app trong trình duyệt — nhanh hơn `localStorage`, hỗ trợ file lớn, đọc/ghi bằng API stream.

**Proxy workflow**:
```
File gốc 50GB (SSD) ──đọc theo byte range──▶ WebCodecs decode (từng frame)
                                                       │ (ngay sau render)
                                               Giải phóng bộ nhớ

Song song: tạo bản proxy 720p → OPFS (background Worker)
           User edit trên proxy → nhanh, nhẹ
           Khi export → đọc lại file gốc 50GB để render chất lượng cao
```

---

## 4. Yjs CRDT — State không bao giờ bị mất

### Vấn đề với state thông thường

Mọi app thông thường lưu state theo kiểu **snapshot**: "đây là trạng thái hiện tại". Khi mất kết nối mạng hoặc nhiều người edit cùng lúc → conflict, dữ liệu mất.

### Giải pháp: Yjs CRDT (Roadmap v3)

**CRDT** (Conflict-free Replicated Data Type): Cấu trúc dữ liệu được thiết kế đặc biệt để nhiều bản sao có thể thay đổi độc lập và luôn có thể merge lại mà không bao giờ conflict — bằng toán học, không phải "ai thắng ai".

**Yjs** là thư viện CRDT phổ biến nhất (Figma, Linear, Notion đều dùng). Compile qua **WebAssembly** để chạy ở tốc độ native trong trình duyệt.

**Kết quả:**
- Mất mạng giữa chừng → tiếp tục edit local, sync lại khi có mạng, không mất gì
- 2 người edit cùng clip → tự động merge, không conflict
- Undo/Redo vô hạn — CRDT lưu toàn bộ lịch sử dưới dạng operations

---

## 5. MCP Server — Giao diện cho AI Agent

### Vấn đề với "AI edit" hiện tại

AI hiện tại tương tác với editor qua text prompt → editor interpret → thực thi. Không reliable, không atomic.

### Giải pháp: MCP Server trong SharedWorker

**MCP** (Model Context Protocol): Chuẩn mở của Anthropic để AI model gọi tools theo cách structured, có type, có schema rõ ràng.

**SharedWorker**: Web Worker dùng chung giữa nhiều tab — MCP Server chạy ở đây, mọi tab Whip đều connect được.

```
Claude / GPT          Whip MCP Server (SharedWorker)
     │                        │
     │ call: split_clip       │
     │ { id: "clip_001",      │──▶ State Worker
     │   at: 5.0 }            │    → split clip
     │                        │    → recalculate anchors
     │◀── result: success ────│    → emit event
```

**Tools hiện có (scaffold):**
- `get_project` — lấy tóm tắt project (không dump toàn bộ JSON)
- `split_clip` — cắt clip tại timestamp
- `add_behavior` — thêm behavior vào clip
- `apply_preset` — áp preset caption/style
- `render` — export ra file

**Nguyên tắc quan trọng:** Agent không nhận toàn bộ JSON (quá lớn, tốn token). Nhận đúng context cần — 1 clip + surrounding beats + anchor info.

---

## 6. Transport Layer — Sync với Server

### Hiện tại (v1): HTTP thường

API call khi cần (save, load, share). Không real-time.

### Roadmap v3: WebTransport (QUIC/HTTP3)

**WebTransport** thay thế WebSocket cho media-heavy app vì giải quyết **Head-of-line blocking**:

> WebSocket chạy trên TCP. TCP đảm bảo gói tin đến đúng thứ tự — nếu rớt 1 gói, toàn bộ stream sau đó chờ. Với video, điều này gây lag.

**QUIC** (nền tảng của HTTP/3) chạy trên UDP, hỗ trợ **multiplexing** (nhiều stream độc lập):

```
WebTransport
  ├── Stream Reliable (CRDT delta sync) → đảm bảo state đúng
  └── Stream Unreliable (video preview) → rớt frame OK, không chờ
```

---

## 7. AI Layer — Local vs Cloud

### Local AI (trình duyệt, không tốn tiền API)

| Model | Dùng cho | Chạy ở đâu |
|---|---|---|
| Whisper (tiny/base) | Transcription → phoneme map | WebGPU Worker |
| Vision model nhỏ | Scene type, energy, emotion | WebGPU Worker |
| Beat detection | BPM, beat timestamps | Web Worker (DSP) |

### Cloud AI (khi cần phân tích nặng)

| Model | Dùng cho | Gọi khi |
|---|---|---|
| Gemini 2.0 Flash | Semantic scene description | Clip mới thêm vào |
| Claude Sonnet | Cut optimization, reasoning | Khi user thay đổi lớn |
| Whisper large-v3 | Transcription chất lượng cao | User yêu cầu |
| GPU model (Modal) | Stem separation cho nhạc | Export + beat match |

**Nguyên tắc:** Chạy local trước → cloud chỉ khi local không đủ. Giảm tối đa API cost.

---

## 8. Storage

### Hiện tại

```
project.whip (JSON) → Supabase / localStorage
assets → blob URLs trong RAM
```

### Roadmap v2: Phân tầng

```
OPFS
├── nodes/                    ← mỗi node 1 file (concurrent write an toàn)
├── events.log                ← append-only (undo/redo history)
├── semantic.db               ← SQLite (wa-sqlite): query nodes, store embeddings
└── proxy/                    ← video proxy 720p

PostgreSQL (server)
├── events (append-only)      ← backup event log
└── projects (metadata)

R2/S3
└── original assets           ← file gốc 4K khi cần share/export
```

---

## So sánh: Hiện tại vs Target

| Component | Hiện tại (v1) | Target (v2/v3) |
|---|---|---|
| Renderer | PixiJS + WebGL | WebGPU + GPUExternalTexture |
| File handling | Blob URL (RAM) | OPFS + byte-range streaming |
| State | Zustand (mutable) | Yjs CRDT (immutable ops log) |
| AI inference | API-only | Local WebGPU + API fallback |
| Transport | HTTP fetch | WebTransport (QUIC) |
| Storage | JSON + Supabase | SQLite OPFS + PostgreSQL |
| Agent interface | window.whip (hacky) | MCP Server (SharedWorker) |
