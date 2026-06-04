---
id: jobradar-system-design
title: System Design
sidebar_label: 🏗 System Design
sidebar_position: 2
---

# System Design

> Trang này giải thích **các thành phần của hệ thống, chúng nói chuyện với nhau thế nào, và tại sao thiết kế như vậy**. Đọc trước khi đụng vào code.

---

## Bức tranh toàn cảnh

jobradar gồm 3 thứ chạy riêng biệt:

```
┌─────────────────────────────────────────────────────┐
│  1. Web App (Next.js) — Vercel                       │
│     • Giao diện user                                 │
│     • API endpoints                                  │
│     • Xử lý auth, billing, agent chat               │
└──────────────┬─────────────────┬───────────────────┘
               │                 │
        Gọi AI (HTTP)     Lưu dữ liệu (Mongoose)
               │                 │
    ┌──────────▼──────┐  ┌───────▼──────────┐
    │ BytePlus ARK    │  │  MongoDB Atlas   │
    │ (AI/LLM)        │  │  (database)      │
    │ 8 models, paid  │  │  16 collections  │
    └─────────────────┘  └──────────────────┘

┌─────────────────────────────────────────────────────┐
│  2. Scraper Worker — Render (Docker)                 │
│     • Luôn chạy, không bị timeout                   │
│     • Nhận lệnh scrape từ Web App                   │
│     • Chạy Python scrapers → ghi job vào MongoDB    │
│     • KHÔNG xử lý AI, không xử lý auth              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  3. Clerk — auth provider bên ngoài                 │
│     • Quản lý đăng nhập, session                    │
│     • jobradar dùng Clerk SDK, không tự làm auth    │
└─────────────────────────────────────────────────────┘
```

**Tại sao tách Worker riêng?** Vercel function có timeout 300s tối đa. Scrape LinkedIn có thể mất 10–30 phút. → Cần process riêng chạy độc lập.

---

## Luồng 1: View Chat First — Onboarding & tạo profile

Entry point duy nhất khi user mới vào app. Không có template → không thấy Jobs page.

**UI:** khung input ở giữa. Bên dưới là các thẻ gợi ý tĩnh — không thay đổi, không do AI sinh ra — để user biết cần điền gì vào prompt:

| Thẻ gợi ý |
|-----------|
| Chuyên môn của bạn là gì? |
| Kinh nghiệm nghề nghiệp của bạn? |
| Mức lương mong muốn? |
| Loại hình làm việc (remote / hybrid / onsite)? |
| Kỹ năng nổi bật của bạn? |

User đọc thẻ → tự gõ prompt mô tả bản thân → submit. Không có vòng hỏi-đáp với AI.

```
User gõ prompt tự do vào khung input
  (ví dụ: "Tôi là video editor 5 năm AE+C4D, muốn freelance remote tối thiểu $35/h")
  ↓
POST /api/chat
  ↓ AI đọc prompt → extract: role, exp, skills, lương, preference
  ↓ Gọi tool generate_keywords → sinh platformKeywords cho từng source
  ↓ Hiện CV Modal (popup)
      Điền sẵn thông tin AI extract được:
        - Role / Track
        - Kinh nghiệm (số năm)
        - Kỹ năng (skills)
        - Lương mong muốn
        - Keywords (đã sinh)
      User xem lại, chỉnh tay nếu cần
  ↓ User bấm "OK" trên CV Modal
  ↓ Gọi tool create_template → lưu JobTemplate vào DB (với data đã chỉnh)
  ↓ Gọi Render worker (POST /api/scrape/trigger) → scrape chạy nền
  ↓ SSE stream progress về browser:
      - Progress bar từng source (LinkedIn 12/50, RemoteOK 8/20...)
      - Số job tìm thấy tăng realtime
      - Nhân vật 8-bit hoạt hình chạy/nhảy trong lúc chờ
      - Nếu cold start: nhân vật ở trạng thái "đang thức dậy" (~50s)
      - Nút "Dừng" hiện trong suốt quá trình scrape
          User bấm → GET /api/scrape/stop?runId=Y
          → Render worker nhận → SIGTERM process → emit event "stopped"
          → Jobs đã tìm được trước đó vẫn được giữ lại trong DB
Khi scrape xong hoặc bị dừng → chuyển sang View 2 (Jobs)
```

**CV Modal — chi tiết:**
- Hiện ra tự động sau khi AI sinh xong keywords, trước khi scrape
- Là **bước bắt buộc** — scrape không chạy cho đến khi user bấm OK
- Điền sẵn toàn bộ thông tin AI extract được từ prompt của user
- User có thể chỉnh tay tất cả các trường trước khi confirm:

| Trường | Nội dung |
|--------|---------|
| Role / Track | Vị trí tìm kiếm (vd: Motion Designer, Frontend Dev) |
| Kinh nghiệm | Số năm kinh nghiệm |
| Kỹ năng | Danh sách skills (vd: After Effects, Cinema 4D) |
| Lương mong muốn | Mức tối thiểu (USD/h hoặc USD/tháng) |
| Keywords | Các từ khoá sẽ dùng để scrape — có thể thêm/xoá |

- Bấm **OK** → lưu `JobTemplate` vào DB → trigger scrape
- Bấm **Back** → quay lại khung chat, không lưu gì

**Scrape hoạt động chi tiết:**

**1. Vercel gọi Render worker**
```
POST /api/scrape/trigger  (Next.js)
  → GET runner/scrape?templateId=X&config=<json>&runId=Y  (Render, SSE)
```
Config gồm: `keywords`, `platform_keywords` (keywords riêng theo source), `sources`, `blocked_companies`, `pages_per_term`, `prefilter`, `mongo_uri`, `user_id`.

**2. `job_scraper.py` emit event `start`** — báo danh sách sources và số keyword sắp dùng.

**3. Lặp qua từng source:**

```
emit source_start  →  chạy scraper tương ứng  →  emit source_done / source_error
```

- Mỗi source có scraper riêng (`scrapers/linkedin.py`, `scrapers/remoteok.py`...)
- **Tất cả source** đều phải dùng callback `on_job` → stream từng job ngay khi tìm thấy, không đợi hết source mới xử lý
- Hiện tại LinkedIn đã dùng callback, các source còn lại cần refactor theo cùng pattern (⬜ việc cần làm)

**Platform keywords:** mỗi source dùng keywords riêng nếu có (`platform_keywords.linkedin`, `platform_keywords.remoteok`...). Nếu không có thì dùng `keywords` chung.

**4. Mỗi job qua 3 bước lọc trước khi lưu:**

| Bước | Điều kiện lọc | Ghi chú |
|------|--------------|---------|
| **URL dedup** | URL đã thấy ở bất kỳ source nào trong run hiện tại → skip | Tránh cùng 1 job bị đếm 2 lần khi xuất hiện trên nhiều source |
| **SeenJob dedup** | Hash MD5 đã có trong `seenjobs` (MongoDB, persistent qua các lần scrape) → skip, không emit job mới | Job cũ từ lần trước vẫn được `$inc seenCount` nhưng không hiện lên như job mới |
| **Prefilter** (rẻ, không gọi mạng) | Các rule lọc **được AI extract từ prompt của user** khi tạo template, không hardcode | |
| | `hard_no` match title → skip | AI extract từ prompt (vd: user viết "không muốn game/gambling") |
| | `must_be_remote` = true + job rõ ràng on-site → skip | AI extract từ prompt; chỉ skip khi có tín hiệu rõ trong title hoặc 300 ký tự đầu description |
| | Lương thấp hơn `min_salary_hr` >40% → skip | AI extract từ prompt; buffer 40% tránh skip nhầm khi job không ghi rõ |
| | Không overlap với keyword stems → skip | AI extract từ prompt; chỉ áp dụng khi có ≥5 stems |
| **Blocked company** | Tên công ty nằm trong blacklist của user → skip | User tự quản lý danh sách này, không phải AI sinh ra |

**5. Lưu job vào MongoDB (`$setOnInsert` upsert theo URL):**
```
Nếu URL đã tồn tại → chỉ tăng seenCount (không ghi đè)
Nếu URL mới → insert với:
  analyzed: false
  action: null
  freshJob: true
  scrapedAt: now
  + toàn bộ metadata: title, company, source, salary, tags, remote, seniority, techStack...
```

**7. SSE events stream về browser realtime:**

| Event | Khi nào | Dữ liệu |
|-------|---------|---------|
| `start` | Đầu scrape | sources[], keyword_count |
| `source_start` | Bắt đầu 1 source | source name |
| `job` | Tìm thấy job mới | id, title, company, source, salary, remote, tags |
| `source_done` | Xong 1 source | source, count, blocked |
| `source_error` | Source bị lỗi | source, error message |
| `blocked` | Cuối scrape | tổng số job bị block |
| `scrape_done` | Toàn bộ xong | total, new_count, blocked |
| `stopped` | User bấm dừng | code: -15 (SIGTERM) |

**8. Sau khi xong:** ghi backup JSON ra `~/job-digests/jobs_raw_<templateId>.json` trên Render server.

---

## Luồng 2: View Jobs — AI Recommended Jobs

Hiện toàn bộ job đã scrape, có hoặc chưa có điểm AI.

```
User vào trang Jobs
  ↓ GET /api/jobs → load job cards của workspace
  ↓ Nếu còn job chưa analyzed → user bấm "Analyze"
      GET /api/analyze/[templateId] (SSE stream)
      ↓ Lấy batch 20 jobs chưa analyzed
      ↓ arkChat(): system = profile user, user message = danh sách job JSON
      ↓ AI trả về [{jobId, matchPct, action, track, moat, whyYou, redFlags}]
      ↓ Bulk update MongoDB → stream kết quả về browser
      ↓ Lặp batch tiếp theo đến hết
  Cards xuất hiện dần với matchPct %

User click 1 card → mở Side Panel BASIC
  ↓ Hiện: title, company, mô tả, skills match, link apply
  ↓ Bấm "Deep Analysis" → mở Side Panel DEEP
      POST /api/jobs/[id]/deep-analyze
      ↓ arkChat() phân tích sâu: công ty, thị trường, xác suất hire
      ↓ Stream kết quả vào panel

User bấm "Choose" trên card → job được đánh dấu chosen: true → xuất hiện ở View 3 (Tracker)
User bấm "Skip" → notInterested: true → ẩn khỏi grid
```

**Free tier gate:** workspace đã score ≥ 10 jobs → các job tiếp theo bị đánh `meta.gated: true`, không gọi AI. Card vẫn hiện info nhưng không có matchPct — hiện badge "🔒 upgrade to score".

---

## Luồng 3: View Tracker — User Selected Jobs

Chỉ chứa job user đã bấm "Choose". Tách hoàn toàn khỏi Jobs grid.

```
User vào trang Tracker
  ↓ GET /api/jobs?chosen=true → load các job đã choose
  ↓ Hiện dạng board theo pipeline status:
      tracking → applied → screening → interview → offer / rejected

User kéo card sang cột khác → PATCH /api/jobs/[id] { status: "applied" }

User bấm "Cover Letter" trên 1 job
  ↓ POST /api/jobs/[id]/cover-letter
  ↓ arkChat(): context = job JD + user profile + moat từ deep analysis
  ↓ Stream cover letter về panel

User bấm "Deep Analysis" trên Tracker
  ↓ Mở Side Panel DEEP (cùng component với View 2)
  ↓ Nếu đã deep analyze trước đó → load từ DB (meta.deepAnalysis), không gọi AI lại
  ↓ Nếu chưa → gọi /api/jobs/[id]/deep-analyze → stream kết quả
```

---

## Luồng 4: View Share — Chia sẻ bộ job (Team plan)

```
User chọn nhiều job → bấm "Share"
  ↓ POST /api/share → tạo Share document { token, jobIds[], expiresAt: +7 ngày }
  ↓ Trả về link: /share/[token]

Người nhận mở link
  ↓ GET /api/share/[token] → verify token còn hạn
  ↓ Hiện preview các job cards (không cần đăng nhập)
  ↓ Bấm "Claim" → POST /api/share/[token]/claim
      Copy jobs vào account người nhận (analyzed: true, không tốn token)
      hasClaimed: true → hiện badge đã nhận
```

**Gate:** chỉ Team plan mới tạo được share link. Free/Personal → 402.

---

## Entitlement system — cách kiểm tra quyền

Mọi route cần kiểm tra quyền đều làm theo pattern này:

```typescript
// 1. Lấy entitlements của user
const { ws, ent } = await getWorkspaceEntitlements(user._id);

// 2. Check feature có được dùng không
if (!ent.canDeepAnalysis) {
  return NextResponse.json({ error: "Cần nâng cấp", upgradeTo: "personal" }, { status: 402 });
}

// 3. Check credit đủ không (nếu tính credit)
const spend = await spendCredits(ws._id, "deep_analysis");
if (!spend.ok) {
  return NextResponse.json({ error: "Hết credit", needCredits: true }, { status: 402 });
}

// 4. Chạy tính năng
try {
  // ... code ở đây
} catch (err) {
  // 5. Hoàn credit nếu lỗi
  await refundCredits(ws._id, "deep_analysis");
  throw err;
}
```

`getEntitlements()` query 3 thứ: `Workspace` (plan type), `Subscription` (còn hạn không), `CreditWallet` (số dư). Trả về object `TierLimits` với các boolean `canDeepAnalysis`, `canCoverLetter`, `canTracker`...

---

## Chi phí thực tế

Token rẻ đến mức không phải vấn đề. Chi phí thật là **hạ tầng**:

| Token | Cost/user nặng/tháng |
|-------|---------------------|
| 200 analyze + 20 deep + 20 cover + 100 chat | **~$0.45** |

| Hạ tầng | Chi phí |
|---------|---------|
| Vercel Pro | $20/tháng |
| Render worker | $7–20/tháng |
| MongoDB Atlas M10 (khi scale) | $57/tháng |

**Định giá không lỗ:** Personal $9–12/tháng → cost ~$0.45 token + phần hạ tầng phân bổ → biên lợi nhuận >75%. Credit pack (100 credit = $4–5) với markup 4–6× so với cost ARK thực.

⚠️ **Số chính xác cần verify:** chạy `GET /api/admin/cost-report` để xem cost thật từ log Usage.
