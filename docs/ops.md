---
id: jobradar-ops
title: Ops & Deploy
sidebar_label: Ops & Deploy
sidebar_position: 4
---

# Ops & Deploy

## Environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `MONGODB_URI` | Vercel + Render | Atlas connection string |
| `ARK_API_KEY` | Vercel | BytePlus ARK API key (paid quota) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel | Clerk frontend key |
| `CLERK_SECRET_KEY` | Vercel | Clerk backend key |
| `CLAUDE_RUNNER_URL` | Vercel | Render runner base URL (e.g. `https://jobradar-runner.onrender.com`) |
| `CLAUDE_RUNNER_SECRET` | Vercel + Render | Shared HMAC secret for runner auth |
| `CRON_SECRET` | Vercel | Protects `/api/cron/daily-scrape` |
| `BILLING_MOR_SECRET` | Vercel | Paddle/LemonSqueezy webhook HMAC secret |
| `BILLING_VN_SECRET` | Vercel | VNPay/MoMo webhook HMAC secret |
| `RUNNER_SECRET` | Render | Same as `CLAUDE_RUNNER_SECRET` |
| `SCRIPTS_DIR` | Render | `/app/scripts/scripts` (set in render.yaml) |

## Deploy workflow (team rule)

```
feat/* branch  →  Vercel Preview URL (does NOT touch production)
staging branch →  shared integration review before merge
main           →  Production deploy (protected branch, PR only)
```

**Quota rule:** Vercel Hobby = ~100 deploys/day. Batch all changes → ask → push once.

## Migrations (run once after deploy)

```bash
# 1. Backfill workspaceId: null → personal workspace for all users
curl -X POST https://jobradar.vercel.app/api/admin/migrate-workspaces \
  -H "Cookie: <admin session cookie>"

# 2. Delete blank-title Reddit jobs from before fix
curl -X POST https://jobradar.vercel.app/api/admin/cleanup-blank \
  -H "Cookie: <admin session cookie>"

# Or from browser console (logged in as admin):
fetch('/api/admin/migrate-workspaces', {method:'POST'}).then(r=>r.json()).then(console.log)
fetch('/api/admin/cleanup-blank',      {method:'POST'}).then(r=>r.json()).then(console.log)
```

## Cost report (run to set credit prices)

```bash
# Returns avg token cost per feature from real Usage logs
curl https://jobradar.vercel.app/api/admin/cost-report \
  -H "Cookie: <admin session cookie>"
```

Use output to set `FEATURE_CREDITS` in `lib/entitlements.ts`.

## Render runner

- Service: `jobradar-runner` (Docker, free tier)
- Exposes: `GET /scrape?templateId=X&config=<json>` (SSE), `GET /stop?runId=X`
- **Free tier sleeps after 15 min idle** → cold start ~50s. Upgrade to paid when revenue allows.
- Does NOT run Claude CLI anymore (M0 migration). Only Python scrapers.

## Webhook setup (billing)

### Paddle / LemonSqueezy
1. Dashboard → Webhooks → Add endpoint: `https://jobradar.vercel.app/api/billing/webhook-mor`
2. Events: `subscription.created`, `subscription.updated`, `subscription.renewed`, `subscription.cancelled`
3. Copy signing secret → `BILLING_MOR_SECRET` in Vercel env

### VNPay / MoMo
1. Set IPN URL: `https://jobradar.vercel.app/api/billing/webhook-vn`
2. Copy secret key → `BILLING_VN_SECRET` in Vercel env
3. Include `orderInfo` field with `email:<user_email>|plan:<personal|team>` format

## Tests

```bash
# Unit tests (no DB/network needed)
npm run test:unit

# E2E against production
TEST_BASE_URL=https://jobradar.vercel.app npm run test:e2e

# E2E with auth (authenticated tests)
TEST_BASE_URL=https://jobradar.vercel.app \
TEST_STORAGE_STATE=tests/auth.json \
npm run test:e2e
```
