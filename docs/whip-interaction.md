---
id: whip-interaction
title: Interaction & Canvas
sidebar_label: 🖱 Interaction & Canvas
sidebar_position: 9
---

# Interaction & Canvas

> Một editor sống hay chết ở **cảm giác tương tác**. Phải **mượt như AE/Figma**, không cứng ngắc.
> Viewport và timeline đều là **infinite canvas** pan/zoom được bằng chuột giữa, có inertia, 60fps.
> Trang này pin chính xác cách điều khiển + tech.

---

## Nguyên tắc nền

```
1. Mọi pan/zoom = CSS/WebGL TRANSFORM, không reflow layout  → 60fps, không giật
2. Có INERTIA (momentum) khi thả  → cảm giác "vật lý", không cứng
3. Chuột giữa = pan ở MỌI panel (viewport + timeline)  → cơ bắp nhớ như AE/Figma
4. Modifier nhất quán: Alt = zoom, Shift = pan ngang/trục phụ
5. Con trỏ đổi theo tool (grab/grabbing/resize)  → feedback tức thì
```

---

## Viewport (canvas preview) — infinite canvas

| Thao tác | Phím/chuột | Ghi chú |
|---|---|---|
| **Pan** | **giữ chuột giữa + kéo** / Space + kéo | như Figma/AE |
| **Zoom** | **Alt + scroll** (zoom quanh con trỏ) / scroll = zoom | zoom tại điểm chuột, không tại tâm |
| Fit / 100% | `Shift+1` (fit) / `1` (100%) | |
| Reset view | `Shift+0` | |

**Tech:** [`pixi-viewport`](https://github.com/davidfig/pixi-viewport) bọc PixiJS stage —
lo sẵn drag/pinch/wheel/decelerate (inertia) + clamp + zoom-to-cursor. Không tự viết toán pan/zoom.

```
PixiJS stage
   └─ Viewport (pixi-viewport)
        .drag({ mouseButtons: "middle" })     // chuột giữa pan
        .wheel({ keyToPress: ["AltLeft"] })    // Alt+scroll zoom
        .decelerate()                          // inertia khi thả
        .clampZoom({ min, max })
```

---

## Timeline — cũng là infinite canvas (trục thời gian)

Timeline **không** phải list cứng. Nó là canvas pan/zoom theo trục thời gian + track.

| Thao tác | Phím/chuột |
|---|---|
| **Pan ngang (thời gian)** | **chuột giữa + kéo** / Shift + scroll |
| **Pan dọc (qua track)** | scroll dọc / chuột giữa + kéo dọc |
| **Zoom thời gian** (giãn/co timeline) | **Alt + scroll** (zoom quanh playhead/con trỏ) |
| Zoom fit toàn project | `Shift+Z` |
| Scrub playhead | kéo trên ruler / `←` `→` (1 frame), `Shift+←/→` (10 frame) |
| **Kéo clip** | drag thân clip (snapping bật) |
| **Trim** | kéo mép clip (ripple/roll tùy modifier) |
| **Cắt (blade)** | `B` rồi click / `Ctrl+K` tại playhead |
| Marquee chọn nhiều | kéo vùng trống |

**Tech timeline:** transform-based, **không** render mọi clip ra DOM.
- Trục thời gian: `pxPerSecond` (zoom) + `scrollX` (pan) → mỗi clip `left = (start - scrollX) * pxPerSecond`.
- **Virtualize**: chỉ render clip trong viewport (project 10 phút không lag).
- Zoom = đổi `pxPerSecond` quanh điểm neo (giữ thời gian dưới con trỏ cố định):
  `scrollX' = tCursor - (tCursor - scrollX) * (zOld / zNew)`.
- Vẽ bằng canvas/WebGL hoặc DOM transform; clip-heavy → canvas (PixiJS chung renderer).

---

## Snapping (mượt nhưng không dính cứng)

```
Khi kéo clip/playhead, snap mềm tới: cut khác · playhead · marker · region edge · beat
- ngưỡng snap theo PIXEL (vd 8px), không theo thời gian → zoom level nào cũng đều tay
- giữ Ctrl = tắt snap tạm thời (nudge tự do)
- có "magnet" toggle
```

---

## Keyframe / curve editor — kéo như AE

| Thao tác | Phím/chuột |
|---|---|
| Pan graph | chuột giữa + kéo |
| Zoom graph | Alt + scroll (zoom value/time quanh con trỏ) |
| Kéo keyframe | drag điểm |
| Kéo bezier handle | drag handle (Shift = khóa trục) |
| Đổi ease preset | right-click → [Smooth Punch…](./whip-look.md) |

Cùng mô hình pan/zoom với timeline → cơ bắp nhớ một kiểu, áp mọi panel.

---

## Inertia & feel — chống "cứng ngắc"

```
• decelerate khi thả pan (pixi-viewport .decelerate, friction ~0.95)
• zoom có easing nhẹ (lerp pxPerSecond tới target ~0.2/frame), không nhảy cóc
• mọi animate dùng requestAnimationFrame, transform GPU
• hover state, cursor đổi, ghost preview khi kéo clip
• KHÔNG block main thread: decode/encode ở Web Worker (xem system-design)
```

> Đây đúng là pattern carousel mượt bạn đã làm ở portfolio (rAF + transform + inertia), nâng lên
> cho cả editor. Cảm giác > tính năng: editor giật một lần là bỏ.

---

## Shortcut map (AE/Premiere-muscle)

```
Space  play/pause        B  blade           Ctrl+K  cut tại playhead
J K L  shuttle           V  select          Ctrl+Z / Ctrl+Shift+Z  undo/redo
I O    in/out            Alt+scroll  zoom    Mid-drag  pan
←/→    ±1 frame          Shift+←/→  ±10 fr   Home/End  đầu/cuối
[ ]    trim in/out       , .  nudge clip     S  toggle snap
```

Cho phép **remap** trong settings (Premiere/FCP/Resolve preset) — dân pro mang muscle-memory sang.

---

## Tóm tắt tech

| Phần | Thư viện |
|---|---|
| Viewport pan/zoom/inertia | **pixi-viewport** trên PixiJS |
| Timeline pan/zoom | custom (transform `pxPerSecond` + `scrollX`) + virtualize |
| Drag/resize clip | pointer events + snapping (pixel-threshold) |
| Curve editor | custom canvas, cùng mô hình pan/zoom |
| Shortcut | bảng remap-able, preset Premiere/FCP/Resolve |

> Không thư viện timeline "đóng hộp" (chúng cứng). Pan/zoom mượt + inertia là **must** của v1 —
> đưa vào [roadmap](./whip-roadmap.md), không để v2.
