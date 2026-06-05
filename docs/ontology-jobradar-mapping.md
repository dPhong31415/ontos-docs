---
id: ontology-jobradar-mapping
title: Map jobradar → Ontology
sidebar_label: 🔗 Map jobradar
sidebar_position: 6
---

# Map jobradar → Ontology

> Trang này chứng minh ontology **fit data thật của jobradar**, và mô tả cách chạy **shadow mode** để test không đụng production. Đây là app #1.

---

## Object Types

Map từ [Schema jobradar](./jobradar-schema.md). `User`, `Workspace`, `Membership` là primitive ở `core` (mọi app dùng chung). Còn lại là object type của app `jobradar`:

| jobradar model | Object Type | title_property | implements |
|----------------|-------------|----------------|------------|
| `JobTemplate` | `JobTemplate` | `requirementText` | — |
| `Job` | `Job` | `title` | `Trackable`, `Assignable` |
| `ProjectTask` | `ProjectTask` | `title` | `Trackable`, `Assignable` |
| `SeenJob` | `SeenJob` | `hash` | — |

`Subscription`, `CreditWallet`, `CreditLedger` → **không** thành object type; chúng là **primitive entitlement ở `core`** (mọi app cần billing như nhau). `RunLog` → thay bằng `action_logs`. `Usage` → thay bằng `llm_usage`. `AgentMemory`/`KeywordMemory` → `agent_memory` generic.

---

## Interfaces (chỗ reuse cross-app)

| Interface | property_schema | Job dùng | Object app khác cũng dùng |
|-----------|-----------------|----------|---------------------------|
| `Trackable` | `status: enum` | `applicationStatus` (tracking→...→offer) | cafe `Order`, hotel `Booking` |
| `Assignable` | `assignee_id` | `assigneeId` (Team plan) | mọi task/đơn giao người |

→ Board kéo-thả pipeline + dropdown giao việc viết **một lần** cho interface, jobradar và cafe xài chung component lẫn backend logic.

---

## Link Types

| Tên | source → target | cardinality |
|-----|-----------------|-------------|
| `generates` | `JobTemplate → Job` | one_to_many |
| `has_task` | `Job → ProjectTask` | one_to_many |
| `assigned_to` | `Job → User` | many_to_one |
| `task_assigned_to` | `ProjectTask → User` | many_to_one |

---

## Action Types

Mọi mutation/agent-tool hiện tại của jobradar → action_type. `parameter_schema` rút gọn, `entitlement`/`credit` theo bảng giá hiện tại:

| Action Type | Effects chính | entitlement | credit |
|-------------|---------------|-------------|--------|
| `extract_profile` | call_llm → trả profile draft | — | 0 |
| `generate_keywords` | call_llm → set `platformKeywords` | — | 0 |
| `create_template` | create_object `JobTemplate` | — | 0 |
| `trigger_scrape` | enqueue Oban → worker Python; emit `scrape.progress` | — | 0 |
| `analyze_jobs` | call_llm batch → set matchPct/action/moat... | Free chỉ 10 job | 0 |
| `deep_analyze` | call_llm → set `meta.deepAnalysis` | `can_deep_analysis` | 2 |
| `generate_cover_letter` | call_llm → tạo cover letter | `can_cover_letter` | 1 |
| `choose_job` | update `Job` set chosen; emit `job.chosen` | — | 0 |
| `skip_job` | update `Job` set notInterested | — | 0 |
| `update_status` | update `Job.applicationStatus` (Trackable) | — | 0 |
| `assign_job` | create_link `assigned_to` | `can_team` | 0 |
| `apply_feedback` | update template (keyword/hardNO) | — | 0 |

7 agent tool cũ (`search_jobs`, `get_job_detail`, `get_stats`, `get_templates`, `update_job_status`, `create_template`, `apply_feedback`) → `search_*`/`get_*` thành **query primitive** (đọc), còn lại thành **action_type** (ghi). Agent tự thấy chúng qua ontology.

---

## Functions

| Function | kind | Thay cho |
|----------|------|----------|
| `match_pct` | derived (AI ghi khi analyze) | `Job.matchPct` |
| `keyword_quality_score` | computed | `KeywordMemory.qualityScore` công thức |

---

## Scrape worker: giữ Python, core điều phối

Worker Python (LinkedIn/RemoteOK/Himalayas...) **không viết lại**. Core chỉ điều phối:

```
action trigger_scrape
  ↓ kinetic effect {:enqueue, ScrapeWorker, %{template_id, config}}
  ↓ Oban job (Elixir) gọi HTTP worker Python (Render)  ─── SSE ──┐
  ↓ worker scrape → stream từng job                              │
  ↓ Oban nhận job → upsert object `Job` (dedup theo url/hash)    │
  ↓ emit event scrape.progress  ───→ Phoenix Channel ───→ browser┘
```

Đổi so với hiện tại: thay vì Vercel route giữ SSE tới Render, **Oban** giữ kết nối (không lo timeout 300s của Vercel), và **Channel** đẩy progress. Logic scraper Python y nguyên.

---

## Shadow mode — test với data thật, không cutover

Mục tiêu: chạy core trên **data jobradar thật** để verify ontology đúng, **chưa** đổi production.

```
Giai đoạn 1 — READ shadow:
  Core đọc từ Mongo (qua adapter) → dựng object/link trong Postgres
  Đối chiếu: query "jobs applied" trên core vs trên Mongo phải khớp

Giai đoạn 2 — DUAL-WRITE:
  Khi user thao tác trên jobradar → app gọi CẢ Mongo (như cũ)
  VÀ POST action lên core. So sánh kết quả, log lệch.
  Production vẫn chạy bằng Mongo. Core chỉ "soi".

Giai đoạn 3 — CUTOVER (M3+, ngoài scope đợt này):
  Khi dual-write khớp ổn định → frontend jobradar trỏ thẳng core
  → tắt đường Mongo. Migrate data lịch sử Mongo → Postgres.
```

> Rủi ro thấp: nếu core sai, production jobradar vẫn nguyên vì vẫn chạy Mongo. Đây là lý do chọn "jobradar chạy song song" thay vì migrate thẳng.
