---
id: ontology-architecture
title: Kiến trúc tổng thể
sidebar_label: 🏗 Kiến trúc
sidebar_position: 2
---

# Kiến trúc tổng thể

> Trang này giải thích **các thành phần của core, chúng xếp thành lớp thế nào, và stack công nghệ**. Đọc trước khi đụng vào metamodel.

---

## Bức tranh toàn cảnh

```
┌──────────────────────────────────────────────────────────────┐
│  N App con (Next.js) — Vercel                                 │
│  jobradar · cafe-manager · hotel-manager · ...                │
│  Chỉ UI + ontology definition. Không có backend riêng.        │
└───────────────┬──────────────────────────────────────────────┘
                │  REST / MCP / WebSocket (Channel)
                │
┌───────────────▼──────────────────────────────────────────────┐
│  ONTOLOGY CORE (Elixir umbrella) — Fly.io / Render            │
│                                                                │
│   core_web   Phoenix API: REST + Channels + MCP endpoint      │
│      │                                                         │
│   agent      LLM gateway (ARK) · ReAct runtime · MCP server   │
│      │                                                         │
│   kinetic    Action engine: validate→entitlement→effect→audit │
│      │                                                         │
│   core       Ontology engine (metamodel) + Instance store     │
│              + multi-tenancy + entitlements/credit            │
└───────┬───────────────────────────┬──────────────────────────┘
        │                           │
   ┌────▼─────┐              ┌───────▼────────┐
   │ Postgres │              │ BytePlus ARK   │
   │ 16 JSONB │              │ (LLM, 8 model) │
   └──────────┘              └────────────────┘
        ▲
        │ điều phối qua Oban + Channel
   ┌────┴──────────────────┐
   │ Worker ngoài (Python) │  ← scrape của jobradar, giữ nguyên
   └───────────────────────┘
```

---

## Umbrella: 4 app

Một Elixir umbrella project, 4 app con với ranh giới rõ (app trên import app dưới, **không** import ngược):

| App | Trách nhiệm | Không làm |
|-----|-------------|-----------|
| `core` | Metamodel (object/link/action/interface/function types), instance store (objects/links), multi-tenancy, entitlements/credit | Không biết HTTP, không biết LLM |
| `kinetic` | Thực thi action: validate params → check entitlement + spend credit → effects (transaction) → audit + emit events | Không tự định nghĩa action (đọc từ `core`) |
| `agent` | LLM gateway (ARK rotation + Usage metering), ReAct runtime, MCP server, agent memory | Không tự chạy mutation (gọi `kinetic`) |
| `core_web` | Phoenix endpoint: REST resource + action invocation, Channels realtime, MCP HTTP, auth plug | Không chứa business logic (mỏng) |

**Tại sao tách `kinetic` khỏi `core`:** `core` là "biết cái gì tồn tại" (đọc), `kinetic` là "thay đổi thế giới" (ghi có kiểm soát) — đúng tách semantic/kinetic của Palantir. Mọi mutation đi qua `kinetic` để audit + entitlement đồng nhất.

---

## Các lớp & data flow

```
Đọc (query object):
  core_web → core.Instances.query(workspace, object_type, filter)
           → Postgres (JSONB + GIN index)

Ghi (chạy action):
  core_web / agent / MCP
     → kinetic.Actions.invoke(workspace, action_type, params, actor)
         1. core.Ontology.action_type(app, name)      ← định nghĩa
         2. validate(params, parameter_schema)         ← ExJsonSchema
         3. entitlements.check + credit.spend          ← uniform
         4. effects (tạo/sửa object, link, gọi function, gọi LLM)
         5. action_logs insert + events emit           ← audit + realtime
         6. lỗi → credit.refund + rollback transaction
```

Mọi đường ghi — UI bấm nút, agent quyết định, MCP tool bên ngoài — **đều chui qua một cửa `kinetic.Actions.invoke/4`**. Không có mutation nào đi cửa sau.

---

## Multi-tenancy

- **Một Postgres dùng chung.** Mỗi instance row có `workspace_id`. Mỗi object type có `app_id`.
- Scoping ép ở **một chỗ duy nhất**: query helper trong `core` luôn nhận `workspace_id`, không có API query "trần".
- `apps` (jobradar, cafe...) tách logic theo `app_id`; `workspaces` tách tenant theo người dùng — hai trục độc lập.
- **Hardening sau (M3+):** Postgres Row-Level Security làm lớp chặn thứ hai, phòng bug app-level.

> Quyết định: **core là system of record**, không federate. Đơn giản, đúng cho greenfield. Nếu sau này cần nối nguồn data ngoài thì thêm lớp adapter, không phá metamodel.

---

## Stack

| Hạng mục | Lựa chọn | Lý do |
|----------|----------|-------|
| Ngôn ngữ/runtime | Elixir 1.17 / OTP 27 | concurrency, fault-tolerance |
| Web | Phoenix 1.7 | REST + Channels chung 1 framework |
| DB | Postgres 16 (JSONB + GIN) | object props schema-less + index được |
| Background job | Oban | scrape orchestration, scheduled reflection |
| Realtime | Phoenix Channels | thay SSE/Render worker đứng riêng |
| Validate | ExJsonSchema | parameter_schema & property_schema |
| LLM HTTP | Req | gọi ARK, retry, rotation |
| Auth | Clerk JWT (verify plug) | port từ jobradar |

GraphQL (Absinthe) và SDK codegen để **sau** — REST + Channels đủ cho M0→M2.

---

## Hosting

- Core: Fly.io hoặc Render (Docker, có volume cho Postgres hoặc managed PG).
- Postgres: managed (Neon/Supabase/Fly PG).
- Worker Python (jobradar scrape): giữ nguyên trên Render, core gọi qua HTTP.
- App con: Vercel (như jobradar hiện tại).
