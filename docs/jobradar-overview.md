---
id: jobradar-overview
title: Tổng quan dự án
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# jobradar — Tổng quan dự án

> Đọc trang này đầu tiên. Nó sẽ giải thích **jobradar là gì, tại sao có nó, và bức tranh toàn cảnh** trước khi bạn đọc bất kỳ trang kỹ thuật nào.

---

## Vấn đề đang giải quyết

Tìm việc freelance/remote hiện tại rất manual: vào LinkedIn, Himalayas, RemoteOK, Reddit... từng trang một, đọc từng job, copy thông tin ra note, không biết job nào phù hợp.

**jobradar làm gì:** user chỉ cần nói *"Tôi là video editor, giỏi After Effects, muốn freelance remote tối thiểu $30/h"* → hệ thống tự scrape tất cả nguồn → AI chấm điểm từng job → hiện ra danh sách xếp hạng từ phù hợp nhất.

---

## Luồng sử dụng (user journey)

```
Bước 1: Nói chuyện với chat
  User: "Tôi là motion designer, 5 năm AE+C4D, muốn remote freelance $35/h+"
  → Agent hỏi thêm: kỹ năng, lương, ngôn ngữ, không muốn ngành nào
  → Tạo ra "CV template" = hồ sơ tìm việc của user

Bước 2: Sinh keywords
  Template → AI sinh từ khoá tối ưu cho từng nền tảng
  ("motion designer remote" cho LinkedIn, "after-effects" cho RemoteOK...)

Bước 3: Scrape
  Worker Render kéo job từ 14 nguồn về database

Bước 4: AI chấm điểm
  Mỗi job → AI so với profile user → matchPct 0-100%, action (apply/save/skip)

Bước 5: User xem cards
  Bấm "✚ choose" → job vào Tracker
  Bấm "✕ skip" → ẩn đi
  Bấm "Deep Analysis" → AI phân tích sâu hơn (công ty, thị trường, xác suất hire)

Bước 6: Tracker
  Theo dõi tiến độ apply: tracking → applied → screening → interview → offer
  Sinh cover letter, task breakdown cho từng job

Bước 7: Tự học
  Mỗi lần skip/apply → hệ thống ghi nhận pattern
  → Lần sau AI hiểu user hơn, kết quả chính xác hơn
```

---

## 3 tier người dùng

Hiện tại chưa có paywall thật (M3 đã build webhook nhưng chưa connect payment provider). Khi connect xong thì:

| | **Free** | **Personal** | **Team** |
|---|---|---|---|
| **Giá** | $0 | ~$9–12/tháng | ~$29–49/người/tháng |
| Tạo template | 1 | Nhiều | Nhiều |
| Regen keywords | 3 lần | Thoải mái | Thoải mái |
| AI chấm điểm | **10 job đầu** (còn lại thấy info nhưng không có %) | Không giới hạn | Không giới hạn |
| Deep analysis | ✕ | ✓ (2 credit/lần) | ✓ |
| Cover letter | ✕ | ✓ (1 credit/lần) | ✓ |
| Project Tracker | ✕ | ✓ | ✓ |
| Share link cho người khác | ✕ | ✕ | ✓ |
| Giao job cho teammate | ✕ | ✕ | ✓ |

**Credit là gì?** Đơn vị tính tính năng nặng. 1 credit = $0.01. Mua lẻ theo gói hoặc nhận theo subscription hàng tháng.

---

## Tech stack (tại sao chọn cái này)

| Thứ | Dùng cái gì | Tại sao |
|-----|-------------|---------|
| Web app | Next.js 16 | Full-stack trong 1 repo, serverless API |
| Database | MongoDB Atlas | Schema linh hoạt, document phù hợp với job data |
| AI/LLM | BytePlus ARK (8 models) | Rẻ hơn Claude API ~10×, rotate để tránh quota |
| Auth | Clerk | Nhanh setup, hỗ trợ org/team |
| Scraper host | Render (Docker) | Worker luôn chạy, không giới hạn thời gian như Vercel |
| Deploy web | Vercel | CI/CD tự động, preview URL per branch |

---

## Cấu trúc repo

```
jobradar/               ← repo chính, bạn đang đọc tài liệu của cái này
  app/                  ← Next.js pages + API routes
  lib/                  ← logic dùng chung (models, agent, billing...)
  components/           ← React components
  scripts/              ← Python scrapers
  runner/               ← Render worker server

jobradar-docs/          ← repo tài liệu (repo này)
```

---

## Trạng thái hiện tại (tháng 6/2026)

**Đã làm xong (backend):**
- ✅ LLM chạy qua ARK (không còn phụ thuộc Claude CLI trên laptop)
- ✅ Multi-tenant: mỗi user có Workspace riêng
- ✅ Entitlement system: gate tính năng theo tier
- ✅ Billing webhooks: sẵn sàng nhận Paddle/LemonSqueezy + VNPay/MoMo
- ✅ Legal pages: /terms /privacy /refunds

**Đang làm (frontend):**
- 🔄 Chat-first layout: Radar chat bên trái, job cards bên phải
- 🔄 Upgrade modal khi nhận 402

**Chưa làm:**
- ⬜ Connect payment provider thật (tài khoản Paddle/VNPay)
- ⬜ Landing page
- ⬜ Mobile responsive
- ⬜ Agent memory loop đầy đủ (capture → inject → reflect)

→ Roadmap đầy đủ xem trang [Roadmap & Checklist](/jobradar-roadmap)
