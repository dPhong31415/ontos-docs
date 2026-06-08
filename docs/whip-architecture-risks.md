---
id: whip-architecture-risks
title: Architecture Risks (VFR / OOM / Concurrency)
sidebar_label: ⚠️ Arch Risks & Pipeline
sidebar_position: 8
---

# Whip — Architecture Risks & Data Pipeline (honest assessment)

> Trả lời thẳng câu hỏi: Whip có đang trị được 3 "hố đen" production không? Đánh giá **trạng thái thật**
> của code hiện tại + quyết định kiến trúc. Cập nhật 07/06/2026.

## TL;DR trạng thái thật

| Hố đen | Hiện trạng | Rủi ro |
|---|---|---|
| **VFR (iPhone)** | 🟩 **Phần lớn đã né** — preview + export đọc frame qua `<video>` element (browser tự decode PTS-correct), KHÔNG tự parse VFR | Thấp cho preview; cần test sync audio file dài |
| **OOM (object pooling)** | 🟥 **CHƯA làm** — chưa có object pooling, waveform decode full vào RAM, thumbnail tạo `<video>` tạm | Cao khi nhiều clip/track |
| **Concurrency (Web Worker)** | 🟥 **CHƯA làm** — OPFS copy + waveform decode + asset probe chạy MAIN THREAD | UI jank khi import file lớn |
| **Lazy decode** | 🟩 **Có sẵn (ngầm)** — preview dùng `<video>.currentTime` seek = browser chỉ decode khi cần | Tốt |

→ **Thành thật:** Whip đang ở "happy path" cho VFR + lazy-decode (nhờ lean vào `<video>`), nhưng **OOM + Web Worker concurrency là CHƯA có** — đúng 20% cuối mà tư vấn Google cảnh báo. Đây là moat thật + việc cần làm trước scale.

---

## 1. VFR (Variable Frame Rate, iPhone) — 🟩 phần lớn né được

**Vì sao đỡ:** Whip KHÔNG tự demux/parse frame cho preview. Compositor dùng **`<video>` HTML element** + `currentTime` seek; **browser tự xử VFR + PTS** → frame trả về đúng thời điểm. Export (`engine/export.ts`) cũng **sample `<video>` tại fixed fps** (`compositor.seekAndWait(t)` mỗi `1/fps`) → output **CFR** tự nhiên (resample qua browser decoder).

**Audio sync:** export mix audio bằng `OfflineAudioContext.decodeAudioData` (real sample rate) + schedule theo `clip.start` giây. Video sample theo giây → cùng trục thời gian giây → **không lệch pha theo VFR** (vì cả 2 map theo seconds, không theo frame index).

**Còn rủi ro / cần test:**
- File rất dài (>10 phút) + nhiều cut: drift tích lũy nhỏ giữa audio offline render và video sample — cần test thực tế.
- `seekAndWait` chờ `seeked` event; vài codec seek chậm → export chậm (không sai, chỉ chậm).
- **Quyết định:** giữ chiến lược "lean on `<video>`" cho VFR. KHÔNG tự viết PTS interpolation (đó là chỗ AI hay gãy) trừ khi cần frame-accurate scrubbing pro.

## 2. OOM (Out of Memory) — 🟥 phải làm

**Hiện tại:**
- 1 `<video>` / asset (reuse — tốt), nhưng `<video>` giữ buffer riêng.
- `computeWaveform` decode **toàn bộ** audio file vào AudioBuffer (RAM lớn với file dài) — cache theo url (không free).
- `ThumbnailStrip` tạo `<video>` tạm mỗi clip để seek thumbnail → nhiều clip = nhiều decoder.
- Sprite/filter cache theo clip (ok), nhưng không có pooling frame.

**Quyết định kiến trúc cần ép:**
- **Object pooling** cho VideoFrame/texture lúc export (tái dùng buffer thay vì new mỗi frame). Hiện export `new VideoFrame` + `frame.close()` mỗi frame — đã close (tốt) nhưng nên giới hạn `encodeQueueSize` (đã có `>8 → await`).
- **Waveform:** decode **downsampled/streamed** (đọc theo chunk → peak), KHÔNG giữ full AudioBuffer; free sau khi tính peak. Cache chỉ giữ mảng peak (nhẹ) — hiện đã cache peak nhưng vẫn decode full 1 lần.
- **Thumbnail:** dùng **1 decoder dùng chung** + hàng đợi, hoặc `createImageBitmap` từ frame, giải phóng ngay. Giới hạn số thumbnail đồng thời.
- **Cap RAM:** theo dõi `performance.memory` (Chrome), cảnh báo + giảm preview quality khi cao.

## 3. Concurrency (Web Worker) — 🟥 phải làm

**Hiện tại:** main thread làm hết — OPFS read/write, `decodeAudioData` (waveform), asset probe, caption WAV extract. → import file lớn / nhiều waveform = **đơ UI** (PixiJS render loop nghẽn).

**Quyết định kiến trúc:**
- **Web Worker pool** (2-4 worker) cho: (a) copy file → OPFS, (b) waveform peak compute, (c) WAV extract cho caption, (d) thumbnail decode.
- Giao tiếp qua `postMessage` + transferable (ArrayBuffer) → zero-copy.
- **OPFS trong worker:** `navigator.storage.getDirectory()` chạy được trong worker → ghi file lớn không chặn main.
- Tránh deadlock: worker stateless, mỗi job độc lập, main thread điều phối hàng đợi (không worker chờ worker).
- **State sync:** main thread là source of truth (Zustand store); worker chỉ nhận input → trả output, không giữ state project.

## 4. Lazy decode vs buffer-ahead — quyết định

**Câu hỏi:** đẩy thẳng vào buffer từ đầu, hay Lazy Decode (lướt tới đâu decode tới đó)?

**Quyết định: Lazy Decode (đã đang dùng ngầm) + buffer-ahead nhẹ cho playback.**
- **Scrub/seek:** lazy — `<video>.currentTime` (browser decode on-demand). Đã có **coalesced seek** (`requestSeek` + `pendingSeek`) để không spam decoder khi kéo nhanh → mượt. Đây đúng hướng tư vấn gợi ý.
- **Playback:** `<video>.play()` (browser buffer-ahead tự nhiên) + AudioContext clock đồng bộ. Không cần tự buffer.
- **Export:** sequential lazy (seek từng frame) — đúng, không cần buffer cả file.
- → KHÔNG buffer toàn bộ vào RAM từ đầu (sẽ OOM). Lazy + coalesce + (sau) worker decode = kiến trúc đúng.

## 5. Lộ trình "20% cuối" (trước scale lớn)
1. **Web Worker pool** (waveform + OPFS copy + thumbnail) — bỏ jank import. ưu tiên 1.
2. **Waveform streaming decode** (không giữ full AudioBuffer) — giảm OOM. ưu tiên 1.
3. **Thumbnail shared decoder + queue** — giảm số `<video>` tạm.
4. RAM monitor + auto-degrade preview quality (gắn với viewport quality modes Low/Mid/High/Auto).
5. Test VFR thực: quay iPhone 60fps VFR → export → kiểm sync phút 3-5.

→ Hiện MVP (vài clip, file vừa) **chạy ổn**. Mục 1-3 cần **trước khi** user ném 50 cuts + 10 track như tư vấn cảnh báo.

---

## 7. SOTA 2026 — đánh giá 4 công nghệ (nên làm cái nào, khi nào)

> Cả 4 đều là mỏ vàng nhưng learning-curve dốc. Xếp theo **ROI cho Whip** + thời điểm.

### 7.1 WebGPU Compute Shaders (thay WebGL/PixiJS) — 🟡 v2, KHÔNG vội
- **Lợi:** color grade/blur/glow/chromatic chạy compute shader song song → 4K real-time, CPU rảnh.
- **Thực tế:** PixiJS v8 ĐÃ dùng WebGPU renderer (có fallback WebGL) — ta đang hưởng 1 phần. Viết compute shader thủ công = rewrite engine, learning-curve dốc.
- **Quyết định:** giữ PixiJS (đã WebGPU-capable). Viết custom WGSL compute **chỉ cho effect nặng cụ thể** khi gặp bottleneck đo được. KHÔNG rewrite vì "SOTA". → v2.
- **Liên quan lag hiện tại:** lag 4K KHÔNG phải do WebGL chậm, mà do **thumbnail seek + decode trên main thread** (đã debounce). WebGPU không cứu cái này — cần Web Worker.

### 7.2 Local SLM + WebNN (AI offline trong browser) — 🟢 ĐÁNG, sau caption
- **Lợi:** SLM 1-2B (Gemma 2B / Llama 3.2 1B) qua WebLLM/WASM/WebGPU → đọc transcript, chunk, phân tích hook OFFLINE → cắt phụ thuộc Deepgram/cloud, zero-knowledge, $0 API.
- **Thực tế:** model ~500MB-1.5GB tải lần đầu (cache). Chunk caption (việc nhẹ) SLM làm tốt. ASR (transcribe) thì Whisper-web (WASM) chạy được nhưng chậm hơn Deepgram nhiều trên máy yếu.
- **Quyết định:** 
  - **Caption chunk** → chuyển sang **WebLLM SLM** được (thay BytePlus) → tiết kiệm token. ROI cao, làm sau khi caption ổn.
  - **Transcribe** → giữ Deepgram (nhanh, chính xác); offer Whisper-web làm tier "free/offline" sau.
- → Lộ trình: caption chunk local trước, transcribe local sau.

### 7.3 CRDT (Yjs/Automerge) + OPFS — multiplayer ("Figma cho Video") — 🟢 moat, v2 (cần Elixir)
- **Lợi:** project = JSON → Yjs CRDT → 2 người sửa real-time không conflict. Elixir/Phoenix gánh WebSocket sync.
- **Thực tế:** ĐÚNG kiến trúc Whip (data-driven JSON). Nhưng cần backend Phoenix (chưa dựng) + rework store sang Yjs doc.
- **Quyết định:** **moat thật cho v2.** Khi build Ontos/Phoenix → tích Yjs. Giờ store Zustand đã là single-source JSON → migrate sang Yjs không vỡ data-model. KHÔNG làm trước launch (cần collab mới đáng).

### 7.4 Semantic visual search (Vision-Language embed frame) — 🟢 killer cho auto-edit, v2
- **Lợi:** embed frame qua VLM nhẹ (WebGPU) → vector spike khi mở mắt/đập bàn/giơ đồ → auto Hook + punch-in KHÔNG cần text. Vượt OpusClip (chỉ nghe transcript).
- **Thực tế:** CLIP/SigLIP nhẹ chạy WebGPU embed được; cần pipeline sample frame + embed + detect spike. Learning-curve cao.
- **Quyết định:** đây là **nâng cấp của LLM Viral Harness (E)** — sau khi harness text-based chạy. Visual = layer 2. v2.

### Tóm tắt ưu tiên SOTA
1. **Web Worker pool** (KHÔNG trong list nhưng cứu lag NGAY) — P1 hạ tầng.
2. WebLLM caption chunk (7.2) — sau caption, tiết kiệm token.
3. CRDT (7.3) + Visual search (7.4) — v2 cùng Ontos.
4. WebGPU compute (7.1) — chỉ khi đo được bottleneck cụ thể.

→ **Đừng để "SOTA FOMO" làm chậm launch.** PixiJS đã đủ; lag hiện tại fix bằng Worker (kiến trúc), không phải đổi sang WebGPU.

## 6. Text/Caption properties — hướng Figma (không phải DaVinci shading)
- User KHÔNG thích "Shading Elements" cứng của DaVinci (8 element cố định).
- **Hướng chọn: Figma-style** — section **Appearance / Fill / Stroke / Effects**, mỗi cái có nút **"+ Add"**: thêm Shadow / Glow / Background / Gradient tùy ý (list effect động, mỗi effect có control + xóa).
- Áp cho cả **text clip + caption** (unified). 1 effect = 1 object trong mảng `textStyle.effects[]` (kind: shadow/glow/longShadow/bgBox + params) → render compositor.
- File: schema TextStyle thêm `effects[]`; TextEffectsPanel (Figma-style add list); compositor render.
- TT: ☐ (làm ở P0.3).
