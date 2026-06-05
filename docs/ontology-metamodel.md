---
id: ontology-metamodel
title: Metamodel & Instance
sidebar_label: 🗄 Metamodel & Instance
sidebar_position: 3
---

# Metamodel & Instance

> Trang này giải thích **hai tầng dữ liệu: ontology (định nghĩa thế giới) và instance (data thật)**. Đọc phần "Hai tầng" trước.

---

## Hai tầng

Điểm cốt lõi của thiết kế Palantir: **schema cũng là data**.

- **Tầng ONTOLOGY (metamodel)** — định nghĩa "trong app này có những loại object nào, nối nhau ra sao, làm được action gì". Đây là **data trong bảng**, không phải code. Thêm app = thêm row, không deploy lại core.
- **Tầng INSTANCE** — object/link thật của user, multi-tenant theo `workspace_id`.

```
ONTOLOGY (cấu hình app)            INSTANCE (data user)
─────────────────────             ──────────────────────
apps                              objects     (object_type_id → object_types)
object_types                      links       (link_type_id   → link_types)
link_types                        action_logs (action_type_id → action_types)
action_types                      events
interfaces
functions
```

---

## Tầng Ontology (metamodel)

### `apps`

| Field | Ý nghĩa |
|-------|---------|
| `id` | |
| `slug` | `jobradar`, `cafe-manager`... |
| `name` | Tên hiển thị |

### `object_types` — "Object Type" của Palantir

| Field | Ý nghĩa |
|-------|---------|
| `app_id` | Thuộc app nào |
| `name` | Vd `Job`, `Order` |
| `property_schema` | JSON Schema mô tả các prop hợp lệ (type, required, enum) |
| `title_property` | Prop nào làm tiêu đề hiển thị (vd `title`) |
| `implements` | Mảng tên interface object này tuân theo: `["Trackable","Assignable"]` |
| `indexed_props` | Prop nào cần GIN index để query nhanh |

Ví dụ `property_schema` của `Job` (rút gọn):

```json
{
  "type": "object",
  "required": ["title", "url", "source"],
  "properties": {
    "title":   { "type": "string" },
    "company": { "type": "string" },
    "url":     { "type": "string", "format": "uri" },
    "source":  { "type": "string", "enum": ["linkedin","remoteok","himalayas"] },
    "matchPct":{ "type": "integer", "minimum": 0, "maximum": 100 },
    "status":  { "type": "string", "enum": ["tracking","applied","screening","interview","offer","rejected"] }
  }
}
```

### `link_types` — "Link Type"

| Field | Ý nghĩa |
|-------|---------|
| `app_id` | |
| `name` | Vd `generates`, `assigned_to` |
| `source_type_id` | Object type nguồn |
| `target_type_id` | Object type đích |
| `cardinality` | `one_to_one` / `one_to_many` / `many_to_many` |
| `inverse_name` | Tên chiều ngược (vd `assigned_to` ↔ `assignee_of`) |

### `interfaces` — "Interface" (global, cross-app)

| Field | Ý nghĩa |
|-------|---------|
| `name` | `Trackable`, `Assignable` — **không gắn app**, dùng chung mọi app |
| `property_schema` | Prop bắt buộc khi implement (vd `Trackable` cần `status`) |

Object type khai trong `implements` → core kiểm `property_schema` của nó phải thoả schema của interface. Nhờ đó UI/logic viết một lần cho interface dùng được cho mọi object implement nó.

### `action_types` — "Action Type" (lõi của Kinetic)

| Field | Ý nghĩa |
|-------|---------|
| `app_id` | |
| `name` | `choose_job`, `place_order`... |
| `parameter_schema` | JSON Schema cho tham số — **chính là MCP tool input schema** |
| `preconditions` | Điều kiện phải đúng trước khi chạy (vd object tồn tại, đúng status) |
| `effects` | DSL mô tả thay đổi: tạo/sửa object, tạo link, gọi function, gọi LLM |
| `required_entitlement` | Quyền cần có (vd `canDeepAnalysis`) — `null` nếu free |
| `credit_cost` | Số credit trừ khi chạy — `0` nếu free |

Chi tiết engine ở [Kinetic Layer](./ontology-kinetic.md).

### `functions` — "Function" (computed/derived)

| Field | Ý nghĩa |
|-------|---------|
| `app_id` | |
| `name` | `matchPct`, `quality_score`, `bill_total` |
| `kind` | `computed_property` (tính khi đọc) / `derived` (tính & lưu) |
| `impl_ref` | Trỏ tới Elixir module/expression thực thi |

---

## Tầng Instance (data thật)

### `objects`

| Field | Ý nghĩa |
|-------|---------|
| `id` | |
| `workspace_id` | **Tenant scope — mọi query bắt buộc filter field này** |
| `object_type_id` | Là loại gì |
| `properties` | JSONB — data thật, validate theo `property_schema` của type |
| `created_by` | User/agent tạo |
| `deleted_at` | Soft delete |
| `inserted_at` / `updated_at` | |

> GIN index trên `properties` theo các key khai trong `object_types.indexed_props`. Query kiểu `properties->>'status' = 'applied'` đi qua index, không scan toàn bảng.

### `links`

| Field | Ý nghĩa |
|-------|---------|
| `workspace_id` | |
| `link_type_id` | |
| `source_object_id` / `target_object_id` | |

### `action_logs` — audit + agent trace (thay `RunLog` của jobradar)

| Field | Ý nghĩa |
|-------|---------|
| `workspace_id` | |
| `action_type_id` | Action nào chạy |
| `actor_type` / `actor_id` | `user` / `agent` / `api` + id |
| `parameters` | Tham số đã truyền (đã validate) |
| `before` / `after` | Snapshot object trước/sau — replay & debug |
| `status` | `pending` → `running` → `done` / `error` |
| `credit_delta` | Trừ/hoàn bao nhiêu credit |
| `request_id` | Trace key xuyên log (như `Usage.requestId` của jobradar) |
| `error` | Nếu fail |

### `events` — domain event do action phát ra

| Field | Ý nghĩa |
|-------|---------|
| `workspace_id` | |
| `type` | `job.chosen`, `order.paid`, `scrape.progress`... |
| `payload` | Data kèm event |

`events` phục vụ 3 thứ: (1) realtime đẩy về Channel, (2) memory loop của agent học từ hành vi, (3) audit nghiệp vụ.

---

## Tại sao generic JSONB chứ không bảng riêng mỗi object type

| | Generic (chọn) | Bảng riêng mỗi type |
|---|---|---|
| Thêm object type | Thêm 1 row `object_types` | Phải migrate DDL, deploy |
| 100 app | 1 schema phục vụ hết | Hàng trăm bảng |
| Query phức tạp/đặc thù | Cần GIN index + đôi khi materialized view | Native, nhanh sẵn |

→ Chọn generic vì mục tiêu là **thêm app không cần deploy core**. Cái giá (query perf) trả bằng GIN index khai trong `indexed_props`, và **materialized view per-app** khi một app có query nặng đặc thù (làm sau, khi đo thấy chậm — đừng tối ưu sớm).
