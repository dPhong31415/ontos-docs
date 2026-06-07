---
id: whip-mvp-flows
title: MVP Features & Flows (debug ref)
sidebar_label: 🔧 MVP Flows (debug)
sidebar_position: 10
---

# Whip — MVP Features & Detailed Flows (debug reference)

> Bản liệt kê **mọi tính năng MVP + luồng chi tiết** để ngồi debug. Mỗi flow: trigger → bước → file →
> trạng thái (✅ chạy / ⚠️ có bug / ☐ chưa làm). Cập nhật 07/06/2026.

## Trạng thái tổng (legend)
✅ chạy · ⚠️ có vấn đề/đang sửa · ☐ chưa làm · 🗑️ bỏ khỏi MVP

---

## A. Basic NLE (editor lõi) — ✅

| Tính năng | Flow | File | TT |
|---|---|---|---|
| Multi-track V/A | track video (trên) + audio (dưới), DaVinci layout | Timeline.tsx | ✅ |
| Move clip | pointerdown thân pill → drag → moveClip (snap, cross-lane) | Timeline + store.moveClip | ✅ |
| Trim | kéo mép → trimClip (clamp source bound, hiện bracket khi đụng) | store.trimClip | ✅ |
| Split / Razor | nút B / 3 nút cut; razorSplitAll, razorTrim (ripple) | store | ✅ |
| Overwrite collision | thả đè → resolveOverlaps (cắt/split clip dưới) | store.resolveOverlaps | ✅ |
| Undo/redo | run() đẩy undoStack; Cmd+Z/Y | store.run | ✅ |
| Snap | snapSec → clip edge/playhead | Timeline | ✅ |

## B. Import (drag & drop) — ✅
- **Flow:** kéo file MP4/img/audio từ máy → thả vào timeline / media pool → `addAsset` (probe duration/w/h, OPFS putAsset) → `addClipFromAsset` (full duration hoặc đoạn trim IN/OUT).
- Kéo từ MediaPool card → Timeline onDrop (whip/asset) → ghost pill snap → tạo clip đúng lane.
- File: MediaPool.tsx, Timeline.tsx onDrop, store.addAsset/addClipFromAsset, engine/assetStore.ts (OPFS).
- TT: ✅. ⚠️ cần test kéo file trực tiếp từ desktop vào timeline (hiện chủ yếu qua pool).

## C. Export (modal settings) — ⚠️
- **Hiện tại:** nút Export → export ngay (không modal).
- **Cần (MVP):** modal chọn: resolution/aspect, fps, range (in/out), watermark (free), format. → rồi mới render.
- Flow đích: Export → **ExportModal** (chọn settings) → exportMp4(project, compositor, opts) → progress → download.
- File: engine/export.ts (có sẵn range+watermark), App.tsx onExport. ☐ ExportModal chưa làm.

## D. Auto-Viral Caption — ✅ (killer feature)
### D1. Auto caption từ audio
- **Flow:** tab Caption → "Tự tạo caption" → lấy clip có tiếng (video/audio) → `autoCaptionFromAudio` (tách WAV 16k mono) → POST `/api/caption` (Vercel Edge) → Deepgram nova-2 word-timestamps → chunk (BytePlus LLM / rule-based) → blocks[] → setCaptionBlocks.
- Token gate: `captionCost(dur)` (10 token/phút), `consumeTokens`. Cache theo asset (re-gen = 0 token). Nút "Transcribe lại (bỏ cache)".
- File: CaptionPanel.tsx, engine/captionService.ts, api/caption.ts, engine/credits.ts.
- TT: ✅ LIVE (`/api/caption` test ok).
### D2. Smart relink (caption bám audio)
- **Flow:** block tag `srcAsset`+`srcIn` (source-time). Mỗi edit timeline → `relinkCaptions` tính lại start/end theo clip audio nguồn. Default ON, toggle tắt.
- File: store.relinkCaptions, schema CaptionBlock.
- TT: ✅ (split nhiều lần dùng probe giữa block).
### D3. Render caption
- compositor.renderCaptions: 3 pacing (word/chunk/karaoke), style pack, wrap nhiều dòng + maxCharsPerLine.
- TT: ✅. ⚠️ caption từng mất khi setProject (đã fix reset cache).

## E. LLM Viral Harness (auto-edit) — ☐ CHƯA, ưu tiên cao
> "LLM phân tích input → viral harness → cut section + gắn caption + hook + effect (paste JSON harness)".
- **Flow đích:**
  1. Input: transcript (Deepgram) + video.
  2. LLM (BytePlus) đọc transcript + **viral harness rules** (prompt template) → trả JSON: `{ sections:[{start,end,hook,caption,effects:[...] }] }`.
  3. Áp JSON → razorSplit theo section + addOverlay/captionTrack + applyPreset effect tại mỗi section.
  4. User dán JSON harness tay cũng được (như paste preset JSON).
- File cần: `engine/harness.ts` (apply JSON → project), prompt ở api/ hoặc client, UI "Auto-edit".
- Liên quan: scenarios.ts (đã có buildGadzhiTalkingHead = harness thủ công).
- TT: ☐.

## F. Audio modes — ⚠️ cần nâng cấp
- **Default "wave":** clip video hiện waveform strip dưới (linked). ✅
- **Mode audio:track (CẦN):** khi bật → audio của MỖI clip video **tách xuống thành clip audio riêng** trên track A bên dưới, **unlink** khỏi video. User chọn audio pill → cắt/dời/trim ĐỘC LẬP.
  - Flow đích: toggle audio mode "track" → tạo track audio + clone audio-clip từ mỗi video clip (asset, in, start, end) với cờ `detached` → render/playback dùng clip audio đó, video clip mute.
  - Cần: store action `detachAudio()`, schema clip có thể là audio-only ref tới video asset, UI chọn/trim audio pill riêng.
- File: Timeline audioMode, store, audio.ts.
- TT: ⚠️ hiện chỉ vẽ waveform strip; chưa tách clip thật.

## G. Animate / Vector — 🗑️ shape cũ → ☐ vector mới
- **Bỏ:** shape primitives hiện tại (rect/ellipse/line/background) — 🗑️ remove.
- **Làm:** vector layer kiểu AE/Illustrator: pen-tool path (bezier), edit anchor/handle, fill/stroke/gradient. ☐.
- File: bỏ ShapeControls + addShapeClip shape primitives UI; thêm vector path schema + pen tool.
- TT: shape ✅ đang có (sẽ gỡ), vector ☐.

## H. Caption ↔ Text unified (CẦN) — ☐
- **Hiện:** caption chỉnh ở **tab Caption trái** (chỉ style pack + pacing + Y/size). Text clip chỉnh ở **right panel** (font/size/kerning/stroke...). → 2 nơi, không nhất quán.
- **Cần:** gộp — caption dùng **chung TextStyle mở rộng** (font, size, weight, kerning, leading, align, fill, stroke, **glow, shadow, gradient**). Chỉnh caption **ở RIGHT panel** khi chọn caption (không phải caption panel trái). Caption panel trái chỉ giữ: gen AI + style pack preset + **caption rule** (karaoke: highlight current vs all; pacing).
- File: ClipPanel (right) thêm CaptionControls; schema TextStyle thêm glow/shadow/gradient; compositor render.
- TT: ☐.

## I. Properties + Keyframe (CẦN đủ) — ⚠️
- **Hiện:** ClipPanel có transform (scale/opacity/rotation) + keyframe nav (◂◆▸) + graph tab trái.
- **Cần:** keyframe đầy đủ cho MỌI property (cả text style, caption, shape→vector, audio gain...). Mỗi property row có stopwatch ◆ + nav ◂▸ rõ.
- ⚠️ UI: slider nhỏ khó kéo · icon keyframe/mũi tên nhỏ · chữ trong input field màu trắng "rởm" · color picker bị che (z-index thấp).
- TT: ⚠️ (fix UI dưới).

## J. Speed ramp — ☐ CẦN
- **Flow đích:** clip có `speed` keyframe-able (time-remap) → graph speed curve; render/playback đọc speed; export resample.
- Hiện `clip.speed` có field nhưng UI "soon", chưa keyframe.
- File: schema clip.speed (→ speedKeyframes), compositor/audio playback theo speed, ClipPanel speed graph.
- TT: ☐.

## K. Bỏ khỏi MVP
- 🗑️ Scene view (tạm ngưng — "khoan đi").
- 🗑️ Shape primitives (thay bằng vector).

---

## Quyết định UI cần fix (07/06)
1. **Color picker z-index** bị che → nâng (ColorField `.cf-pop` z-index cao hơn panel/overlay).
2. **Slider to hơn** (height/thumb lớn, dễ kéo).
3. **Keyframe icon ◆ + mũi tên ◂▸ to lên**.
4. **Input field text** đang trắng "rởm" → đổi màu/contrast chuẩn.
5. Caption controls → **right panel**.

## L. Viewport guides & alignment — ☐ CẦN
- **Ruler** (cạnh trên + trái viewport, đơn vị px) ☐.
- **Add guide** (kéo từ ruler ra → guide line; snap khi kéo layer) ☐.
- **Smart guide** (khi di chuyển layer → hiện đường căn với layer khác / tâm canvas, kiểu Figma) ☐.
- **Platform overlay** (provision khung an toàn cho Instagram/TikTok/Reels/YouTube — vùng bị UI che, chung với safe-area guide) ☐. Hiện có SafeOverlay (title/action safe) — mở rộng thêm preset platform.
- **Auto-align L/R/center vs canvas** (như plugin AE: nút căn trái/giữa/phải/top/middle/bottom layer so với canvas) ☐.
- File: ViewportGizmo, SafeOverlay, useViewport, ClipPanel (nút align).

## M. Toolbar gọn — ☐
- Topbar hiện hơi rối (New/Demo/Open/Save/Content/Safe/Text/aspect/undo/redo/Upgrade/Export/user).
- **Cần:** gom nhóm gọn (file menu, insert menu, view menu...), spacing chuẩn, icon đồng nhất.
- File: App.tsx Controls.

## N. Zoom-out fit toàn timeline — ⚠️ BUG
- Cmd+scroll zoom ok nhưng **không zoom out hết** với clip rất dài → không thấy toàn bộ.
- **Cần:** pxPerSec min đủ nhỏ để fit `project.duration` vào viewport; nút "fit timeline".
- File: Timeline onWheel (clamp min pxPerSec theo duration), thêm fit button.

## O. Multi project / timeline — ☐ CẦN
- Hiện chỉ 1 project (localStorage 1 slot). Cần: tạo/đổi/xóa nhiều project; mỗi project nhiều sequence/timeline.
- **Flow đích:** project list (sidebar/menu) → chọn → load; "New project"; lưu mỗi project key riêng (whip:project:&lt;id&gt;) + index.
- File: store (projects index), App menu.
- TT: ☐.

## P. Timeline/Sequence settings — ☐ CẦN
- Mỗi timeline cần settings đầy đủ: **resolution, aspect, fps, duration, background color, audio sample rate**, tên.
- **Flow đích:** nút Settings (gear) cạnh timeline → modal sửa các field → cập nhật project.resolution/fps/aspect... (đã có setAspect, cần mở rộng).
- File: store (project fields), SequenceSettingsModal.
- TT: ☐ (hiện chỉ đổi aspect qua dropdown topbar).

## Thứ tự debug đề xuất
1. UI quick fixes (1-4 trên) — nhanh, đỡ chói mắt khi debug.
2. Export modal (E).
3. Caption→Text unified ở right panel (H) + keyframe đủ (I).
4. Audio track-detach (F).
5. Speed ramp (J).
6. Vector thay shape (G).
7. LLM viral harness (E/auto-edit) — lớn nhất, để sau cùng.
