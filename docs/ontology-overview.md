---
id: ontology-overview
title: Ontology Platform — Tổng quan
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# Ontology Platform — Tổng quan

> Đọc trang này đầu tiên. Nó giải thích **platform này là gì, tại sao tách khỏi jobradar, và bức tranh 100-app** trước khi đọc các trang kỹ thuật.

---

## Vấn đề đang giải quyết

jobradar là app đầu tiên. Nhưng phần lõi của nó — AI agent, multi-tenant, billing/credit, một "đối tượng" có pipeline status, một agent đọc data rồi hành động — **không có gì riêng cho ngành tuyển dụng**. Quản lý cafe, nhà hàng, khách sạn, hay bất kỳ utility nào cũng cần đúng những thứ đó.

Nếu cứ build từng app Next.js riêng, mỗi app tự làm lại auth + billing + agent + schema → **ra 100 app rồi quản lý xỉu**. Mỗi lần sửa logic core phải sửa 100 chỗ.

**Platform này làm gì:** một **backend core duy nhất** khái quát hoá mọi domain về **objects / links / actions**. Bên trên, mỗi app chỉ là **UI Next.js + một định nghĩa ontology** — không viết lại backend. Sửa core một lần, 100 app hưởng.

---

## Tư tưởng: thiết kế theo Palantir Ontology

Palantir Foundry/AIP tách thế giới làm 3 lớp. Ta mượn nguyên mô hình đó:

| Palantir | Ở đây | jobradar | cafe-manager |
|----------|-------|----------|--------------|
| **Object Type** | Node Type | Job, JobTemplate | Order, Table, MenuItem |
| **Property** | Props (JSONB) | salary, matchPct | price, status |
| **Link Type** | Edge (typed, có cardinality) | `Job → assigned_to → User` | `Order → at → Table` |
| **Action Type** | Mutation có validate | analyze_job, choose_job | place_order, mark_paid |
| **Function** | Computed/derived prop | matchPct, qualityScore | tổng bill |
| **Interface** | Abstraction xài chung | `Trackable` | `Trackable` |

**Insight ăn tiền nhất — Action Type là first-class.** Không phải "code mutation rải khắp route", mà là một object có `parameter_schema`, validation, effects, permission. Khi Action là **data có schema**, một định nghĩa tự sinh ra cả 3 mặt:

```
Action Type "choose_job"
   ├──→ REST:  POST /apps/jobradar/actions/choose_job
   ├──→ MCP:   tool choose_job   (schema lấy thẳng từ parameter_schema)
   └──→ UI:    form/button        (Next.js codegen — M3+)
```

→ AI agent **không đọc data trực tiếp rồi đoán**. Nó đọc ontology ("đây là object types mày query được, đây là actions mày làm được") rồi reason. **Ontology chính là system prompt của agent.** Thêm app mới = thêm ontology definition, không viết backend mới.

---

## "Interface" — chỗ reuse thật sự

Đây là lý do làm 100 app mà không viết lại UI lẫn backend logic. Định nghĩa interface **`Trackable`** (có pipeline status) một lần:

```
interface Trackable { status: enum }

jobradar:  Job   implements Trackable  → board  tracking→applied→interview→offer
cafe:      Order implements Trackable  → board  pending→cooking→served→paid
hotel:     Booking implements Trackable → board  held→confirmed→checked_in→out
```

→ **Cùng một React board component, cùng một backend logic chuyển status.** App con chỉ map object type của nó vào interface. Đó là khái quát hoá đúng nghĩa — không phải "mọi thứ là node mơ hồ", mà là "mọi thứ implement một số interface chuẩn".

---

## Tại sao Elixir / Phoenix

| Nhu cầu của platform | Elixir đáp ứng |
|----------------------|----------------|
| Realtime (scrape progress, AI token stream) | Phoenix Channels — sinh ra để làm việc này |
| Background job lâu, fail-safe (scrape 10–30 phút) | OTP supervision + Oban, thay con Render worker đứng riêng |
| Multi-tenant nhiều app cùng lúc | BEAM concurrency, mỗi request rẻ |
| Một codebase phục vụ N app | Umbrella project, ranh giới rõ |

Khác với Palantir thật (là **semantic layer federate** nhiều nguồn data), platform này đơn giản hơn: **core CHÍNH LÀ system of record** — data nằm thẳng trong Postgres của core. Không có lớp federation/pipeline.

---

## Quan hệ với jobradar

jobradar **không bị vứt đi**. Nó là **app #1** để chứng minh ontology hoạt động với data thật:

- Core chạy **shadow mode**: đọc/ghi song song với MongoDB hiện tại của jobradar, đối chiếu kết quả, **chưa cutover** production.
- Scrape worker Python **giữ nguyên** — core chỉ điều phối nó qua action `trigger_scrape`.
- Khi shadow chạy ổn → cutover frontend jobradar sang gọi core (M3+).

Xem chi tiết ở [Map jobradar → ontology](./ontology-jobradar-mapping.md).

---

## Đọc tiếp theo thứ tự

1. [Kiến trúc tổng thể](./ontology-architecture.md) — umbrella, các lớp, stack
2. [Metamodel & Instance](./ontology-metamodel.md) — bảng ontology + data, Ecto schema
3. [Kinetic Layer](./ontology-kinetic.md) — action engine (phần lõi nhất)
4. [Agent & MCP](./ontology-agent-mcp.md) — AI đọc ontology, MCP auto-expose
5. [Map jobradar](./ontology-jobradar-mapping.md) — proof với data thật
6. [Roadmap](./ontology-roadmap.md) — M0→M2 build order + tương lai
