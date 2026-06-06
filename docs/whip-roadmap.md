---
id: whip-roadmap
title: Roadmap & Checklist
sidebar_label: ✅ Roadmap
sidebar_position: 8
---

# Roadmap & Checklist

> Build order. **v0** = chứng minh engine chạy. **v1** = NLE basic đầy đủ (mốc bạn quan tâm).
> **v2** = vượt AE/Resolve cho niche này + tích hợp Ontos.

---

## v0 — "Chạy được và export được" (proof engine)

- [ ] Vite + React + Zustand skeleton, PixiJS canvas
- [ ] Project JSON schema (zod) + interpolation engine
- [ ] Load 1 video làm `<video>` texture, 1 transform track, scrub timeline
- [ ] Keyframe scale punch-in, playback mượt
- [ ] Export mp4 qua WebCodecs + mp4-muxer (video-only)

→ **Milestone:** 1 clip talking-head + smooth zoom, export ra mp4. Không cần AE cho cú đó.

---

## v1 — "NLE basic hoàn chỉnh" ← mốc chính

- [ ] Timeline đa track: drag / trim / split / **ripple-delete / snapping / copy-paste / markers**
- [ ] **Transform stack** per clip: scale / position / rotation / crop / anchor / opacity / blend
- [ ] **Transitions**: cross-dissolve, fade-to-black, wipe, dip-to-color
- [ ] **Text engine**: title, lower-third, caption — keyframeable
- [ ] **Color correction**: brightness / contrast / saturation / temperature / curves (WebGL shader)
- [ ] **Speed / time-remap**: slow-mo, speed ramp, reverse
- [ ] **Effect library (viral edge)**: shake, RGB-split/glitch, zoom-blur, grain, light leaks, vignette
- [ ] **Audio (CapCut-pain fix)**: waveform, A/V sync, **volume automation keyframe**, fade,
      detach, mute/solo, **EQ + compressor/limiter** (WebAudio native), export AAC
- [ ] **Smart Animation (edge lõi)**: anchors (region/cue) + behaviors (`zoomToRegion`,
      `sequenceReveal`, `punchOnEmphasis`) + compiler → keyframe. Region derive từ marker/tay (v1),
      từ transcript (v2). Bind motion vào nội dung, không vào giây cứng — xem [Smart Animation](./whip-behaviors.md)
- [ ] **Keyframe UX (override)**: keyframe tay + **graph/curve editor** (bezier) + bake behavior
- [ ] **Signature Look**: ease preset "Smooth Punch" (expo-out) + curve editor (linear/bezier/
      continuous/auto/hold + value & speed graph + influence handle) + speed ramp + glow stack
      (bloom/light-leak/haze/milky-black/grain/chromatic) — xem [Signature Look](./whip-look.md)
- [ ] **Interaction (must, không để v2)**: viewport + timeline infinite-canvas — pan chuột giữa,
      zoom Alt+scroll, inertia, snapping pixel-threshold, shortcut AE-muscle — xem [Interaction](./whip-interaction.md)
- [ ] **Export presets**: 16:9 / 9:16 / 1:1 / 4:5 + social bitrate, GPU encode, async
- [ ] **MCP server** expose Command API → drive từ Claude Code

→ **Milestone:** cut trọn 1 video talking-head end-to-end, **không mở AE / Resolve / CapCut.**

---

## v2 — "Hơn AE/Resolve cho niche này" + Ontos

- [ ] Agent skills (behavior-driven): `autoZoomOnMention`, `autoPunchIn`, `autoSequenceGraphics`,
      `autoCutOnSilence`, `beatSync`, `autoCaptions` (Whisper), `autoReframe` (MediaPipe), `autoDuck`
      → agent gắn anchors+behaviors từ transcript, **không rải keyframe**
- [ ] **Chroma key** (green screen) + **masking** (shape/feather) — shader
- [ ] **LUT / film grading**, adjustment layer, color-managed working space
- [ ] Motion blur lúc export (sub-frame accumulation)
- [ ] **Electron shell**: native file, project lớn, **ffmpeg fallback** (ProRes/HEVC), local agent
- [ ] **Tích hợp Ontos**: auth + workspace + credit (export 4K, AI job), persistence, share-link
- [ ] WebGPU compositing path cho effect stack nặng

---

## Quyết định đã chốt

| Câu hỏi | Chốt |
|---|---|
| Web hay desktop trước | **Web-first** (Chromium), code drop vào Electron sau |
| Tauri hay Electron | **Electron** (Tauri macOS = WebKit → WebCodecs gãy) |
| Chromium-only lúc dev | **OK** — bạn xài Chromium sẵn |
| GUI-first hay agent-first v0 | **GUI-first** (thấy engine chạy), MCP ở v1 |
| Tên | **Whip** (dự phòng: Glide / Swoop) |
| Tích hợp Ontos khi nào | **v2** — v0/v1 standalone, engine không phụ thuộc Ontos |

---

## Còn cần chốt (trước khi scaffold v0)

- [ ] **v0 scope**: "1 clip + smooth zoom + export" đủ chưa, hay muốn audio-synced cut luôn trong v0?
- [ ] Repo: tách `Codebase/whip` riêng, hay monorepo với Ontos?
- [ ] Preset pack đầu tiên: chốt 5 cú (`smoothZoomIn`/`whipPan`/`drift`/`shake`/`punchIn`) đủ chưa?

---

## Risk & mitigation

| Risk | Mitigation |
|---|---|
| WebCodecs chỉ Chromium | Target Chromium trước; Electron bundle Chromium |
| Preview effect stack giật | Composite 2D/Pixi, cache frame decode, proxy res khi scrub |
| Seek frame-accurate video dài | WebCodecs + keyframe index (mp4box); proxy media |
| Agent edit sai | Mọi command zod-validate + undoable; project là diff review được |
| Over-abstraction Ontos sớm | v0/v1 standalone; chỉ cắm Ontos ở v2 khi cần billing thật |
