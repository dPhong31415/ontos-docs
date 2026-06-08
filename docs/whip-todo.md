---
id: whip-todo
title: TODO (prioritized)
sidebar_label: ☑️ TODO
sidebar_position: 9
---

# Whip — TODO (prioritized, cập nhật 07/06/2026)

> Checklist gọn để build/debug. ⬛ = chưa · 🟨 = đang dở/1 phần · ✅ = xong.
> Chi tiết luồng: [MVP Flows](./whip-mvp-flows.md). Đây là danh sách hành động.

---

## P0 — Caption/Text properties ✅ (DONE)

### Caption granular ✅ word-level adapt + relink (cắt từ → tách theo từ)
- ⬛ **Word-level adapt:** câu dài, user cắt **1 chữ** ra khỏi clip audio rồi dời → caption phải tách & dời theo TỪNG TỪ (hiện relink ở mức BLOCK, chưa tách word khi clip bị cắt giữa block).
  - Cần: khi split/trim clip audio cắt ngang 1 block → tách block thành 2 (theo word.start nằm 2 bên điểm cắt), mỗi nửa giữ words của nó, relink theo source-time từng nửa.
- ⬛ Block bị cắt mất 1 phần → chỉ ẩn từ bị mất, giữ phần còn lại (hiện ẩn cả block nếu srcIn mất).

### Click caption pill → Properties ✅ (text/timecode/copy/use-track-setting/override)
- ⬛ Click 1 caption pill (trên track C) → **select caption** (state `selectedCaption`).
- ⬛ Properties (panel) hiện cho caption đang chọn:
  - **Text box** sửa nội dung (multi-line) + copy được.
  - **Timecode IN / OUT** (number + format mm:ss.f) — sửa + copy.
  - **Per-caption style override** + checkbox **"Use track setting"** (tick = theo track; bỏ tick = override riêng caption này).
- Cần: schema CaptionBlock thêm `style?` (override per-block) + compositor ưu tiên block.style ?? track style ?? pack.

### Unify Text/Caption properties 🟨 (gradient/bg/effects/kerning/leading ✅; transform-keyframe cho caption còn)
> Hiện thiếu nhiều so với DaVinci/AE. Gộp 1 bộ control dùng chung cho text clip + caption.
- ⬛ Font, size, weight, **kerning/tracking**, **leading/line-height**, align (L/C/R + justify).
- ⬛ Fill: solid + **gradient** (linear/radial, stops).
- ⬛ Stroke (màu + width), **glow**, **drop-shadow** (thường + **3D zoom-radius/long-shadow**).
- ⬛ **Background box** sau chữ (màu, padding, radius) — kiểu caption nền.
- ⬛ Transform: position, scale, rotation, opacity — keyframe-able.
- ⬛ Per-property **keyframe** (stopwatch ◆ + nav ◂▸) cho cả text style.

---

## P1 — Core NLE còn thiếu
- ✅ **Export modal** (resolution scale / fps / quality / range / watermark) — render qua frame canvas W×H. (C)
- ✅ **Audio track-detach:** nút Detach → tách audio clip ra track A riêng (unlink, trim/dời độc lập), mute video gốc. (F)
- 🟨 **Speed ramp:** constant speed ✅ (video+audio honor); ramp curve graph ✅ (point edit, source-offset integral video preview). Audio ramp + export integral còn. (J)
- ⬛ **Zoom-out fit** — ✅ (đã clamp min pxPerSec). Thêm nút "Fit" rõ. 🟨

---

## P2 — Viewport / canvas
- ⬛ **Ruler** (trên + trái viewport, px).
- ⬛ **Add guide** (kéo từ ruler) + snap layer vào guide.
- ⬛ **Smart guide** (căn với layer khác / tâm canvas khi kéo — Figma style).
- ⬛ **Platform overlay** (Instagram/TikTok/Reels/YouTube safe zone) chung với safe-area.
- ⬛ **Auto-align L/R/center/top/middle/bottom** layer so với canvas (nút như plugin AE).
- ⬛ **Viewport quality modes (Low / Mid / High / Auto):** đổi render resolution scale của preview để mượt.
  - Low = render ở scale nhỏ (nhanh, mờ khi zoom), High = full res (nét khi zoom sâu), **Auto = theo zoom %** (zoom cao → tăng res).
  - Hiện preview render cố định theo canvas px → zoom sâu bị vỡ/mờ (ảnh 497%). Cần: compositor render scale động + resolution dropdown.
  - File: compositor (renderer.resolution / app.renderer.resize theo quality×zoom), App viewport toolbar dropdown.

---

## P3 — Vector & Effects
- ⬛ **Bỏ shape primitives** hiện tại → **vector layer** (pen-tool path bezier, edit anchor/handle, fill/stroke/gradient). (G)
- ⬛ **Effect Lab (node-graph ComfyUI-style):** admin/user test effect → lưu **thumbnail = kết quả test**; preset = chain property node đơn giản. Lưu vào "My Presets". (Q)

---

## P4 — Project / app shell
- ⬛ **Multi project / timeline** (tạo/đổi/xóa nhiều project, mỗi project nhiều sequence). (O)
- ⬛ **Timeline/Sequence settings đầy đủ** (resolution/aspect/fps/duration/bg/sample-rate/tên). (P)
- ⬛ **Toolbar gọn** (gom nhóm file/insert/view, spacing chuẩn). (M)

---

## P5 — Launch global
- 🟨 **English toàn bộ UI** (Landing/Caption ✅; topbar/Timeline/ClipPanel/Effect/Behavior/Scene còn VN).
- ⬛ **Dọn description nhỏ thừa** toàn app (🟨 caption xong).
- ⬛ **LLM Viral Harness auto-edit** (transcript → BytePlus → sections + hook + caption + effect JSON; paste JSON tay được). (E)
- ⬛ Onboarding interactive.

---

## ✅ Đã xong (tham chiếu)
- Editor NLE lõi, import drag-drop, OPFS.
- Auto-caption (Deepgram + BytePlus chunk) LIVE `/api/caption`; token system (100 token=$1); cache; smart-link block-level.
- Clerk auth + Landing "Whip it" + ErrorBoundary.
- Deploy Vercel (whip-zeta) + Supabase cloud-share (signed URL, no DDL).
- GitHub private repo.
- Storage persist (navigator.storage.persist) + Save/Open FOLDER ổ đĩa (File System Access) — chống mất media khi OPFS bị evict.
- Export modal (scale/fps/quality/range).
- UI: color picker fixed/z-index, granular sliders, keyframe icon to, input contrast, zoom-out fit, gizmo zoom đúng, caption track "C", caption styling ở left panel.

---

## Thứ tự đề xuất làm tiếp
1. **P0** — caption granular word-level + click pill → properties + unified text/caption controls (đúng cái user vừa nêu).
2. **P5 English sweep** (sắp launch).
3. **P1** export modal → audio detach → speed ramp.
4. **P2** guides/align.
5. **P3** vector + Effect Lab.
6. **P4** multi-project + toolbar.
7. **E** LLM harness.
