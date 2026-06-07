---
id: whip-launch-infra
title: Launch & Infra Master Plan
sidebar_label: 🏗️ Launch & Infra
sidebar_position: 15
---

# Whip — Launch & Infrastructure Master Plan

> Bản quy hoạch hạ tầng + tiền + auth + dashboard cho launch SaaS. Đọc cùng
> [GTM & Launch](./whip-gtm-launch.md) và [Auto-Viral Pipeline](./whip-auto-viral-pipeline.md).
> Cập nhật 07/06/2026. Quyết định: **LS subscription (bỏ Gumroad), Clerk identity + Elixir billing/dashboard**.

---

## 0. TL;DR kiến trúc

```
                 ┌────────────────────── BROWSER (client) ──────────────────────┐
                 │  Whip SPA (Vite/React/PixiJS)                                 │
                 │  • Clerk <SignedIn> gate (identity, JWT)                      │
                 │  • Editor: project JSON + media bytes ở OPFS (local cache)    │
                 │  • Export: WebCodecs GPU (local, $0 server)                   │
                 └──────┬─────────────────────┬───────────────────┬────────────┘
                        │ JWT                  │ audio WAV         │ asset upload
                        ▼                      ▼                   ▼
        ┌── Clerk ──┐     ┌── Caption endpoint ──┐     ┌── Cloud storage ──┐
        │ identity  │     │ Phoenix /api/caption │     │ Supabase Storage  │
        │ sessions  │     │ → Deepgram + Haiku   │     │ hoặc Cloudflare R2 │
        │ social    │     │ → trừ credit (DB)    │     └───────────────────┘
        └───────────┘     └──────────┬───────────┘
                                     │
              ┌── Elixir/Phoenix (Ontos control plane, Fly.io) ──┐
              │ • Postgres: users, subscriptions, credits, projects │
              │ • LS webhook listener → cập nhật entitlement        │
              │ • Phoenix PubSub/Channels → Dev Dashboard real-time │
              │ • LiveView Admin Dashboard ("ting" income)          │
              └────────────────────────────────────────────────────┘
                        ▲
                        │ webhook (payment_success, subscription_*)
                 ┌── Lemon Squeezy (MoR) ──┐
                 │ thu USD, đóng thuế VAT  │ → payout → Payoneer → bank VN (Whip-only)
                 └─────────────────────────┘
```

**Nguyên tắc vàng:** video nặng decode/encode ở **client** → server chỉ xử lý **text JSON + lệnh + thanh toán** → hạ tầng gần như $0 lúc đầu, scale rẻ.

---

## 1. Auth — Clerk hay build trong Elixir/Ontos?

**Câu hỏi sai cách đặt — KHÔNG phải chọn 1.** Tách 2 mối lo:

| Lớp | Ai làm | Vì sao |
|---|---|---|
| **Identity** (đăng nhập, session, social login, reset pass, bảo mật) | **Clerk** | Tự build auth = tốn tuần + rủi ro bảo mật. Clerk lo hết, có sẵn UI. |
| **Entitlement** (user này gói gì, còn bao credit, quyền gì) | **Elixir/Postgres** | Là business logic + tiền → phải ở backend bạn kiểm soát. |

**Cách 2 cái nối nhau (cực sạch):** Clerk phát **JWT**; mọi request lên Phoenix kèm `Authorization: Bearer <clerk_jwt>`; Phoenix **verify JWT bằng Clerk JWKS public key** → biết `user_id` → tra Postgres lấy entitlement. → Clerk = "ai", Elixir = "được làm gì". **Không bao giờ phải migrate.**

**Lộ trình:**
1. **Now (MVP):** Clerk `<ClerkProvider>` + gate `<SignedIn>/<SignedOut>` trong SPA. Client-only entitlement tạm (localStorage) để test.
2. **+Billing (khi có Ontos):** Phoenix verify Clerk JWT → entitlement thật từ Postgres. Caption credit check server-side.
3. KHÔNG build login/session trong Elixir. Phí công, Clerk làm tốt hơn.

> Quyết định: **Clerk ngay** (identity), **Elixir sau** (entitlement + billing + dashboard), bridge bằng Clerk JWT.

### Tích hợp kỹ thuật
- Client: `@clerk/clerk-react`, `VITE_CLERK_PUBLISHABLE_KEY` (pk_… — public, an toàn).
- Phoenix: thư viện verify JWT (Joken) + fetch Clerk JWKS. Webhook Clerk `user.created` → tạo row user trong Postgres.

---

## 2. Billing — Lemon Squeezy (MoR), bỏ Gumroad

**Vì sao LS, không Gumroad:** Gumroad = đất bán PDF/template lẻ → làm phèn định vị SaaS. LS/Paddle = MoR chuẩn SaaS: quản subscription mượt, **đóng thuế VAT/Sales Tax toàn cầu thay bạn** (Stripe thuần thì bạn tự kê khai thuế từng nước = ác mộng).

### Gói (đồng bộ Auto-Viral Pipeline)
- **Free**: 1080p export, watermark, 3 caption credit/tháng.
- **Pro $8.99/mo**: 4K/60, no watermark, 50 caption credit/tháng, full preset 👑.
- **Studio $29/mo**: 200 credit, ưu tiên.
- (Caption có COGS API → bán theo credit, KHÔNG unlimited — xem Auto-Viral doc §1.)

### Luồng tiền VN (minh bạch cho team)
```
User quẹt thẻ → Lemon Squeezy (thu USD, đóng thuế VAT)
   → payout định kỳ → [Wise #1 / PingPong #2 / Payoneer #3]
   → Bank VN MỞ RIÊNG cho Whip (Techcombank/VCB/Timo/Cake)
```
**Xếp hạng nhận tiền về VN (net cao→thấp):**
1. **Wise** — tỷ giá mid-market + phí thấp minh bạch → **net cao nhất**.
2. **PingPong** — phí thu hộ thấp, tỷ giá tốt.
3. **Payoneer** — phổ biến nhưng **cắn ~2% FX spread**.
4. ❌ **SWIFT direct** — phí ngân hàng trung gian + tỷ giá xấu → **tránh**.

> ⚠️ **VERIFY TRƯỚC KHI CHỐT:** Lemon Squeezy **có payout về Wise/VN trực tiếp không?** LS truyền thống payout qua PayPal, sau thêm bank/Wise nhưng **không phải nước nào cũng hỗ trợ**. Kiểm tra **Settings → Payout** của LS với quốc gia VN. Nếu LS KHÔNG hỗ trợ Wise→VN → fallback **Payoneer/PayPal** (dù cắn FX). Con số VNĐ tuyệt đối phụ thuộc số tiền + tỷ giá ngày rút — chỉ chênh lệch tương đối là đáng tin.

- **Tách bạch tiền dự án ≠ tiền cá nhân.** Tài khoản ngân hàng riêng chỉ cho Whip.
- Minh bạch team: cấp **view-only** hoặc xuất **sao kê hàng tháng** vào group.

### Tích hợp
- LS dashboard: tạo Store + Product subscription + bật License keys (hoặc dùng webhook).
- `engine/license.ts` (đã có client) → đổi sang verify qua Phoenix khi backend lên.
- Webhook LS → Phoenix (xem §3).

---

## 3. Dev Dashboard real-time (Phoenix — "ting" income)

Đây là **đất diễn của Elixir/Phoenix**, đừng dùng tool ngoài.

```
LS payment_success ──webhook──► Phoenix Controller
   1. verify chữ ký HMAC (X-Signature) — chống giả mạo
   2. lưu Postgres: user, gói Pro, số tiền, thời điểm
   3. cập nhật entitlement (is_pro=true, +credit)
   4. Phoenix.PubSub.broadcast("revenue", {user, amount})
        └► LiveView Admin Dashboard (team đang mở)
             → số dư nhảy "Ting" $100 → $108.99 + popup tên user
```
- **Phoenix LiveView** cho Admin Dashboard (đỡ viết Next.js riêng): MRR, danh sách giao dịch, credit usage, COGS/video, churn.
- **PubSub/Channels** = push real-time, BEAM gánh ngàn kết nối RAM nhỏ.
- Hype team như kênh donate streamer → động lực kinh khủng.

**Bảo mật webhook (bắt buộc):** verify HMAC signature của LS bằng signing secret; reject nếu sai. Idempotent (LS có thể gửi trùng) → dedupe theo event id.

---

## 4. Caption dev worker chạy ở đâu (production)?

Hiện tại: `scripts/caption-worker.mjs` chạy local (`npm run caption:dev` :8787) hoặc Cloudflare Worker.

| Giai đoạn | Host caption endpoint | Lý do |
|---|---|---|
| **Now (test)** | local Node `:8787` (đã chạy) | dev nhanh |
| **MVP deploy** | **Cloudflare Worker** (`wrangler deploy`) | stateless, free tier, gần user, giữ Deepgram key bí mật. `VITE_CAPTION_API` = url worker. |
| **+Billing** | **chuyển vào Phoenix** `/api/caption` | để check + trừ **credit trong Postgres** trước khi gọi Deepgram (chống lạm dụng). CF Worker không có DB credit dễ. |

→ MVP: CF Worker. Khi có Ontos + credit DB: chuyển endpoint sang Phoenix (cùng code Deepgram+Haiku, thêm bước check credit). Deepgram key **chỉ ở server**, không bao giờ ra client.

**Cache (tiết kiệm tiền):** client đã cache transcript theo asset (localStorage). Thêm: worker cache theo content-hash (in-memory/KV) → cùng audio nhiều user = 1 lần gọi Deepgram.

---

## 5. Media storage & SHARE project (đính chính OPFS)

**OPFS = lưu ẩn per-browser/per-device, KHÔNG modal chọn folder, KHÔNG share được.** (Cái "modal chọn folder" là File System Access API — khác, cũng không share.)

→ Share project + assets cho team **bắt buộc cloud**:

```
Share project:
  1. upload mọi asset (media bytes từ OPFS) → Supabase Storage / R2
  2. project.whip JSON lưu URL cloud thay vì assetId-local
  3. lưu project vào Postgres (owner = clerk user_id) → trả link /p/<id>
  4. team mở link → Phoenix trả JSON → client fetch assets từ cloud URL
```
- **Supabase** khuyên cho MVP: Storage + Postgres + (có thể) Auth — gọn 1 nền. R2 nếu cần $0 egress cho video nặng.
- **OPFS vẫn giữ vai trò L1 cache**: tải cloud 1 lần → cache OPFS → mở lại nhanh (xem GTM §4.4 Relink).
- Upload lớn → **Web Worker** để không treo UI.

---

## 6. Deploy topology (MVP)

| Thành phần | Host | Lệnh / ghi chú |
|---|---|---|
| SPA (app) | **Vercel** (hoặc CF Pages) | `vercel deploy --prod`; SPA rewrite về index.html |
| Landing | cùng Vercel, route `/` | `landing/index.html` |
| Caption worker | **Cloudflare Worker** | `npm run caption:deploy` (wrangler); secret DEEPGRAM/ANTHROPIC |
| Ontos backend (sau) | **Fly.io** (Elixir) | 2 máy SG+US ~$5–10/th; Postgres ~$5 |
| Storage (sau) | Supabase / R2 | free tier đầu |

**Env:**
- `VITE_CLERK_PUBLISHABLE_KEY` (public)
- `VITE_CAPTION_API` = url CF worker
- `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (public) — khi bật cloud share
- Secret (KHÔNG VITE_, chỉ server): `DEEPGRAM_API_KEY`, `ANTHROPIC_API_KEY`, `LS_WEBHOOK_SECRET`, `CLERK_SECRET_KEY`

**SPA rewrite (vercel.json):** mọi route → `/index.html` (trừ /assets), để client-router hoạt động.

---

## 7. Thứ tự thực thi (đề xuất)

1. **Fix bug + ổn định editor** (đang làm) → build xanh.
2. **Clerk gate** vào SPA (cần pk key) + **vercel.json** + deploy thử (open hoặc gated).
3. **Caption worker → Cloudflare** + set VITE_CAPTION_API production.
4. **Cloud share** (Supabase Storage upload + project link) → team share thật.
5. **Ontos/Phoenix**: webhook LS + entitlement + Dev Dashboard LiveView.
6. Onboarding interactive (xem [whip-onboarding](./whip-onboarding.md)).

→ Bước 2-4 đủ để **team test + share project**. Bước 5 khi có doanh thu/credit thật.

---

## 8. Chi phí — đường "MVP $0" (mục tiêu đã chốt)

**$0 thật sự nếu giữ trong free-tier + HOÃN Phoenix/Fly:**

| Phần | Free-tier | Mẹo giữ $0 |
|---|---|---|
| App + Landing | Vercel free | dùng `*.vercel.app` (đừng mua domain → khỏi ~$10/yr) |
| Auth Clerk | free tới ~10k MAU | — |
| Caption AI Deepgram | **$200 credit tặng lúc đăng ký** | ~3000+ video FREE; + cache client (đã làm) → cùng audio ko gọi lại |
| Cloud share Supabase | Storage 1GB + PG 500MB free | nén/giới hạn upload |
| Caption endpoint | Cloudflare Worker 100k req/ngày free | — |
| Billing LS | $0 khi chưa bán | chỉ 5%+50¢ **khi có giao dịch** |
| **Dashboard real-time Phoenix** | ❌ **phá $0** (Fly.io min ~$5 + PG ~$5) | **HOÃN** — xài LS dashboard (free) tới khi có MRR |

**Trade-off cho $0:** tạm **bỏ dashboard "ting" real-time** (cần Fly.io). Launch $0 trước; bật Phoenix khi đạt ~$50 MRR (lúc đó $10/th là vặt).

**Khi vượt free-tier → đã có doanh thu trả:** Supabase Pro ~$25, Fly.io ~$10, Deepgram theo dùng (~$0.06/video). Tổng dưới $40/th — chỉ bật khi cần.

→ **Launch MVP = $0.** Tiền chỉ phát sinh khi bán được hoặc vượt free-tier (đều là tín hiệu tốt).
