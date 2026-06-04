---
id: jobradar-overview
title: jobradar — Overview
sidebar_label: Overview
sidebar_position: 1
---

# jobradar

AI-powered job intelligence SaaS. Multi-tenant, chat-first, agentic.

**Live:** [jobradar.vercel.app](https://jobradar.vercel.app)  
**Stack:** Next.js 16, MongoDB Atlas, BytePlus ARK (LLM), Clerk (auth), Render (scraper worker)

---

## What it does

1. User describes what they're looking for in a **single chat** → agent builds a job search profile (template)
2. Agent generates **platform-optimized keywords** (per source: LinkedIn, RemoteOK, Himalayas, Indeed, Reddit…)
3. Scraper worker pulls live jobs → Claude **AI-scores each job** (match %, action recommendation, skill gaps)
4. User sees **recommendation cards** (grid or list) with Skip / Choose actions
5. Chosen jobs go to **Project Tracker** with per-job task breakdown + status pipeline
6. **Self-improving**: every skip/apply/feedback updates `AgentMemory` + `KeywordMemory` → next run is smarter

---

## Monetization model

| Tier | Price | What's included |
|------|-------|-----------------|
| **Free** | $0 | 1 template, 3 keyword regens, AI score for first 10 jobs, basic market research |
| **Personal** | ~$9–12/mo | Unlimited scoring, deep analysis, cover letter/proposal, source presets, project tracker |
| **Team** | ~$29–49/mo/seat | Personal + share links, job assignment |

**Plus:** credit packs for à-la-carte deep analysis / cover letters (`1 credit = $0.01`).

Payments: **Paddle/LemonSqueezy** (international, MoR) + **VNPay/MoMo** (Vietnam domestic).
