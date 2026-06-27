---
id: misk-ops
title: MÍSK Ops — Internal PM
sidebar_label: 🗂️ MÍSK Ops (PM)
sidebar_position: 9
---

# MÍSK Ops — Internal Project Management

> App nội bộ quản lý job từ **lead → order → production → deliverable → paid**.
> Sống tại `frontend/jobradar/app/(app)/tracker`. Đây là **ops cockpit** của studio: vừa CRM nhẹ, vừa PM, vừa sổ cái tiền vào/ra.
> Doc này dành cho dev: kiến trúc data + các view + ref UI cho từng view.

---

## 0. Nguyên tắc kiến trúc (đọc trước khi code)

1. **Một entity sống suốt vòng đời — stage chỉ là 1 cột status.** KHÔNG copy row giữa các bảng (lead→order→project). Một `project` ra đời từ lúc là lead và sống tới lúc paid.
2. **"Đơn hàng" và "Project" là CÙNG 1 row, nhìn qua 2 lăng kính.** Đơn hàng = lăng kính tiền. Project = lăng kính sản xuất. Không tạo 2 nguồn data.
3. **Tách bảng theo _concern_ (việc gì), không theo _stage_ (lúc nào).** Mỗi concern (task, asset, deliverable, payment) là 1 bảng riêng treo vào `project` qua FK.
4. **Dashboard là _view_, không phải storage.** Gộp ở UI thoải mái, đừng gộp ở DB.
5. **Ledger chỉ đọc khi `deal_stage = won`.** Lead là pre-revenue, không đụng sổ tiền.
6. **KHÔNG nhồi mọi thứ vào 1 cột `stage`.** Tách **4 trục độc lập** (đúng SOTA — HubSpot tách lifecycle≠deal stage, Linear tách project status≠issue status, xem §8): `deal_stage` (bán hàng) · `prod_status` (sản xuất) · `payment_state` (DERIVED từ payments) · `health` (DERIVED từ due vs progress). Tiền & sức khoẻ là **suy ra**, không phải stage gõ tay.

```
        ┌──────────── 1 PROJECT (spine) ─────────────────────┐
        │ #ICCE3D · client · deal_stage · prod_status · net · │
        │ due · [payment_state ⟵derived] · [health ⟵derived]  │
        └──┬─────┬──────────┬───────────┬──────────┬──────────┘
           │     │          │           │          │
        lead   quote     task[]      asset[]   deliverable[]   payment[]
        info  (line     (assignee,  (moodboard, (file, ver,    (milestone,
              items)    status,%)    ref, link)  approval,      đã thu)
                                                  revision)
```

---

## 1. Data model

### `project` (spine)
| Field | Type | Ghi chú |
|---|---|---|
| `id` | string | mã ngắn `#ICCE3D` |
| `title` | string | "Hazel Clarke — Full set (birds)" |
| `client_id` | FK → client | |
| `source` | enum | `upwork`/`reddit`/`twine`/`manual`/`referral` — **canonical cho win-rate** (khác `client.source` = gốc khách) |
| `deal_stage` | enum | **bán hàng:** `lead → contacted → quoting → proposal_sent → won / lost` (Leads view) |
| `prod_status` | enum | **sản xuất (chỉ sau won):** `not_started → in_production → in_review → delivered` (Projects view). `null` khi chưa won |
| `payment_state` | DERIVED | `unpaid / partial / paid` — suy từ bảng `payment`, KHÔNG lưu tay |
| `health` | DERIVED | `on_track / at_risk / late` — suy từ `due_at` vs progress% (Linear-style) |
| `est_amount` | number | giá ước lúc lead (chưa có quote) |
| `contract_amount` | number | = `quote.total` lúc accepted; chốt-1-lần khi won |
| `net_amount` | number | = `contract_amount − fee` (net thực sau Upwork/VAT/PIT) |
| `currency` | enum | `USD` / `VND` |
| `due_at` | date | |
| `thumbnail` | string | |
| `created_at` / `updated_at` | date | |
| `stage_entered_at` | date | "đứng stage này bao lâu" → flag lead nguội |

**💰 Luật tiền (single source of truth — tránh 3 màn 3 số):**
- Lead chưa quote → hiển thị `est_amount` ("~$X").
- Quote accepted → `contract_amount = quote.total`; khi `deal_stage=won` set `net_amount = contract_amount − fee`.
- **Ràng buộc:** `SUM(payment.amount) === contract_amount`; `payment_state` = paid khi đủ, partial khi 1 phần.
- **3 con số chuẩn dùng toàn app:** Đã chốt = `SUM(net WHERE won)` · Đã thu = `SUM(payment WHERE paid)` · **AR = Đã chốt − Đã thu**.
- Revenue split chia trên **net** (sau fee, 2 người cùng gánh phí); tính từ **độ khó × người làm ở cây deliverable** (§1.1), không gõ tay.

### `client`
`id, name, company, source, contact (email/upwork), notes, tags`

### `quote` (stage lead→won)
`id, project_id, line_items[] {label, qty, unit_price}, total, sent_at, status (draft/sent/accepted/rejected)`

### `task` (checklist nội bộ — KHÔNG tính tiền)
`id, project_id, deliverable_id (nullable), title, assignee_id, status (todo/doing/qa/done), order, due_at`
> Task = bước thực thi nhỏ dưới 1 deliverable (vd "30s hero" có task: treatment → storyboard → dựng → sound). **Task KHÔNG mang tiền** — tiền nằm ở **deliverable lá** (xem §1.1). Tránh đếm tiền 2 nơi.
> ⚠️ Task `status=qa` (đổi từ "review" để **không trùng** `project.prod_status=in_review`). Khác tầng, khác tên.

### `asset`
`id, project_id, type (reference/moodboard/source/link), url, thumbnail, label`

### `deliverable` — **CÂY (WBS)**, tự tham chiếu
```
deliverable {
  id, project_id,
  parent_id,        // nullable self-ref → cây con. null = top-level
  name,             // "30s hero", "Versioning pack", "IG 9:16"
  kind,             // hero | versioning | group | ...
  difficulty,       // S/M/L/XL (chỉ LEAF) → map ra points
  assignee_id,      // Phong/Tuyến (chỉ LEAF) → drive revenue split
  status,           // sent / revising / approved (leaf)
  revision_round,   // vòng khách sửa (đếm để biết vượt free revision)
  order
}
```
- **Node có con = "group"** → value + status = **rollup từ con** (không set tay difficulty/assignee).
- **Node lá = đơn vị tính tiền** → có `difficulty` + `assignee`.

### `option` + `file` (biến thể & version)
```
option { id, deliverable_id, label (A/B/C), is_chosen, note }
file   { id, option_id, version (int), url, is_final, uploaded_at }
```
- 1 **deliverable lá** có thể có nhiều **option** (concept A/B khách chọn) — `is_chosen` đánh dấu cái chốt.
- Mỗi **option** ôm nhiều **file** theo `version` (v1, v2…). `is_final` = bản giao.
- Deliverable đơn giản (không cần A/B) → 1 option mặc định, file gắn thẳng.
- Phân biệt: **`version`** = mỗi lần upload (kỹ thuật) · **`revision_round`** = mỗi vòng khách sửa (thương mại). 1 round đẻ nhiều version.

### `payment` (ledger-in)
`id, project_id, milestone_label, amount, fee, net, status (pending/escrow/paid), paid_at`
> Ledger Net = `SUM(payment WHERE status=paid)`. Card "Net đã chốt $384" sinh từ đây.

### `activity` (log)
`id, project_id, actor, type, message, created_at` — feed cho mọi panel detail.

---

## 1.1 💰 Value rollup — chia tiền theo độ khó (WBS bottom-up)

> Bài toán: 1 project (vd MÁTTA) có nhiều deliverable **khó-dễ khác nhau** + **2 người làm phần khác nhau** → tiền mỗi phần phải khác, và **revenue split Phong/Tuyến phải tự ra**. Cơ chế chuẩn = **WBS bottom-up cost rollup** (PMBOK, xem §8): set ở lá → cộng dồn lên. Phong nghĩ bằng **"% cao hơn cho cái khó"** → dùng **points theo độ khó**, KHÔNG gõ $ tay.

**Cách hoạt động:**
1. Mỗi **deliverable lá** chọn `difficulty` (S/M/L/XL) → map ra **points**. Mặc định: `S=1 · M=2 · L=4 · XL=8` (chỉnh được).
2. `leaf.value = net_amount × leaf.points / Σ(tất cả leaf points)`. → $ luôn cộng đúng bằng net, không lệch.
3. **Group value = Σ con** (rollup). Set con là parent tự cộng — **"set child chưa set parent" tự xử**. Chỉ khi node KHÔNG có con mới set difficulty trực tiếp.
4. **Revenue mỗi người = Σ(leaf.value WHERE assignee = người đó)**.

**Ví dụ MÁTTA** (giả sử net = $1000):
| Deliverable | Độ khó | Points | Ai | $ (auto) |
|---|---|---|---|---|
| 30s hero | XL | 8 | Phong | $348 |
| 15s hero | L | 4 | Phong | $174 |
| 6s hero | M | 2 | Phong | $87 |
| Versioning pack *(group, 9 video)* | — | Σ=9 | — | $391 |
| └ mỗi versioning ×9 | S | 1 | Tuyến | $43 mỗi cái |
| **Tổng** | | **23** | | **$1000** |

→ **Phong = 14/23 = 60.9% ($609)** (3 cái khó), **Tuyến = 9/23 = 39.1% ($391)** (9 cái nhỏ). Đúng trực giác: làm ít cái khó vẫn ăn % cao hơn làm nhiều cái dễ. Tất cả **tự tính**, không bấm máy.

**Set sao cho dễ/intuitive (UI):**
- Tab Deliverables = **cây outline** (indent), mỗi dòng: tên · **chip độ khó S/M/L/XL (1 tap)** · **avatar người làm** · `$/%` (read-only, live).
- Thêm con → indent vào; parent tự thành group, $ tự cộng.
- Đỉnh panel: **thanh split sống** "Phong 61% $609 · Tuyến 39% $391" cập nhật ngay khi đổi độ khó/người.
- Tùy chọn nâng cao: "khoá $" 1 node để gõ số tuyệt đối, các node còn lại auto chia phần dư (mặc định vẫn là points).

> Vì sao points chứ không gõ $: contract là tổng cố định; gõ $ từng cái phải tự canh cho cộng đúng tổng (mệt + sai). Points → hệ tự ra %, **luôn cộng đúng 100%**. Khớp cách Phong nói "% tiền phải cao hơn".

---

## 2. Các view (navigation)

| View | Lăng kính | Câu hỏi trả lời | Trạng thái |
|---|---|---|---|
| **Leads** | bán hàng | "Job nào đang chào, sắp chốt?" | 🔨 làm trước (bảng như Đơn hàng) |
| **Đơn hàng** | tiền | "Đơn nào chốt, thu chưa, net?" | ✅ có, cần nâng cấp |
| **Projects** | sản xuất | "Việc tới đâu, ai kẹt?" | 🔨 thiếu |
| **Project Detail** | 1 job sâu | "Task gì, asset đâu, giao gì?" | 🔨 thiếu |
| **Dashboard** | tổng quan | "Sức khoẻ studio?" | 🔨 thiếu |
| **Chi phí** | tiền ra | "Tháng này tốn gì?" | ✅ có |

---

## 3. View specs + ref UI

### 3.1 Leads 🔨 (ưu tiên 1)
**KHÔNG kanban.** Là **1 trang BẢNG y hệt Đơn hàng** (cùng layout: 4 card tổng + bảng group theo status), chỉ khác **cột = data leads** và **side panel = thông tin lead**. Reuse component bảng của Đơn hàng, đổi cột + inspector.

**4 card tổng (leads lens):** Tổng lead · Đang chào giá · Proposal sent · Win-rate %.

**Cột bảng (thay vì NET/THANH TOÁN của Đơn hàng):**

`TÊN LEAD/JOB · CLIENT · NGUỒN · STAGE (chip) · GIÁ ƯỚC · Ở STAGE X LÂU · NEXT ACTION · Chi tiết`

- **Stage** = chip màu (New lead / Đã liên hệ / Đang báo giá / Proposal sent / Chốt / Từ chối) — đổi inline ngay trong row, KHÔNG cần kéo-thả.
- **Ở stage X lâu** (`stage_entered_at`) → badge đỏ nếu nguội.
- **Next action**: việc kế (gửi sketch / follow-up) + ngày hẹn.
- Group bảng theo stage (giống Đơn hàng group theo status).

**🧩 Tính năng làm được:**
- ➕ **Tạo lead nhanh**: paste link Upwork/Reddit/Twine → parse auto-fill title/client/budget.
- 🔀 **Đổi stage inline** ngay trong row (dropdown chip), log tự động vào Activity.
- 🧾 **Soạn & gửi quote**: line-items → tổng; trạng thái draft/sent/accepted.
- ⏰ **Reminder follow-up**: lead đứng quá X ngày → badge đỏ + nhắc.
- ⚡ **Convert → Won**: 1 click sinh Order + Project (không nhập lại), set `deal_stage=won` + `prod_status=not_started`.
- 🏷️ **Win-rate theo nguồn**: lead→won theo source để biết kênh nào ăn.

**Side panel Leads — bám mockup CRM Deal (KHÁC panel Đơn hàng):**
![ref leads panel](/img/misk-ops/ref-leads-panel.png)

Map mockup → MÍSK:
| Mockup | MÍSK Ops |
|---|---|
| "2 of 7 in Proposal Sent Stage" + Close | vị trí lead trong stage + đóng |
| Stage chips bar (New Leads→…→Rejected) | stage chips lead (đỉnh panel) |
| "Been this stage 48 min" | ở stage này bao lâu |
| Active sequence / Next drip "Follow up proposal" | **Next follow-up** (nhắc lịch) |
| Deal # + title + address | lead id + tên job + client |
| **New Proposal** button | **Tạo báo giá** |
| Amount card "$2,480 · Proposal Sent · View" | **giá ước / quote đã gửi** + trạng thái |
| Sub-tabs: Activity · Proposals · Notes · Tasks | Hoạt động · Báo giá · Notes · Việc cần làm |
| Contact Details (name/email/phone/**source**) | client + nguồn (Upwork/Reddit/Twine) + OSINT |
| **Salesperson** | **Người phụ trách** (Phong/Tuyến) |
| Appointments / Invoices | **bỏ** (freelance illustration không cần) |

> Khác panel Đơn hàng (§7.4): Leads panel xoáy vào **chốt deal** (báo giá, follow-up, contact), KHÔNG có Deliverables/Payment vì chưa thắng. Cùng inspector, khác preset — xem §7.8.

---

### 3.2 Đơn hàng ✅ (nâng cấp — lăng kính TIỀN)
Giữ layout hiện tại (4 card tổng + bảng group theo status). Cột nên thuần tiền:

`TÊN ĐƠN · NET · FEE/THUẾ · NET THỰC · TRẠNG THÁI SX · THANH TOÁN · REVENUE SHARE (Phong/Tuyến) · % DONE · Chi tiết`

- Thêm cột **% production done** (kéo từ task) → đứng ở Đơn hàng vẫn biết tiến độ.
- Thêm card **"Đang chờ thu" (AR)** = tiền đã chốt chưa về. Đây là PM tiền, rất cần.

**🧩 Tính năng làm được:**
- 🧮 **Tự tính fee/thuế → net thực**: nhập gross + nguồn → trừ Upwork 15% + VAT + PIT (khớp `/split-calc`), ra net.
- 💸 **Đánh dấu thanh toán**: pending / escrow / paid; đổi trạng thái → cập nhật ledger Net + card AR realtime.
- 👥 **Revenue share auto**: từ độ khó × người làm ở cây deliverable (§1.1) → phần Phong/Tuyến, hiện ở cột + sidebar.
- 🔍 **Lọc/group/sort**: theo status SX, thanh toán, client, nguồn, tháng.
- 📤 **Export báo cáo tháng**: tổng net, đã thu, chờ thu, chia theo người (CSV/PDF).
- 📊 **4 card tổng**: Tổng đơn · Đang làm · Hoàn thành · Net + (mới) **AR chờ thu**.

**Ref — Orders list (sidebar nav + 4 metric card + bảng có thumbnail/ID/status/action):**
![orders list](/img/misk-ops/ref-orders-list.jpg)
> Lấy gần như nguyên bố cục này cho tab Đơn hàng. Đổi cột "Stock" → "Thanh toán/Revenue share".

**Ref — metric card (so sánh vs forecast, mini bar breakdown):**
![kpi cards](/img/misk-ops/ref-kpi-cards.jpg)
> Lấy: kiểu card "$37.12 +28% vs forecast" cho 4 card tổng (Tổng đơn / Đang làm / Hoàn thành / Net + AR).

**Ref — stat widget tối giản (số to, thanh trực quan):**
![stat widgets](/img/misk-ops/ref-stat-widgets.jpg)
> Lấy: aesthetic số lớn + thanh bar cho widget Net/AR nếu muốn bản gọn.

---

### 3.3 Projects 🔨 (lăng kính SẢN XUẤT)
**Cũng là clone bảng Đơn hàng** (reuse khung bảng), nhưng **project-oriented**: cột = data sản xuất, group theo `prod_status`. → **3 view Leads / Đơn hàng / Projects xài CHUNG 1 component bảng**, chỉ khác cột + side panel preset. Đỡ build 3 lần.

Bảng project: thumbnail · tên · client · **assignee avatar** · **`prod_status`** · **`health` badge** · **progress ring (% task done)** · due. Group theo `prod_status` (Chưa bắt đầu / Đang làm / Chờ duyệt / Đã giao). Có **Timeline/Gantt** để thấy job chồng deadline.

> **Double-click 1 row → mở trang Project Detail riêng (§3.4)** — full task board (Board/List/Timeline/Calendar), assets, deliverables. Side panel chỉ là xem nhanh; double-click mới vào sâu. (giống Linear/ClickUp: list → mở project detail)

**🧩 Tính năng làm được:**
- 🟢🟡🔴 **Health badge auto (Linear-style)**: `on_track / at_risk / late` suy từ due vs progress → liếc 1 phát biết job nào nguy. (xem §8)
- 🔘 **Progress ring auto**: % = task done / tổng task, cập nhật khi tick task.
- 📅 **Timeline/Gantt**: thấy job nào chồng deadline → cảnh báo quá tải Phong/Tuyến.
- 🔍 **Filter/group**: theo assignee, `prod_status`, `health`, due, client.
- ➕ **Quick-add task** ngay từ row (không cần mở detail).
- 🔀 **Đổi view**: List ↔ Timeline ↔ Calendar.

**Ref — dashboard + project timeline + project list (progress ring, source file, assignee):**
![dashboard timeline](/img/misk-ops/ref-dashboard-timeline.jpg)
> Lấy: Project Timeline (gantt), Project List có cột Source File + Assignee + Progress ring. BỎ "Referral/Target Sales" charts (B2B SaaS, không hợp studio 2 người).

---

### 3.4 Project Detail 🔨 (deep dive — nơi sống hằng ngày)
**Trang riêng** (mở bằng double-click từ Projects/Đơn hàng, hoặc nút ⤢ trong side panel). Header: tên project + member + `health` + `prod_status`.

Tabs: **Overview · Tasks · Assets · Deliverables · Payment · Activity**
> Tab **Tasks** có nhiều view-mode như ClickUp/tuduu: **Board (kanban) · List · Timeline · Calendar** — cùng data, đổi cách nhìn.

- **Overview**: brief, client, `deal_stage`+`prod_status`, `health`, due, net, người làm.
- **Tasks**: list/kanban, group To Do/Doing/QA/Done, assignee. Checklist nội bộ, **KHÔNG mang tiền** (tiền ở cây Deliverables §1.1).
- **Assets**: board ảnh kiểu moodboard (reference, source, link Frame.io).
- **Deliverables**: **cây WBS** (group → leaf), mỗi lá có độ khó + người làm + option(A/B) + file version. $ và revenue split tự rollup (§1.1). (MÁTTA: 3 hero + pack 9 versioning.)
- **Payment**: milestone, escrow, đã thu → feed ledger.
- **Activity**: log mọi thứ.

**🧩 Tính năng từng tab:**

| Tab | Làm được gì |
|---|---|
| **Overview** | Sửa brief/due/net; xem client + người làm + `health`; nút đổi `prod_status` (not_started→in_production→in_review→delivered). |
| **Tasks** | CRUD task (checklist, ko tiền); gán assignee; kéo status (todo→doing→**qa**→done); subtask; group theo giai đoạn SX (Concept/Paint/Crop/Export); link tới deliverable; quick-add. |
| **Assets** | Upload ảnh / dán link (Drive, Frame.io, PureRef); board moodboard grid; gắn nhãn (reference/source/moodboard); preview nhanh. |
| **Deliverables** | Cây outline: thêm group/lá; set **độ khó (S/M/L/XL)** + **người làm** mỗi lá → $/split tự rollup (§1.1); thêm **option A/B** (khách chọn); upload **file theo version**; đếm revision round; đổi trạng thái; link gửi khách. |
| **Payment** | Tạo milestone; mark pending/escrow/paid; link hợp đồng Upwork; mỗi lần paid → đẩy ledger Net + giảm AR. |
| **Activity** | Tự log mọi thay đổi (stage, task done, deli approved, payment) với actor + thời gian. |

**Ref — project có tabs Board/Timeline/Calendar/List + group To Do/In Progress/In Review + right-click actions:**
![project tabs](/img/misk-ops/ref-project-tabs.jpg)
> Lấy: hệ tab + group status + context menu (rename/duplicate/move/delete) cho tab Tasks.

**Ref — task grouped theo section + priority + due + assignee, kèm AI chat panel:**
![project detail tasks ai](/img/misk-ops/ref-project-detail-tasks-ai.webp)
> Lấy: cách group task theo nhóm (UI/UX, Backend...) → ta group theo giai đoạn sản xuất (Concept/Paint/Crop/Export). **AI panel bên phải** = chỗ cắm trợ lý sau (gen task từ brief, nhắc deadline). Để phase 2.

**Ref — task list gọn (Open/Closed/Archived, checkbox, time, assignee avatar):**
![task list mobile](/img/misk-ops/ref-task-list-mobile.jpg)
> Lấy: card task gọn, strike-through khi done, avatar nhóm. Hợp cho widget "task hôm nay".

**Ref — asset ví dụ (ảnh reference trong tab Assets):**
![asset example](/img/misk-ops/ref-asset-example.jpg)
> Minh hoạ 1 item asset (reference chim/thú) hiện trong board Assets.

---

### 3.5 Production flow — DAG track stage sản xuất
Visualize 1 job chạy qua các stage sản xuất dạng **DAG node/flow** (Concept → Paint → Crop → Export → Deliver). Mỗi node = 1 bước, **node card** show status/owner/ngày/size + nhánh rẽ (vd full-body và crop là 2 nhánh từ cùng 1 painting). Khác với Pipeline/Leads ở 3.1 (đó là phễu bán hàng) — đây là **luồng sản xuất nội bộ của 1 project**.

**🧩 Workflow tạo được gì:**
- 🧱 **Tạo node theo bước SX**: mỗi node 1 stage (Concept/Paint/Crop/Export/Deliver), tự đặt được bước riêng.
- 🔀 **Rẽ nhánh & gộp**: 1 painting → nhánh "full-body" + nhánh "crop 10x10"; nhiều node gộp về 1 deliverable.
- 🟢🟡🔴 **Status mỗi node**: success / warning / blocked → nhìn phát biết **kẹt ở đâu**.
- 👤 **Gán owner + file/preview** vào node (Phong/Tuyến), gắn asset/deliverable tương ứng.
- 🧩 **Template flow theo loại job**: lưu sẵn flow cho "bird illustration" (Concept→Paint→Crop→Export) → job mới **1 click áp template**, khỏi dựng lại.
- 🔗 **Node nối thẳng entity thật**: node Deliver ↔ bảng `deliverable`, node Export ↔ `asset` — không phải sơ đồ trang trí, mà là **view sống của data**.

**⚡ Auto-trigger (phase 2):**
- Deliver node = approved → **tự tạo payment milestone**.
- Tất cả node done → đẩy project `stage = delivered`.
- Crop node xong → nhắc "gửi khách bản crop".
> Tầng auto-trigger để sau; phase 1 chỉ cần **visualize + status thủ công**. 2 người đừng over-engineer.

**Ref — DAG pipeline node/flow (node card có status/owner/date/size + link rẽ nhánh):**
![pipeline nodes](/img/misk-ops/ref-pipeline-nodes.jpg)
> Lấy: layout node-graph theo cột stage, node card expand ra status/owner/date/preview, link nối có rẽ nhánh. Map: cột = stage sản xuất, node = bước/deliverable, nhánh = biến thể (full vs crop). Dùng để nhìn 1 job "production tới đâu, kẹt node nào".

**Ref — workflow automation node graph + insight metrics (phase 2, auto-trigger):**
![workflow automation](/img/misk-ops/ref-workflow-automation.webp)
> Để **sau**. Tầng trên của DAG: gắn metric + auto-trigger (vd deliver xong → tự tạo payment milestone). 2 người thì chưa cần, đừng over-engineer.

---

### 3.6 Dashboard 🔨 (tổng quan sức khoẻ studio)
Trang đầu khi mở app: số liệu sống của tiền + người + việc.

**🧩 Tính năng làm được:**
- 💰 **KPI cards**: Net tháng (vs tháng trước) · AR chờ thu · job đang làm · job sắp hết hạn.
- 🩺 **Health roll-up (Linear-style)**: bao nhiêu job `at_risk` / `late` — liếc biết studio có đang cháy không. (xem §8)
- 👥 **Revenue share per member**: Phong/Tuyến tháng này được bao nhiêu (auto từ task).
- 📈 **Trend chart**: doanh thu theo tháng, win-rate theo nguồn.
- 🔥 **Cần chú ý hôm nay**: lead nguội + deliverable chờ duyệt + payment quá hạn thu — gom 1 chỗ.

> ❌ **Bỏ "Apply CV / năng suất apply"** khỏi dashboard này — đó là job-hunt cá nhân (di sản jobradar), thuộc view **Job Hunt riêng**, không phải PM khách hàng. Xem §7.1 + [[project_jobradar_role]].

**Ref — metric card + stat widget:** dùng lại `ref-kpi-cards` + `ref-stat-widgets` + `ref-dashboard-timeline` (phần Overall Tasks / Project Progress).

---

## 4. Mắt xích sống còn (phải nối đúng)

1. **Deliverable (độ khó × người làm) → Revenue share member** (sidebar Thành viên) qua rollup §1.1. Tự tính, bỏ số tay. Khớp logic `/split-calc`.
2. **Payment(paid) → Ledger Net + Chi phí**. Chỉ khi `deal_stage = won`.
3. **Transition tự sinh concern**: `deal_stage` lead→won tạo quote/order + set `prod_status=not_started`; vào production mở task board. Không copy entity.
4. **3 trục derived nhau**: `payment_state` ⟵ payments · `health` ⟵ due vs progress · progress% ⟵ task done. Không lưu tay 3 cái này.

---

## 5. Thứ tự build đề xuất
1. **Refactor spine**: 1 bảng `project` + 4 trục (`deal_stage`/`prod_status`/`payment_state`/`health`); Leads/Đơn hàng/Projects đều là view filter của nó, **chung 1 component bảng**.
2. **Project Detail** (trang riêng, tabs) — định hình data model cho mọi view.
3. **Leads** — clone bảng (đổi cột + side panel lead).
4. **Projects** — clone bảng (đổi cột + double-click → Project Detail) + Timeline.
5. **Dashboard tổng + AR card**.
6. Production flow / AI assistant — phase 2.

---

## 6. Lấy gì / bỏ gì từ ref (đừng clone nguyên)
| Ref | LẤY | BỎ |
|---|---|---|
| Orders list | bố cục bảng + 4 metric card | cột Stock/Inventory |
| KPI cards | "vs forecast" + mini bar | metric nhà hàng (cheque/delivery) |
| Dashboard timeline | gantt + progress ring + source file | Referral/Target Sales charts |
| Project tabs | tab system + group status + context menu | phần team đông người |
| Detail + AI | group task theo giai đoạn | AI panel (để phase 2) |
| DAG pipeline nodes | node-graph theo cột stage + node card status/owner + link rẽ nhánh (Production flow) | — |
| Workflow nodes | (phase 2) auto-trigger + metric layer | toàn bộ lúc này |

> Bám design system MÍSK (token, shared component) — reuse, không hard-code. Xem [[project_whip_design_system]] tinh thần tương tự.

---

## 7. Tổ chức UI/UX — layout 3 panel

### 7.1 Vấn đề hiện tại
Bảng giữa OK. **2 panel cạnh đang là bãi rác — mỗi panel gánh 3 concern không liên quan.**

- **Left rail** trộn: KPI tổng + Thành viên/revenue + "Năng suất apply CV".
- **Right inspector** trộn: giai đoạn deal + liên hệ + Notes + **nút job-hunt cũ** (xem JD / gắn link ứng tuyển / thêm vào nhóm / Personal).

🔴 **Thủ phạm gốc:** mấy thứ *"Apply CV hôm nay", "xem JD", "gắn link ứng tuyển", "thêm vào nhóm"* là **di sản jobradar (săn việc cá nhân)**, không thuộc tool PM khách hàng. Lẫn vào đây nên panel nào cũng rối. → **Gỡ hết ra khỏi MÍSK Ops**, đẩy về view "Job Hunt" riêng (hoặc bỏ). Xem [[project_jobradar_role]].

> **Nguyên tắc vàng:** mỗi panel làm ĐÚNG 1 việc. Left = điều hướng/bối cảnh. Giữa = danh sách (master). Phải = chi tiết item đang chọn (inspector). Đừng để panel nào thành "ngăn kéo tạp".

### 7.2 Layout chuẩn (master–detail 3 cột)

```
┌─────────────┬───────────────────────────┬──────────────────┐
│ LEFT RAIL   │  MASTER (list/table)      │  INSPECTOR        │
│ (context)   │  Đơn hàng / Projects      │  (item đang chọn) │
│ ~240px      │  flex (rộng nhất)         │  ~360px, đóng đc  │
│ thu gọn đc  │                           │  resize đc        │
└─────────────┴───────────────────────────┴──────────────────┘
```

- Inspector **mặc định đóng**; click 1 row mới mở (đỡ chật như hiện tại).
- Cả 2 rail **collapse được** → bảng giữa full khi cần tập trung.
- Resize được; nhớ width vào localStorage.

### 7.3 LEFT RAIL — chỉ "bối cảnh + lọc"
Bỏ kiểu nhồi 3 khối. Còn 2 nhóm, cô đọng:

1. **Studio snapshot** (4 số compact, không card to): Net tháng · AR chờ thu · Đang làm · Sắp hết hạn.
2. **Members = bộ lọc** (không phải profile card dài): avatar + tên + % revenue tháng. **Click 1 member → lọc list theo người đó.** Bỏ "demo video / countdown / tasks pending" khỏi rail (đưa vào Dashboard hoặc member detail).

❌ Bỏ khỏi rail: "Năng suất apply CV", "7 ngày gần", "Demo video" → không thuộc PM khách hàng.

### 7.4 INSPECTOR (phải) — chi tiết item, đúng tab entity
Tabs **bám đúng spine** (đồng bộ với Project Detail §3.4), không tự đẻ tab lạ:

```
[ Overview ] [ Báo giá ] [ Tasks ] [ Deliverables ] [ Payment ] [ Nhật ký ]
```

- **Header**: cover (chọn ảnh) + tên job + source badge + ngày. (giữ, đang ổn)
- **Overview**: **Giai đoạn deal stepper** (giữ — đẹp) + client/liên hệ + Notes. Gộp 3 cái rời hiện tại vào đây.
- **Báo giá**: line-items + tổng + net sau fee.
- **Tasks / Deliverables / Payment**: như §3.4 (rút gọn cho panel hẹp; "mở rộng" → bật full Project Detail).
- **Nhật ký**: activity log.

❌ Bỏ khỏi inspector: "xem JD", "gắn link ứng tuyển", "thêm vào nhóm", dropdown "Personal" → di sản job-hunt.

### 7.5 Chuẩn UX (bar Apple+)
- 1 panel = 1 job; không scroll vô tận trộn concern.
- Mật độ: rail dùng **số + nhãn nhỏ**, không card bự chiếm chỗ.
- Mọi action phá huỷ (bỏ khỏi tracker, xoá) → confirm + undo gộp.
- Token màu/spacing từ design system MÍSK, không hard-code. Theo [[feedback_ux_pass]].

### 7.6 Wireframe — LEFT RAIL (~240px)
```
┌────────────────────────────┐
│ « thu gọn                  │
├────────────────────────────┤
│ THÁNG 6 · 2026             │  ← snapshot, số gọn
│ Net      $384   ▲12%       │
│ Chờ thu  $251   3 đơn      │
│ Đang làm 63                │
│ Sắp hạn  4   ⚠             │
├────────────────────────────┤
│ THÀNH VIÊN  (lọc theo người)│
│ ◉ Phong    55%   $1,582    │  ← click = filter list
│ ○ Tuyến    45%   $1,294    │
│ + thêm member              │
└────────────────────────────┘
   (Job Hunt / Apply CV → route riêng, KHÔNG ở đây)
```

### 7.7 Wireframe — INSPECTOR (bám mockup CRM Deal slide-over)

> **Mẫu chuẩn = CRM Deal panel "Proposal Sent"** (không vẽ lại từ panel rối hiện tại). Cấu trúc mockup, theo thứ tự từ trên xuống:
> `context line → stage chips → title → AMOUNT card → sub-tab pills → ACTIVITY feed (mặc định) → Contact card → Assignee card`.
> Khác cái đang làm ở 3 điểm: (1) **stage chips luôn ở đỉnh panel** chứ không nằm trong tab Overview; (2) có **card số tiền nổi bật** ngay dưới title; (3) **Activity là tab mặc định**, không phải Overview.

**Khung cố định (mọi sub-tab dùng chung phần trên):**
```
┌────────────────────────────────────────┐
│ Job 2/7 ở "Hoàn thành"          [⤢][✕] │ ← context + mở full + đóng
│ ⏱ ở stage này 2 ngày                    │
├────────────────────────────────────────┤
│ [cover ảnh]   ⬢ UPWORK                  │
│ Hazel Clarke — Full set (birds)         │
│ upwork.com · 13/06/2026                 │
├────────────────────────────────────────┤
│ STAGE  ●─●─●─●─●─◐            [✕ từ chối]│ ← chips, active sáng
│ Lead Chào Demo Đàm Chốt Hoàn            │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ NET THỰC          $151      🟢 Đã thu│ │ ← AMOUNT card (như $2,480 ref)
│ │ gross $180 − fee $29                 │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ ◉Hoạt động  Báo giá Tasks Deli $ Notes │ ← sub-tab pills (Activity default)
└────────────────────────────────────────┘
```

**◉ Hoạt động (mặc định — feed như ref Activity):**
```
│ Latest activity                         │
│ ✓ 20:15  Phong  stage → Hoàn thành      │
│ ☑ 18:40  Tuyến  task Koala done         │
│ ⬆ 14:02  Phong  approved Kangaroo.pdf   │
│ ✦ 12:50  hệ thống tạo project từ lead   │
│ ──────────────────────────────────────  │
│ CONTACT                                 │ ← card cố định (như ref Contact Details)
│ 👤 Hazel Clarke   ✉ …@…                  │
│ 🔗 LickiMat · Australia (OSINT)         │
│ ──────────────────────────────────────  │
│ NGƯỜI LÀM (assignee)                    │ ← thay "Salesperson" của ref
│ 🟣 Phong 55%   🔴 Tuyến 45%             │
```

**Báo giá:** (như ref "Proposals" list + line-items)
```
│ • Full body illus  ×3  $60      $180   │
│ • Crop portrait    ×0   —        —     │
│ Tổng $180 − Upwork 15% $27 − VAT $x    │
│ ═════════════════  NET $151 🟢          │
│ [+ dòng]  [Gửi báo giá]  trạng thái:sent│
```

**Tasks / Deliverables / Payment:** rút gọn 1 cột (panel hẹp), nội dung như §3.4. Cần rộng → **[⤢] mở full** Project Detail.
```
Deliverables (cây WBS + split sống ở đỉnh):
  ┌ Phong 61% $609 · Tuyến 39% $391 ──────────┐
  ▾ Hero cuts                         [group]
     • 30s   [XL] 🟣Phong   $348  ▾options A·B  v2 ✓
     • 15s   [L]  🟣Phong   $174   v1 ◐revising
     • 6s    [M]  🟣Phong   $87
  ▾ Versioning pack                   [group] $391
     • IG 9:16 …  [S] 🔴Tuyến  $43   ×9
  [+ deliverable]  [+ group]

Tasks:  ▾PAINT ◐1/3  ☑Kangaroo Phong · ☐Koala Tuyến ⏰1/7   (checklist, ko tiền)
$:      Milestone1 $180 due 3/7 ● escrow [mark paid] → Chờ thu $180 (AR)
```

**Notes:** ô text follow-up/ghi chú (tách riêng, không nhồi vào Overview).

**Khác biệt vs panel hiện tại (checklist sửa):**
- ✅ Đưa **stage chips lên đỉnh**, bỏ khỏi trong tab.
- ✅ Thêm **AMOUNT card** (net + trạng thái thu) ngay dưới title — điểm nhấn số tiền như mockup.
- ✅ **Activity feed làm mặc định** (mockup mở ra là thấy hoạt động, không phải form trống).
- ✅ Contact + Assignee là **card cố định** dưới feed (như Contact Details / Salesperson của ref).
- ❌ Gỡ "xem JD / gắn link ứng tuyển / thêm vào nhóm / Personal".

### 7.8 Inspector đổi theo view (context-aware)

Cùng 1 project, nhưng đứng ở view nào thì inspector **mở đúng tab mặc định + làm nổi đúng khối** của lăng kính đó. Component giống nhau, chỉ khác **default tab** và **thứ tự ưu tiên section**.

| Đang ở view | Tab mặc định | Khối nổi bật | Khối ẩn/gập |
|---|---|---|---|
| **Leads** | **Báo giá** | stage chips + quote + nút "Chốt → tạo order" + follow-up + contact | Deliverables, Payment (chưa có) |
| **Đơn hàng** (tiền) | **Hoạt động** | AMOUNT card + Payment + revenue share | Tasks chi tiết (chỉ show % done) |
| **Projects** (sản xuất) | **Tasks** | task list + % done + Deliverables + due | Báo giá, Contact (gập) |
| **Project Detail** | tab cuối mở | full mọi tab (panel = trang) | — |
| **Production flow (DAG)** | **Deliverables** | node đang chọn ↔ deliverable/asset của node | Báo giá, Payment |

**Quy tắc:**
- Inspector đọc `context = currentView` → set default tab + sắp xếp section, **không đổi data**.
- Stage chips + AMOUNT card luôn ở đỉnh (không đổi) để mọi view vẫn neo được "đang ở đâu / tiền bao nhiêu".
- Khối không liên quan view → **collapse mặc định** (vẫn bấm mở được), không xoá hẳn → giữ nhất quán, đỡ "mỗi view một panel lạ".
- Cùng 1 project mở ở 2 view khác nhau phải **nhất quán nội dung**, chỉ khác điểm nhấn.

> Tinh thần: 1 inspector, nhiều "preset bố cục" theo view — không build 5 panel riêng. Đỡ maintain, user học 1 lần dùng mọi nơi.

---

## 8. SOTA references (vì sao model thế này)

Mỗi quyết định kiến trúc bám pattern của app dẫn đầu từng mảng (tham chiếu design, không phải benchmark học thuật):

| Quyết định trong doc | App SOTA | Nguồn |
|---|---|---|
| **Tách `deal_stage` ≠ `prod_status` ≠ `payment`** (đừng nhồi 1 cột) | HubSpot tách *lifecycle stage* khỏi *deal stage*: "1 contact có nhiều deal khác stage cùng lúc", tách để mỗi team theo dõi cái của mình | [struto — lifecycle vs deal](https://www.struto.io/blog/what-is-the-difference-between-lifecycle-stages-and-deal-stages-in-hubspot) |
| **`health` badge (on_track/at_risk/late) + progress% derived từ task** | Linear: project có status sức khoẻ (On Track/At Risk/Off Track) riêng, target date, progress tính từ issue | [Linear — project status](https://linear.app/docs/project-status), [conceptual model](https://linear.app/docs/conceptual-model) |
| **task status ≠ project status** (đổi "review"→"qa") | Linear: issue workflow (Backlog→Todo→In Progress→Done) tách khỏi project status | [Linear — workflows](https://linear.app/docs/configuring-workflows) |
| **Cây deliverable + chia tiền rollup theo độ khó (§1.1)** | WBS/CBS bottom-up: estimate ở work-package → roll up lên deliverable → project; CBS map mỗi deliverable 1 budget. (Linear KHÔNG auto-rollup vì là estimate kỹ thuật; billing thì phải rollup kiểu Jira/WBS) | [WBS cost rollup](https://www.projectmanager.com/guides/work-breakdown-structure), [Linear estimates](https://linear.app/docs/estimates) |
| **1 spine lead→project→invoice, tiền nhìn thấy mọi tầng** | Bonsai (agency): lead→client→project→invoice 1 hệ, task nối thẳng budget/finance | [Bonsai — agencies](https://www.hellobonsai.com/software/agencies) |
| **Inline edit stage trên bảng, không over-model UI** | Attio: inline edit deal không cần mở record; cảnh báo graph-model overkill nếu nhu cầu đơn giản → giữ cảm giác HubSpot-simple | [Attio review](https://www.authencio.com/blog/attio-crm-review-features-pricing-customization-alternatives) |
| **3 view (Leads/Đơn hàng/Projects) chung 1 component bảng** | Attio/Linear: cùng 1 record-list, đổi cột + filter theo "view" | [softr — Attio vs HubSpot](https://www.softr.io/blog/attio-vs-hubspot) |

> Nguyên tắc chung rút ra: **mỗi trục dữ liệu là 1 cột độc lập; tiền & sức khoẻ là DERIVED; UI giữ đơn giản (2 người, đừng phơi ontology)**. Khớp [[project_jobradar_role]] (không spin ontos cho tool nội bộ).
