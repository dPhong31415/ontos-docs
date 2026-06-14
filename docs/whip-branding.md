---
id: whip-branding
title: Branding (Brand Kit)
sidebar_label: 📣 Branding
sidebar_position: 14
---

# Whip — Brand Kit

> **Nguồn chân lý màu/font = `frontend/whip/src/ui/tokens.css`.** Brand kit này diễn giải design system đó thành quy chuẩn thương hiệu cho marketing & Khanh dùng. Mọi nội dung (post, thumbnail, landing, slide) phải theo đây.
>
> 🚫 **KHÔNG dark theme tím.** Whip là **light neumorphism** (chrome trắng-xám nổi khối mềm kiểu thiết bị phần cứng / plugin âm thanh VST). Accent là **xanh dương**, không phải tím tối.

---

## 1. Bản chất thương hiệu (1 dòng)

> **Whip = "thiết bị" làm video talking-head viral — bấm là ra, mượt như một cây đàn synth, không phải phần mềm khó.**

- **Ẩn dụ cốt lõi:** một **thiết bị phần cứng đẹp** (VST/synth/mixer) — nút bấm nổi khối mềm (neumorphism), màn hình đen hiển thị data. Chạm vào thấy "đắt tiền, đã tay".
- **Cảm giác muốn tạo:** *gọn — mượt — pro nhưng thân thiện*. Không hàn lâm, không hacker-tối-tăm.

---

## 2. Tính cách thương hiệu (brand personality)

| Là | Không phải |
|---|---|
| Gọn gàng, sáng sủa, tự tin | Lòe loẹt, ồn ào |
| Pro nhưng dễ gần | Hàn lâm, khó hiểu |
| "Thiết bị đẹp đáng sở hữu" | "Phần mềm doanh nghiệp" |
| Nhanh, dứt khoát (whip = quất, nhanh) | Chậm, rườm rà |

---

## 3. Màu sắc (palette CHÍNH THỨC — lấy từ tokens.css)

### Nền & bề mặt (light neumorphic chrome)
| Vai trò | Mã | Dùng cho |
|---|---|---|
| Nền chính | `#d4dbe6` | nền ngoài cùng (tối hơn panel để khối nổi) |
| Panel | `#ecf0f6` | thẻ, khối nổi |
| Panel phụ | `#e2e8f0` | khối chìm nhẹ |
| Đường kẻ | `#c5cedc` | viền hairline |

### Chữ
| Vai trò | Mã |
|---|---|
| Chữ chính | `#2e3645` (xanh đá đậm — KHÔNG dùng đen tuyền) |
| Chữ phụ/mờ | `#6e7a8f` |

### Accent (điểm nhấn)
| Vai trò | Mã |
|---|---|
| **Xanh dương chủ đạo** ⭐ | `#3f6bff` |
| Hồng (đầu kia gradient) | `#f0327d` |
| **Gradient signature** | `linear-gradient(120deg, #2f6bff 0%, #6a5bf2 58%, #e0399a 100%)` (xanh → tím → hồng, trên nền SÁNG) |
| Xanh lá (success/audio) | `#16a34a` |

### "Màn hình" (chỉ cho khu hiển thị video/data)
Nền đen flat `#0c0d10`, chữ `#e8edf6`. **Chỉ dùng cho phần màn hình preview/timeline** — KHÔNG biến cả thương hiệu thành nền đen.

> ⚖️ **Tỉ lệ vàng:** ~80% sáng (chrome trắng-xám) · ~15% accent xanh dương · ~5% màn hình đen. Tím chỉ xuất hiện **giữa gradient**, không bao giờ làm nền chính.

---

## 4. Typography

- **Font UI/thương hiệu:** **Plus Jakarta Sans** (chính), fallback Inter.
- **Wordmark "Whip":** Plus Jakarta Sans **Bold/ExtraBold**, chữ thường `whip` hoặc `Whip` — gọn, không nghiêng quá.
- Tiêu đề: đậm, sạch. Body: regular/medium. Không dùng font script/trang trí.

---

## 5. Logo & wordmark (định hướng cho Khanh)

- **Wordmark "whip"** là logo chính (chưa cần icon phức tạp).
- Ý tưởng dấu nhấn: nét **"quất" (whip/swoosh)** — 1 đường cong nhanh, hoặc dấu nhấn gradient ở chữ cuối. Gợi tốc độ + chuyển động.
- Đặt trên **nền sáng**, khối nổi neumorphic mềm (như 1 phím/nút thiết bị).
- **Biến thể cần giao:** (1) wordmark đủ màu · (2) wordmark 1 màu (đen `#2e3645` / trắng) · (3) icon vuông cho avatar (chữ "w" trong khối neumorphic) · (4) favicon.

---

## 6. Hiệu ứng đặc trưng: Neumorphism (bắt buộc đúng)

Đây là chữ ký hình ảnh của Whip — làm sai là mất chất.

- **Khối nổi (raised):** bóng sáng góc trên-trái + bóng tối góc dưới-phải, mềm.
  `box-shadow: -9px -9px 20px rgba(255,255,255,.95), 9px 9px 22px rgba(155,170,192,.65)`
- **Khối chìm (inset):** ngược lại, dùng cho field/track.
  `box-shadow: inset 3px 3px 8px rgba(155,170,192,.6), inset -3px -3px 8px rgba(255,255,255,.95)`
- **Nguồn sáng luôn ở trên-trái.** Mọi bóng nhất quán hướng này.
- Bo góc mềm (radius 8–20px). Không góc vuông sắc.

> Làm thumbnail/post: nền sáng `#d4dbe6`–`#ecf0f6`, nút/thẻ nổi khối mềm, 1 điểm nhấn xanh `#3f6bff`. Đó là "ra chất Whip" ngay.

---

## 7. Giọng nói (voice & tone)

- **Ngắn, dứt khoát, tự tin.** Câu ngắn. Động từ mạnh.
- Nói lợi ích cụ thể, không sáo: *"Ra reel talking-head trong 5 phút"* > *"Giải pháp sáng tạo tối ưu"*.
- Thân thiện, không hù dọa kỹ thuật. Người không biết AE vẫn hiểu.
- **Tagline chính thức:** **"Made with Whip."** (luôn giữ nguyên, không dịch.)

---

## 8. "Made with Whip" — watermark = cỗ máy marketing

- Mọi video xuất bản free PHẢI có watermark **"Made with Whip"** — đây là kênh marketing miễn phí lớn nhất.
- Watermark: chữ Plus Jakarta Sans, nhỏ gọn, góc video, đọc được nhưng không che nội dung. Có thể kèm chấm gradient nhỏ.
- Trên social, mọi nội dung kết bằng dòng này + link waitlist.

---

## 9. Do / Don't (nhìn là biết đúng/sai)

| ✅ Do | ❌ Don't |
|---|---|
| Nền sáng, khối neumorphic mềm | Nền dark tím toàn trang |
| Accent xanh dương `#3f6bff` | Lấy tím làm màu chủ đạo |
| Chữ `#2e3645` trên nền sáng | Đen tuyền `#000` trên trắng gắt |
| Gradient xanh→hồng làm điểm nhấn nhỏ | Gradient phủ kín nền |
| Plus Jakarta Sans | Font script/trang trí |
| Màn hình đen CHỈ cho khu video/data | Biến cả brand thành "dark mode" |

---

## 10. Cần Khanh giao (deliverables branding)

- [ ] Wordmark "whip" (4 biến thể — Mục 5)
- [ ] Bộ avatar + ảnh bìa cho 4 kênh social (TikTok/IG/YouTube/X) — đồng bộ
- [ ] Template thumbnail (3–5 layout) cho video, theo neumorphism light
- [ ] Watermark "Made with Whip" (PNG nền trong, 2 cỡ)
- [ ] Brand sheet 1 trang (màu + font + logo) để team marketing tra nhanh

> Tất cả bám `tokens.css`. Có gì lệch design system → hỏi Phong trước khi làm.

---

## Liên kết
- [📣 Marketing Roadmap](./whip-marketing-roadmap.md)
- [🎨 Look & Presets](./whip-look.md) — style video OUTPUT (khác brand kit này — đây là nhận diện sản phẩm)
- Nguồn token: `frontend/whip/src/ui/tokens.css`
