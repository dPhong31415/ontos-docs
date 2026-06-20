---
id: whip-flow-validate
title: Luồng Whip It — bản tiếng người (để Phong validate)
sidebar_label: ✅ Whip It flow (validate)
sidebar_position: 4
---

# Luồng Whip It — full, tiếng người (Phong validate 20/06)

> Mục đích: ghi ĐÚNG những gì code đang làm (`src/components/WhipItButton.tsx` + engine), bằng tiếng người,
> để Phong soi đúng/sai từng bước. KHÔNG tô hồng — bước nào còn yếu/giả thì ghi rõ.

## Bức tranh 1 câu
Bấm **Whip It** → Whip nghe lời nói trong video → hiểu cấu trúc câu chuyện → cắt bỏ phần thừa → chèn b-roll
đúng chỗ đúng nghĩa → áp nhịp/caption/zoom theo phong cách mẫu → ra bản dựng + bảng "cut sheet" để duyệt.

## Các bước (theo đúng thứ tự code chạy)

**Bước 0 — Chọn "xương sống" (spine).**
Whip nhìn cả kho clip trong pool, tự chọn 1 talking-head làm trục chính (`planAssembly`), còn lại là b-roll.
- Nếu Phong tag ⭐ MAIN → tôn trọng tuyệt đối; không tag → Whip tự đoán (có thể sai, báo rõ "tự đoán").
- Nếu Phong dán **script** sẵn HOẶC chọn "b-roll → story" → rẽ sang luồng *footage-story* (AI tự viết mạch từ cảnh).

**Bước 1 — Nghe (transcribe).**
Trộn audio → gửi Deepgram (cloud) → ra **từng chữ kèm mốc thời gian**. Kèm: đo **nhịp nhấn giọng** (chỗ
lên giọng) + **khoảng lặng** (dead air để cắt).

**Bước 2 — Chọn phong cách.**
Đọc loại input → recommend style → áp caption.
- Có **mẫu viral đã phân tích** (🧬 styleGraph) → dùng *dạng kể chuyện + nhịp cắt + caption + look* của mẫu.
- Chưa có mẫu → style generic (báo "nên phân tích 1 reel để đúng trend").

**Bước 3 — Hiểu cấu trúc (semantic graph — Moat #1).**
`semanticGround` (LLM) đọc transcript → chia thành **section** có ý nghĩa: vai (hook/point/proof/cta) +
*đoạn này nên có hình gì* (direction.footage) + tóm tắt + năng lượng. **Đây là NGUỒN** quyết định mọi thứ sau.

**Bước 4 — Quyết chèn b-roll ở đâu + chuẩn bị.**
- `deriveInsertionIntents`: từ section → ra **các điểm cần chèn b-roll** + *cần quay/minh hoạ gì*. Dồn/thưa
  theo **cut profile** của mẫu (chỗ mẫu cắt nhanh thì chèn dày) + boost theo **công thức viral (rules)**.
- `shortlistBroll`: lọc rẻ ứng viên b-roll trong kho (khớp tên/tag) — chưa decode.
- `deepIndexBroll`: chỉ với ứng viên lọt vòng → cut-detection + VLM đọc từng cảnh (đắt, chạy NỀN song song).

**Bước 5 — Cắt + áp style (cut talking-head xong trước, ko đợi b-roll).**
- **Editorial cut**: bỏ filler + dead air, giữ câu có ý → spine gọn lại.
- **Caption + motion**: áp caption theo mẫu; **punch-in/zoom** theo vai + nhịp (mạnh/nhẹ theo `punchZoom`).
- (Look/grade filmGrain/vignette: TẠM TẮT — vì mẫu mới là LLM ĐOÁN, chưa đo thật từ frame → áp vào "xàm".)

**Bước 6 — Đắp b-roll (nền, đắp dần).**
`matchBroll`: ghép b-roll đã index vào đúng intent theo NGHĨA → `placeBrollClips`. Thà để trống còn hơn ghép sai.

**Bước 7 — Bảng duyệt (StoryReview / cut sheet).**
Hiện từng nhịp: vai + lời nói + on-screen + b-roll + camera + "vì sao" → Phong đọc-là-hiểu, duyệt/sửa.

## ⚠️ Điểm Phong vừa flag (20/06) — cần sửa UI/logic
1. **Phân tích vỡ chunk quá nhỏ**: section/cut đang over-segment (mỗi câu 1 chunk). Cần gộp theo Ý (semantic
   merge) — 1 ý = 1 section, không phải mỗi câu nói. *(logic: nâng ngưỡng gộp trong semanticGround / merge spans liền vai)*
2. **Card vừa "B-roll" vừa "punch-in" khó hiểu**: 2 thứ khác loại đứng cạnh. Ghi rõ (tiếng Anh):
   **`B-roll` = footage type** (loại hình chèn) · **`punch-in` = camera move** (cách máy chuyển). Nên tách nhãn:
   `FOOTAGE: B-roll` · `CAMERA: Punch-in`.
3. **Ô text chưa rõ là gì**: ô "I met this kitten…" = **lời thoại gốc (script/caption)**. Cần label "Script / Caption".
4. **Mỗi dòng trong card cần ghi rõ là gì**:
   - `~ kitten remains stationary` = **On-screen action** (đang thấy gì trên hình)
   - `💡 Mở bằng tổn thương…` = **Editorial intent** (vì sao nhịp này tồn tại)
   - chip `shelter cage / blanket` = **Entities** (vật/người nhận diện trong cảnh)

## Chỗ còn YẾU (honest)
- Look/grade chưa đo thật từ frame (đang tắt). · motionIntensity curve còn suy ra từ cutDensity. · footage-story
  path chưa nhận cutProfile/rules/learned. · over-segmentation (điểm 1 trên).
