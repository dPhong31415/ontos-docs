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

**Phần user nhập (qua chat onboarding hoặc form):**

| Field | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `requirementText` | Free-text mô tả bản thân, AI đọc để hiểu ngữ cảnh | "Tôi là motion designer 5 năm, giỏi AE và C4D..." |
| `tracks` | Mảng ngành nghề | `["production", "art"]` |
| `skills` | Kỹ năng cụ thể | `["After Effects", "Cinema 4D"]` |
| `experience` | Level | `junior` / `mid` / `senior` / `lead` |
| `jobTypes` | Loại công việc mong muốn | `["freelance", "contract"]` |
| `minSalaryUsdHr` | Lương tối thiểu (USD/giờ) | `35` |
| `mustBeRemote` | Chỉ lấy remote | `true` |
| `languages` | Ngôn ngữ làm việc | `["English", "Vietnamese"]` |
| `hardNO` | Tuyệt đối không muốn | `["gaming", "crypto"]` |

**Phần AI sinh ra (user có thể chỉnh):**

| Field | Ý nghĩa |
|-------|---------|
| `generatedKeywords` | Từ khoá tổng quát cho mọi nguồn |
| `platformKeywords` | Từ khoá tối ưu riêng cho từng nguồn: `{"linkedin": [...], "remoteok": [...]}` |
| `keywordsVersion` | Tăng mỗi lần AI regenerate keywords |

**Cấu hình scrape:**

| Field | Ý nghĩa |
|-------|---------|
| `activeSources` | Nguồn nào đang bật: `["linkedin", "remoteok", "himalayas"]` |
| `blockedCompanies` | Công ty không muốn thấy |
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

## ScrapeRun

> Lịch sử mỗi lần scrape. Vercel cron và user thủ công đều tạo ScrapeRun.

| Field | Ý nghĩa |
|-------|---------|
| `status` | `pending` → `scraping` → `analyzing` → `done` / `error` / `stopped` |
| `triggeredBy` | `manual`, `cron`, `api` |
| `scraped` | Bao nhiêu job đã kéo về |
| `analyzed` | Bao nhiêu job đã được AI chấm |

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

> Ghi lại mọi lần gọi AI. Dùng để tính cost thực tế và cấu hình giá credit.

| Field | Ý nghĩa |
|-------|---------|
| `type` | Tính năng nào gọi: `analyze` / `keyword_gen` / `chat` / `deep_analysis` |
| `modelId` | Model ARK nào được chọn lần đó |
| `tokensIn` / `tokensOut` | Token đã dùng |
| `costUsd` | Chi phí ước tính |
| `latencyMs` | Tốc độ response |

**Dùng để làm gì:** `GET /api/admin/cost-report` query collection này, group theo `type`, tính average cost/lần → đây là số thật để chốt giá credit.

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
