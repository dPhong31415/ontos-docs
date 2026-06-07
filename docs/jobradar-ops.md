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

## Render worker (runner)

Python HTTP server (`runner/server.py`) — chạy scrapers + fetch URL cho `/api/jobs/import-url`. Không còn Claude CLI.

| Thuộc tính | Giá trị |
|-----------|---------|
| Service name | **`jobradar`** (KHÔNG phải `jobradar-runner`) |
| Service ID | `srv-d8fame7avr4c73a33kog` |
| URL | `https://jobradar-0201.onrender.com` → set vào `CLAUDE_RUNNER_URL` |
| Runtime | **`node` (native)** — KHÔNG phải Docker. `runner/Dockerfile` **bị bỏ qua**. |
| Plan | free (ngủ sau 15' idle → cold start ~50s) |
| Endpoints | `GET /` (health), `GET /scrape` (SSE), `GET /stop`, `GET /fetch-url?url=` |
| Auth | header `x-runner-secret` = `CLAUDE_RUNNER_SECRET` |

### ⚠️ Cấu hình build/start ĐÚNG (đừng sửa sai lại)

Vì runtime là **node** nhưng app là **Python**, hai lệnh này phải set tay trong Render → Settings:

```
Build Command:  pip install -r runner/requirements.txt
Start Command:  python runner/server.py
```

**Lỗi cũ đã từng làm runner chết nhiều ngày (`x-render-routing: no-server`):**
- `startCommand: python server.py` — SAI, file ở `runner/server.py` không phải root → start fail → deploy `update_failed` → không có instance live.
- `buildCommand: npm install; npm run build` — build Next.js vô nghĩa cho runner Python, không cài được `requests`/`cloudscraper`.

> `server.py` chỉ import stdlib ở top (kể cả `sys`) nên server tự bind port được; deps nặng import lazy trong handler. Build chỉ cần `pip install`.

### Quản runner qua Render API (không cần vào dashboard)

`RENDER_API_KEY` lưu trong `jobradar/.env.local` (gitignored).

```bash
KEY=$RENDER_API_KEY; SID=srv-d8fame7avr4c73a33kog
# trạng thái + URL
curl -s -H "Authorization: Bearer $KEY" https://api.render.com/v1/services/$SID
# deploy gần nhất (coi update_failed = start fail)
curl -s -H "Authorization: Bearer $KEY" "https://api.render.com/v1/services/$SID/deploys?limit=5"
# sửa build/start command
curl -s -X PATCH -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  https://api.render.com/v1/services/$SID \
  -d '{"serviceDetails":{"envSpecificDetails":{"buildCommand":"pip install -r runner/requirements.txt","startCommand":"python runner/server.py"}}}'
# trigger deploy (clear cache)
curl -s -X POST -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  https://api.render.com/v1/services/$SID/deploys -d '{"clearCache":"clear"}'
```

### Import URL — 3 lớp fetch (`lib/extract-job-url.ts`)

1. **Layer 1** — Next.js `fetch()` trực tiếp (UA giả browser). Site thường ăn ngay.
2. **Layer 2** — runner `/fetch-url` (`cloudscraper`, vượt Cloudflare v1/v2). Reddit/X bỏ qua bước này, dùng context từ URL.
3. **Layer 3** — fallback: chỉ đưa URL cho AI tự đoán (khi cả 2 lớp trên fail).

**Đã verify (06/06):** WeWorkRemotely, Hacker News → lấy được nội dung. **Upwork + RemoteOK chặn login+CF Turnstile → cloudscraper không qua → rớt Layer 3.** Với mấy site này, cách chắc ăn là user **paste thẳng text job** (route `import-url` nhận field `rawText`), không dựa vào fetch URL.

> Đã cân nhắc thêm Playwright + Chromium cho Layer 2 để crack Upwork, nhưng free tier 512MB build OOM → bỏ. Muốn Upwork ổn định phải nâng Render lên Starter (2GB) + cài Playwright.

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
