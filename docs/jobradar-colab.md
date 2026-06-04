---
id: jobradar-colab
title: Colab Workflow
sidebar_label: 👥 Colab Workflow
sidebar_position: 5
---

# Colab Workflow — 2 Dev

---

## Phân công zone

### Dev A — Frontend
```
app/(app)/dashboard/       → job grid, cards, filters, choose/skip
app/(app)/tracker/         → tracker page + side panel + tasks
app/(app)/scrape/          → scrape UI
app/(app)/sources/         → sources config UI
app/(app)/template/        → template form UI
app/(app)/team/            → team management UI
app/(app)/shares/          → shares UI
app/(auth)/                → sign-in/up (Clerk)
app/(legal)/               → terms, privacy, refunds
app/share/[token]/         → public share page
app/page.tsx               → root redirect / landing page
components/                → ChatSidebar, ProposalPanel, DeepPanel, ScrapeCrew
```

### Dev B — Backend
```
app/api/                   → tất cả API routes
lib/models/                → Mongoose schemas
lib/entitlements.ts        → tier matrix + credit helpers
lib/byteplus.ts            → LLM gateway (KHÔNG sửa models list nếu không confirm)
lib/claude-runner.ts       → parseJSON utility + runClaude proxy
lib/workspace.ts           → getOrCreatePersonalWorkspace()
lib/analyze.ts             → analyzeJobBatch
lib/deep-analyze.ts        → runDeepAnalysis
lib/keyword-generator.ts   → generateKeywords + reflectAndUpdateMemory
lib/extract-job-url.ts     → URL → job extraction
lib/agent/                 → Radar agent (graph + tools)
lib/sources.ts             → source list + colors
runner/                    → Render Python server
scripts/                   → scrapers Python
```

### Shared — phải hẹn trước khi sửa
```
app/(app)/layout.tsx       → app shell + nav
lib/models/index.ts        → model exports
lib/mongodb.ts             → DB connection
proxy.ts                   → Clerk middleware
package.json               → dependencies
vercel.json                → cron config
```

---

## Git workflow hàng ngày

```bash
# Bắt đầu feature mới
git checkout main
git pull origin main
git checkout -b feat/A-chat-layout    # Dev A
# hoặc
git checkout -b feat/B-billing-webhook  # Dev B

# Code, commit...
git add <files>
git commit -m "feat: mô tả ngắn gọn"

# Push → Vercel tự tạo Preview URL
git push origin feat/A-chat-layout
# → Preview: jobradar-<hash>-dphongnguyen31415....vercel.app

# Khi xong → mở PR trên GitHub → người kia review → merge
```

**Quy tắc commit message:**
```
feat:  tính năng mới
fix:   bug fix
chore: dependency, config, non-code
docs:  tài liệu
```

---

## Checklist trước mỗi push

```
□ npx tsc --noEmit  → pass (không có type error)
□ npm run test:unit → 11 tests pass
□ Không có workspaceId: null trong tạo job/template mới
□ Tính năng paid → gọi getEntitlements() → gate đúng
□ Tính năng credit → có refund trong catch block
□ Route mới → có requireSession() (trừ route public)
□ Route public mới → thêm vào proxy.ts isPublic matcher
□ KHÔNG tạo middleware.ts (sẽ conflict với proxy.ts → build fail)
□ KHÔNG commit .env, secrets
```

---

## Tránh conflict

**File hay conflict nhất:**

| File | Cách tránh |
|------|-----------|
| `dashboard/page.tsx` | A sửa UI components, B sửa data hooks — không overlap |
| `lib/sources.ts` | Merge nhanh, file nhỏ |
| `lib/entitlements.ts` | B owns logic, A chỉ đọc `ent.*` trong UI |
| `lib/models/index.ts` | Luôn thêm ở cuối file |
| `package.json` | Một người install một lúc, commit lock file cùng |

**Khi bị conflict:**
```bash
git fetch origin
git rebase origin/main
# Resolve conflict
git add <file>
git rebase --continue
git push --force-with-lease
```

---

## Vercel Preview & Production

| Branch | Deploy | URL |
|--------|--------|-----|
| `feat/*` | Preview (auto) | `jobradar-<hash>-....vercel.app` |
| `main` | Production (auto) | `jobradar-orcin.vercel.app` |

**Quota:** ~100 deploys/ngày (Vercel Hobby). Gộp commit → push 1 lần.

---

## Dùng Claude Code như dev team

Claude Code đọc `.claude/CLAUDE.md` tự động mỗi session. **Subagents theo role** để phân công như team thật:

| Subagent | Dùng khi | Tools |
|---------|----------|-------|
| `frontend-engineer` | Sửa UI, components, pages | Read/Edit/Write/Bash(build) |
| `backend-engineer` | API routes, models, entitlements | Read/Edit/Write/Bash |
| `devops` | Vercel, Render, env, deploy, Mongo indexes | Read/Edit/Bash |
| `qa-test` | Viết/chạy tests, reproduce bug | Read/Bash(tests) |
| `reviewer` | `/code-review` trước merge | Read-only |

**Vòng lặp SOTA (plan mode):**
```
1. /plan — thiết kế trước khi code (cho feature > 2 file)
2. Subagent implement trên branch feat/*
3. /code-review — review trước merge
4. qa-test chạy test cases
5. PR → merge main
```

**Skills có sẵn (gõ /tên):**
- `/deploy` — gate → build → push 1 lần (tránh lố quota)
- `/code-review` — review diff, có thể dùng `ultra` cho thay đổi lớn

**Khi giao task cho Claude:**
```
"Làm feat/B-entitlement-gate — gate route /api/jobs/[id]/deep
theo zone Dev B. Đọc .claude/team.md trước."
```

**Claude sẽ:**
1. Đọc `CLAUDE.md` → rules
2. Đọc `.claude/team.md` → zone ownership
3. Đọc `.claude/decisions.md` → quyết định đã chốt (không re-argue)
4. Đọc `.claude/status.md` → trạng thái hiện tại
5. Làm trong zone được phân công, không đụng file zone khác

**Files `.claude/` quan trọng:**

| File | Nội dung |
|------|---------|
| `CLAUDE.md` | Rules + stack + test + git + security + checklist |
| `.claude/team.md` | Zone ownership + workflow colab |
| `.claude/status.md` | Trạng thái hiện tại + next steps |
| `.claude/_map.md` | Sơ đồ thư mục + data flows |
| `.claude/decisions.md` | Quyết định kỹ thuật đã chốt (LLM, tenancy, billing...) |

---

## Claude Code Hooks (harness rules)

Dự án cấu hình hooks trong `.claude/settings.json` (nếu có):

- **Pre-push:** `tsc --noEmit` + `npm run test:unit` chạy tự động
- **Stop:** lint check
- **Chặn:** commit thẳng `main`, tạo `middleware.ts`

Nếu hook fail → Claude dừng lại, giải thích lỗi, không bypass.

**Các điều Claude KHÔNG làm:**
- Không push thẳng `main` (phải qua PR)
- Không amend commit đã push
- Không `--no-verify` bypass hooks
- Không xóa file chưa confirm
- Không sửa file ngoài zone đang làm

---

## Env vars cần set (Vercel Production)

| Var | Ai cần biết | Ghi chú |
|-----|-------------|---------|
| `MONGODB_URI` | Dev B | Atlas connection string |
| `ARK_API_KEY` | Dev B | BytePlus ARK |
| `CLERK_SECRET_KEY` | Dev B | Clerk backend |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Dev A | Clerk frontend |
| `CLAUDE_RUNNER_URL` | Dev B | Render worker URL |
| `CLAUDE_RUNNER_SECRET` | Dev B | Shared secret với Render |
| `CRON_SECRET` | Dev B | Bảo vệ daily-scrape |
| `BILLING_MOR_SECRET` | Dev B | Paddle/LemonSqueezy HMAC |
| `BILLING_VN_SECRET` | Dev B | VNPay/MoMo HMAC |

Dev A không cần biết secrets backend. Dev A chỉ cần `NEXT_PUBLIC_*` và Clerk publishable key để test local.
