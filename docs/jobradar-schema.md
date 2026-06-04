---
id: jobradar-schema
title: Database Schema
sidebar_label: 🗄 Database Schema
sidebar_position: 3
---

# Database Schema

> Trang này giải thích **tại sao mỗi model tồn tại, nó quan hệ với model khác thế nào, và các field quan trọng cần chú ý**. Đọc phần "Quan hệ giữa các model" trước khi đọc từng model.

---

## Quan hệ giữa các model

```
User ──────────── sở hữu ──────────────► Workspace (1 personal + n team)
  │                                           │
  │                                      có Subscription (billing)
  │                                      có CreditWallet (số dư credit)
  │                                      có Membership[] (ai thuộc về)
  │
Workspace ─── chứa ──► JobTemplate (hồ sơ tìm việc)
                            │
                            ├─── sinh ra ──► Job[] (các job đã scrape)
                            │                  │
                            │              có ProjectTask[] (task breakdown)
                            │
                            ├─── tạo ra ──► ScrapeRun[] (lịch sử scrape)
                            │
                            ├─── có ──────► AgentMemory (AI học từ user)
                            └─── có ──────► KeywordMemory[] (hiệu quả keyword)
```

**Đọc theo hướng này:** User có Workspace → Workspace có Template → Template sinh Job. Mọi query đều cần filter theo `userId` hoặc `workspaceId` để tenant isolation.

---

## User

> Đại diện cho 1 người dùng. Được tạo tự động khi user đăng nhập qua Clerk lần đầu.

File: `lib/models/User.ts`

| Field | Ý nghĩa |
|-------|---------|
| `clerkUserId` | ID từ Clerk (dùng để tìm user khi nhận request) |
| `email` | Email đăng nhập |
| `displayName` | Tên hiển thị trong app |
| `color` | Màu avatar |
| `lastActiveAt` | Theo dõi user có còn active không |

---

## Workspace

> **Đây là đơn vị tenant.** Mỗi user có ít nhất 1 workspace "personal". Team chia sẻ chung 1 workspace. Mọi dữ liệu (job, template, billing) gắn với workspace, không phải user trực tiếp.

File: `lib/models/Workspace.ts`

| Field | Ý nghĩa |
|-------|---------|
| `name` | Tên hiển thị (vd "Phong's workspace") |
| `slug` | URL-safe ID, tự sinh từ userId (vd `personal-a1b2c3d4`) |
| `ownerId` | User tạo workspace này |
| `plan` | `free` / `personal` / `team` / `enterprise` — **cập nhật qua webhook billing** |
| `type` | `personal` (1 người) / `team` (nhiều người) / `org` (B2B, chưa dùng) |
| `parentWorkspaceId` | Dự phòng B2B2B, hiện null |

**Quan trọng:** Gọi `getOrCreatePersonalWorkspace(userId)` từ `lib/workspace.ts` để lấy workspace của user. Không tự query trực tiếp vì hàm này tự tạo nếu chưa có.

---

## Membership

> Nối User ↔ Workspace với role. Dùng cho Team plan khi nhiều người cùng workspace.

| Field | Ý nghĩa |
|-------|---------|
| `workspaceId` | |
| `userId` | |
| `role` | `owner` / `admin` / `member` / `viewer` |
| `invitedBy` | Ai mời người này vào |

---

## JobTemplate

> **"CV hồ sơ tìm việc" của user.** Đây là input cho mọi thứ: scraper dùng nó để biết cần scrape gì, AI dùng nó để biết cần chấm điểm dựa trên tiêu chí nào.

File: `lib/models/JobTemplate.ts`

**Nguồn gốc dữ liệu:** User gõ 1 prompt tự do → AI extract ra các field bên dưới → hiện vào CV Modal → user xem lại và chỉnh tay → bấm OK → lưu vào DB. Không có field nào hardcode hay do hệ thống tự điền.

**Prompt gốc của user:**

| Field | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `promptText` | Đúng nguyên văn prompt user đã gõ, lưu lại để debug và re-extract nếu cần | `"Tôi là motion designer 5 năm, giỏi AE và C4D, muốn remote $35/h"` |

**Phần AI extract từ prompt (user có thể chỉnh trong CV Modal):**

| Field | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `requirementText` | Tóm tắt lại prompt sau khi AI hiểu ngữ cảnh | `"Motion designer 5yr, AE+C4D, freelance remote min $35/h"` |
| `tracks` | Mảng ngành nghề | `["production", "art"]` |
| `skills` | Kỹ năng cụ thể | `["After Effects", "Cinema 4D"]` |
| `experience` | Level | `junior` / `mid` / `senior` / `lead` |
| `jobTypes` | Loại công việc mong muốn — giá trị hợp lệ: `freelance`, `contract`, `full_time`, `part_time` | `["freelance", "full_time"]` |
| `locationTypes` | Loại hình làm việc chấp nhận — giá trị hợp lệ: `remote`, `hybrid`, `onsite` | `["remote", "hybrid"]` |
| `minSalaryUsdHr` | Lương tối thiểu (USD/giờ) — dùng làm prefilter floor khi scrape | `35` |
| `mustBeRemote` | Shorthand: chỉ lấy remote hoàn toàn (tương đương `locationTypes: ["remote"]`) — dùng làm prefilter | `true` |
| `languages` | Ngôn ngữ làm việc | `["English", "Vietnamese"]` |
| `hardNO` | Tuyệt đối không muốn — dùng làm prefilter hard_no khi scrape | `["gaming", "crypto"]` |

**Phần AI sinh ra keywords (user có thể chỉnh trong CV Modal):**

| Field | Ý nghĩa |
|-------|---------|
| `generatedKeywords` | Từ khoá tổng quát cho mọi nguồn |
| `platformKeywords` | Từ khoá tối ưu riêng cho từng nguồn: `{"linkedin": [...], "remoteok": [...]}` |
| `keywordsVersion` | Tăng mỗi lần AI regenerate keywords |

**Cấu hình scrape:**

| Field | Ý nghĩa |
|-------|---------|
| `activeSources` | Nguồn nào đang bật: `["linkedin", "remoteok", "himalayas"]` |
| `blockedCompanies` | Blacklist công ty — user tự quản lý, không do AI sinh, dùng làm prefilter khi scrape |
| `scrapeSchedule` | Cron schedule tự động (default 8h sáng hàng ngày) |

---

## Job

> **Một listing job đã được scrape về.** Có 2 giai đoạn: mới scrape về (chưa analyzed) và đã được AI chấm điểm (analyzed). User tương tác với job qua dashboard cards.

File: `lib/models/Job.ts`

**Thông tin scrape về:**

| Field | Ý nghĩa |
|-------|---------|
| `jobId` | Hash MD5 của `title\|company\|url` — dùng để dedup |
| `url` | URL gốc của job |
| `source` | Nguồn: `linkedin`, `remoteok`, `himalayas`, `reddit`, `manual`... |
| `title`, `company` | |
| `salary` | `{ display: "$30-50/hr" }` |
| `description` | Mô tả job |
| `freshJob` | `true` = job mới chưa ai thấy, `false` = đã seen trước đó |

**Kết quả AI chấm (sau khi Analyze):**

| Field | Ý nghĩa |
|-------|---------|
| `analyzed` | Đã chấm chưa (`false` = đang chờ analyze) |
| `matchPct` | % phù hợp với profile user (0–100) |
| `action` | Khuyến nghị của AI: `"apply"` / `"save"` / `"skip"` / `null` |
| `track` | AI phân loại ngành: `production`, `code`, `art`... |
| `skillsMatched` | Kỹ năng nào của user khớp job này |
| `moat` | Lý do ngắn: tại sao nên/không nên apply |
| `whyYou` | Điểm mạnh của user so với yêu cầu job |
| `redFlags` | Cờ đỏ: công ty mờ ám, lương thấp, on-site... |
| `meta.gated` | `true` = Free tier đã vượt 10 job, không được chấm |
| `meta.deepAnalysis` | Kết quả deep analysis chi tiết (nếu đã chạy) |

**Trạng thái user tương tác:**

| Field | Ý nghĩa |
|-------|---------|
| `notInterested` | User bấm Skip → ẩn khỏi grid |
| `applicationStatus` | Pipeline: `tracking` → `applied` → `screening` → `interview` → `offer` / `rejected` |
| `applicationNotes` | Ghi chú cá nhân |
| `assigneeId` | Giao cho teammate nào (Team plan) |

**Quy tắc hiển thị trên card:**

| Điều kiện | Hiển thị |
|-----------|---------|
| `action:"apply"` + `matchPct >= 70` | Badge "TOP PICK" |
| `action:"skip"` | Badge "Skipped" |
| `meta.gated: true` | Hiện info nhưng không có % — "🔒 upgrade to score" |
| `notInterested: true` | Ẩn khỏi grid (trừ tab Skipped) |

---

## SeenJob

> Lưu hash của mọi job đã thấy để không scrape trùng. Trước đây lưu trong file `~/.job-seen-*.json` trên máy laptop (sau khi migrate M0 giờ lưu MongoDB).

| Field | Ý nghĩa |
|-------|---------|
| `templateId` | Hash này thuộc về template nào |
| `hash` | MD5 của `title\|company\|url` |

---

## RunLog

> **Lịch sử mọi loại tác vụ chạy nền** — scrape, analyze batch, AI agent task, keyword regen... Dùng chung 1 collection, phân biệt qua `runType`. Đủ general để làm log cho AI agent sau này.
>
> **Khác với `Usage`:** RunLog = log cấp session (1 task = 1 document, theo dõi trạng thái và kết quả). Usage = log cấp LLM call (1 lần gọi `arkChat()` = 1 document, theo dõi token và cost). 1 RunLog có thể sinh ra nhiều Usage (vd: analyze batch 1 RunLog → 5 Usage, mỗi Usage là 1 lần batch gọi AI).

File: `lib/models/RunLog.ts`

**Fields chung (mọi loại run):**

| Field | Ý nghĩa |
|-------|---------|
| `runType` | Loại tác vụ: `scrape` / `analyze` / `keyword_gen` / `agent_task` / `deep_analysis` / `cover_letter` |
| `workspaceId` | Workspace nào trigger |
| `userId` | User nào trigger |
| `templateId` | Template liên quan (nếu có) |
| `status` | `pending` → `running` → `done` / `error` / `stopped` |
| `triggeredBy` | `manual` / `cron` / `agent` / `api` |
| `startedAt` | Thời điểm bắt đầu thực sự chạy |
| `finishedAt` | Thời điểm kết thúc |
| `durationMs` | Tổng thời gian chạy |
| `stoppedByUser` | `true` nếu user bấm Dừng giữa chừng |
| `error` | Message lỗi nếu thất bại |
| `meta` | Object chứa dữ liệu riêng theo từng `runType` (xem bên dưới) |

**`meta` theo từng `runType`:**

| runType | meta chứa gì |
|---------|------------|
| `scrape` | `{ sources[], scraped, newJobs, blocked, prefiltered, stoppedByUser, sourceSummary: { linkedin: { found, new }, ... } }` |
| `analyze` | `{ total, scored, gated, batchCount }` |
| `keyword_gen` | `{ keywordsGenerated, platformCount, keywordsVersion }` |
| `agent_task` | `{ taskName, toolCalls[], stepCount, finalAction }` |
| `deep_analysis` | `{ jobId, stepCount }` |
| `cover_letter` | `{ jobId, wordCount }` |

---

## Subscription

> Trạng thái billing của 1 workspace. **Được tạo/update tự động qua webhook** từ Paddle hoặc VNPay — không tự tạo bằng tay.

| Field | Ý nghĩa |
|-------|---------|
| `workspaceId` | Mỗi workspace có tối đa 1 subscription |
| `provider` | `paddle` / `lemonsqueezy` / `vnpay` / `momo` / `manual` |
| `externalId` | ID subscription của provider (dùng để tra cứu khi nhận webhook) |
| `plan` | `free` / `personal` / `team` |
| `status` | `active` / `trialing` / `past_due` / `canceled` |
| `currentPeriodEnd` | Hết hạn lúc nào — nếu qua ngày này mà chưa gia hạn → hạ xuống free |
| `cancelAtPeriodEnd` | User đã hủy nhưng còn dùng đến hết kỳ |

---

## CreditWallet & CreditLedger

> **CreditWallet** là số dư hiện tại. **CreditLedger** là lịch sử mọi giao dịch (như sao kê ngân hàng).

**CreditWallet:**

| Field | Ý nghĩa |
|-------|---------|
| `workspaceId` | Mỗi workspace 1 ví |
| `balance` | Số credit còn (integer, không âm) |

**CreditLedger** (mỗi giao dịch là 1 document):

| Field | Ý nghĩa |
|-------|---------|
| `delta` | Dương = nạp vào, âm = tiêu đi |
| `reason` | `spend` / `purchase` / `plan_grant` / `refund` |
| `feature` | Tính năng nào dùng: `deep_analysis`, `cover_letter`... |
| `refId` | ID job/order để trace |

**Chi phí tính năng hiện tại:**

| Tính năng | Credit | Tương đương USD |
|-----------|--------|-----------------|
| Deep analysis | 2 | $0.02 (~2.5× cost thật) |
| Cover letter | 1 | $0.01 (~3× cost thật) |
| CV file | 2 | $0.02 |
| Market research | 1 | $0.01 |

⚠️ Số này cần cập nhật sau khi chạy `/api/admin/cost-report` để xem cost ARK thật.

---

## ProjectTask

> Chia nhỏ công việc cho từng job đang track. Ví dụ: "Viết cover letter", "Research công ty", "Apply trên website".

| Field | Ý nghĩa |
|-------|---------|
| `jobId` | Task này thuộc về job nào |
| `title` | Tên task |
| `estimateHours` | Ước tính mất bao lâu |
| `status` | `todo` → `in_progress` → `done` / `blocked` |
| `order` | Thứ tự trong list |
| `assigneeId` | Giao cho ai (Team plan) |

---

## Share

> Khi user muốn chia sẻ bundle job hoặc template cho người khác. Tạo ra 1 link public, người nhận click vào "Claim" để copy vào account của họ.

| Field | Ý nghĩa |
|-------|---------|
| `token` | Unique token trong URL: `/share/abc123` |
| `type` | `jobs` (gói job) hoặc `template` (hồ sơ tìm việc) |
| `payload` | Dữ liệu thực tế được share |
| `claims` | Danh sách `[{ userId, claimedAt }]` — ai đã nhận |
| `expiresAt` | Link hết hạn sau bao lâu |

---

## AgentMemory

> **AI "nhật ký" học từ user.** Sau mỗi run, agent phân tích kết quả và ghi lại những gì học được. Lần sau, những ghi chú này được inject vào prompt để AI chính xác hơn.

| Field | Ý nghĩa |
|-------|---------|
| `goodPatterns` | Những kiểu keyword/job cho kết quả tốt |
| `badPatterns` | Những kiểu nên tránh |
| `sourceInsights` | Nhận xét từng nguồn (vd "LinkedIn chủ yếu US-only") |
| `userPatterns` | Sở thích user suy ra từ hành vi (vd "Hay skip job esports") |
| `reflections` | Nhật ký sau mỗi run: "Tuần này thêm TouchDesigner, quality tăng 18%" |
| `bestKeywords` | Top 10 keyword đang work tốt |
| `worstKeywords` | Bottom 10 nên prune |

**Hiện tại:** model đã có, nhưng chỉ mới đọc khi generate keywords. Phần ghi (capture → inject → reflect) là feature cần build tiếp.

---

## KeywordMemory

> Track hiệu quả từng keyword theo thời gian. Keyword nào liên tục mang job tốt → giữ. Keyword nào cho toàn junk → bỏ.

| Field | Ý nghĩa |
|-------|---------|
| `keyword` | Từ khoá cụ thể |
| `totalJobsFound` | Tổng job tìm được qua keyword này |
| `relevantJobs` | Bao nhiêu job được AI chấm apply/save |
| `appliedJobs` | Bao nhiêu job user thực sự apply |
| `qualityScore` | `(relevantJobs × 2 + appliedJobs × 5) / totalJobsFound` |

---

## Usage

> Ghi lại mọi lần gọi AI. Là nguồn sự thật duy nhất để kiểm soát token, tính cost thực tế, và debug sự cố AI. **Mọi lần gọi `arkChat()` đều phải tạo 1 document Usage.**

| Field | Ý nghĩa |
|-------|---------|
| `requestId` | UUID sinh per-call — dùng để trace 1 request xuyên suốt log |
| `userId` | Ai trigger call này |
| `workspaceId` | Workspace nào |
| `type` | Tính năng gọi: `prompt_extract` / `keyword_gen` / `analyze` / `deep_analysis` / `cover_letter` / `chat` |
| `modelId` | Model ARK thực sự được dùng (sau rotation) |
| `modelAttempts` | Số lần thử model trước khi thành công (1 = không cần retry, >1 = có model bị 429) |
| `tokensIn` | Token input (bao gồm system prompt + context) |
| `tokensOut` | Token output |
| `cacheTokens` | Token đọc từ prompt cache (rẻ hơn ~10× so với tokensIn) |
| `costUsd` | Chi phí ước tính theo giá model (đã tính cacheTokens với giá cache) |
| `latencyMs` | Thời gian từ lúc gọi đến lúc nhận xong response |
| `success` | `true` / `false` |
| `error` | Message lỗi nếu `success: false` |
| `promptSnippet` | 200 ký tự đầu của prompt — đủ để debug, không lưu toàn bộ |
| `createdAt` | Timestamp |

**Dùng để làm gì:**

| Mục đích | Cách dùng |
|---------|----------|
| Kiểm soát chi phí | Group theo `type` → average `costUsd` → chốt giá credit |
| Debug AI trả sai | Tìm theo `requestId` → xem `promptSnippet` + `modelId` + `error` |
| Monitor quota ARK | Filter `modelAttempts > 1` → biết model nào hay bị 429 |
| Theo dõi latency | P95 `latencyMs` theo `type` → phát hiện model chậm |
| Cost per user | Group theo `userId` + `type` trong tháng |

**Admin endpoint:** `GET /api/admin/cost-report` — query collection này, group theo `type` và `modelId`.

---

## Asset & Purchase *(chưa build — post-MVP)*

> Marketplace bán mẫu CV/cover-letter. User mua 1 lần, dùng mãi.

**Asset** — mẫu đang bán:

| Field | Ý nghĩa |
|-------|---------|
| `name` | Tên mẫu |
| `type` | `cv` / `cover_letter` |
| `priceUsd` | Giá |
| `previewUrl` | Ảnh demo |

**Purchase** — lịch sử mua:

| Field | Ý nghĩa |
|-------|---------|
| `workspaceId` | Ai mua |
| `assetId` | Mua cái gì |
| `provider` | Qua provider nào |
| `paidUsd` | Đã trả bao nhiêu |
