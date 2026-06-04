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
