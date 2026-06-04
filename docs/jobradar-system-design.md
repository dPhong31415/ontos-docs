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

## Luồng 1: User Scrape job

```
User bấm "Scrape" trên web
  ↓
POST /api/scrape/trigger
  ↓ Web App gọi Render worker
GET runner/scrape?config={keywords, sources, ...}
  ↓ Worker chạy job_scraper.py
  ↓ Scrape từng source: LinkedIn, RemoteOK, Indeed, Reddit...
  ↓ Mỗi job: check SeenJob collection (đã thấy chưa?)
  ↓ Nếu chưa seen → ghi vào MongoDB jobs collection
  ↓ Emit SSE events → Web App → stream về browser
User thấy "Đã thêm 47 jobs mới"
```

**Dedup hoạt động thế nào:** mỗi job có hash MD5 của `title|company|url`. Hash này lưu vào collection `seenjobs`. Lần sau scrape gặp job đó → skip, không ghi lại.

---

## Luồng 2: AI chấm điểm (Analyze)

```
User bấm "Analyze"
  ↓
GET /api/analyze/[templateId] (SSE stream)
  ↓ Lấy 20 jobs chưa analyzed
  ↓ Gọi arkChat() với:
    - System prompt: profile của user (skills, lương, hardNO...)
    - User message: danh sách 20 jobs compact JSON
  ↓ AI trả về JSON: [{jobId, matchPct, action, track, moat, whyYou, redFlags}]
  ↓ Bulk update jobs trong MongoDB
  ↓ Stream kết quả về browser realtime
  ↓ Lặp lại cho batch tiếp theo
User thấy cards xuất hiện dần với %
```

**Free tier gate:** đếm số jobs đã scored cho workspace. Khi vượt 10 → đánh `meta.gated: true`, không gọi AI nữa. Card vẫn hiện info nhưng không có matchPct.

---

## Luồng 3: Chat với Radar agent

```
User gõ "Bỏ hết job gaming đi" hoặc "Show top picks"
  ↓
POST /api/chat
  ↓ buildAgent(userId, templateId) → ReAct loop
  ↓ Claude đọc system prompt + lịch sử chat + message của user
  ↓ Quyết định có cần gọi tool không?
    Nếu có → emit "TOOL: search_jobs | {action:'apply'}"
    → Gọi tool → nhận kết quả → tiếp tục
  ↓ Tối đa 3 tool calls/turn
  ↓ Stream câu trả lời về browser từng từ
```

**Onboarding mode:** khi user chưa có template, agent hỏi 7 câu (role, skills, lương...) → cuối cùng gọi tool `create_template` → tạo `JobTemplate` trong DB.

---

## Luồng 4: Billing

```
User trả tiền qua Paddle (quốc tế) hoặc VNPay/MoMo (Việt Nam)
  ↓
Provider gửi webhook đến:
  /api/billing/webhook-mor  ← Paddle/LemonSqueezy
  /api/billing/webhook-vn   ← VNPay/MoMo
  ↓
Verify chữ ký HMAC (chống giả mạo)
  ↓
Upsert Subscription trong MongoDB
  ↓
addCredits() → nạp credit vào ví
  ↓
Workspace.plan = "personal" hoặc "team"
  ↓
Từ lần sau gọi getEntitlements() → trả kết quả mới
```

**Tại sao dùng MoR (Merchant of Record)?** Stripe không hỗ trợ ngân hàng Việt Nam trực tiếp. Paddle/LemonSqueezy là "người bán hàng" thay mình, tự xử lý VAT/thuế toàn cầu và chuyển tiền về tài khoản VN. Phí ~5%.

---

## AI Gateway — cách ARK rotation hoạt động

**Vấn đề:** mỗi model ARK có quota free tháng. Nếu 1 model hết → các model khác vẫn còn.

```
arkChat() được gọi
  ↓ Random chọn 1 trong 8 models làm điểm bắt đầu
  ↓ Thử gọi model đó
  ↓ Nếu 429 (quota hết) → thử model tiếp theo
  ↓ Nếu tất cả hết → throw error + CẦN ALERT ngay
  ↓ Nếu thành công → ghi Usage document (token, cost, latency)
```

8 models (từ rẻ đến đắt): `seed-2-0-lite` ($0.1/1M), `deepseek-v4-flash` ($0.1/1M), `seed-1-8` ($0.1/1M), `glm-4-7` ($0.3/1M), `deepseek-v3-2` ($0.3/1M), `seed-2-0-mini` ($0.3/1M), `seed-2-0-pro` ($0.7/1M), `deepseek-v4-pro` ($0.7/1M).

**Freemium pool:** mỗi tài khoản ARK có 500k token free × 8 model = 4M token/tháng. 1 free user tiêu ~45k token. Nghĩa là 1 tài khoản phục vụ ~89 free user/tháng.

| Số tài khoản ARK | Free user phục vụ được |
|-----------------|----------------------|
| 1 | ~89 |
| 5 | ~445 |
| 10 | ~890 |

⚠️ **Cần xác nhận ToS ARK:** rotate đa tài khoản có thể vi phạm điều khoản. Paid user dùng quota riêng, không dùng pool free.

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

## Agent Core — kế hoạch tách repo

**Hiện tại:** agent nằm trong `lib/agent/` của jobradar repo.

**Kế hoạch (post-MVP):** tách thành repo riêng `agent-core` vì muốn build nhiều app dùng chung AI layer:

```
agent-core (repo riêng)
  ├── LLM gateway (ARK rotation, metering)
  ├── Agent runtime (ReAct loop)
  ├── Memory store (AgentMemory, KeywordMemory)
  └── MCP server endpoint

jobradar ──────────────────────────────── gọi agent-core qua HTTP/SDK
app-2 (tool khác) ─────────────────────── cũng gọi agent-core
```

**Khi nào tách:** contract API ổn định. Hiện tại giữ trong `lib/agent/` với ranh giới rõ ràng (lib/agent không import ngược lại app/).

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
