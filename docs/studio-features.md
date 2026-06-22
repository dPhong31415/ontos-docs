---
id: studio-features
title: Tính năng
sidebar_label: 🎯 Tính năng
sidebar_position: 2
---

# Tính năng

MÍSK Studio có **4 mode** trên cùng một canvas. Ba mode đầu là sản xuất; mode thứ tư (Lab) là chẩn đoán.

---

## 1. Moodboard — khám phá rẻ, nhiều phương án

Rải nhiều pin lên canvas để dò ý tưởng. Chất lượng thấp, nhanh, rẻ; mỗi provider sinh 1–2 option, đặt thành cột cạnh nhau để so trực tiếp.

- Aspect mặc định 1:1, quality `low`
- So song song nhiều provider trong một lần chạy

## 2. Production — một output chất lượng cao

Một ảnh lớn, chất lượng cao (poster, board cuối). Aspect 2:3, quality `high`.

## 3. Storyboard — dãy scene đánh số

Một hàng frame đánh số. Chọn bất kỳ ảnh nào → **↻ Redo** để gen lại scene đó từ prompt đã lưu trong `meta.prompt` của shape. Aspect 3:2, quality `medium`.

---

## 4. 🔬 Diagnostic Lab — tách suggestion / prompt / model

> Tài liệu chi tiết: [Diagnostic Lab](./studio-lab).

Mode quan trọng nhất và là **moat**. Khi một layout ra xấu, Lab cho biết lỗi nằm ở đâu trong 3 tầng:

| Tầng | Hiện thân trong Lab | Câu hỏi trả lời |
|---|---|---|
| **Suggestion** | Recipe form (subject, style, layout, palette, type, text tokens) | Ý tưởng có đủ tốt không? |
| **Prompt** | Compiled prompt (read-only) + **lint score** | Prompt có theo guideline model không? |
| **Model** | Reference-image probe (ablation row `ref-probe`) | Model có làm nổi không, kể cả khi được mớm mẫu? |

**Ablation runner**: hàng = biến thể prompt (`golden` / `your recipe` / `ref-probe`), cột = provider. Đọc **xuống cột** để cô lập biến prompt; đọc **ngang hàng** để cô lập biến model.

---

## Hạ tầng dùng chung (tất cả mode)

- **Provider registry** (`lib/providers`): một interface `GenerateOptions → ProviderResult`, mọi provider thay thế lẫn nhau. Thêm provider mới = thêm 1 file.
- **Cost estimate** (`lib/cost`): ước tính USD + VND mỗi lần chạy theo provider × quality × số option.
- **Canvas overlay**: skeleton shimmer khi đang gen + nhãn tên nổi trên mỗi ảnh (bám theo khi kéo).
- **Placement không đè**: batch mới luôn đặt vào vùng trống dưới nội dung cũ; camera tự center tới batch mới.

> Nguyên tắc reuse: mọi mode chia sẻ `placeColumn`/`placeOne`, `loadDims`, overlay, registry — không có hai implementation song song cho cùng một việc.
