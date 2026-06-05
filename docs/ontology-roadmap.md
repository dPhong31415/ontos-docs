---
id: ontology-roadmap
title: Roadmap & Build Order
sidebar_label: ✅ Roadmap
sidebar_position: 7
---

# Roadmap & Build Order

> Trang này là **bản đồ việc cần làm** để build core. Scope đợt này: **M0 → M2**. M3+ là tương lai, chỉ mô tả.

---

## Tổng quan

```
M0 Ontology engine   ░░░░░░░░░░  ⬜ metamodel + instance + CRUD validate
M1 Kinetic engine    ░░░░░░░░░░  ⬜ action: validate→entitlement→effect→audit
M2 AI + MCP          ░░░░░░░░░░  ⬜ LLM gateway + agent đọc ontology + MCP server
──────────────────── ranh giới scope đợt này ────────────────────
M3 Realtime+Cutover  ░░░░░░░░░░  ⬜ Channels đầy đủ + dual-write + cutover jobradar
M4 App SDK           ░░░░░░░░░░  ⬜ TS SDK codegen từ ontology
M5 App #2 (cafe)     ░░░░░░░░░░  ⬜ chứng minh: app mới = chỉ ontology + UI
```

**Scope đợt này (M0→M2)** đã chốt với user: dựng được core query object + chạy action + agent/MCP. **Chưa** cutover, chưa SDK, chưa app #2.

---

## M0 — Ontology engine

**Mục tiêu:** định nghĩa được ontology và lưu/đọc object đúng schema, multi-tenant.

- ⬜ Scaffold Elixir umbrella: `core`, `kinetic`, `agent`, `core_web`
- ⬜ Ecto migration tầng ontology: `apps`, `object_types`, `link_types`, `interfaces`, `action_types`, `functions`
- ⬜ Ecto migration tầng instance: `objects`, `links`, `action_logs`, `events` (+ GIN index trên `objects.properties`)
- ⬜ `core.Ontology` — load/describe object/link/action/interface types theo app
- ⬜ `core.Instances` — query/get object có **bắt buộc `workspace_id`**, validate props theo `property_schema` (ExJsonSchema)
- ⬜ Interface check: object type `implements` phải thoả `property_schema` của interface
- ⬜ Seed ontology jobradar (object types + interfaces + link types) như **dữ liệu khai báo**
- ⬜ Auth plug verify Clerk JWT → workspace context
- ⬜ REST đọc: `GET /apps/:app/objects/:type`, `GET /apps/:app/objects/:type/:id`

**Verify M0:** seed ontology jobradar → tạo vài `Job` object qua API → query theo `status` đi qua GIN index → tạo object thiếu field required bị reject đúng.

---

## M1 — Kinetic engine

**Mục tiêu:** chạy được action với validate + entitlement + credit + audit đồng nhất.

- ⬜ Port entitlement primitive ở `core`: `subscriptions`, `credit_wallets`, `credit_ledger` + `entitlements` (tier limits)
- ⬜ `kinetic.Actions.invoke/4` theo flow 6 bước (xem [Kinetic](./ontology-kinetic.md))
- ⬜ Effects DSL interpreter: `create_object`, `update_object`, `create_link`, `call_function`, `emit_event`, `enqueue`
- ⬜ `action_logs` before/after snapshot + `events` insert
- ⬜ Credit spend/refund pattern (port từ jobradar, gom về một chỗ)
- ⬜ REST chạy action: `POST /apps/:app/actions/:name`
- ⬜ Seed action_types jobradar không cần AI: `choose_job`, `skip_job`, `update_status`, `create_template`, `apply_feedback`

**Verify M1:** `POST choose_job` → object đổi đúng + có `action_logs` + emit `job.chosen`. Action có `credit_cost` mà ví hết → 402, không đổi data. Action lỗi giữa chừng → rollback + hoàn credit.

---

## M2 — AI + MCP

**Mục tiêu:** agent đọc ontology để reason, action AI chạy được, MCP expose ra ngoài.

- ⬜ Port LLM gateway: ARK rotation 8 model + `llm_usage` metering (từ `lib/byteplus.ts`)
- ⬜ Effect `call_llm` → gọi gateway, kết quả vào `$llm_result`
- ⬜ Seed action_types AI: `extract_profile`, `generate_keywords`, `analyze_jobs`, `deep_analyze`, `generate_cover_letter`
- ⬜ `agent` ReAct runtime: build system prompt từ `core.Ontology.describe(app)`, tools = action_types + query primitive
- ⬜ `agent_memory` generic + vòng Capture/Inject (Reflect để M3)
- ⬜ MCP server `/apps/:app/mcp`: `list_tools` (action_types) + `call_tool` (→ invoke)

**Verify M2:** gọi agent "tìm job remote match cao rồi choose 1 cái" → agent query + invoke `choose_job` đúng, có `llm_usage` + `action_logs`. Trỏ Claude Desktop vào MCP endpoint → thấy & gọi được tool.

---

## M3+ — Ngoài scope đợt này (chỉ mô tả)

| Milestone | Nội dung |
|-----------|----------|
| **M3 Realtime + Cutover** | Phoenix Channels đẩy `events` realtime (scrape progress, AI stream). `trigger_scrape` điều phối worker Python qua Oban. Shadow → dual-write → cutover frontend jobradar sang core. Migrate data Mongo→Postgres. Reflect loop (Oban scheduled). |
| **M4 App SDK** | Codegen TypeScript SDK từ ontology (typed client cho mỗi app). UI form auto-gen từ `parameter_schema`. |
| **M5 App #2 (cafe-manager)** | Định nghĩa ontology cafe (Order/Table/MenuItem, reuse `Trackable`/`Assignable`). Dựng Next.js app trên cùng core, **zero backend code**. Đây là phép thử thật của abstraction. |
| Sau nữa | Postgres RLS hardening, admin console quản lý ontology, GraphQL (Absinthe), marketplace ontology template |

---

## Thứ tự build đề xuất

```
1. Umbrella scaffold + Postgres + migration (M0)
2. core.Ontology + core.Instances + seed jobradar ontology
3. REST đọc → verify query/validate chạy
4. Entitlement primitive + kinetic.Actions.invoke + effects DSL (M1)
5. REST action + seed action non-AI → verify audit/credit
6. LLM gateway port + call_llm effect (M2)
7. agent ReAct đọc ontology + agent_memory
8. MCP server
→ DỪNG REVIEW. Sau đó mới M3 (realtime + cutover).
```

> Nguyên tắc tránh over-abstraction: M0→M2 build **trên ontology jobradar thật** (không phải ví dụ giả). Đến M5 mới thêm app #2 — lúc đó cái gì thật sự lặp lại giữa 2 app mới là core đúng. Đừng generic hoá thứ chỉ mới thấy ở 1 app.
