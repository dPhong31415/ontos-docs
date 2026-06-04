---
id: jobradar-roadmap
title: Roadmap & Checklist
sidebar_label: ✅ Roadmap & Checklist
sidebar_position: 6
---

# Roadmap & Feature Checklist

Trạng thái: ✅ Done · 🔄 In progress · ⬜ Todo · ❌ Blocked

---

## M0 — Lõi & LLM (✅ Done)

**Backend (Dev B)**
- ✅ Retire Claude CLI + Tailscale runner cho LLM
- ✅ `runClaude()` → proxy `arkChat()` (BytePlus ARK)
- ✅ Thread `type` + `userId` vào mọi call để log `Usage`
- ✅ Bỏ `@anthropic-ai/sdk` khỏi `package.json`
- ✅ `SeenJob` model — dedup scraper từ file local → MongoDB
- ✅ `job_scraper.py` dùng `SeenJob` collection thay `~/.job-seen-*.json`
- ✅ `GET /api/admin/cost-report` — đọc Usage ra bảng cost thật/feature

---

## M1 — Multi-tenancy (✅ Done)

**Backend (Dev B)**
- ✅ `Workspace` model: thêm `type`, `parentWorkspaceId` (dormant)
- ✅ `lib/workspace.ts`: `getOrCreatePersonalWorkspace()`
- ✅ `users/sync`: tự tạo personal workspace khi user đăng nhập lần đầu
- ✅ `tracker/route.ts`: dùng workspace thay `workspaceId: null`
- ✅ `jobs/import-url`: dùng workspace thay `null`
- ✅ `POST /api/admin/migrate-workspaces` — backfill data cũ

**⬜ Còn chờ:**
- ⬜ Chạy migration trên prod: `POST /api/admin/migrate-workspaces`

---

## M2 — Entitlements & Credit (✅ Done)

**Backend (Dev B)**
- ✅ `Subscription` model
- ✅ `CreditWallet` + `CreditLedger` model
- ✅ `lib/entitlements.ts`: tier matrix + `getEntitlements()` + credit helpers
- ✅ Gate `deep analysis` route (Personal+, 2 credit + refund on error)
- ✅ Gate `propose/cover letter` route (Personal+, 1 credit + refund)
- ✅ Gate `presets` POST (Personal+)
- ✅ Analyze route: Free cap = 10 jobs, `meta.gated = true` khi vượt

**Frontend (Dev A)**
- ✅ Job card: hiện `🔒 upgrade to score` thay matchPct khi `meta.gated`

---

## M3 — Billing & Legal (✅ Done)

**Backend (Dev B)**
- ✅ `POST /api/billing/webhook-mor` — Paddle/LemonSqueezy, HMAC verify
- ✅ `POST /api/billing/webhook-vn` — VNPay/MoMo, HMAC verify
- ✅ `GET /api/billing/credits` — balance + ledger
- ✅ `BILLING_MOR_SECRET` + `BILLING_VN_SECRET` set trên Vercel
- ⬜ Connect tài khoản Paddle hoặc LemonSqueezy thật
- ⬜ Set webhook URL trong dashboard Paddle/LS
- ⬜ Connect VNPay/MoMo → set IPN URL

**Frontend (Dev A)**
- ✅ `/terms` page
- ✅ `/privacy` page
- ✅ `/refunds` page
- ⬜ Upgrade modal UI khi nhận 402 (`upgradeTo`)
- ⬜ Credit balance hiển thị trong app
- ⬜ Checkout flow UI (link sang Paddle/LS)

---

## M4 — Chat-first UX (🔄 In progress)

**Frontend (Dev A)**
- ✅ Chat sidebar → chuyển sang **bên trái** (primary)
- ✅ Job grid ở bên phải (secondary)
- ✅ Khi không có template: chỉ hiện chat (onboarding mode)
- ✅ "✚ choose" button (set `applicationStatus: tracking`)
- ✅ "✕ skip" button (notInterested)
- ✅ Grid/List toggle
- ✅ Gated card UI (`meta.gated` → 🔒)
- ✅ `ProjectTasksPanel` trong tracker side panel
- ⬜ Landing page (`app/page.tsx`) thay vì redirect thẳng
- ⬜ Upgrade prompt UI khi nhận 402
- ⬜ Credit balance badge trong header
- ⬜ Mobile responsive

**Backend (Dev B)**
- ✅ `ProjectTask` model + CRUD API `/api/jobs/[id]/tasks`
- ✅ `create_template` agent tool
- ✅ Agent system prompt: onboarding mode khi không có template
- ✅ Agent phản hồi cùng ngôn ngữ user (Tiếng Việt)

---

## M5 — Team & Admin (✅ Done phần lớn)

**Backend (Dev B)**
- ✅ `Job.assigneeId` — giao job cho thành viên
- ✅ `PATCH /api/jobs/[id]`: cho phép sửa `assigneeId`
- ✅ `GET /api/admin/subscriptions`

**Frontend (Dev A)**
- ⬜ UI giao job (dropdown chọn member trong card)
- ⬜ Admin page: subscription/billing section
- ⬜ Admin page: cost dashboard sử dụng `/api/admin/cost-report`

---

## Post-MVP — Backlog

**Agentic / Memory**
- ⬜ Capture loop: skip/apply/feedback → ghi `AgentMemory.userPatterns`
- ⬜ Inject loop: keyword-gen đọc `AgentMemory` → prompt smarter
- ⬜ Reflect job: scheduled job re-review skipped jobs
- ⬜ Prune low-quality keywords (qualityScore < 0.1 sau 3 run)

**MCP**
- ⬜ MCP server endpoint tại `/api/mcp`
- ⬜ Expose agent tools qua MCP (same tools, workspace-scoped)

**Marketplace**
- ⬜ `Asset` + `Purchase` model
- ⬜ CV/cover-letter template packs (mua lẻ)
- ⬜ Marketplace page

**Khác**
- ⬜ Agent-core tách repo riêng
- ⬜ Custom domain (không phải `jobradar-orcin.vercel.app`)
- ⬜ Annual plan + referral
- ⬜ Mobile/PWA
- ⬜ More sources (topCV, Glints, CareerViet đã có scraper)
- ⬜ B2B2B `parentWorkspaceId` (code có sẵn, chỉ cần UI)

---

## Legal & Compliance Checklist (trước khi mở bán)

**Trang pháp lý**
- ✅ `/terms` — Terms of Service
- ✅ `/privacy` — Privacy Policy
- ✅ `/refunds` — Refund Policy (3-day MBG cho new subs)
- ⬜ Review nội dung với luật sư (nếu cần)
- ⬜ Cookie banner (nếu serve EU users)

**Thanh toán**
- ⬜ Đăng ký tài khoản Paddle hoặc LemonSqueezy
- ⬜ Verify business + ngân hàng VN để rút tiền
- ⬜ Tạo product + pricing trên MoR dashboard
- ⬜ Set webhook URL → test sandbox checkout
- ⬜ Đăng ký VNPay hoặc MoMo business account
- ⬜ Test IPN + sandbox VN gateway

**Data**
- ⬜ Confirm BytePlus ARK ToS: nhiều tài khoản free có vi phạm không?
- ⬜ GDPR: user có thể request delete account + data
- ⬜ Xác nhận không store raw card data (đang delegate MoR — OK)

**Infra**
- ⬜ Custom domain (jobradar.vn hoặc tương tự)
- ⬜ Upgrade Vercel Hobby → Pro ($20/mo) cho `maxDuration 300s`
- ⬜ Render free → paid để hết cold start
- ⬜ Alert khi ARK quota cạn (hiện throw lỗi nhưng chưa có Slack/email alert)
- ⬜ MongoDB backup policy

---

## Test cases cần pass trước launch

**Unit (npm run test:unit)**
- ✅ `FEATURE_CREDITS` values đúng
- ✅ `parseJSON` xử lý đúng các format LLM trả về
- ✅ Cost math: heavy user < $1/month

**E2E (npm run test:e2e)**
- ✅ Unauthenticated → redirect sign-in
- ✅ Legal pages public
- ✅ Share invalid token → 404 hoặc error
- ⬜ Tracker double panel regression (cần `TEST_STORAGE_STATE`)

**Manual**
- ⬜ New user → chat onboarding → tạo template → scrape → analyze → card
- ⬜ Free user → 11th job không có matchPct (gated)
- ⬜ Paid user → deep analysis trừ credit → error → hoàn credit
- ⬜ Checkout sandbox → entitlement update live
- ⬜ Team: invite member → giao job → share link claim
