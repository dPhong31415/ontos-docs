---
id: whip-system-design
title: System Design
sidebar_label: 🏗 System Design
sidebar_position: 3
---

# System Design

> Trang này giải thích **các thành phần của Whip, chúng nói chuyện thế nào, và tại sao**. Đọc trước khi đụng code.

---

## Bức tranh toàn cảnh

Whip là **thick client** (engine chạy local) + **thin services** (server-side, mượn từ Ontos).

```
┌──────────────────────────────────────────────────────────────┐
│  WHIP CLIENT (browser / Electron)  — nơi 95% việc xảy ra      │
│                                                                │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │ React UI   │   │ Command Bus  │   │  Render Engine        │ │
│  │ (Zustand)  │──▶│ (zod-valid,  │──▶│  • Interpolator       │ │
│  │ timeline,  │   │  undo log)   │   │  • PixiJS (WebGL)      │ │
│  │ curve ed.  │   │              │   │  • WebAudio (clock)   │ │
│  └────────────┘   └──────┬───────┘   │  • WebCodecs encode   │ │
│        ▲                 │           └──────────┬────────────┘ │
│        │          ┌──────▼───────┐              │              │
│        │          │ project.whip │◀─────────────┘              │
│        │          │  (JSON doc)  │   đọc tại time t            │
│        └──────────┴──────────────┘                            │
└───────────────────────┬──────────────────────────────────────┘
                        │  chỉ khi cần (không phải mỗi keyframe)
        ┌───────────────┼────────────────┬─────────────────┐
        │               │                │                 │
   ┌────▼─────┐   ┌──────▼──────┐  ┌──────▼──────┐   ┌──────▼──────┐
   │  Auth    │   │ Project     │  │  Asset      │   │ Async AI    │
   │ Workspace│   │ persistence │  │  storage    │   │ jobs        │
   │ Credits  │   │ (share/ver) │  │  (R2/S3)    │   │ (Whisper…)  │
   └──────────┘   └─────────────┘  └─────────────┘   └─────────────┘
        └──────────────── ONTOS PLATFORM (Elixir) ───────────────┘
```

**Quy tắc vàng:** mọi thứ **latency-critical** (kéo keyframe, scrub, preview 60fps) chạy
**hoàn toàn trong client**. Server chỉ lo cái **không realtime** (login, lưu, asset, job AI nặng).
Không round-trip mỗi thao tác edit lên Elixir — xem [Ontology Reuse](./whip-ontology-reuse.md).

---

## Render Engine — hàm thuần `(project, t) → frame`

```
                    project.whip
                         │
              ┌──────────▼───────────┐
   t (giây) ─▶│   INTERPOLATOR        │  với mỗi track, đọc clip active tại t,
              │   tính giá trị mọi    │  lerp từng property theo keyframe + bezier
              │   property tại time t │
              └──────────┬───────────┘
                         │  scene state (transforms, effects, opacity…)
              ┌──────────▼───────────┐
              │   PIXIJS COMPOSITOR   │  upload frame video → texture,
              │   (WebGL)            │  áp transform + shader effect, blend track
              └──────────┬───────────┘
                         │
        ┌────────────────┼─────────────────┐
        │                                  │
   PREVIEW (canvas)               EXPORT (WebCodecs VideoEncoder)
   60fps, proxy res khi scrub     từng frame → H.264 → mp4-muxer
```

**Master clock = `AudioContext.currentTime`.** Video, animation, export đều bám clock của
WebAudio để A/V không lệch. Đây là lý do audio không phải "track phụ" mà là **xương sống timeline**.

---

## Luồng 1: Import media

```
Drag file ─▶ File System Access API (web) / native dialog (Electron)
          ─▶ tạo asset node trong project.assets {id, type, src, duration}
          ─▶ video: probe metadata (mp4box) → fps, w/h, keyframe index
          ─▶ audio: decodeAudioData → vẽ waveform
          ─▶ thumbnail/proxy gen (optional, cho scrub mượt)
```

Codec ngoài WebCodecs (ProRes/HEVC) → chỉ Electron + ffmpeg fallback (v2).

---

## Luồng 2: Edit (cú kéo keyframe)

```
User kéo handle  ─▶ UI phát command setKeyframe(clipId, "scale", {t, v, ease})
                 ─▶ Command Bus: zod validate → apply vào project.whip
                 ─▶ push vào undo log (before/after)
                 ─▶ Zustand notify → Render Engine repaint tại playhead
                 ─▶ (KHÔNG chạm server)
```

Mỗi command tất định + undoable. Pattern y hệt `action_log` của [Kinetic](./ontology-kinetic.md)
nhưng chạy in-memory, không phải Postgres transaction.

---

## Luồng 3: Preview playback

```
play() ─▶ AudioContext start, requestAnimationFrame loop
       ─▶ mỗi frame: t = audioCtx.currentTime - startOffset
       ─▶ Interpolator(project, t) → Compositor → canvas
       ─▶ scrub nhanh: hạ xuống proxy res, cache frame đã decode
```

---

## Luồng 4: Export

```
render({range, out}) ─▶ VideoEncoder (H.264 hardware) + AudioEncoder (AAC)
                     ─▶ loop t từ start→end theo fps:
                          Interpolator → Compositor → VideoFrame → encode
                     ─▶ WebAudio OfflineAudioContext render mix → AAC
                     ─▶ mp4-muxer ghép video+audio → Blob mp4
                     ─▶ async, progress bar, không freeze UI
```

v2: motion blur = accumulate sub-frame samples lúc export (chỉ export, không preview).

---

## Web vs Desktop — chọn shell

| | Web (Chromium) | Tauri | **Electron** |
|---|:---:|:---:|:---:|
| WebCodecs | ✓ Chrome/Edge | ⚠️ macOS = WebKit, **không tin được** | ✓ bundles Chromium, mọi OS |
| Binary | 0 (URL) | ~5–10MB | ~100–150MB |
| Reuse code web | 100% | phải viết lại encode bằng Rust | **100%** |
| File lớn / render dài | giới hạn browser | native | native |

**Quyết định:** **Web-first** (Chromium) để build/iterate nhanh, kiến trúc để code drop thẳng vào
shell sau. Khi lên desktop → **Electron, KHÔNG Tauri** (vì Tauri macOS dùng WebKit, WebCodecs gãy).
100MB với editor video là số lẻ so với Resolve (hàng GB).

---

## Stack một dòng

> **Vite + React + Zustand + PixiJS (WebGL) + WebCodecs + WebAudio + mp4-muxer + Zod**,
> chạy JSON timeline khai báo, editing expose qua **MCP Command API**.
> Electron + ffmpeg chỉ thêm khi web hết cữ. Còn lại là dead weight.

Không Next.js (editor là SPA, SSR thừa). Không ffmpeg.wasm trong hot path (20MB+, chậm).
