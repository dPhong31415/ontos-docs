---
id: ontology-agent-mcp
title: Agent & MCP
sidebar_label: 🤖 Agent & MCP
sidebar_position: 5
---

# Agent & MCP

> Trang này giải thích **AI layer: LLM gateway, agent đọc ontology để reason, và MCP server tự expose action**. Đây là phần "AI-first" làm nên khác biệt.

---

## Ontology chính là system prompt

Agent thường phải hardcode tool list + biết schema data. Ở đây, agent **đọc ontology lúc runtime**:

```
agent nhận request trong app "jobradar"
  ↓ core.Ontology.describe("jobradar")
      object_types  → "mày query được: Job, JobTemplate, ProjectTask..."
      action_types  → "mày làm được: analyze_jobs, choose_job, deep_analyze..."
      interfaces    → "Job là Trackable (có status pipeline)"
  ↓ build system prompt từ mô tả đó
  ↓ ReAct loop: reason → chọn action_type làm tool → invoke → quan sát → lặp
```

→ Thêm app mới hoặc thêm action mới, agent **tự biết**, không sửa code agent. Một agent runtime phục vụ mọi app.

---

## LLM Gateway (port từ jobradar `lib/byteplus.ts`)

Giữ nguyên thiết kế ARK rotation đã chạy tốt, viết lại bằng Elixir:

```
arkChat(messages, type, workspace_id)
  ↓ random chọn 1 trong 8 model ARK làm điểm bắt đầu
  ↓ gọi model; 429 (hết quota) → thử model tiếp
  ↓ tất cả 429 → {:error, :quota_exhausted}  + ALERT
  ↓ thành công → ghi llm_usage (tokensIn/Out, cost, latency, modelId)
```

8 model rẻ→đắt: `seed-2-0-lite`, `deepseek-v4-flash`, `seed-1-8`, `glm-4-7`, `deepseek-v3-2`, `seed-2-0-mini`, `seed-2-0-pro`, `deepseek-v4-pro`.

**`llm_usage` table** (port `Usage` của jobradar) — nguồn sự thật để kiểm soát token/cost:

| Field | Ý nghĩa |
|-------|---------|
| `request_id` | Trace key (khớp `action_logs.request_id`) |
| `workspace_id` | Tenant |
| `type` | `prompt_extract` / `analyze` / `deep_analysis` / `cover_letter` / `chat` |
| `model_id` | Model thực dùng sau rotation |
| `model_attempts` | >1 nghĩa là có model bị 429 |
| `tokens_in` / `tokens_out` / `cache_tokens` | |
| `cost_usd` | Tính theo giá model (đã trừ giá cache) |
| `latency_ms` / `success` / `error` | |

> Khác biệt quan trọng so với jobradar cũ: LLM **không gọi mutation thẳng**. Agent muốn thay đổi data → phải gọi `kinetic.Actions.invoke`. Nhờ vậy hành động của AI cũng bị audit + entitlement + credit như user.

---

## Agent runtime (ReAct)

Port `lib/agent/graph.ts` của jobradar, tổng quát hoá:

```
loop (tối đa N bước):
  reason  → LLM với system = ontology describe + lịch sử
  act     → chọn:
             • query object   → core.Instances.query (đọc, free)
             • run action      → kinetic.Actions.invoke (ghi, có thể tốn credit)
  observe → đưa kết quả vào context
  đến khi LLM trả lời cuối / hết bước
```

**Tools của agent = `action_types` của app + vài query primitive.** Không cần khai tool thủ công. jobradar's `search_jobs`, `update_job_status`, `create_template`, `apply_feedback`... đều trở thành action_type và tự xuất hiện.

---

## MCP Server

Cùng một `action_types` → expose qua MCP để **agent/tool bên ngoài** (Claude Desktop, partner, app khác) dùng được:

```
GET/POST /apps/:app/mcp
  list_tools  → mỗi action_type thành 1 MCP tool
                 { name, description, inputSchema: parameter_schema }
  call_tool   → kinetic.Actions.invoke(...)  (cùng engine, cùng audit/quyền)
```

Vì `parameter_schema` của action **chính là** JSON Schema mà MCP `inputSchema` cần, không phải dịch gì cả. Định nghĩa action một lần → REST có, agent nội bộ có, MCP ngoài có.

> Bảo mật: MCP call mang theo workspace token → bị entitlement + credit như mọi đường khác. Partner không vượt quyền được.

---

## Agent Memory (tổng quát hoá)

jobradar có `AgentMemory` + `KeywordMemory` (học từ skip/apply). Ở platform, memory **gắn theo workspace + object type**, không riêng cho job:

| Vòng | Làm gì | Trạng thái |
|------|--------|-----------|
| **Capture** | Sau mỗi action/skip, ghi pattern vào `agent_memory` (đọc từ `events`) | Có ở M2 |
| **Inject** | Trước khi reason, chèn memory liên quan vào system prompt | Có ở M2 |
| **Reflect** | Oban scheduled job review events → cập nhật pattern, prune cái kém | M3+ |

Nhờ generic, một cafe-manager cũng tự học ("bàn 4 hay đặt món X", "giờ cao điểm 19h") qua đúng cơ chế, không viết lại.

---

## Liên hệ jobradar

`lib/byteplus.ts` (gateway) và `lib/agent/graph.ts` (ReAct) là thứ port sớm nhất vì đã có sẵn và độc lập domain. 7 tool hiện tại của jobradar map 1-1 sang action_type/query — xem [Map jobradar](./ontology-jobradar-mapping.md).
