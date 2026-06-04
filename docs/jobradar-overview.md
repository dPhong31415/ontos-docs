---
id: jobradar-overview
title: Tổng quan
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# jobradar — Tổng quan

SaaS tìm việc thông minh bằng AI. Multi-tenant, chat-first, agentic, tự cải thiện.

**Production:** jobradar-orcin.vercel.app  
**Stack:** Next.js 16 · MongoDB Atlas · BytePlus ARK · Clerk · Render

---

## Luồng chính

```
User mô tả qua chat
  → Agent onboarding → tạo JobTemplate (role, skills, lương, remote...)
  → AI sinh keywords tối ưu cho từng nền tảng
  → Scraper worker kéo job → AI chấm điểm (matchPct, action)
  → Cards gợi ý → Skip / Choose
  → Tracker → task breakdown, cover letter, status pipeline
  → Mỗi feedback → AgentMemory cập nhật → lần sau chính xác hơn
```

---

## Tier & giá

| Tier | Giá | Tính năng |
|------|-----|-----------|
| **Free** | $0 | 1 template, regen 3 lần, AI chấm 10 job, research cơ bản |
| **Personal** | ~$9–12/tháng | Không giới hạn chấm, deep analysis (2 credit), cover letter (1 credit), presets, tracker |
| **Team** | ~$29–49/tháng/người | + share link, giao job cho thành viên |

**Credit:** 1 credit = $0.01. Mua lẻ hoặc theo gói.

---

## Repos

| Repo | Mô tả |
|------|-------|
| `dPhong31415/jobradar` | App chính (Next.js + API + Agent) |
| `dPhong31415/jobradar-docs` | Tài liệu (repo này) |

---

## Phân công dev

| Dev | Zone |
|-----|------|
| **Dev A — Frontend** | `app/(app)/**`, `components/` |
| **Dev B — Backend** | `app/api/**`, `lib/models/**`, `lib/*.ts`, `scripts/` |
| **Shared (phải hẹn)** | `proxy.ts`, `lib/sources.ts`, `lib/entitlements.ts`, `package.json` |

→ Chi tiết xem [Colab Workflow](/jobradar-colab)
