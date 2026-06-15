---
id: whip-ux-map
title: UX Map — Zone, Vai trò, Quy tắc đặt element
sidebar_label: 🧭 UX Map
sidebar_position: 7
---

# UX Map — bản đồ zone + quy tắc đặt element

> **Mục đích:** mỗi zone UI có **1 vai trò chuyên biệt**. Trước khi thêm BẤT KỲ element nào → tra bảng này
> để đặt ĐÚNG chỗ theo tâm lý người dùng, không nhét bừa chỗ tiện code. Bar UX: bằng/hơn Apple + hơn mọi editor
> [[feedback-ux-pass]]. Bài học gốc: nút Join từng bị đặt nhầm ở Inspector (right panel) → phải ở **Timeline toolbar**
> vì nó là thao tác CẤU TRÚC timeline, không phải thuộc tính của clip đang chọn.

## Mental model (chuẩn NLE — Premiere/FCP/DaVinci, user đã quen)
```
┌─ TOPBAR — hành động GLOBAL (project-level) ─────────────────────────────┐
│  Whip It (agentic) · Manual · undo/redo · Save · Bundle/Export · Share   │
├───────────┬─────────────────────────────────────┬───────────────────────┤
│ LEFT       │            VIEWPORT (monitor)        │ RIGHT (Inspector)     │
│ = SOURCES  │  output + direct-manip (gizmo)       │ = thuộc tính của      │
│ + authoring│  + Transport (play/seek)             │   ITEM ĐANG CHỌN      │
│ Media/Assets│                                     │ Properties/Effects/   │
│ /Caption/  │                                     │ Actions/Semantic      │
│ Presets/Graph                                    │                       │
├───────────┴─────────────────────────────────────┴───────────────────────┤
│ TIMELINE TOOLBAR — thao tác CẤU TRÚC theo thời gian                      │
│  Snap · Split ✂ · Join 🔗 · Trim · Ripple · +Track · Detach              │
│ TIMELINE — sắp xếp clip theo thời gian (structure)                       │
└──────────────────────────────────────────────────────────────────────────┘
  Overlay: PerfHud (góc) · Tamagotchi · WhipTrace · Banner · Modals
```

## Vai trò CHUYÊN BIỆT từng zone + đặt gì ở đó
| Zone | Vai trò 1-câu | ĐẶT GÌ ở đây | KHÔNG đặt |
|---|---|---|---|
| **Topbar** | Hành động cấp PROJECT/global | Whip It, mode, save, export, share, undo | thao tác trên 1 clip lẻ |
| **Left › Media/Assets** | NGUỒN: mang content vào | import, asset card, shape/stock | inspector thuộc tính |
| **Left › Caption** | Author caption (text+style) | transcribe, sửa lời, style pack | motion/effect của clip |
| **Left › Presets** | THƯ VIỆN motion preset | browse/áp preset | thuộc tính 1 clip |
| **Left › Graph** | Đường cong giá trị theo thời gian | energy/property graph, ease | — |
| **Viewport** | MONITOR output + direct-manip | gizmo transform, safe-zone, play | nút thao tác cấu trúc |
| **Right › Properties** | Inspector: thuộc tính clip CHỌN | scale/pos/opacity/keyframe | thao tác đổi cấu trúc timeline |
| **Right › Effects** | Inspector: filter clip chọn | blur/màu… | — |
| **Right › Actions** | Inspector: MOTION/behavior + AI action TRÊN clip chọn | Audio→Motion, **Detect scene cuts** (sinh ra cut TỪ clip này) | Join (đó là thao tác giữa NHIỀU clip → toolbar) |
| **Right › Semantic** | Inspector: graph ngữ nghĩa clip chọn | xem span/link/source | — |
| **Timeline toolbar** | Thao tác CẤU TRÚC timeline | Split, **Join**, Trim, Ripple, Snap, +Track, Detach | thuộc tính 1 clip |
| **Timeline** | Sắp xếp clip theo thời gian | clip, drag, badge tên, filmstrip | — |

## Quy tắc đặt element MỚI (decision tree)
1. Tác động lên **cả project**? → **Topbar**.
2. **Mang content vào / thư viện**? → **Left** (tab phù hợp).
3. **Sửa thuộc tính của 1 item đang chọn** (param/fx/motion/semantic của NÓ)? → **Right** (tab phù hợp).
4. **Đổi cấu trúc timeline** (cắt/gộp/trim/xếp, tác động ≥1 clip theo thời gian)? → **Timeline toolbar**.
5. **Thao tác trực tiếp trên khung hình**? → **Viewport** (gizmo).
> Ranh giới then chốt: *thuộc tính của clip* → Inspector (Right). *Cấu trúc giữa các clip / theo thời gian* → Timeline toolbar. Join vi phạm rule này lúc đầu.

## Liên kết feature (zone nối nhau thế nào)
- Chọn clip ở **Timeline** → **Right Inspector** đổi theo (Properties). Direct: chọn → soi/sửa.
- Badge 🧠 ở Media card / clip → mở **Right › Semantic** (semanticReq bump).
- **Detect scene cuts** (Right › Actions) → sinh sub-clip trên **Timeline** → auto-select → thấy ngay (flow).
- **Whip It** (Topbar) → cut/caption/semantic hiện dần khắp Timeline + Left Caption + Right Semantic (live reveal).
- "Open graph" (Right Properties right-click) → mở **Left › Graph** (graphReq bump).

## Đánh giá UX hiện tại + improve SOTA-2026 (attention span, tâm lý user)
> Ưu tiên theo tần suất dùng × ma sát hiện tại. (Đề xuất — chờ Phong chọn làm.)

1. **Frequent structural ops phải gần timeline (Fitts's law).** ✅ vừa sửa Join về toolbar. Soi tiếp: còn op cấu trúc nào kẹt trong panel không.
2. **Right panel = progressive disclosure.** Chỉ hiện tab/section liên quan selection; ẩn cái rỗng → giảm tải nhận thức. SOTA (FCP Inspector) ẩn section trống.
3. **Discoverability bằng context menu.** Timeline right-click hiện chỉ toggle-disabled → nên thành menu thật (Split/Join/Trim/Delete) — đúng nơi tay user đang ở (giảm hành trình mắt).
4. **Attention trong Whip It (agentic).** Pipeline dài → live-reveal tốt, nhưng cần 1 "tiêu điểm" duy nhất mỗi bước (không để mắt nhảy 4 vùng). Cân 1 progress spine rõ.
5. **Keyboard-first cho power user.** Split=B/W có; Join nên có phím (vd Cmd+J chuẩn editor) → flow không rời tay khỏi bàn phím.
6. **Empty states không dead-end** (đã làm copy điềm tĩnh cho scene-cut). Áp toàn app: mỗi panel rỗng = 1 gợi ý hành động kế tiếp.
7. **Giảm số tab nếu trùng vai.** Effects vs Actions vs Properties — kiểm có chồng lấn nhận thức không; gộp nếu user lẫn lộn.

## Quy tắc sống
- Thêm/sửa element FE → cập nhật bảng zone này CÙNG phiên (như [[feature-map]]). Doc là bản đồ THẬT của UX.
