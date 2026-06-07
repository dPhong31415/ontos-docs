---
id: whip-asset-layers
title: Asset Layers & Properties (AE-style)
sidebar_label: 🧩 Asset Layers
sidebar_position: 14
---

# Whip — Asset Layers, Properties Panel & Vector (AE/Figma-style)

> Mục tiêu: mọi asset (text/shape/caption/media) = **layer vector** chỉnh được đầy đủ properties,
> color picker xịn (Figma), gradient, 3D shadow, và **pen tool** tự vẽ shape. Đây là roadmap;
> phần ✅ đã build, phần ☐ là kế hoạch.

## Đã build ✅
- **Shape primitives** (rect/ellipse/line/background) = clip vector, render PIXI Graphics, có ShapeControls (fill/stroke/radius/size).
- **ColorField** = Figma-style picker (SV square + hue + alpha + hex + presets), `components/ColorField.tsx`. Dùng cho shape fill/stroke, text fill/stroke. Trả `#rrggbb[aa]`.
- **Caption**: word-level, style pack, 3 pacing, wrap nhiều dòng + maxCharsPerLine, pill trên timeline.
- Rename clip, gizmo transform (move/scale/rotate), keyframe + graph editor.

## Kế hoạch (ưu tiên giảm dần)

### 1. Unified text/caption style ☐
- Caption block và text clip dùng CHUNG `TextStyle` mở rộng (font/size/weight/kerning/leading/align/fill/stroke/gradient/shadow).
- Caption Style Pack = preset của TextStyle (không phải hệ riêng) → caption & text style dùng chung, đổi qua lại được.
- Properties panel (RightPanel) hiện full controls cho caption khi chọn (giờ caption chỉnh ở tab Caption trái — chuyển sang phải cho nhất quán).

### 2. Rich text/shape decorations ☐
- **Gradient fill**: thêm `fill: {type:"solid"|"linear"|"radial", stops:[{color,pos}], angle}`. ColorField mở rộng thành GradientField (stop editor). Render: PIXI `FillGradient`.
- **3D zoom-radius shadow** (viral): nhiều lớp shadow offset tăng dần (long-shadow) + drop-shadow blur. Param `{dx,dy,blur,color,layers}`. Render qua filter stack hoặc vẽ text nhiều lần.
- **Drop shadow thường** cho mọi layer (DropShadowFilter pixi-filters).

### 3. Pen tool / custom vector ☐
- Shape kind `path` với `points:[{x,y,cp1,cp2}]` (bezier). Pen tool trên viewport: click thêm điểm, kéo handle → cong. Render PIXI Graphics `.moveTo/.bezierCurveTo`.
- Edit điểm sau khi vẽ (như Illustrator/Figma): chọn path → hiện anchor + handle trên viewport.

### 4. Layer system AE-style ☐
- Mỗi clip = layer; panel layer list (đã có tracks nhưng chưa phải layer tree). Blend mode, opacity, lock, solo per layer.
- Parent/child (đã có constraint Pin-to — mở rộng thành parenting transform).

### 5. Smart caption relink ☐ (user muốn)
- Khi cắt/di chuyển audio clip sau khi gen caption → caption block tự **theo audio** (link block.start/end vào clip nguồn + offset), không gen lại.
- Cần: caption block lưu `sourceClipId` + `sourceOffset`; khi clip audio move/split → recompute block timeline-time. Option toggle "Smart caption follow audio".

## Nguyên tắc
- Color/gradient = data trong JSON (`#rrggbbaa` hoặc gradient object) → agent-drivable, render PixiJS đọc.
- Mọi asset có 1 `<XxxControls>` trong ClipPanel, dùng chung ColorField/GradientField/SliderField.
- Pen/path là vector thuần → export sắc nét mọi resolution (moat vs raster editor).
