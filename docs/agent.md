---
id: jobradar-agent
title: AI Agent & Memory
sidebar_label: AI Agent & Memory
sidebar_position: 5
---

# AI Agent & Memory

jobradar's differentiator: a **self-improving agentic system** that learns from user behavior.

## LLM setup

All LLM calls go through `lib/byteplus.ts` (BytePlus ARK):
- 8 models in rotation (`seed-2-0-lite`, `deepseek-v4-flash`, `glm-4-7`, `seed-2-0-pro`, …)
- Automatic retry on `429` (quota exceeded) → tries next model
- Every call logs a `Usage` record (tokensIn, tokensOut, costUsd, latencyMs)
- **No Claude CLI** — fully serverless-compatible (M0 migration)

## Chat agent (Radar)

`lib/agent/graph.ts` — ReAct loop, max 3 tool calls per turn.

### Onboarding mode (no template)
When a user has no template, Radar switches to onboarding mode:
1. Asks conversational questions (role, skills, exp, salary, remote, languages, hardNO)
2. Calls `create_template` tool → creates `JobTemplate`
3. Suggests next step: generate keywords → scrape

### Tools available

| Tool | Purpose |
|------|---------|
| `search_jobs` | Filter + search job DB (action, source, match%, query) |
| `get_job_detail` | Full details of one job |
| `get_stats` | Pipeline counts (total/analyzed/top/unanalyzed) |
| `get_templates` | List user's templates |
| `update_job_status` | Mark applied/not-interested |
| `create_template` | Create job search profile from onboarding answers |
| `apply_feedback` | Refine search: filter patterns, add keywords, add hardNO |

### MCP surface (post-MVP)
The same tools will be exposed as an MCP server at `/api/mcp` so external agents can drive jobradar.

## Self-improving memory loop

### Data captured

| Model | What's stored |
|-------|--------------|
| `AgentMemory` | goodPatterns, badPatterns, sourceInsights, userPatterns, reflections |
| `KeywordMemory` | Per-keyword: totalJobsFound, relevantJobs, appliedJobs, skippedJobs → qualityScore |

### How it learns

1. **Capture** — every apply/skip/choose/feedback event:
   - Updates `KeywordMemory.qualityScore` = `(relevantJobs×2 + appliedJobs×5) / totalJobsFound`
   - `apply_feedback` tool persists patterns to `AgentMemory.userPatterns` / `badPatterns`

2. **Inject** — next keyword generation reads `AgentMemory` into the prompt:
   - Good patterns → search for similar
   - Bad patterns → avoid / add to hardNO suggestions
   - Source insights → prioritize better sources

3. **Reflect** (post-MVP scheduled job) — after each scrape cycle:
   - Re-examines recently skipped jobs against updated user patterns
   - Prunes low-quality keywords (`qualityScore < 0.1` after 3+ runs)
   - Writes a `reflections` entry: "added 3 TouchDesigner keywords, quality +18%"

### Token cost
Memory injection adds ~500–2k tokens per keyword-gen call (~$0.0005 extra at ARK prices). Worth it.
