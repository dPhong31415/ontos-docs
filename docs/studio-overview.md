---
id: studio-overview
title: Tổng quan
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# MÍSK Studio — Canvas sáng tạo AI cho cả team

> **Một câu:** MÍSK Studio là một canvas vô hạn nơi cả team gen ảnh bằng nhiều model AI trên *cùng một URL*, và là nơi duy nhất tách bạch được vì sao một layout ra xấu.

---

## Vấn đề

Team sáng tạo dùng AI hôm nay bị **kẹt 2 chỗ**:

1. **Mỗi người một tab, một tool, một API key.** Ý tưởng nằm rải rác trong Midjourney của người này, ChatGPT của người kia, file rời trên Drive. Không có một mặt bàn chung.
2. **Khi ảnh ra xấu, không ai biết tại sao.** Lỗi do *ý tưởng dở*, do *prompt viết sai guideline*, hay do *model không làm nổi*? Cả 3 gộp vào một ô prompt → không debug được, chỉ biết "thử lại" mù.

Vấn đề (2) đặc biệt đau với **brand board / layout nhiều vùng** (logo + swatch + bảng màu + type specimen + mockup): đây là tác vụ gần trần của *mọi* model T2I 2026.

---

## MÍSK đặt cược

Hai cược ngược với phần còn lại của thị trường:

**Cược 1 — Một mặt bàn, nhiều model.**
Một canvas tldraw vô hạn, nhiều provider (ChatGPT / Gemini / Seedream) chung một interface, key giấu server-side. Team làm việc trên một link, không truyền repo/file.

**Cược 2 — Truy được nguồn cơn cái xấu.**
Thay vì một ô prompt hộp đen, MÍSK tách pipeline thành 3 tầng đo được: **suggestion** (recipe có cấu trúc) → **prompt** (compiled + chấm điểm theo guideline) → **model** (probe bằng reference image). Đây là [Diagnostic Lab](./studio-lab) — thứ không đối thủ nào có.

---

## Khác biệt so với đối thủ (tóm tắt)

| | Firefly Boards | Krea | Recraft | **MÍSK Studio** |
|---|---|---|---|---|
| Canvas team nhiều model | ✅ | ⚠️ (1 model mạnh) | ⚠️ | ✅ |
| Remix / reference | ✅ | ✅ | ✅ (Brand Kit) | ⚠️ (đang xây) |
| Vector thật | ❌ | ❌ | ✅ | ➡️ (qua Whip) |
| **Tách suggestion/prompt/model** | ❌ | ❌ | ❌ | ✅ **Lab** |
| **Recipe schema tái dùng** | ❌ | ❌ | ⚠️ (style) | ✅ |
| Ráp layout có cấu trúc | ❌ (chỉ remix) | ❌ | ⚠️ (node beta) | ➡️ (moat) |

Chi tiết & khoảng trống cần lấp: xem [Đối thủ 2026 & cần làm gì](./studio-competitor).

---

## Trạng thái (22/06/2026)

- ✅ Canvas + 3 mode (Moodboard / Production / Storyboard), 3 provider, cost estimate, skeleton, redo
- ✅ **Diagnostic Lab v1**: recipe schema + prompt compiler + linter version-aware + reference lane + ablation runner
- ⏳ Sync realtime cho team (đang local persist)
- ⏳ Select-to-remix trên canvas; Brand Kit / style lock; ráp layout có cấu trúc
