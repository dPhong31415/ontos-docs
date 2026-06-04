---
id: jobradar-agent
title: AI Agent & Memory
sidebar_label: 🤖 AI Agent & Memory
sidebar_position: 5
---

# AI Agent & Memory

## LLM Gateway

File: `lib/byteplus.ts`

- 8 models ARK rotate, random start để phân tải
- `429` quota hết → thử model tiếp
- Mỗi call ghi `Usage` (tokensIn, tokensOut, costUsd, latencyMs)
- **Không dùng Anthropic SDK** — `@anthropic-ai/sdk` đã xóa

---

<details>
<summary>**AI Gateway — cách ARK rotation hoạt động**</summary>

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

</details>

<details>
<summary>**AI Observability — kiểm soát token, chi phí, và debug**</summary>

Mọi lần gọi `arkChat()` phải tạo 1 document `Usage` với đủ thông tin để trả lời được:
- Call này tốn bao nhiêu tiền?
- Model nào thực sự chạy?
- Có phải retry không (model bị 429)?
- Nếu AI trả sai → prompt trông như thế nào?

**Cấu trúc log mỗi call:**

```
requestId: uuid          ← trace key xuyên suốt
userId + workspaceId     ← tenant context
type: "prompt_extract"   ← feature nào gọi
modelId: "seed-2-0-lite" ← model thực sự dùng (sau rotation)
modelAttempts: 2         ← 1 model bị 429, thử lại
tokensIn: 1840
tokensOut: 312
cacheTokens: 1200
costUsd: 0.000021
latencyMs: 1420
success: true
promptSnippet: "Extract profile from: Tôi là motion designer..."
```

**Các mức log cần có:**

| Level | Khi nào | Nội dung |
|-------|---------|---------|
| `info` | Mỗi call thành công | requestId, type, model, tokens, cost, latency |
| `warn` | `modelAttempts > 1` | Model nào bị 429, model nào cuối cùng dùng |
| `warn` | Tất cả model 429 một lần | Cần alert — ARK quota gần hết |
| `error` | Call thất bại | requestId, type, error message, promptSnippet |

**Cách debug khi AI trả sai:**

```
1. Lấy requestId từ response lỗi của frontend
2. Query Usage collection: { requestId: "..." }
3. Xem: modelId, tokensIn, promptSnippet
4. Xem error nếu có
5. Nếu cần → re-run với cùng promptSnippet để reproduce
```

**Monitoring dashboard (`GET /api/admin/cost-report`):**

| Metric | Group by | Mục đích |
|--------|---------|---------|
| Tổng cost tháng | `type` | Biết feature nào tốn nhất |
| Average cost/call | `type` | Chốt giá credit cho đúng |
| P95 latency | `type` + `modelId` | Phát hiện model chậm |
| Tỷ lệ lỗi | `type` | Tính năng nào hay fail |
| Retry rate | `modelAttempts > 1` | Model nào hay bị quota |
| Cost per user | `userId` / tháng | Phát hiện user dùng bất thường |

**Quy tắc bắt buộc:**
- Tất cả `arkChat()` call phải pass `type` + `userId` — không ghi được Usage nếu thiếu
- `requestId` phải được trả về trong response header hoặc SSE event đầu tiên để frontend có thể trace
- `promptSnippet` giới hạn 200 ký tự — đủ để debug, không vi phạm privacy

</details>

<details>
<summary>**Agent Core — kế hoạch tách repo**</summary>

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

**Khi nào tách:** contract API ổn định. Hiện tại giữ trong `lib/agent/` với ranh giới rõ ràng (`lib/agent` không import ngược lại `app/`).

</details>

---

## Radar Chat Agent

File: `lib/agent/graph.ts` — ReAct loop, tối đa 3 tool calls/turn.

**Onboarding mode** (chưa có template):  
Agent hỏi 7 câu theo thứ tự: role → skills → experience → salary → remote → languages → hardNO → gọi `create_template`.

**Tools:**

| Tool | Mô tả |
|------|-------|
| `search_jobs` | Tìm job theo action/source/match%/query |
| `get_job_detail` | Chi tiết 1 job |
| `get_stats` | Thống kê: total/analyzed/top/unanalyzed |
| `get_templates` | Danh sách templates |
| `update_job_status` | Mark applied/not-interested |
| `create_template` | Tạo template từ onboarding answers |
| `apply_feedback` | Lọc job, thêm keyword, thêm hardNO |

## Memory Loop (tự cải thiện)

**Capture** (hiện tại):  
- `KeywordMemory.qualityScore` cập nhật theo apply/skip/relevant

**Inject** (todo):  
- `generateKeywords()` đọc `AgentMemory` → chèn vào prompt

**Reflect** (post-MVP):  
- Scheduled job review jobs bị skip → cập nhật `AgentMemory.reflections`
- Prune keyword score thấp

## MCP (post-MVP)

Expose cùng tools tại `/api/mcp` để agent bên ngoài/partner dùng.
