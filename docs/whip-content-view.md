---
id: whip-content-view
title: Content View (Content-Centric)
sidebar_label: 📑 Content View
sidebar_position: 7
---

# Content View — đảo trục editor

> **Cú lớn nhất về tư duy sản phẩm.** Editor truyền thống xoay quanh **edit** (clip, keyframe, track).
> Whip xoay quanh **content** (lời nói, sự kiện, ý). Bạn làm việc với *nội dung*, animation/timing
> là hệ quả — không phải thứ bạn nắn tay.

---

## Vấn đề của editor "edit-centric"

```
Cách cũ (CapCut/AE/Premiere):
  muốn thêm caption → kéo 1 cục text vào timeline
  → chỉnh start/end tay
  → gõ nội dung tay
  → mỗi lần sửa lời nói/cut → caption lệch → sửa lại tay
  → text độc lập với content
```

Mọi thứ là thao tác *thủ công* trên *cục* rời rạc. Sửa nội dung là vỡ.

---

## Content View: list mọi event/caption theo trình tự

Một view liệt kê **mọi sự kiện trong video theo thời gian** — caption, super, cú nhấn, đoạn nói về X:

```
┌─ 📑 CONTENT ─────────────────────────────── ✨ AI analyze  + Caption ─┐
│ 01  0.0–4.0s   "Hôm nay mình nói về…"        ▓▓▓▓▓▓▓▓░░░░               │
│ 02  4.0–8.0s   "Điểm thứ nhất là…"            ░░░▓▓▓▓▓▓▓▓░               │
│ 03  8.0–12s    "Nhìn vào cái graph này"       ░░░░░▓▓▓▓▓▓▓  ← zoom here │
│ 04  12–15s     "Tóm lại…"                      ░░░░░░░▓▓▓▓▓               │
└──────────────────────────────────────────────────────────────────────┘
        ↑ event = đơn vị nội dung      ↑ thanh span theo content
```

- **Event** = đơn vị nội dung (câu nói, đoạn, super). Có thể **AI sinh** (semantic/temporal phân tích
  transcript) hoặc **manual**.
- **Text/super** thêm ở đây = **thanh dọc span theo content** (gắn vào event), không phải cục rời.
- Click event → playhead nhảy tới. Sửa nội dung event → mọi thứ bám theo.

---

## Liên kết với Smart Animation

Content View là **mặt trên** của [Anchors](./whip-behaviors.md). Event chính là **region/cue**:

```
Content View (cái user thấy)          Anchors + Behaviors (cái chạy bên dưới)
─────────────────────────             ────────────────────────────────────
event "nhìn vào graph" [8–12s]   ───▶ region r3 [8–12s]
   gắn action "Zoom"             ───▶ behavior zoomToRegion(bind=r3)
                                 ───▶ compiler → keyframes (ẩn)
```

→ User thao tác ở tầng **"đoạn này nói về graph → zoom"**, không phải keyframe. Sửa lời (event dời)
→ animation tự dời. Đây là hiện thực của triết lý [bind motion to meaning](./whip-behaviors.md).

---

## Ba nguồn event

| Nguồn | Cách |
|---|---|
| **AI semantic** | LLM đọc transcript → chia ý, gắn nhãn ("nói về số liệu", "điểm nhấn") |
| **AI temporal** | VAD/scene-detect → ranh giới câu, im lặng, cut cảnh |
| **Manual** | user thêm event/caption tay, kéo span |

→ `✨ AI analyze` sinh event tự động; user tinh chỉnh. Caption (Whisper) cũng đổ vào đây.

---

## Vì sao đây là tương lai của editing

- **AI-native**: agent làm việc ở tầng content (đọc được), không rải keyframe (xem [MCP](./whip-mcp.md)).
- **Sửa nội dung không vỡ**: animation/super bám event, không bám giây cứng.
- **Nhanh**: "đoạn này zoom, đoạn kia caption" — vài thao tác content thay vì trăm keyframe.

> **Một câu:** Content View biến editor từ *"sắp xếp clip/keyframe"* thành *"đạo diễn nội dung"* —
> bạn nói *cái gì* xảy ra ở *đoạn nào*, Whip lo *làm thế nào*.

---

## Trạng thái (06/2026)

🩻 **Scaffold** trong app: `components/ContentView.tsx` — list clip làm event theo thời gian, span bar,
nút AI-analyze / Caption (stub). TODO v1: event từ transcript (Whisper), text-span thật, gắn behavior
từ event, edit nội dung event.
