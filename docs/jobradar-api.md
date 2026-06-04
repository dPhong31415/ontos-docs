---
id: jobradar-api
title: API Reference
sidebar_label: 🔌 API Reference
sidebar_position: 4
---

# API Reference

Tất cả route yêu cầu Clerk session (cookie) trừ khi ghi **(public)**.  
Lỗi auth → `401`. Lỗi quyền tier → `402 { error, upgradeTo? | needCredits?: true }`.

---

## Jobs

### GET /api/jobs
Lấy danh sách jobs với filter.

**Query params:**

| Param | Type | Mô tả |
|-------|------|-------|
| `templateId` | string | Lọc theo template |
| `action` | `"top"` / `"applied"` / `"skip"` / `"analyzed"` / `"unanalyzed"` / `"deep"` | Tab hiển thị |
| `track` | string | Lọc theo track |
| `search` | string | Tìm theo title hoặc company |
| `page` | number | Trang (default 1) |
| `limit` | number | Số item/trang (default 50) |

**Response:** `{ jobs: Job[], total, page, pages }`

---

### GET /api/jobs/stats
Thống kê nhanh.

**Query:** `templateId`

**Response:** `{ total, analyzed, top, userApplied, unanalyzed, skip, deep }`

---

### PATCH /api/jobs/[id]
Cập nhật job. Chỉ cho phép sửa các field sau:

| Field | Mô tả |
|-------|-------|
| `applied` | `true` → auto set `appliedAt` + `applicationStatus: "applied"` |
| `notInterested` | Bấm skip |
| `skipReason` | Lý do skip |
| `action` | Override verdict của AI |
| `applicationStatus` | Pipeline: `tracking/applied/screening/interview/offer/rejected` |
| `applicationNotes` | Ghi chú cá nhân |
| `workspaceId` | Chuyển sang workspace khác (Team) |
| `applicationUrl` | URL apply riêng |
| `assigneeId` | Giao cho thành viên (Team plan) |

---

### GET /api/jobs/[id]/deep *(SSE)*
Chạy deep analysis. **Yêu cầu Personal+, tốn 2 credit.**

**Events:**
- `step` → `{ step: 1-4, label: "Đang fetch JD..." }`
- `step_done` → `{ step, data? }`
- `done` → `{ jobId, saved: true }`
- `error` → `{ message }` (tự hoàn credit)

---

### POST /api/jobs/[id]/propose *(SSE)*
Sinh cover letter + pricing. **Yêu cầu Personal+, tốn 1 credit.**

**Events:** `step`, `step_done`, `done { pricing, coverLetter, market }`, `error`

---

### GET/POST/PATCH/DELETE /api/jobs/[id]/tasks
CRUD project tasks. **POST yêu cầu Personal+.**

**POST body:**

| Field | Type | Mô tả |
|-------|------|-------|
| `title` | string | Bắt buộc |
| `estimateHours` | number | Ước tính giờ |
| `notes` | string | Ghi chú |
| `order` | number | Thứ tự |

**PATCH query:** `?taskId=<id>`  
**PATCH body:** `{ title?, status?, estimateHours?, notes?, order? }`  
**DELETE query:** `?taskId=<id>`

---

### POST /api/jobs/import
Bulk import job bằng URL list.

**Body:** `{ templateId?, urls: string[] }`  
**Response:** `{ inserted, skipped, templateId }`

Reddit URL → tự parse slug (không fetch, bị 403).  
Các URL khác → fetch HTML, extract title/company qua AI.

---

### POST /api/jobs/import-url *(SSE)*
Import + analyze + deep analysis 1 URL. Dùng trong Tracker.

**Body:** `{ url, templateId? }`  
**Events:** `step 1-3`, `step_done`, `done { job }`, `error`

Deep analysis chạy fire-and-forget sau khi `done` emit.

---

### POST /api/jobs/bulk
Bulk update nhiều jobs.

**Body:** `{ ids: string[], update: { applied?, notInterested?, action? } }`

---

## Templates

### GET /api/templates
Lấy tất cả template của user.

### POST /api/templates
Tạo template mới.

### GET/PATCH/DELETE /api/templates/[id]
CRUD.

### POST /api/templates/[id]/feedback
Chat feedback để tinh chỉnh template (lọc job, thêm keyword, hardNO).

**Body:** `{ message: string }`  
**Response:** `{ reply, actions[], filtersApplied[], keywordsAdded[], reAnalyze }`

---

## Scrape

### POST /api/scrape/trigger
Bắt đầu scrape cho template.

**Body:** `{ templateId }`  
**Response:** `{ runId }`

### GET /api/scrape-stream *(SSE)*
Stream progress từ Render runner.

**Query:** `templateId`, `runId`, `config` (JSON)

**Events:** `source_start`, `job`, `source_done`, `blocked`, `scrape_done`, `error`

### POST /api/scrape/stop
Dừng run đang chạy. **Body:** `{ runId }`

### GET /api/scrape/runs
Lịch sử scrape runs. **Query:** `templateId?`

---

## Analyze

### GET /api/analyze/[templateId] *(SSE)*
Chấm điểm jobs chưa analyzed. Tự dừng nếu Free tier vượt 10 job.

**Events:**
- `analyzing` → `{ count }`
- `result` → `{ title, action, pct, gated? }`
- `progress` → `{ done, remaining, apply, save }`
- `done` → `{ hasMore }`
- `error` → `{ message }`

---

## Chat

### POST /api/chat *(SSE)*
Radar agent — onboarding + job queries.

**Body:** `{ message, history: [{role,content}][], templateId? }`  
**Events:** `data: { text }` (word by word), `data: [DONE]`, `data: { error }`

---

## Keywords

### POST /api/keywords/generate
Sinh platform-optimized keywords từ template.

**Body:** `{ templateId }`  
**Response:** `{ keywords[], platformKeywords{}, reasoning, pruned[] }`

---

## Billing

### POST /api/billing/webhook-mor **(public)**
Webhook Paddle / LemonSqueezy.  
Header: `paddle-signature` hoặc `x-signature` (HMAC-SHA256 của `BILLING_MOR_SECRET`).

Xử lý events: `subscription.created`, `subscription.updated`, `subscription.renewed`, `subscription.cancelled`.

### POST /api/billing/webhook-vn **(public)**
Webhook VNPay / MoMo.  
Body field `signature` (HMAC-SHA256 của `BILLING_VN_SECRET`).

`orderInfo` format: `"email:<user_email>|plan:<personal|team>"`

### GET /api/billing/credits
Số dư credit + lịch sử 20 giao dịch gần nhất.

**Response:** `{ balance, ledger[] }`

---

## Share **(GET public, POST/DELETE cần auth)**

### GET /api/share/[token]
Preview share. Nếu đã đăng nhập trả thêm `hasClaimed: boolean`.

**Response:** `{ token, type, title, itemCount, fromName, claimCount, hasClaimed, preview[] }`

### POST /api/share/[token]
Nhận (claim) share bundle. Thêm jobs/template vào tài khoản.

**Lỗi:** `"Already claimed"` → frontend xử lý thành claimed state.

### DELETE /api/share/[token]
Xóa share (chỉ owner).

---

## Admin

### GET /api/admin/monitor
Tổng quan toàn hệ thống (chỉ admin).

### GET /api/admin/subscriptions
Tất cả subscription với balance credit (chỉ admin).

### GET /api/admin/cost-report
Bảng cost thật từ Usage collection theo feature (chỉ admin).  
Dùng để chốt giá credit.

### POST /api/admin/migrate-workspaces
Backfill `workspaceId: null` → personal workspace cho tất cả user.  
**Idempotent — chạy 1 lần sau deploy M1.**

### POST /api/admin/cleanup-blank
Xóa job có title rỗng trong tracker (Reddit import cũ).

---

## Presets (Source Presets)

### GET /api/presets
Lấy source presets. **Yêu cầu Personal+.**

### POST /api/presets
Tạo preset. **Yêu cầu Personal+ — 402 nếu Free.**

### GET/PATCH/DELETE /api/presets/[id]
CRUD.

---

## Workspaces

### GET /api/workspaces
Lấy danh sách workspace user thuộc về.

### POST /api/workspaces
Tạo workspace team mới.

### GET/PATCH /api/workspaces/[id]
Chi tiết + cập nhật workspace.

### POST /api/workspaces/join
Tham gia workspace bằng invite token.

---

## Response lỗi chuẩn

```json
// Chưa đăng nhập
{ "error": "Unauthorized" }  // 401

// Chưa đủ tier
{ "error": "Deep analysis requires a paid plan", "upgradeTo": "personal" }  // 402

// Hết credit
{ "error": "Insufficient credits", "needCredits": true }  // 402

// Không tìm thấy
{ "error": "Not found" }  // 404

// Forbidden
{ "error": "Forbidden" }  // 403
```
