---
id: whip-ux
title: UI/UX Design — Infinite Canvas & Interaction
sidebar_label: 🖱 UI/UX Design
sidebar_position: 7
---

# UI/UX Design — Interaction & Psychological Hooks

> Ý tưởng kỹ thuật tốt đến đâu cũng chết nếu UX tệ. Trang này là law của team — mọi interaction phải pass qua đây trước khi ship.

---

## Triết lý cốt lõi

**1. Zero friction đến wow moment đầu tiên**
Creator drop video vào → auto-caption trong 30 giây → thấy caption viral chạy đúng nhịp → đây là cú hook. Mọi onboarding đều phải dẫn đến khoảnh khắc này trong ≤ 60 giây.

**2. Cơ bắp nhớ được (muscle memory)**
Sau 30 phút dùng Whip, tay người dùng phải tự biết chuột giữa để pan, Cmd+scroll để zoom — không cần nghĩ. Cùng một cơ chế ở mọi panel.

**3. Không modal**
Không popup hỏi "Bạn có chắc không?". Không dialog chờ. Mọi thứ inline, contextual, undo được.

**4. Progressive disclosure**
Mặc định đơn giản. Power features xuất hiện khi cần — không dump hết lên màn hình ngay từ đầu.

---

## Infinite Canvas — Viewport & Timeline

### Nguyên tắc kỹ thuật

```
Tất cả pan/zoom = CSS transform hoặc WebGL matrix  → 60fps, không reflow
Có inertia (momentum) khi thả chuột                → cảm giác vật lý, không cứng
Chuột giữa = pan ở MỌI panel                       → muscle memory đồng nhất
Con trỏ đổi theo context (grab/grabbing/resize)    → feedback tức thì
```

### Viewport (canvas preview)

| Thao tác | Chuột/phím | Tại sao chọn cách này |
|---|---|---|
| Pan | Chuột giữa drag | Cùng với Figma, AE — muscle memory |
| Zoom | Cmd/Ctrl + scroll wheel | Standard Mac/Win |
| Pinch zoom | 2 ngón trackpad | Mobile-first generation |
| Fit to screen | `F` hoặc double-click nền | Blender convention |
| Zoom 100% | `1` | Blender convention |
| Zoom fit | `2` | Blender convention |
| Zoom fill | `3` | |

**Quan trọng:** Zoom luôn lấy tâm tại vị trí con trỏ, không phải tâm canvas. Đây là điểm mà CapCut làm sai — zoom từ center gây disorientation.

### Timeline

| Thao tác | Chuột/phím | Ghi chú |
|---|---|---|
| Pan ngang | Chuột giữa drag | Đồng nhất với viewport |
| Zoom time axis | Cmd/Ctrl + scroll | Giữ cursor position cố định khi zoom |
| Pan ngang nhanh | Shift + scroll | |
| Pan dọc (multi-track) | Scroll thuần | |
| Set playhead | Click ruler | |
| Snap toggle | `\` (backslash) | Toggle on/off |

---

## Keyboard Shortcuts — Blender-style Transform

### Tại sao Blender style?

Blender là editor 3D phổ biến nhất thế giới trong giới creative. Hàng triệu người đã học cơ chế `G → X/Y → số → Enter`. Dùng cùng convention = zero learning curve cho người đã biết Blender.

### Core transform shortcuts

| Phím | Action | Sau đó có thể thêm |
|---|---|---|
| `G` | Grab/Move clip hoặc keyframe | `X` = chỉ ngang, `Y` = chỉ dọc |
| `S` | Scale | `X` = chỉ scale ngang, `Y` = chỉ scale dọc |
| `R` | Rotate | Nhập số độ trực tiếp (ví dụ R 45 Enter = xoay 45°) |
| `Alt+G` | Reset position về 0 | |
| `Alt+S` | Reset scale về 1.0 | |
| `Alt+R` | Reset rotation về 0° | |
| `G → số → Enter` | Move chính xác (ví dụ G X 100 Enter = dời 100px sang phải) | |
| `S → 1.5 → Enter` | Scale về đúng 150% | |

### Keyframe shortcuts

| Phím | Action |
|---|---|
| `K` | Thêm keyframe ở playhead cho property đang chọn |
| `I` | Insert keyframe menu (chọn: Position / Scale / Rotation / Opacity / All) |
| `Alt+K` | Xóa keyframe tại playhead |
| `←` / `→` | Di chuyển playhead từng frame |
| `Shift+←` / `Shift+→` | Nhảy đến keyframe prev/next |
| `Cmd+G` | Mở graph editor cho clip đang chọn |

### Timeline editing shortcuts

| Phím | Action |
|---|---|
| `B` hoặc `W` | Razor — cắt TẤT CẢ clips tại playhead |
| `Cmd+K` | Razor — cắt chỉ clip đang chọn |
| `Q` | Trim trái clip đến playhead |
| `E` | Trim phải clip đến playhead |
| `D` | Disable/Enable clip (không render) |
| `Delete` | Xóa clip đang chọn |
| `Cmd+D` | Duplicate clip |
| `Cmd+Z` | Undo |
| `Cmd+Shift+Z` | Redo |
| `Space` | Play/Pause |
| `Home` | Về đầu timeline |
| `End` | Về cuối timeline |
| `\` | Toggle snap |

### Command palette

| Phím | Action |
|---|---|
| `Cmd+K` (khi không có clip chọn) | Mở command palette — search bất kỳ action/preset/effect |

**Command palette** là cách tiếp cận mọi thứ mà không cần nhớ menu. User gõ "zoom punch" → thấy preset → Enter để apply. Chuẩn Linear/Raycast/VSCode 2026.

---

## Contextual UI — Right Panel thay đổi theo selection

### Không có selection
→ Panel hiển thị Project properties (resolution, fps, duration)

### Chọn video/image clip
→ Transform (position, scale, rotation, opacity) + Effects stack + Speed

### Chọn text clip
→ Font/size/color/weight + text effects (shadow/glow) + transform

### Chọn caption track
→ Style pack selector + pacing + per-block controls

### Chọn audio clip
→ Volume, fade in/out, waveform display, EQ (khi có)

### Chọn nhiều clips
→ Bulk actions: apply preset, delete, group into scene

**Nguyên tắc:** Properties panel không bao giờ hiển thị options không liên quan đến selection hiện tại. Clutter = confusion.

---

## Psychological Hooks

### Hook 1 — "Wow moment" trong 30 giây

```
Drop video → progress bar nhỏ "Analyzing audio..." → captions xuất hiện word-by-word → 
creator thấy chữ nhảy đúng theo miệng → phản ứng: "OMG nó làm được cái này à?"
```

Đây là hook quan trọng nhất. Mọi thứ khác đều phục vụ cho khoảnh khắc này.

### Hook 2 — "Made with Whip" watermark (free tier)

Mọi video export từ free tier có watermark nhỏ góc dưới phải. Hai hiệu ứng:
- **Viral loop**: Người xem video thấy watermark → tò mò → tìm Whip
- **Itch to upgrade**: Creator muốn xóa watermark → upgrade Pro

Watermark phải **đẹp** — không xấu như CapCut. Một dòng chữ nhỏ "Made with Whip" kiểu minimal, không che nội dung.

### Hook 3 — One-click preset → instant gratification

Creator mới vào không biết làm gì → click preset "Viral TikTok" → video transform instantly với zoom punches + loud captions → thấy kết quả ngay → want to customize → bắt đầu học deep features.

Đây là lý do preset browser phải là tính năng F1 của onboarding, không phải keyframe editor.

### Hook 4 — Export progress bar

Export là hành động có cảm giác "làm việc thật". Progress bar 0% → 100% với animation đẹp + estimated time. Khi xong: confetti nhỏ + "Done! Your video is ready" + preview thumbnail.

Đừng underestimate cái này. Satisfying export experience = creator muốn export thêm = dùng nhiều hơn.

### Hook 5 — Undo flash

Khi Cmd+Z, timeline flash nhẹ + clip "bật" trở lại vị trí cũ với spring animation. Undo cảm giác powerful, không giống "revert to save" lạnh lùng. Creator không sợ thử nghiệm vì biết undo đẹp.

---

## Whip vs AE — Pain points đã giải quyết

| Vấn đề ở AE | Cách Whip giải quyết |
|---|---|
| RAM preview required → chờ 30-60s | WebGL real-time, không cần RAM preview |
| Timeline nhỏ mặc định, phải resize | Timeline full width, responsive |
| Effect Controls panel riêng biệt, phải tìm | Properties hiện ngay trong right panel khi chọn clip |
| Render queue là app riêng | Export inline, progress trong cùng UI |
| Zoom bằng phím = (obscure) | Cmd+scroll (universal) |
| Keyframe phải right-click → Add Keyframe | K để add keyframe instantly |
| Compositions nested gây confuse | Scenes = nhóm clip theo nội dung, không phải nested comp |
| Mở file mất 5-30 giây | Project load instant (JSON small, assets lazy-load) |

---

## Whip vs CapCut — Pain points đã giải quyết

| Vấn đề ở CapCut | Cách Whip giải quyết |
|---|---|
| Caption ghim theo giây → chỉnh video là lệch | SmartLink — caption ghim theo âm vị |
| Chuột giữa không làm gì | Pan canvas |
| Không có keyboard shortcut cho transform | G/S/R Blender-style |
| Keyframe ẩn sâu trong submenu | K ở bất kỳ đâu |
| Không có graph editor | Cmd+G mở graph editor |
| Export phải chờ upload server | Local WebCodecs, không upload |
| "Lag" khi có nhiều effects | WebGL compositor, 60fps |
| Không undo vô hạn | Undo stack đầy đủ với gesture grouping |

---

## Empty States — Dạy bằng UI, không bằng tutorial

### Timeline trống
```
[icon camera]
Kéo video vào đây để bắt đầu
hoặc [Browse files]
```
Không nói "Welcome to Whip! Here's how to use our powerful editor..."

### MediaPool trống
```
[icon folder]
Chưa có file nào
[+ Import video/audio/image]
```

### Behaviors panel khi chưa có behavior
```
[icon wand]
Thêm behavior để tự động hóa chuyển động
Thử ngay: [Zoom Punch] [Whip Pan] [Caption Reveal]
```
→ Click ngay vào preset = instant apply = immediate value.

---

## Responsive Layout — 3 zone cố định

```
┌─────────────────────────────────────────────────────┐
│  LEFT PANEL      │   VIEWPORT (center)  │ RIGHT PANEL│
│  MediaPool       │                      │ Properties  │
│  Scenes          │   Video preview      │ contextual  │
│  Presets         │   + overlays         │             │
│  (resizable)     │   (expand to fill)   │ (resizable) │
├──────────────────┴──────────────────────┴────────────┤
│  TIMELINE (bottom, resizable height)                 │
│  Ruler + tracks + playhead                           │
└──────────────────────────────────────────────────────┘
```

**Resize handles** tất cả panel boundaries — user config layout.

**Double-click viewport** = toggle full-screen preview mode (ẩn tất cả panels).

**`Tab`** = toggle giữa full timeline view và full viewport view.

---

## Micro-interactions quan trọng

| Interaction | Animation | Mục đích |
|---|---|---|
| Clip hover | Subtle highlight + trim handle xuất hiện | Affordance — cho biết có thể interact |
| Clip select | Ring highlight + properties panel animate in | Feedback ngay lập tức |
| Keyframe add | Diamond "pop" với spring scale | Satisfying, confirm action |
| Snap | Clip "snap" với nhỏ spring + haptic (trackpad) | Physical feel |
| Export done | Thumbnail "fly in" + subtle confetti | Celebration = positive reinforcement |
| Undo | Timeline flash nhẹ + clip spring back | Powerful undo feel |
| Caption generated | Words "type" vào từng block sequentially | Progress cảm giác real-time |
| Behavior apply | Keyframes "bloom" vào timeline | Visual confirmation |

---

## SOTA 2026 — Features UX chưa có nhưng cần build

### Command palette đầy đủ
Cmd+K → fuzzy search toàn bộ: presets, effects, behaviors, actions, settings. Giống Raycast. Hiện tại chưa có.

### Radial menu (right-click trên clip)
8 options phổ biến nhất quanh con trỏ: Cut / Copy / Paste / Delete / Disable / Add Behavior / Speed / Color. Nhanh hơn menu dọc.

### Floating inspector
Properties float **ngay cạnh clip đang chọn** thay vì locked vào right panel. Khi chỉnh keyframe trong graph, không phải liếc mắt sang phải.

### AI autocomplete caption
Khi user edit text của caption block → AI suggest hoàn thành câu theo context của transcript. Giống GitHub Copilot nhưng cho caption.

### Hover preview trên preset
Hover vào preset thumbnail → preview animation chạy ngay trên clip → click để apply. Không cần apply → xem → undo → thử cái khác.
