---
id: jobradar-system-design
title: System Design
sidebar_label: 🏗 System Design
sidebar_position: 2
---

# System Design

## Kiến trúc mục tiêu — Agent Core tách repo riêng

Mục tiêu dài hạn: build nhiều app. **Agent Framework là tài sản lõi, repo riêng, tái sử dụng cho mọi app.**

```
[ agent-core ]  ← REPO RIÊNG (chưa tách, đang nằm trong lib/agent/)
  • LLM Gateway: ARK rotation (pool free + pool paid), retry, metering
  • Usage metering → billing event theo (appId, workspaceId, feature)
  • Agent runtime: ReAct loop + tools + memory
  • Memory store: AgentMemory / KeywordMemory (per app, per tenant)
  • MCP server: expose tools cho agent/partner bên thứ 3
  • SDK TypeScript mỏng để app gọi qua HTTP
          ▲
          │ HTTP / SDK (đa tenant: appId + workspaceId)
          │
[ jobradar (Next.js) ]  ← REPO APP hiện tại → Vercel
[ app #2, #3... ]       ← chỉ cần port Next.js, dùng chung agent-core

[ scraper-worker ]      ← Render Docker, chỉ scrape, ghi Mongo trực tiếp
```

**Khi nào tách:** contract API/SDK agent-core ổn định → extract thành package npm hoặc HTTP service riêng. Hiện tại giữ trong `lib/agent/` với ranh giới rõ ràng (không import ngược).

---

## Kiến trúc tổng thể (hiện tại)

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (User)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│               Next.js 16 — Vercel (Pro)                      │
│                                                              │
│  app/(app)/          → authenticated pages                   │
│  app/api/            → API routes (serverless functions)     │
│  proxy.ts            → Clerk middleware (auth guard)         │
│  lib/                → models, agent, entitlements, byteplus │
└───────┬──────────────────┬──────────────────────────────────┘
        │                  │
        │ HTTP             │ Mongoose
        ▼                  ▼
┌───────────────┐   ┌──────────────────┐
│ BytePlus ARK  │   │  MongoDB Atlas   │
│ (LLM gateway) │   │  (database)      │
│ 8 models      │   │  16 collections  │
└───────────────┘   └──────────────────┘
        
┌──────────────────────────────────────────────────────────────┐
│              Render Worker (Docker container)                  │
│                                                              │
│  runner/server.py      → HTTP: GET /scrape (SSE), GET /stop  │
│  scripts/job_scraper.py → multi-source scraper               │
│  scripts/scrapers/     → 14 nguồn: linkedin, remoteok...     │
│                                                              │
│  Kết nối Mongo trực tiếp để ghi job (không qua Next.js)     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  Clerk (Auth)  │  Vercel Cron  │  GitHub (CI)               │
└──────────────────────────────────────────────────────────────┘
```

---

## Luồng dữ liệu chi tiết

### Luồng Scrape
```
1. User bấm "Scrape" → POST /api/scrape/trigger
2. Next.js gọi GET runner/scrape?templateId=X&config={keywords,sources,...}
3. Render worker chạy job_scraper.py
4. job_scraper.py scrape từng source → ghi trực tiếp vào MongoDB (collection: jobs)
5. Emit SSE events → Next.js stream → Browser hiển thị progress
6. Dedup: kiểm tra SeenJob collection, skip nếu đã thấy
```

### Luồng Analyze
```
1. User bấm "Analyze" → GET /api/analyze/[templateId] (SSE)
2. Fetch batch 20 jobs chưa analyzed
3. Gọi arkChat() với system prompt (profile user) + JOBS payload
4. Parse JSON kết quả: matchPct, action, track, moat, whyYou, redFlags
5. Bulk update jobs trong Mongo
6. Free tier: dừng sau 10 jobs, đánh meta.gated=true
7. Cập nhật KeywordMemory.qualityScore
```

### Luồng Chat / Onboarding
```
1. User gửi tin → POST /api/chat (SSE)
2. buildAgent(userId, templateId) → ReAct loop
3. Agent đọc system prompt (có onboarding hướng dẫn nếu chưa có template)
4. Nếu cần tool → emit "TOOL: <name> | <args>" → gọi tool
5. Tối đa 3 tool calls per turn
6. Stream kết quả về browser word by word
```

### Luồng Billing
```
Paddle/LemonSqueezy (quốc tế):
  Checkout → webhook POST /api/billing/webhook-mor
  → Verify HMAC-SHA256 (BILLING_MOR_SECRET)
  → Upsert Subscription
  → addCredits() theo plan
  → Workspace.plan = personal|team

VNPay/MoMo (nội địa):
  IPN → POST /api/billing/webhook-vn
  → Verify HMAC-SHA256 (BILLING_VN_SECRET)
  → Upsert Subscription (30 ngày)
  → addCredits()
```

---

## LLM Gateway (BytePlus ARK)

File: `lib/byteplus.ts`

```
8 models được rotate:
  seed-2-0-lite-260428     → $0.1/$0.3 per 1M tokens (rẻ nhất)
  seed-2-0-mini-260428     → $0.3/$0.9
  seed-2-0-pro-260328      → $0.7/$2.1
  deepseek-v4-flash-260425 → $0.1/$0.3
  deepseek-v4-pro-260425   → $0.7/$2.1
  glm-4-7-251222           → $0.3/$0.9
  seed-1-8-251228          → $0.1/$0.3
  deepseek-v3-2-251201     → $0.3/$0.9

Logic:
  - Random start index để phân tải
  - Nếu 429 (quota hết) → thử model tiếp theo
  - Tất cả hết → throw lỗi + phải alert
  - Mỗi call ghi Usage document (token, cost, latency)
```

**Chi phí ước tính (ARK paid):**

| Tính năng | Token in | Token out | Cost/lần |
|-----------|----------|-----------|----------|
| Keyword gen | ~5k | ~2k | ~$0.0033 |
| Analyze 20 jobs | ~8k | ~2.5k | ~$0.0047 |
| Deep analysis 1 job | ~6k | ~2k | ~$0.0084 |
| Cover letter | ~4k | ~1.5k | ~$0.0026 |
| Chat 1 tin | ~3k | ~1k | ~$0.0018 |

**1 user nặng/tháng ≈ $0.45** → token không phải chi phí chính, hạ tầng mới là.

---

## Entitlement system

File: `lib/entitlements.ts`

```
getEntitlements(workspaceId)
  → query Workspace + Subscription + CreditWallet
  → trả TierLimits:
     { tier, maxTemplates, maxKeywordRegens, maxAiScored,
       canDeepAnalysis, canCoverLetter, canSourcePresets,
       canTracker, canShare, canAssign, creditBalance, isActive }

spendCredits(workspaceId, feature, refId?)
  → check balance >= cost
  → $inc balance, ghi CreditLedger
  → trả { ok, balance }

refundCredits(workspaceId, feature, refId?)
  → $inc balance, ghi CreditLedger với delta dương
```

**Pattern gate trong route (bắt buộc):**
```ts
const { ws, ent } = await getWorkspaceEntitlements(user._id);
if (!ent.canDeepAnalysis)
  return NextResponse.json({ error: "...", upgradeTo: "personal" }, { status: 402 });
const spend = await spendCredits(ws._id, "deep_analysis");
if (!spend.ok)
  return NextResponse.json({ error: "Insufficient credits", needCredits: true }, { status: 402 });
try {
  // ... chạy feature
} catch {
  await refundCredits(ws._id, "deep_analysis"); // hoàn nếu lỗi
  throw;
}
```

---

## Agent Memory (tự cải thiện)

```
AgentMemory (per template):
  goodPatterns[]     → pattern keyword cho kết quả tốt
  badPatterns[]      → pattern cần tránh
  sourceInsights{}   → nhận xét từng source (linkedin, himalayas...)
  userPatterns[]     → sở thích user suy ra từ apply/skip
  reflections[]      → nhật ký sau mỗi run

KeywordMemory (per keyword per template):
  qualityScore = (relevantJobs×2 + appliedJobs×5) / totalJobsFound
  → keyword nào score cao → ưu tiên giữ
  → keyword score thấp sau 3+ run → đề xuất prune

Vòng lặp:
  Skip job → ghi pattern → AgentMemory.userPatterns cập nhật
  → keyword-gen lần sau inject memory vào prompt
  → kết quả relevance tăng dần
```

---

## Freemium pool rotate tài khoản free

Mỗi tài khoản ARK có **500.000 token free/model × 8 model ≈ 4.000.000 token/tháng**.  
1 free user tiêu ~45.000 token (chủ yếu lúc onboarding, sau đó chạm cap).

| Số tài khoản ARK free | Free user phục vụ được/tháng |
|----------------------|------------------------------|
| 1 | ~89 |
| 5 | ~445 |
| 10 | ~890 |
| 20 | ~1.780 |

Công thức: `users ≈ (4.000.000 × số_tài_khoản) / 45.000`

**⚠ Rủi ro:**
- Rotate đa tài khoản có thể **vi phạm ToS ARK** → cần xác nhận điều khoản
- Dễ bị ban theo IP → cần email + IP ổn định
- **Paid tier TUYỆT ĐỐI không dùng pool free** — paid dùng quota riêng trả phí
- Pool free cạn → chặn mềm + mời upgrade

---

## Định giá không lỗ

**Nguyên tắc:** `giá_gói ≥ token_cost × markup + phần phân bổ hạ tầng`

Token rẻ → **floor là hạ tầng**, credit/overage bảo vệ biên với user nặng.

**Chi phí hạ tầng ước tính:**
- Vercel Pro: ~$20/tháng
- Render worker: $7–20/tháng
- MongoDB Atlas: M0 free → M10 $57 khi scale
- **Cộng lại:** ~$30–100/tháng shared across toàn bộ user

**Token cost thực tế (ARK):**

| Tính năng | Token in | Token out | Cost/lần (ước tính) |
|-----------|----------|-----------|---------------------|
| Keyword gen | ~5k | ~2k | ~$0.0033 |
| Analyze 20 jobs | ~8k | ~2.5k | ~$0.0047 |
| Deep analysis 1 job | ~6k | ~2k | ~$0.0084 |
| Cover letter | ~4k | ~1.5k | ~$0.0026 |
| Chat 1 tin | ~3k | ~1k | ~$0.0018 |

**User nặng/tháng** (200 analyze + 20 deep + 20 cover + 100 chat) ≈ **~$0.45/tháng token**.

**Markup credit:** `1 credit = $0.01 bán ra` với markup 4–6×:
- Deep analysis: cost ~$0.008 → bán **2 credit ($0.02)** = 2.5× markup
- Cover letter: cost ~$0.003 → bán **1 credit ($0.01)** = 3× markup

**Giá gói:**
- **Personal** ~$9–12/tháng → COGS ~5–25% → biên >75%
- **Team** ~$29–49/tháng/seat
- **Credit pack**: 100 credit = $4–5 (à la carte)
- **Asset packs**: mẫu CV/cover-letter bán lẻ 1 lần

⚠ **Số chính xác phải chốt lại sau khi đọc `GET /api/admin/cost-report`** với dữ liệu Usage thật.
