---
id: whip-mvp-scope
title: MVP Status & Roadmap
sidebar_label: ✅ MVP & Roadmap
sidebar_position: 5
---

# MVP Status & Roadmap

> **Đây là bảng sự thật** — cái gì đã build xong, cái gì đang làm, cái gì chưa làm.
> Cập nhật thủ công sau mỗi sprint.

---

## Trạng thái hiện tại (June 2026)

### ✅ Đã hoàn thiện — Production

| Tính năng | Mô tả | File chính |
|---|---|---|
| ✅ Engine render (PixiJS WebGL) | Render video/image/text lên canvas 60fps | `compositor.ts` |
| ✅ Keyframe + Bezier easing | Animate mọi thuộc tính, 7 preset easing | `interpolate.ts`, `ease.ts` |
| ✅ Multi-track timeline | Video + Audio tracks, drag/trim/split | `Timeline.tsx`, `store.ts` |
| ✅ Speed ramp | Slow-mo, time-remap, reverse | `speed.ts` |
| ✅ Text overlay | Font, size, color, weight, alignment | `compositor.ts` |
| ✅ Text effects | Shadow, glow (Figma-style stackable) | `TextEffects.tsx` |
| ✅ Gradient fill chữ | Linear gradient trên text | `compositor.ts` |
| ✅ Shape primitives | Rect, ellipse, line, background | `compositor.ts` |
| ✅ Effects stack | Bloom, chromatic aberration, film grain, vignette, color correct, light leak | `effects.ts` |
| ✅ Smart behaviors | zoomToRegion, sequenceReveal, punchOnEmphasis | `behaviors.ts` |
| ✅ Auto-viral caption | Word-level Deepgram, 4 style packs, 3 pacing modes | `captionService.ts` |
| ✅ SmartLink caption | Caption tự bám audio khi cắt/dời — không lệch | `captions.ts` |
| ✅ Caption per-block style override | Mỗi block có thể có style riêng | `CaptionBlockPanel.tsx` |
| ✅ Scene view | Nhóm clip thành cảnh (storyboard view) | `SceneView.tsx` |
| ✅ Preset browser | Style pack preset nhanh | `PresetBrowser.tsx` |
| ✅ Asset store | Quản lý video/audio/image assets | `assetStore.ts` |
| ✅ Clip constraint | Figma-style anchor clip vào clip khác | `project.ts` |
| ✅ Export H.264 | WebCodecs, 1080p free / 4K pro | `export.ts` |
| ✅ Multiple aspect ratios | 9:16, 16:9, 1:1, 4:5 | `project.ts` |
| ✅ Auth + billing | Clerk login, LemonSqueezy subscription | `license.ts` |
| ✅ Project persistence | Save/load project JSON | `projectFolder.ts` |

### 🔄 Scaffold — Đang hoàn thiện

| Tính năng | Mô tả | Còn thiếu gì |
|---|---|---|
| 🔄 MCP tools | Schema defined, tools listed | MCP server thật (SharedWorker), wiring |
| 🔄 Audio FX | Schema defined (EQ, compressor, limiter) | UI đầy đủ, WebAudio wiring |
| 🔄 Transitions | Schema defined (crossDissolve, wipe, dip) | Shader implementation |
| 🔄 Overlay system | Schema defined (caption/super/disclaimer span) | UI components |
| 🔄 TwelveLabs integration | API wired, polling flow | UX hoàn thiện, CORS proxy |
| 🔄 Cloud save/share | Cloudflare Worker endpoint | UI, versioning |

### ❌ Chưa làm — Roadmap

| Tính năng | Phase | Lý do chưa làm |
|---|---|---|
| ❌ WebGPU renderer | v2 | Cần WebGPU stable + expertise |
| ❌ Zero-copy VideoFrame | v2 | Phụ thuộc WebGPU |
| ❌ OPFS large file | v2 | File System Access API cần UX careful |
| ❌ SQLite in OPFS | v2 | Phụ thuộc OPFS |
| ❌ Semantic anchor DAG | v2 | Core moat, cần architecture rewrite |
| ❌ Beat map extraction | v2 | On-device DSP hoặc API |
| ❌ On-device Whisper | v2 | WebGPU model loading |
| ❌ Yjs CRDT | v3 | Offline + collab |
| ❌ WebTransport | v3 | Sau CRDT |
| ❌ Collaborative editing | v3 | Sau CRDT |
| ❌ Video LLM semantic analysis | v3 | Sau semantic graph |

---

## MVP Definition (Launch target)

**MVP = Editor đủ dùng cho creator talking-head + Auto-caption viral + Auth/Billing.**

Đây là thứ creator cần mỗi ngày và đủ để charge tiền:

```
✅ Import video từ máy
✅ Cut/trim/split basic
✅ Zoom punch-in tự động (behaviors)
✅ Auto caption word-level (killer feature)
✅ Caption style viral (loud/clean/cinematic)
✅ Export 1080p MP4 (free) / 4K (pro)
✅ Login + token system
```

**MVP KHÔNG cần:**
- WebGPU (WebGL đủ cho 1080p)
- Collab / CRDT
- Semantic anchor DAG
- File 50GB (target sau)

---

## Roadmap Phase

### Phase 0 — Pre-launch (Done ✅)
Engine chạy, export được, caption viral live.

### Phase 1 — Launch MVP (Current 🔄)
Hoàn thiện UX: onboarding, MCP scaffold, audio FX, transitions. Target: **creator tự dùng được mà không cần hỏi**.

**Deliverables:**
- [ ] Onboarding flow (interactive, ≤ 3 phút)
- [ ] Transitions UI hoàn thiện
- [ ] Audio FX UI (EQ, volume automation)
- [ ] MCP server thật (1-2 tools hoạt động)
- [ ] Cloud save/share link

### Phase 2 — Performance + Scale (v2)
WebGPU zero-copy, OPFS large file, Semantic Anchor DAG. **Đây là lúc Whip bắt đầu thực sự khác Adobe.**

**Deliverables:**
- [ ] WebGPU renderer thay PixiJS
- [ ] OPFS proxy workflow (file 50GB)
- [ ] SQLite semantic index
- [ ] Semantic anchor: phoneme + relative_time
- [ ] Beat map extraction (local DSP)
- [ ] MCP server đầy đủ (10+ tools)
- [ ] Agent demo: "edit 1-click theo style này"

### Phase 3 — Collaboration + Platform (v3)
Yjs CRDT, WebTransport, multi-user. **Đây là lúc pitch Series A.**

**Deliverables:**
- [ ] Yjs CRDT local-first state
- [ ] WebTransport sync (collab)
- [ ] Multi-user editing
- [ ] Semantic keyword anchor
- [ ] Creator style learning (AI learns your patterns)
- [ ] Plugin/extension API

---

## Token Economics

| Thứ | Free | Pro ($XX/tháng) |
|---|---|---|
| Export resolution | 1080p | 4K |
| Watermark | Có | Không |
| Auto-caption phút/tháng | 30 phút | Unlimited |
| Storage | Local only | Cloud sync 10GB |
| Export batch | 1 | 10 |
| Agent MCP | ❌ | ✅ |
