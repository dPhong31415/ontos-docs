---
id: jobradar-ops
title: Ops & Deploy
sidebar_label: ⚙️ Ops & Deploy
sidebar_position: 8
---

# Ops & Deploy

## Env vars

| Var | Mô tả |
|-----|-------|
| `MONGODB_URI` | Atlas connection string |
| `ARK_API_KEY` | BytePlus ARK (LLM chính) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk frontend |
| `CLERK_SECRET_KEY` | Clerk backend |
| `CLAUDE_RUNNER_URL` | Render worker URL (scrape only, không còn LLM) |
| `CLAUDE_RUNNER_SECRET` | Shared secret với Render |
| `CRON_SECRET` | Bảo vệ `/api/cron/daily-scrape` |
| `BILLING_MOR_SECRET` | Paddle/LemonSqueezy webhook HMAC |
| `BILLING_VN_SECRET` | VNPay/MoMo webhook HMAC |

## Deploy workflow

```
feat/* push  →  Vercel Preview URL (không đụng prod)
staging      →  review chung trước merge
main push    →  Production auto-deploy
```

**Quota:** ~100 deploys/ngày (Vercel Hobby). Push 1 lần/batch.

## Migrations (chạy 1 lần sau deploy)

```js
// Trong browser (đăng nhập admin):
fetch('/api/admin/migrate-workspaces', {method:'POST'}).then(r=>r.json()).then(console.log)
fetch('/api/admin/cleanup-blank',      {method:'POST'}).then(r=>r.json()).then(console.log)
```

## Cost report

```js
fetch('/api/admin/cost-report').then(r=>r.json()).then(console.log)
// → bảng avg token + cost/feature → dùng để chốt giá credit
```

## Render worker

- Service: `jobradar-runner` (Docker, free tier)
- Endpoints: `GET /scrape` (SSE), `GET /stop`
- Free tier ngủ sau 15' idle → cold start ~50s
- **Chỉ chạy Python scrapers** — không còn Claude CLI

## Webhook setup

**Paddle/LemonSqueezy:**  
Webhook URL: `https://jobradar-orcin.vercel.app/api/billing/webhook-mor`  
Events: `subscription.created`, `subscription.updated`, `subscription.renewed`, `subscription.cancelled`  
Secret → `BILLING_MOR_SECRET`

**VNPay/MoMo:**  
IPN URL: `https://jobradar-orcin.vercel.app/api/billing/webhook-vn`  
`orderInfo` format: `"email:<user_email>|plan:<personal|team>"`  
Secret → `BILLING_VN_SECRET`

## Tests

```bash
npm run test:unit   # vitest, 11 tests, no network
TEST_BASE_URL=https://jobradar-orcin.vercel.app npm run test:e2e
```
