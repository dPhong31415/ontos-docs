---
id: jobradar-api
title: API Reference
sidebar_label: API Reference
sidebar_position: 3
---

# API Reference

All routes require Clerk session (cookie) unless marked **public**.

## Jobs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/jobs` | List jobs (filters: templateId, action, track, search, page) |
| GET | `/api/jobs/stats` | Stats counts (total, analyzed, top, unanalyzed, skip, deep) |
| PATCH | `/api/jobs/[id]` | Update job (applied, notInterested, applicationStatus, assigneeId…) |
| DELETE | `/api/jobs/[id]` | Delete job |
| GET | `/api/jobs/[id]/deep` | SSE — run deep analysis (2 credits, personal+ only) |
| POST | `/api/jobs/[id]/propose` | SSE — generate cover letter + pricing (1 credit, personal+ only) |
| GET/POST/PATCH/DELETE | `/api/jobs/[id]/tasks` | Project tasks CRUD (personal+ only) |
| POST | `/api/jobs/import` | Bulk import jobs by URL list |
| POST | `/api/jobs/import-url` | SSE — import + analyze + deep one URL |
| POST | `/api/jobs/bulk` | Bulk update (applied, notInterested, action) |

## Templates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/templates` | List templates for current user |
| POST | `/api/templates` | Create template |
| GET/PATCH/DELETE | `/api/templates/[id]` | CRUD |
| POST | `/api/templates/[id]/feedback` | Chat feedback → refine template (filter jobs, add keywords) |

## Scrape + Analyze

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scrape/trigger` | Enqueue scrape for a template |
| GET | `/api/scrape-stream` | SSE stream from Render runner |
| POST | `/api/scrape/stop` | Stop active scrape |
| GET | `/api/scrape/runs` | List scrape runs |
| GET | `/api/analyze/[templateId]` | SSE — score unanalyzed jobs with AI |

## Chat + Keywords

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | SSE — Radar chat agent (onboarding + job queries) |
| POST | `/api/keywords/generate` | Generate platform-optimized keywords from template |

## Billing

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/billing/webhook-mor` | **public** | Paddle/LemonSqueezy webhook (HMAC-SHA256) |
| POST | `/api/billing/webhook-vn` | **public** | VNPay/MoMo webhook (HMAC-SHA256) |
| GET | `/api/billing/credits` | session | Current credit balance + ledger |
| POST | `/api/billing/credits` | admin | Manual credit grant |

## Share (public preview)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/share/[token]` | optional | Preview share + hasClaimed flag |
| POST | `/api/share/[token]` | required | Claim job bundle / template |
| DELETE | `/api/share/[token]` | owner | Revoke share |

## Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/monitor` | Global scrape/usage monitor |
| GET | `/api/admin/subscriptions` | All subscriptions with credit balances |
| GET | `/api/admin/cost-report` | Real token costs per feature from Usage collection |
| POST | `/api/admin/migrate-workspaces` | Backfill `workspaceId: null` → personal workspace |
| POST | `/api/admin/cleanup-blank` | Delete blank-title Reddit tracker jobs |

## Error shapes

```json
// Entitlement gate
{ "error": "Deep analysis requires a paid plan", "upgradeTo": "personal" }
// 402

// Credit gate
{ "error": "Insufficient credits", "needCredits": true }
// 402

// Auth
{ "error": "Unauthorized" }
// 401
```
