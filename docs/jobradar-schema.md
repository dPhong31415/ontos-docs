---
id: jobradar-schema
title: Schema & Models
sidebar_label: 🗄 Schema & Models
sidebar_position: 3
---

# Schema & Models

Tất cả schema dùng Mongoose, DB: MongoDB Atlas, database name: `jobagent`.

---

## User

File: `lib/models/User.ts` · Collection: `users`

| Field | Type | Mô tả |
|-------|------|-------|
| `clerkUserId` | String (unique) | ID từ Clerk, dùng để lookup user |
| `email` | String | Email đăng nhập |
| `displayName` | String | Tên hiển thị |
| `color` | String | Màu avatar (default `#7c6af7`) |
| `lastActiveAt` | Date | Lần cuối dùng app |
| `createdAt` | Date | Auto (timestamps) |

---

## Workspace

File: `lib/models/Workspace.ts` · Collection: `workspaces`

| Field | Type | Mô tả |
|-------|------|-------|
| `name` | String | Tên workspace (vd "Personal", "Team XYZ") |
| `slug` | String (unique) | URL-safe ID, auto-gen từ userId (vd `personal-a1b2c3d4`) |
| `ownerId` | ObjectId → User | Người tạo |
| `plan` | `"free"` / `"personal"` / `"team"` / `"enterprise"` | Gói hiện tại, sync từ Subscription |
| `type` | `"personal"` / `"team"` / `"org"` | Loại workspace |
| `logoUrl` | String | URL logo (optional) |
| `clerkOrgId` | String | ID tổ chức Clerk (nếu dùng Clerk org) |
| `inviteToken` | String | Token mời thành viên |
| `parentWorkspaceId` | ObjectId → Workspace | Dự phòng B2B2B (hiện null) |

**Lưu ý:** Mỗi user khi đăng nhập lần đầu tự có 1 workspace `type:"personal"`. Gọi `getOrCreatePersonalWorkspace(userId)` từ `lib/workspace.ts`.

---

## Membership

File: `lib/models/Membership.ts` · Collection: `memberships`

| Field | Type | Mô tả |
|-------|------|-------|
| `workspaceId` | ObjectId → Workspace | |
| `userId` | ObjectId → User | |
| `role` | `"owner"` / `"admin"` / `"member"` / `"viewer"` | Quyền hạn |
| `invitedBy` | ObjectId → User | Ai mời |
| `joinedAt` | Date | |

Index unique: `(workspaceId, userId)`

---

## JobTemplate

File: `lib/models/JobTemplate.ts` · Collection: `jobtemplates`

"CV hồ sơ tìm việc" của user — agent dùng cái này để scrape + analyze.

| Field | Type | Mô tả |
|-------|------|-------|
| `userId` | ObjectId → User | Chủ template |
| `workspaceId` | ObjectId → Workspace | Workspace chứa |
| `name` | String | Tên template (vd "Phong — Production 2026") |
| `isDefault` | Boolean | Template mặc định khi scrape/analyze |
| `isActive` | Boolean | Có đang dùng không |
| `requirementText` | String | Free-text mô tả bản thân (Claude đọc để sinh keywords) |
| `tracks` | String[] | Mảng track: `production`, `code`, `art`, `design`, `music`, `writing` |
| `skills` | String[] | Kỹ năng cụ thể: `["After Effects", "Cinema 4D", "Blender"]` |
| `experience` | String | Level: `junior`, `mid`, `senior`, `lead` |
| `jobTypes` | String[] | Loại: `freelance`, `contract`, `full-time`, `part-time` |
| `minSalaryUsdHr` | Number | Lương tối thiểu (USD/giờ), 0 = không giới hạn |
| `mustBeRemote` | Boolean | Chỉ lấy remote |
| `locations` | String[] | Địa điểm ưa thích |
| `languages` | String[] | Ngôn ngữ: `["English", "Vietnamese"]` |
| `hardNO` | String[] | Từ khoá loại bỏ: `["gaming", "crypto", "children"]` |
| `generatedKeywords` | String[] | Keywords do AI sinh ra (generic, cho mọi source) |
| `platformKeywords` | Map\<string, string[]> | Keywords tối ưu cho từng source (`{"linkedin": [...], "remoteok": [...]}`) |
| `keywordsGeneratedAt` | Date | Lần cuối regenerate keywords |
| `keywordsVersion` | Number | Tăng mỗi lần regenerate |
| `activeSources` | String[] | Nguồn đang bật: `["linkedin", "remoteok", "himalayas"]` |
| `blockedCompanies` | String[] | Công ty bị block riêng của template này |
| `urlWatchList` | String[] | URL cụ thể để watch (ATS pages) |
| `scrapeSchedule` | String | Cron schedule (default `"0 8 * * *"`) |
| `lastScrapedAt` | Date | |
| `lastAnalyzedAt` | Date | |

---

## Job

File: `lib/models/Job.ts` · Collection: `jobs`

| Field | Type | Mô tả |
|-------|------|-------|
| `jobId` | String | Hash MD5 của title\|company\|url |
| `url` | String | URL job gốc (dùng để dedup) |
| `source` | String | Nguồn: `linkedin`, `remoteok`, `himalayas`, `reddit`, `manual`... |
| `userId` | ObjectId → User | Chủ |
| `workspaceId` | ObjectId → Workspace | Workspace |
| `templateId` | ObjectId → JobTemplate | Template tìm ra job này |
| `scrapeRunId` | ObjectId → ScrapeRun | Run nào tìm ra |
| `title` | String | Tên vị trí |
| `company` | String | Tên công ty |
| `salary` | Mixed | `{ display: "$30-50/hr" }` hoặc string |
| `description` | String | Mô tả job |
| `techStack` | String[] | Tech stack phát hiện được |
| `seniority` | String | `junior`, `mid`, `senior`, `lead` |
| `remote` | Boolean | Có remote không |
| `scrapedAt` | Date | Thời điểm scrape |
| `freshJob` | Boolean | `true` = mới scrape, chưa seen trước đó |
| `seenCount` | Number | Đã xuất hiện bao nhiêu lần trong các run |
| `analyzed` | Boolean | Đã được AI chấm điểm chưa |
| `matchPct` | Number | % phù hợp (0-100), do AI tính |
| `action` | `"apply"` / `"save"` / `"skip"` / null | Khuyến nghị của AI |
| `track` | String | Track phát hiện: `production`, `code`, `art`... |
| `skillsMatched` | String[] | Kỹ năng khớp với profile user |
| `moat` | String | Lý do ngắn gọn vì sao nên/không nên apply |
| `whyYou` | String[] | Điểm mạnh của user với job này |
| `redFlags` | String[] | Cờ đỏ (công ty mờ ám, lương thấp...) |
| `meta.reasoning` | String | Reasoning đầy đủ của AI |
| `meta.confidence` | Number | Độ tự tin AI (0-100) |
| `meta.gated` | Boolean | `true` = Free tier đã hết 10 job, không chấm nữa |
| `meta.deepAnalysis` | Object | Kết quả deep analysis (xem dưới) |
| `applied` | Boolean | User đã apply chưa |
| `appliedAt` | Date | |
| `notInterested` | Boolean | User bấm Skip |
| `skipReason` | String | Lý do skip |
| `applicationStatus` | `"tracking"` / `"applied"` / `"screening"` / `"interview"` / `"offer"` / `"rejected"` | Pipeline ứng tuyển |
| `applicationNotes` | String | Ghi chú của user |
| `applicationUrl` | String | URL apply (override url gốc) |
| `assigneeId` | ObjectId → User | Giao cho ai (Team plan) |

**Index quan trọng:**
- `(userId, url)` unique — dedup per user
- `(userId, action, matchPct)` — query jobs tab
- `(workspaceId, action, matchPct)` — team mode

---

## SeenJob

File: `lib/models/SeenJob.ts` · Collection: `seenjobs`

Dedup scraper — thay file `~/.job-seen-*.json` (không còn dùng).

| Field | Type | Mô tả |
|-------|------|-------|
| `templateId` | ObjectId → JobTemplate | |
| `hash` | String | MD5 của title\|company\|url |
| `seenAt` | Date | |

Index unique: `(templateId, hash)`

---

## ScrapeRun

File: `lib/models/ScrapeRun.ts` · Collection: `scraperuns`

| Field | Type | Mô tả |
|-------|------|-------|
| `templateId` | ObjectId | |
| `userId` | ObjectId | |
| `workspaceId` | ObjectId | |
| `status` | `"pending"` / `"scraping"` / `"analyzing"` / `"done"` / `"error"` / `"stopped"` | |
| `triggeredBy` | String | `"manual"`, `"cron"`, `"api"` |
| `scraped` | Number | Số job đã scrape |
| `analyzed` | Number | Số job đã analyze |
| `startedAt` | Date | |
| `scrapedAt` | Date | |
| `analyzedAt` | Date | |

---

## Subscription

File: `lib/models/Subscription.ts` · Collection: `subscriptions`

| Field | Type | Mô tả |
|-------|------|-------|
| `workspaceId` | ObjectId (unique) | Mỗi workspace 1 subscription |
| `provider` | `"paddle"` / `"lemonsqueezy"` / `"vnpay"` / `"momo"` / `"manual"` | |
| `externalId` | String | ID subscription của provider |
| `plan` | `"free"` / `"personal"` / `"team"` / `"enterprise"` | |
| `status` | `"active"` / `"trialing"` / `"past_due"` / `"canceled"` / `"incomplete"` | |
| `seats` | Number | Số slot thành viên (Team plan) |
| `currentPeriodEnd` | Date | Hết hạn kỳ hiện tại |
| `cancelAtPeriodEnd` | Boolean | Có tự hủy sau kỳ này không |
| `metadata` | Mixed | Raw event từ provider để debug |

---

## CreditWallet & CreditLedger

Files: `lib/models/CreditWallet.ts` · Collections: `creditwallets`, `creditleaders`

**CreditWallet** — số dư hiện tại:

| Field | Type | Mô tả |
|-------|------|-------|
| `workspaceId` | ObjectId (unique) | |
| `balance` | Number | Số credit còn (integer, min 0) |
| `updatedAt` | Date | |

**CreditLedger** — lịch sử giao dịch:

| Field | Type | Mô tả |
|-------|------|-------|
| `workspaceId` | ObjectId | |
| `delta` | Number | Dương = nạp, âm = tiêu |
| `reason` | String | `"spend"`, `"purchase"`, `"plan_grant"`, `"refund"` |
| `feature` | String | `"deep_analysis"`, `"cover_letter"`, `"cv_file"`... |
| `refId` | ObjectId | ID job/order để trace |
| `createdAt` | Date | |

**Credit cost mặc định** (trong `lib/entitlements.ts`):

| Feature | Credit |
|---------|--------|
| `deep_analysis` | 2 |
| `cover_letter` | 1 |
| `cv_file` | 2 |
| `market_research` | 1 |
| `analyze_extra` | 0 (trong plan) |

---

## ProjectTask

File: `lib/models/ProjectTask.ts` · Collection: `projecttasks`

| Field | Type | Mô tả |
|-------|------|-------|
| `jobId` | ObjectId → Job | Job này thuộc về task nào |
| `workspaceId` | ObjectId → Workspace | |
| `assigneeId` | ObjectId → User | Giao cho ai |
| `title` | String | Tên task (vd "Viết cover letter", "Research công ty") |
| `estimateHours` | Number | Ước tính giờ làm |
| `status` | `"todo"` / `"in_progress"` / `"done"` / `"blocked"` | |
| `order` | Number | Thứ tự trong list |
| `notes` | String | Ghi chú |

---

## Share

File: `lib/models/Share.ts` · Collection: `shares`

| Field | Type | Mô tả |
|-------|------|-------|
| `token` | String (unique) | Token URL (vd `abc123`) → `/share/abc123` |
| `fromUserId` | ObjectId → User | Người tạo share |
| `workspaceId` | ObjectId | |
| `type` | `"jobs"` / `"template"` | Loại share |
| `title` | String | Tiêu đề hiển thị |
| `itemCount` | Number | Số job/keyword |
| `payload` | Mixed | Dữ liệu job/template được share |
| `claims` | `[{ userId, claimedAt }]` | Ai đã nhận |
| `expiresAt` | Date | Hết hạn |

---

## AgentMemory

File: `lib/models/AgentMemory.ts` · Collection: `agentmemories`

| Field | Type | Mô tả |
|-------|------|-------|
| `templateId` | ObjectId (unique) | Per template |
| `userId` | ObjectId | |
| `goodPatterns` | String[] | Pattern keyword cho kết quả tốt |
| `badPatterns` | String[] | Pattern cần tránh |
| `sourceInsights` | Map\<string, string> | Nhận xét từng source |
| `userPatterns` | String[] | Sở thích suy ra từ hành vi apply/skip |
| `companyPatterns` | String[] | Nhận xét công ty |
| `reflections` | `[{ date, runId, text }]` | Nhật ký tự review sau mỗi run |
| `bestKeywords` | String[] | Top 10 keyword theo qualityScore |
| `worstKeywords` | String[] | Bottom 10 (ứng viên prune) |
| `totalRunsAnalyzed` | Number | Tổng run đã qua |
| `lastReflectionAt` | Date | |
| `version` | Number | Tăng mỗi lần cập nhật |

---

## KeywordMemory

File: `lib/models/KeywordMemory.ts` · Collection: `keywordmemories`

| Field | Type | Mô tả |
|-------|------|-------|
| `templateId` | ObjectId | |
| `userId` | ObjectId | |
| `keyword` | String | Keyword cụ thể |
| `totalJobsFound` | Number | Tổng job tìm được từ keyword này |
| `relevantJobs` | Number | Job được AI chấm apply/save |
| `appliedJobs` | Number | Job user thực sự apply |
| `skippedJobs` | Number | Job bị skip |
| `qualityScore` | Number | `(relevantJobs×2 + appliedJobs×5) / totalJobsFound` (0-1) |
| `agentNotes` | String | Ghi chú của AI về keyword này |
| `runsUsed` | Number | Số run đã dùng keyword |
| `lastUsedAt` | Date | |

Index unique: `(templateId, keyword)`

---

## Usage

File: `lib/models/Usage.ts` · Collection: `usages`

Mỗi lần gọi LLM ghi 1 record.

| Field | Type | Mô tả |
|-------|------|-------|
| `workspaceId` | ObjectId | |
| `userId` | ObjectId | |
| `type` | `"analyze"` / `"keyword_gen"` / `"chat"` / `"deep_analysis"` | Loại call |
| `modelId` | String | Model ARK đã dùng |
| `label` | String | Label tự đặt (vd `"analyze 20"`, `"radar-chat"`) |
| `tokensIn` | Number | Prompt tokens |
| `tokensOut` | Number | Completion tokens |
| `cached` | Number | Cached tokens |
| `latencyMs` | Number | Thời gian response (ms) |
| `costUsd` | Number | Chi phí ước tính (USD) |
| `createdAt` | Date | |
