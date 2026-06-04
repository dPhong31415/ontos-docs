---
id: jobradar-features
title: Tính năng
sidebar_label: 🎯 Tính năng
sidebar_position: 2
---

# Tính năng — MVP & Post-MVP

> Trang này là **danh sách tính năng đã chốt** cho từng giai đoạn. Dùng để:
> - Chia sprint cho dev
> - Prompt agent "build tính năng X theo spec này"
> - Kiểm tra xem đã làm đúng chưa

---

## MVP — Phải có trước khi charge tiền

### 1. Chat Onboarding (tạo hồ sơ tìm việc)

**Mục đích:** User mới vào app chưa có gì. Chat là điểm vào duy nhất — agent hỏi từng câu, cuối cùng tạo ra "CV template" để app biết cần tìm job gì cho user này.

**Luồng:**
1. User mở app lần đầu → thấy chat (không thấy grid job)
2. Radar agent hỏi theo thứ tự:
   - "Bạn đang tìm loại công việc gì?" → role/track
   - "Kỹ năng chính của bạn?" → skills
   - "Mấy năm kinh nghiệm?" → experience level
   - "Lương mong muốn?" → minSalaryUsdHr
   - "Chỉ remote hay ok hybrid/onsite?" → mustBeRemote
   - "Làm việc bằng ngôn ngữ nào?" → languages
   - "Ngành/công ty không muốn?" → hardNO
3. Agent gọi tool `create_template` → tạo `JobTemplate` trong DB
4. Hiện thông báo "Hồ sơ tạo xong → tiếp theo: sinh keywords"

**File liên quan:** `lib/agent/graph.ts`, `lib/agent/tools.ts` (tool `create_template`), `app/api/chat/route.ts`

**Trạng thái:** ✅ Backend xong. ⬜ Frontend cần: chat full-width khi chưa có template (hiện đang làm).

---

### 2. Sinh Keywords tối ưu

**Mục đích:** "video editor remote" trên LinkedIn cho kết quả khác với trên RemoteOK. AI sinh từ khoá riêng cho từng nền tảng dựa trên profile user.

**Luồng:**
1. User bấm "Generate Keywords" hoặc agent gợi ý sau khi tạo template
2. `POST /api/keywords/generate` → đọc `requirementText` + `tracks` + `skills`
3. AI sinh: `generatedKeywords[]` (generic) + `platformKeywords{}` (theo source)
4. User xem + chỉnh nếu muốn
5. Lưu vào `JobTemplate`

**Output ví dụ:**
```json
{
  "generatedKeywords": ["video editor remote", "motion designer freelance"],
  "platformKeywords": {
    "linkedin": ["motion designer", "video editor remote"],
    "remoteok": ["after-effects", "cinema-4d"],
    "reddit": ["hiring video editor remote"]
  }
}
```

**File liên quan:** `lib/keyword-generator.ts`, `app/api/keywords/generate/route.ts`

**Trạng thái:** ✅ Xong.

---

### 3. Scrape Job

**Mục đích:** Tự động kéo job từ 14 nguồn về database theo keywords và sources đã config.

**Nguồn đang support:** LinkedIn, RemoteOK, Himalayas, WeWorkRemotely, Remotive, Wellfound, Remote.co, Indeed, Dribbble, ArtStation, Coroflot, Freelancer, ITviec, TopDev, VietnamWorks, Reddit (và các nguồn VN: TopCV, Glints, CareerViet...)

**Luồng:**
1. User bấm "Scrape" (hoặc cron tự chạy lúc 1h sáng)
2. Vercel gọi Render worker
3. Worker chạy `job_scraper.py` với config (keywords, sources, blocked_companies)
4. Mỗi job: hash MD5 → check `SeenJob` → nếu mới → ghi vào `jobs` collection
5. Stream progress về browser realtime

**Gate:** Free được scrape nhiều, nhưng AI chỉ chấm 10 job đầu.

**File liên quan:** `runner/server.py`, `scripts/scripts/job_scraper.py`, `app/api/scrape/trigger/route.ts`

**Trạng thái:** ✅ Xong. ⬜ Cần monitor khi Render cold start (~50s delay).

---

### 4. AI Chấm điểm Job (Analyze)

**Mục đích:** Thay vì user phải đọc từng job, AI đọc hết và cho điểm % phù hợp + khuyến nghị apply/save/skip.

**Output cho mỗi job:**

| Field | Ý nghĩa | Ví dụ |
|-------|---------|-------|
| `matchPct` | % phù hợp (0–100) | `78` |
| `action` | Khuyến nghị | `"apply"` / `"save"` / `"skip"` |
| `track` | Ngành phát hiện | `"production"` |
| `skillsMatched` | Kỹ năng khớp | `["After Effects", "C4D"]` |
| `moat` | Lý do ngắn | `"Remote explicit, rate market rate"` |
| `whyYou` | Điểm mạnh của bạn | `["5yr AE experience matches JD"]` |
| `redFlags` | Cờ đỏ | `["Company track record unclear"]` |

**Gate Free tier:** Chỉ chấm 10 job đầu. Job thứ 11 trở đi → `meta.gated: true` → card hiện info nhưng không có %. Muốn hơn → upgrade Personal.

**File liên quan:** `lib/analyze.ts`, `app/api/analyze/[templateId]/route.ts`

**Trạng thái:** ✅ Xong kể cả gate.

---

### 5. Job Cards — Grid & List view

**Mục đích:** Hiển thị job đã chấm điểm theo dạng card dễ nhìn. User quyết định nhanh: choose hoặc skip.

**Các tab:**

| Tab | Hiển thị |
|-----|---------|
| Analyzed | Tất cả job đã chấm (trừ skip) |
| Top Picks | Job có `action:"apply"` + `matchPct >= 70` |
| Deep | Job đã chạy deep analysis |
| Applied | Job đã apply |
| To Analyze | Job chưa chấm |
| Skipped | Job đã skip |

**Actions trên card:**
- **"✚ choose"** → set `applicationStatus: "tracking"` → job vào Tracker
- **"✕ skip"** → set `notInterested: true` → ẩn khỏi grid ngay lập tức
- **"Deep Analysis"** → chạy deep analysis (Personal+, tốn 2 credit)
- **"View JD"** → mở URL gốc

**Gated card:** Khi `meta.gated: true` → không hiện matchPct, hiện "🔒 upgrade to score" thay vào.

**View toggle:** Grid (mặc định) hoặc List (compact, nhiều job/màn hình hơn).

**File liên quan:** `app/(app)/dashboard/page.tsx`

**Trạng thái:** ✅ Xong. ⬜ Filter sidebar (theo source, salary range, track) chưa đầy đủ.

---

### 6. Deep Analysis

**Mục đích:** AI phân tích sâu hơn cho 1 job cụ thể — nghiên cứu công ty, so sánh lương thị trường, đánh giá xác suất được hire.

**Output deep analysis:**

| Phần | Nội dung |
|------|---------|
| Company legitimacy | Legit / Sketchy / Unknown + lý do |
| Skills fit | % kỹ năng match + thiếu gì |
| Market rate | Low/Mid/High USD/hr, so sánh với mức đăng |
| Hire probability | % xác suất được hire |
| Verdict | apply / save / skip + summary |

**Luồng:**
1. User bấm "Deep Analysis" trên card
2. Check entitlement: cần Personal+ → nếu Free thì 402
3. Check credit: cần 2 credit → nếu hết thì 402
4. Trừ 2 credit ngay
5. Chạy multi-step analysis (SSE stream về browser)
6. Nếu lỗi giữa chừng → tự hoàn 2 credit
7. Lưu kết quả vào `job.meta.deepAnalysis`

**Gate:** Personal+ plan. Tốn 2 credit. Free → hard paywall.

**File liên quan:** `lib/deep-analyze.ts`, `app/api/jobs/[id]/deep/route.ts`

**Trạng thái:** ✅ Xong.

---

### 7. Cover Letter & Proposal

**Mục đích:** Dựa trên kết quả deep analysis + profile user, AI viết cover letter và đề xuất giá cho job.

**Output:**
- Cover letter cá nhân hoá (không generic)
- Pricing tiers: Low / Mid / High (dựa trên market rate)
- Task breakdown ước tính

**Gate:** Personal+ plan. Tốn 1 credit. Free → hard paywall.

**File liên quan:** `app/api/jobs/[id]/propose/route.ts`, `components/ProposalPanel.tsx`

**Trạng thái:** ✅ Xong.

---

### 8. Project Tracker

**Mục đích:** Theo dõi tiến độ apply cho các job đã choose. Mỗi job có pipeline status và task breakdown.

**Pipeline status:** `tracking` → `applied` → `screening` → `interview` → `offer` / `rejected`

**Task breakdown:** Mỗi job có list task (vd "Viết cover letter", "Research công ty", "Apply") với estimate giờ và status riêng.

**Gate:** Personal+ plan. Free → 402.

**File liên quan:** `app/(app)/tracker/page.tsx`, `app/api/jobs/[id]/tasks/route.ts`

**Trạng thái:** ✅ Xong. ⬜ UI giao task cho teammate chưa có.

---

### 9. Share Job Bundle (Team)

**Mục đích:** Team member chia sẻ bộ job đã analyze cho người khác. Người nhận claim về account của mình.

**Gate:** Team plan. Free/Personal → không tạo được share link.

**Luồng:**
1. User chọn nhiều job → "Share"
2. Tạo Share với token unique, hết hạn sau 7 ngày
3. Link public: `/share/abc123` → người khác xem preview
4. Bấm "Claim" → jobs copy vào account người nhận (đã analyzed, không tốn token)
5. Nếu claim lại → `hasClaimed: true` → hiện badge đã nhận

**File liên quan:** `app/api/share/route.ts`, `app/api/share/[token]/route.ts`, `app/share/[token]/page.tsx`

**Trạng thái:** ✅ Xong.

---

### 10. Import Job bằng URL

**Mục đích:** User thấy job hay ở nơi nào đó (Reddit, ATS page, link bạn gửi) → paste URL → app tự fetch + analyze.

**Hỗ trợ:**
- URL bất kỳ: fetch HTML, AI extract title/company/description
- Reddit post: parse từ URL slug (không fetch vì Reddit block server)
- Bulk import: paste nhiều URL cùng lúc

**File liên quan:** `app/api/jobs/import/route.ts`, `app/api/jobs/import-url/route.ts`

**Trạng thái:** ✅ Xong.

---

### 11. Billing & Subscription

**Mục đích:** Thu tiền user. Dùng 2 provider vì ngân hàng chủ ở Việt Nam.

**Thanh toán quốc tế:** Paddle hoặc LemonSqueezy (Merchant of Record) — họ xử lý VAT, tax, chuyển về ngân hàng VN. Phí ~5%.

**Thanh toán nội địa VN:** VNPay hoặc MoMo — trả VND.

**Luồng kỹ thuật:**
1. User checkout trên Paddle/VNPay
2. Provider gửi webhook đến jobradar
3. jobradar verify chữ ký → upsert `Subscription` → grant credit → update `Workspace.plan`
4. Từ lúc này `getEntitlements()` trả đúng tier mới

**File liên quan:** `app/api/billing/webhook-mor/route.ts`, `app/api/billing/webhook-vn/route.ts`

**Trạng thái:** ✅ Code xong. ⬜ Chưa có tài khoản provider thật. ⬜ Chưa có checkout UI.

---

### 12. Admin Dashboard

**Mục đích:** Owner theo dõi hệ thống, xem cost, quản lý user/subscription.

**Các section:**
- Cost report: token + $ spend theo tính năng (từ Usage collection)
- Subscriptions: danh sách workspace, plan, credit balance
- Scrape health: run đang chạy, lỗi gần đây
- Per-user control: xem data, force downgrade, manual credit grant

**File liên quan:** `app/(app)/admin/page.tsx`, `app/api/admin/`

**Trạng thái:** ✅ Backend xong. ⬜ Frontend section billing/cost chưa có.

---

## Post-MVP — Sau khi có revenue

### Agent Memory Loop (tự cải thiện)

**Vấn đề:** Hiện tại AI chấm điểm dựa trên profile tĩnh. Không học từ hành vi user.

**Kế hoạch:**

**Capture** — ghi lại mỗi khi user tương tác:
- User skip job → ghi `userPatterns: ["Hay skip esports jobs"]`
- User apply job → tăng `KeywordMemory.appliedJobs`
- User feedback qua chat → ghi `AgentMemory.badPatterns`

**Inject** — lần sau AI dùng memory khi chạy:
- `generateKeywords()` đọc `AgentMemory.goodPatterns` → ưu tiên keyword tương tự
- Analyze prompt chèn `userPatterns` → AI hiểu sở thích user

**Reflect** — scheduled job review:
- Xem lại job bị skip gần đây so với patterns mới
- Prune keyword qualityScore < 0.1 sau 3+ run
- Ghi `AgentMemory.reflections`

**File liên quan:** `lib/models/AgentMemory.ts`, `lib/models/KeywordMemory.ts`, `lib/keyword-generator.ts`

---

### MCP Server

**Vấn đề:** Agent tools chỉ dùng được trong app. Muốn partner hoặc tool khác drive jobradar.

**Kế hoạch:** Expose `lib/agent/tools.ts` qua MCP endpoint `/api/mcp`. Cùng tools, cùng workspace-scoped, nhưng gọi được từ Claude Desktop, Cursor, hoặc custom app khác.

---

### Marketplace Template

**Vấn đề:** Người dùng muốn CV/cover letter xịn hơn template mặc định.

**Kế hoạch:** 
- `Asset` model: mỗi mẫu có giá, preview, loại (cv/cover_letter)
- `Purchase` model: lưu lịch sử mua
- Mua 1 lần, dùng mãi
- Creator (owner hoặc community) upload template

---

### Agent-core tách repo

**Vấn đề:** Muốn build app #2, #3 dùng chung AI layer.

**Kế hoạch:** Khi contract API ổn định, tách `lib/agent/` + `lib/byteplus.ts` thành repo `agent-core` riêng. Expose qua HTTP/SDK. jobradar import qua HTTP thay vì import trực tiếp.

---

### Tính năng phụ khác

| Tính năng | Mô tả | Độ ưu tiên |
|-----------|-------|------------|
| Annual plan | Giảm giá khi trả năm | Medium |
| Referral | Invite bạn được credit | Low |
| Mobile/PWA | Xem job trên điện thoại | Medium |
| B2B2B | Agency quản lý nhiều client | Low |
| A/B pricing | Test giá khác nhau | Low |
| More scrapers | Toptal, Contra, 99designs... | Medium |
