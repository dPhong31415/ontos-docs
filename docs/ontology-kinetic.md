---
id: ontology-kinetic
title: Kinetic Layer (Action Engine)
sidebar_label: ⚡ Kinetic Layer
sidebar_position: 4
---

# Kinetic Layer — Action Engine

> **Đây là phần lõi nhất của platform.** Một định nghĩa action → tự thành REST + MCP tool + UI form. Đọc kỹ trang này.

---

## Vì sao Action là first-class

Trong app thường, "ghi data" rải khắp nơi: route này update Mongo, route kia check quyền, route nọ trừ credit — mỗi chỗ một kiểu, dễ quên, khó audit.

Ở đây, mọi thay đổi thế giới đi qua **Action Type** — một object trong ontology có schema rõ ràng. Khi action là **data có schema**, ta được 3 thứ free từ một định nghĩa:

```
                    ┌─→ REST   POST /apps/:app/actions/:name
action_type  ───────┼─→ MCP    tool :name  (parameter_schema = MCP input schema)
(1 định nghĩa)      └─→ UI     form         (Next.js codegen từ parameter_schema — M3+)
```

Và **entitlement + credit + audit** được enforce **đồng nhất** ở engine, không phải copy-paste vào từng route.

---

## Một action_type trông như thế nào

Ví dụ `deep_analyze` của jobradar:

```elixir
%ActionType{
  app: "jobradar",
  name: "deep_analyze",
  parameter_schema: %{
    "type" => "object",
    "required" => ["job_id"],
    "properties" => %{"job_id" => %{"type" => "string"}}
  },
  preconditions: [
    {:object_exists, "job_id"},
    {:property_eq, "job_id", "analyzed", true}
  ],
  effects: [
    {:call_llm, :deep_analysis, input: "$job_id"},
    {:update_object, "$job_id", set: %{"meta.deepAnalysis" => "$llm_result"}},
    {:emit_event, "job.deep_analyzed", %{"job_id" => "$job_id"}}
  ],
  required_entitlement: :can_deep_analysis,
  credit_cost: 2
}
```

→ Tự động: có endpoint `POST /apps/jobradar/actions/deep_analyze`, có MCP tool `deep_analyze`, agent thấy nó trong tool list, UI (sau) sinh được form. Quyền `can_deep_analysis` + trừ 2 credit + hoàn nếu lỗi: engine lo hết.

---

## Engine flow — `kinetic.Actions.invoke/4`

```
invoke(workspace, app, action_name, params, actor)

 1. RESOLVE   core.Ontology.action_type(app, action_name)
              không có → {:error, :unknown_action}

 2. VALIDATE  ExJsonSchema.validate(parameter_schema, params)
              sai → {:error, {:invalid_params, details}}   (chưa trừ gì)

 3. GATE      entitlements.check(workspace, required_entitlement)
              thiếu → {:error, {:upgrade_required, ent}}   (HTTP 402)
              credit.spend(workspace, credit_cost)
              hết → {:error, :insufficient_credits}        (HTTP 402)

 4. PRECOND   eval preconditions (object tồn tại? đúng status?)
              sai → refund + {:error, {:precondition, ...}}

 5. EFFECTS   Repo.transaction:
                run effects tuần tự (create/update object, link,
                call_function, call_llm)
              insert action_logs (before/after snapshot)
              emit events

 6. RESULT    {:ok, result}  → trả về + đẩy events lên Channel
    LỖI       rollback transaction + credit.refund + log error
```

**Quy tắc vàng:** chưa làm gì tốn kém thì chưa trừ credit (validate trước, trừ sau). Trừ rồi mà lỗi thì **luôn hoàn**. Đây chính là pattern entitlement của jobradar (`spendCredits`/`refundCredits`) nhưng nâng lên thành **một chỗ duy nhất** thay vì lặp trong mọi route.

---

## Effects DSL

Effects là danh sách lệnh khai báo, chạy tuần tự trong một transaction. Biến `$x` tham chiếu param hoặc kết quả bước trước.

| Lệnh | Tác dụng |
|------|----------|
| `{:create_object, type, props}` | Tạo object mới |
| `{:update_object, ref, set: map}` | Sửa props object |
| `{:delete_object, ref}` | Soft delete |
| `{:create_link, link_type, src, tgt}` | Nối 2 object |
| `{:call_function, name, args}` | Chạy function (vd tính matchPct) |
| `{:call_llm, type, opts}` | Gọi LLM gateway, kết quả vào `$llm_result` |
| `{:emit_event, type, payload}` | Phát domain event |
| `{:enqueue, worker, args}` | Đẩy Oban job (vd trigger scrape Python) |

> Tại sao DSL khai báo chứ không viết Elixir thẳng? Vì effects được **lưu trong ontology (data)** → thêm/sửa action không cần deploy core. Lệnh nào DSL chưa cover thì viết function Elixir rồi gọi qua `:call_function`.

---

## Ba đường vào cùng một engine

```
UI bấm nút        ─┐
Agent quyết định  ─┼─→ kinetic.Actions.invoke/4 ─→ Postgres + events
MCP tool ngoài    ─┘
```

Không có mutation nào đi cửa sau. Nhờ vậy:
- **Audit đầy đủ:** mọi thay đổi có row `action_logs` với before/after + actor.
- **Quyền đồng nhất:** agent hay user hay partner qua MCP đều bị check entitlement như nhau.
- **Realtime free:** mọi action emit events → Channel đẩy về client ngay.

---

## Liên hệ jobradar

Các mutation hiện rải trong route Next.js của jobradar (`/api/jobs/[id]/deep-analyze`, `choose`, `cover-letter`, `update status`...) → mỗi cái thành **một `action_type`**. Route Next.js sau này chỉ còn gọi `POST /apps/jobradar/actions/...`. Xem map đầy đủ ở [Map jobradar](./ontology-jobradar-mapping.md).
