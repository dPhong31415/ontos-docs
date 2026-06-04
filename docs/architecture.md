---
id: jobradar-architecture
title: Architecture
sidebar_label: Architecture
sidebar_position: 2
---

# Architecture

## Deployment units

```
[ jobradar (Next.js 16) ]          → Vercel Pro
  app/          — App Router pages + API routes
  lib/          — models, agent, entitlements, byteplus
  middleware.ts — Clerk auth guard (all (app)/* routes)

[ scraper-worker ]                 → Render (Docker container)
  runner/server.py                 — HTTP: GET /scrape (SSE), GET /stop
  scripts/scripts/job_scraper.py   — generic multi-source scraper
  scripts/scripts/scrapers/        — per-source scrapers (14 sources)

[ MongoDB Atlas ]                  → shared DB
[ BytePlus ARK ]                   → LLM API (8 models, paid quota)
[ Clerk ]                          → authentication
```

## Request flow

```
Browser → Vercel (Next.js API)
         → BytePlus ARK          (LLM: analyze, chat, keyword-gen, deep)
         → MongoDB Atlas          (all data)
         → Render runner          (scrape trigger → SSE stream back)
           └→ Python scraper      (job_scraper.py → direct Mongo write)
```

## Key files

| File | Purpose |
|------|---------|
| `lib/entitlements.ts` | Single source of truth for tier limits + credit helpers |
| `lib/byteplus.ts` | LLM gateway: rotates 8 ARK models, logs Usage, retries on 429 |
| `lib/agent/graph.ts` | ReAct chat agent — handles onboarding + job search queries |
| `lib/agent/tools.ts` | Agent tools: search_jobs, get_stats, create_template, apply_feedback… |
| `lib/workspace.ts` | `getOrCreatePersonalWorkspace()` — every user has exactly one personal workspace |
| `lib/models/` | Mongoose schemas (15 models) |
| `app/api/billing/` | Webhook handlers for Paddle/LemonSqueezy + VNPay/MoMo |
| `app/api/admin/` | Cost report, subscriptions, migration, scrape monitor |

## Database models

| Model | Purpose |
|-------|---------|
| `User` | Clerk-linked user record |
| `Workspace` | Tenant — every user has a `personal` workspace; teams share one |
| `Membership` | User ↔ Workspace with role (owner/admin/member/viewer) |
| `Subscription` | Billing state per workspace (provider, plan, status, period end) |
| `CreditWallet` / `CreditLedger` | Credit balance + transaction log |
| `JobTemplate` | User's job search profile (skills, salary, keywords, sources) |
| `Job` | Scraped + AI-scored job (matchPct, action, deepAnalysis, applicationStatus) |
| `ScrapeRun` | One scrape session (status, progress, job counts) |
| `SeenJob` | Dedup hash per template — replaces `~/.job-seen-*.json` |
| `AgentMemory` | Per-template learned patterns (goodPatterns, userPatterns, reflections) |
| `KeywordMemory` | Per-keyword quality score (relevantJobs, appliedJobs → qualityScore) |
| `ProjectTask` | Per-job task breakdown (title, status, estimateHours) |
| `Share` | Shareable job bundle links with claim tracking |
| `Usage` | LLM token + cost log per call |
| `BlockedCompany` | Global + per-template company blocklist |

## Entitlement flow

```
route handler
  └→ getEntitlements(workspaceId)
       ├→ Workspace (plan type)
       ├→ Subscription (status, currentPeriodEnd)
       └→ CreditWallet (balance)
         → TierLimits { tier, maxAiScored, canDeepAnalysis, canCoverLetter, … }

Gated features:
  Free  → 10 job AI-score cap (meta.gated=true beyond), no deep/cover/tracker
  Personal+ → unlimited score, deep (2 credits), cover letter (1 credit)
  Team+ → share links, job assignment
  
402 response shape: { error, upgradeTo? | needCredits?: true }
```
