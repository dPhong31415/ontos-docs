---
id: jobradar-roadmap
title: Roadmap & Checklist
sidebar_label: ✅ Roadmap & Checklist
sidebar_position: 7
---

# Roadmap & Checklist

> **Trang này là "bản đồ việc cần làm."** Đọc trước khi bắt đầu sprint mới để biết đang ở đâu và cần làm gì tiếp. Cập nhật khi hoàn thành việc.

---

## 🐛 Known Bugs (cần fix trước launch)

| # | Bug | Mô tả | File | Priority |
|---|-----|-------|------|----------|
| 1 | **Chat trắng sau 2 bước** | Onboarding: user submit prompt → chạy được "extracting" + "extracted" → sau đó UI reset về chat trắng, không hiện CV Modal. Root cause: `generateKeywords()` (step 2) throw error → event `"error"` → `setStage("idle")` nhưng UI không hiện `statusMsg` khi `stage === "idle"` → user thấy màn hình trắng không rõ lý do. | `app/onboarding/page.tsx:93-96`, `app/api/chat/extract/route.ts` | 🔴 P0 — block onboarding |

**Fix cần làm (Dev A + Dev B phối hợp):**
- Dev A: khi `stage === "idle"` + `statusMsg` chứa "Lỗi" → hiện error toast/message thay vì màn trắng
- Dev B: log lỗi `generateKeywords` rõ hơn trong SSE, kiểm tra `AgentMemory.findOne` có fail không khi workspace mới tạo

---

## Tổng quan tiến độ

```
M0 Lõi kỹ thuật  ██████████ ✅ Xong
M1 Multi-tenant  ██████████ ✅ Xong (cần chạy migration)
M2 Entitlements  ██████████ ✅ Xong
M3 Billing       ████████░░ 🔄 90% — cần connect provider thật
M4 Chat-first UX ████████░░ 🔄 80% — onboarding page live, bug P0 chat trắng cần fix
M5 Team + Admin  ████░░░░░░ 🔄 40% — backend xong, frontend còn thiếu
```

**Critical path để ra tiền: M3 (connect payment provider thật).**  
M4, M5 có thể làm song song.

---

## M0 — Lõi kỹ thuật ✅

**Vấn đề M0 giải quyết:** App ban đầu dùng Claude CLI chạy trên laptop, expose qua Tailscale. Không thể serve nhiều user, không có khi laptop tắt. M0 migrate toàn bộ AI sang BytePlus ARK (cloud API).

**Backend — Dev B:**
- ✅ `runClaude()` → proxy `arkChat()` — không còn gọi laptop
- ✅ Thread `userId` + `type` vào mọi AI call để log Usage
- ✅ Bỏ `@anthropic-ai/sdk` khỏi package.json
- ✅ `SeenJob` model — dedup scraper lưu vào MongoDB (không còn `~/.job-seen-*.json`)
- ✅ Scraper Python dùng `SeenJob` collection

**Verify M0 done:** Tắt Render runner → chat, analyze, keyword-gen vẫn chạy bình thường qua ARK.

**Còn lại:**
- ⬜ **Chạy** `GET /api/admin/cost-report` để xem cost thật → chốt giá credit

---

## M1 — Multi-tenant ✅ (cần migration)

**Vấn đề M1 giải quyết:** Trước đây, dữ liệu của user nằm ở `workspaceId: null` nghĩa là "personal mode". Cách này không scale được khi có nhiều user. M1 đảm bảo mọi user đều có Workspace rõ ràng.

**Backend — Dev B:**
- ✅ `Workspace` thêm `type` field
- ✅ Mỗi user đăng nhập lần đầu → tự tạo workspace personal
- ✅ Các route tạo job mới dùng workspace thay `null`
- ✅ Migration API: `POST /api/admin/migrate-workspaces`

**Còn lại — cần làm ngay:**
- ⬜ **Chạy migration trên prod:** `fetch('/api/admin/migrate-workspaces', {method:'POST'}).then(r=>r.json()).then(console.log)`
- ⬜ **Chạy cleanup:** `fetch('/api/admin/cleanup-blank', {method:'POST'}).then(r=>r.json()).then(console.log)`

---

## M2 — Entitlements & Credit ✅

**Vấn đề M2 giải quyết:** Chưa có gì ngăn Free user dùng tính năng trả phí. M2 build hệ thống gate tính năng và credit.

**Backend — Dev B:**
- ✅ `Subscription` + `CreditWallet` + `CreditLedger` models
- ✅ `lib/entitlements.ts` — single source of truth cho tier limits
- ✅ Deep analysis route: yêu cầu Personal+, tốn 2 credit, tự hoàn nếu lỗi
- ✅ Cover letter route: yêu cầu Personal+, tốn 1 credit
- ✅ Presets: yêu cầu Personal+
- ✅ Analyze: Free chỉ chấm 10 job, còn lại `meta.gated: true`

**Frontend — Dev A:**
- ✅ Card hiện "🔒 upgrade to score" khi `meta.gated: true`
- ⬜ **Upgrade modal** khi route trả về `402 { upgradeTo: "personal" }` → hiện popup "Nâng cấp để dùng tính năng này"
- ⬜ **Credit balance** hiển thị ở đâu đó trong UI
- ⬜ **Checkout flow** — button "Nâng cấp" link đến đâu?

---

## M3 — Billing 🔄 (90% backend xong, cần connect provider)

**Vấn đề M3 giải quyết:** Có code nhận payment webhook rồi, nhưng chưa có tài khoản provider để test.

**Backend — Dev B: ✅ Code xong**
- ✅ Webhook Paddle/LemonSqueezy (xác thực HMAC, upsert Subscription, grant credit)
- ✅ Webhook VNPay/MoMo
- ✅ `BILLING_MOR_SECRET` + `BILLING_VN_SECRET` đã set trên Vercel
- ✅ Legal pages: /terms /privacy /refunds

**Còn lại — cần người có tài khoản:**
- ⬜ **Đăng ký Paddle hoặc LemonSqueezy** (merchant account, verify ngân hàng VN)
- ⬜ Set webhook URL: `https://jobradar-orcin.vercel.app/api/billing/webhook-mor`
- ⬜ Test sandbox checkout → xác nhận entitlement update đúng
- ⬜ **Đăng ký VNPay hoặc MoMo** business account
- ⬜ Set IPN URL cho VN gateway
- ⬜ Review legal pages — nội dung đủ chưa?

---

## M4 — Chat-first UX 🔄 (70%)

**Vấn đề M4 giải quyết:** Trước đây UX là form-based, chat chỉ là sidebar phụ. M4 đưa chat thành giao diện chính.

**Frontend — Dev A:**
- ✅ Chat sidebar chuyển sang bên trái (primary)
- ✅ Job grid bên phải (secondary)
- ✅ Khi chưa có template → chỉ hiện chat (onboarding mode)
- ✅ "✚ choose" button (add to tracker)
- ✅ "✕ skip" button
- ✅ Grid/List view toggle
- ✅ Gated card UI (🔒)
- ✅ ProjectTask panel trong tracker

**Còn lại:**
- ⬜ **Landing page** (`/`) — hiện đang redirect thẳng vào app, cần trang giới thiệu
- ⬜ **Upgrade modal** — khi Deep Analysis bị block (trả 402), hiện modal đẹp thay vì im lặng
- ⬜ **Mobile responsive** — layout hiện chỉ chạy đẹp trên desktop
- ⬜ Filter sidebar đầy đủ (theo source, track, salary range)

**Backend — Dev B:**
- ✅ `create_template` agent tool
- ✅ Agent onboarding mode (hỏi 7 câu)
- ✅ Agent phản hồi tiếng Việt

---

## M5 — Team & Admin 🔄 (40%)

**Backend — Dev B: ✅ Xong**
- ✅ `Job.assigneeId` — giao job
- ✅ `GET /api/admin/subscriptions` — xem billing status
- ✅ `GET /api/admin/cost-report` — xem cost thật

**Frontend — Dev A: Chưa làm**
- ⬜ **UI giao job cho teammate** — dropdown chọn member trong job card
- ⬜ **Admin: subscription section** — hiện danh sách workspace + plan + credit balance
- ⬜ **Admin: cost dashboard** — biểu đồ cost theo tính năng từ `/api/admin/cost-report`
- ⬜ **Admin: scrape health** — scrape runs đang chạy, lỗi gần đây

---

## Post-MVP — Backlog (không làm bây giờ)

Những thứ này **đã có trong thiết kế** nhưng chưa cần cho launch:

**Agent Memory Loop** (tự cải thiện)
- Agent ghi `AgentMemory` sau mỗi skip/apply (capture)
- `generateKeywords()` đọc memory vào prompt (inject) — *hiện chưa có*
- Scheduled job review job bị skip → cập nhật pattern (reflect)

**MCP Server**
- Expose agent tools qua `/api/mcp` → partner/tool khác có thể dùng jobradar

**Agent-core tách repo**
- Khi contract API ổn định, tách `lib/agent/` + `lib/byteplus.ts` thành repo riêng

**Marketplace**
- `Asset` + `Purchase` model
- Bán mẫu CV/cover-letter theo item

**Khác:** annual plan, referral, mobile app, thêm nguồn scrape

---

## Launch checklist — điều kiện mở bán

Tất cả phải xanh trước khi charge tiền user thật:

**Technical:**
- ⬜ `npm run test:unit` pass (11 tests)
- ⬜ E2E: auth redirect, legal pages accessible, share page
- ⬜ Manual: onboarding → scrape → analyze → choose → tracker flow hoạt động end-to-end
- ⬜ Free tier: job thứ 11 không có matchPct (gated)
- ⬜ Paid: deep analysis trừ credit → lỗi → hoàn credit
- ⬜ Webhook sandbox: checkout → entitlement update

**Business:**
- ⬜ Payment provider account đã verify ngân hàng VN
- ⬜ Legal pages reviewed (Terms, Privacy, Refund Policy)
- ⬜ Custom domain (không phải `-orcin.vercel.app`)
- ⬜ Vercel Pro hoặc xác nhận Hobby đủ dùng

**Observability:**
- ⬜ Alert khi ARK quota cạn (hiện throw error nhưng chưa ping đâu)
- ⬜ Alert khi Render worker fail
- ⬜ Admin có thể refund user thủ công
