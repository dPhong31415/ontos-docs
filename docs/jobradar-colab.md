---
id: jobradar-colab
title: Làm việc cùng nhau (2 dev)
sidebar_label: 👥 Colab & Claude Code
sidebar_position: 6
---

# Làm việc cùng nhau

> Trang này dành cho **2 dev** và **Claude Code agent**. Giải thích ai làm gì, làm thế nào để không giẫm lên nhau, và cách dùng Claude Code hiệu quả.

---

## Phân chia vùng trách nhiệm

**Nguyên tắc:** Dev A không đụng file của Dev B và ngược lại. File "Shared" thì phải hẹn nhau trước.

### Dev A — Frontend
Chịu trách nhiệm giao diện người dùng.

```
app/(app)/dashboard/    → trang chính: job cards, filters, choose/skip
app/(app)/tracker/      → theo dõi apply: kanban + side panel + tasks
app/(app)/scrape/       → trang trigger scrape
app/(app)/template/     → form tạo/sửa template
app/(app)/team/         → quản lý thành viên team
app/(app)/shares/       → quản lý share links
app/(auth)/             → trang đăng nhập/đăng ký
app/(legal)/            → /terms /privacy /refunds
app/share/[token]/      → trang public cho người nhận share
app/page.tsx            → trang chủ (hiện đang redirect)
components/             → ChatSidebar, ProposalPanel, DeepPanel, ScrapeCrew
```

### Dev B — Backend
Chịu trách nhiệm API, database, AI logic, scrapers.

```
app/api/                → tất cả API routes
lib/models/             → Mongoose schemas (16 models)
lib/entitlements.ts     → logic tier/credit (KHÔNG sửa nếu không confirm A)
lib/byteplus.ts         → AI gateway (KHÔNG thêm/xóa model nếu không confirm)
lib/claude-runner.ts    → utility parseJSON + runClaude proxy
lib/workspace.ts        → helper tạo workspace
lib/analyze.ts          → chấm điểm job hàng loạt
lib/deep-analyze.ts     → deep analysis
lib/keyword-generator.ts → sinh keywords + memory reflection
lib/extract-job-url.ts  → extract job từ URL bất kỳ
lib/agent/              → Radar chat agent
lib/sources.ts          → danh sách sources + màu sắc
runner/                 → Render Python server
scripts/                → Python scrapers
```

### Shared — hẹn trước khi sửa
File nào cả 2 đều có thể cần động vào. Trước khi sửa phải nói với người kia.

```
app/(app)/layout.tsx    → nav bar, app shell
lib/models/index.ts     → export models (thêm ở cuối, đừng reorder)
lib/mongodb.ts          → kết nối DB
proxy.ts                → Clerk middleware (auth guard)
package.json            → dependencies
vercel.json             → cron config
```

---

## Git workflow

### Quy trình cơ bản

```
main (production) ──────────────────────────────►
                    ↑              ↑
              merge PR        merge PR
                    │              │
feat/A-chat-layout ─┘    feat/B-billing-webhook ─┘
```

**Bước 1:** Cắt branch mới từ main
```bash
git checkout main && git pull
git checkout -b feat/A-mô-tả-ngắn    # Dev A
# hoặc
git checkout -b feat/B-mô-tả-ngắn    # Dev B
```

**Bước 2:** Code, commit khi xong 1 mảng nhỏ
```bash
git add <chỉ file mình đang làm>
git commit -m "feat: mô tả rõ ràng"
```

**Bước 3:** Push → Vercel tự tạo Preview URL riêng
```bash
git push origin feat/A-mô-tả-ngắn
# → Preview: jobradar-abc123-dphongnguyen...vercel.app
# → Test trên URL đó, KHÔNG đụng production
```

**Bước 4:** Mở Pull Request trên GitHub

```bash
# Claude tự mở PR nếu bạn yêu cầu:
# "Mở PR cho branch này"
# Hoặc tự làm:
gh pr create --title "feat: chat-first layout" --body "Mô tả..."
```

Sau khi PR mở:
- GitHub gửi email thông báo cho bạn
- Vercel comment trực tiếp vào PR với Preview URL để test
- Bạn (hoặc Dev kia) vào GitHub, xem tab **Files changed** → review diff
- Nếu OK → bấm **"Merge pull request"** → main tự deploy production

**Bạn có cần vào GitHub không?** — **Có**, trước khi merge. Claude không tự merge được (branch protection chặn). Bạn là checkpoint cuối cùng.

### Quy tắc bắt buộc

- ❌ **Không push thẳng vào main** — chỉ qua PR
- ❌ **Không push nhiều lần liên tiếp** — gộp hết thay đổi, push 1 lần/batch (Vercel Hobby ~100 deploy/ngày)
- ✅ **Commit message rõ ràng:** `feat:`, `fix:`, `chore:`, `docs:`
- ✅ **Resolve conflict bằng rebase:** `git pull --rebase` rồi fix

### Khi bị conflict
```bash
git fetch origin
git rebase origin/main
# Mở file conflict → tìm <<<< ==== >>>> → chọn giữ cái nào
git add <file đã fix>
git rebase --continue
git push --force-with-lease
```

---

## Vòng đời một feature — Claude làm, bạn approve

Ví dụ thực tế: Dev A (Claude) build "Upgrade modal khi nhận 402".

```
Bạn giao việc cho Claude:
"Build upgrade modal — khi route trả 402 {upgradeTo:'personal'},
hiện modal đẹp giải thích tính năng cần upgrade. Zone Dev A."
          ↓
Claude làm trên branch feat/A-upgrade-modal:
  - Đọc CLAUDE.md + team.md
  - Viết code trong components/ và app/(app)/dashboard/
  - Chạy tsc --noEmit + test:unit
  - Commit + push
          ↓
Vercel tự build Preview URL (bạn nhận email hoặc xem Vercel dashboard)
  → Bạn mở Preview URL, test thử feature
          ↓
Claude mở PR (nếu bạn yêu cầu "mở PR đi"):
  → GitHub gửi email cho bạn
  → Vercel comment URL preview vào PR
          ↓
BẠN vào GitHub → tab "Files changed" → xem diff
  Câu hỏi cần check:
  □ Code có đúng zone (chỉ frontend files)?
  □ Logic có đúng spec không?
  □ Có gì lạ không?
          ↓
Nếu OK → bấm "Merge pull request" trên GitHub
          ↓
main tự deploy production trong ~1 phút
```

**Bạn phải làm gì thủ công:**
1. ✅ Test trên Preview URL (tùy — có thể skip nếu tin tưởng)
2. ✅ Review diff trên GitHub (quan trọng)
3. ✅ Bấm Merge (bắt buộc — không delegate cho Claude)

**Claude tự làm:**
- Code, commit, push
- Mở PR nếu bạn nói "mở PR"
- Fix lỗi nếu bạn comment trên PR "fix cái này"
- Không tự merge vào main

---

## Checklist trước mỗi push

Chạy cái này trước khi push, nếu fail thì fix trước:

```bash
npx tsc --noEmit          # Không có TypeScript error
npm run test:unit         # 11 unit tests phải pass
```

Và tự check bằng mắt:
```
□ Route mới → có requireSession() chưa? (trừ route public)
□ Route public mới → đã thêm vào proxy.ts chưa?
□ Tạo job/template mới → dùng workspace thật, không workspaceId: null
□ Tính năng paid → có gọi getEntitlements() chưa?
□ Tính năng credit → có refund trong catch block chưa?
□ TUYỆT ĐỐI không tạo middleware.ts (conflict với proxy.ts → build fail)
```

---

## Dùng Claude Code như dev team

Claude Code tự đọc `CLAUDE.md` khi bắt đầu session. Nó biết rules, tech stack, và các quyết định đã chốt.

### Cách giao task hiệu quả

**Không hiệu quả:**
```
"Fix the bug in the dashboard"
```

**Hiệu quả:**
```
"Tôi cần gate route POST /api/presets để chỉ Personal+ mới tạo được.
Zone Dev B. Đọc lib/entitlements.ts để hiểu pattern gate đang dùng,
rồi áp dụng tương tự như route /api/jobs/[id]/deep đã làm."
```

**Template giao task:**
```
Tôi cần [mô tả tính năng].
Zone: Dev A (frontend) hoặc Dev B (backend).
Files liên quan: [list file nếu biết].
Tham khảo: [file tương tự đã implement].
Không được đụng: [file nào không được sửa].
```

### Subagents theo role

Claude Code có thể chạy như các "role" khác nhau:

| Dùng khi... | Cách gọi |
|-------------|---------|
| Thiết kế feature lớn (>2 file) | `/plan` trước khi code |
| Build UI component | Nói "zone Dev A, làm trong components/" |
| Build API route | Nói "zone Dev B, làm trong app/api/" |
| Review trước merge | `/code-review` |
| Tìm bug | Mô tả triệu chứng, Claude tìm root cause |

### Files `.claude/` Claude tự đọc

| File | Chứa gì |
|------|---------|
| `CLAUDE.md` | Rules tuyệt đối, tech stack, checklist commit |
| `.claude/team.md` | Zone ownership (file này) |
| `.claude/decisions.md` | Quyết định kỹ thuật đã chốt — **KHÔNG re-argue** |
| `.claude/status.md` | Trạng thái hiện tại, next steps |
| `.claude/_map.md` | Sơ đồ thư mục + data flows |

**Tại sao có decisions.md?** Để Claude không hỏi lại "tại sao không dùng Stripe?" hay "tại sao không dùng Claude API?" mỗi lần. Những quyết định này đã được cân nhắc kỹ, có lý do rõ ràng, không cần debate lại.

---

## Vercel Preview vs Production

| Branch | Kết quả | URL |
|--------|---------|-----|
| `feat/A-*` hoặc `feat/B-*` | Preview deploy tự động | `jobradar-<hash>-....vercel.app` |
| `main` | Production deploy tự động | `jobradar-orcin.vercel.app` |

**Preview URL an toàn để test** — không ảnh hưởng production, dùng cùng database thật (attention: vẫn ghi vào DB thật, cẩn thận khi test delete).

---

## Env vars — ai cần biết gì

**Dev A** chỉ cần 2 cái để chạy local:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk frontend key

**Dev B** cần toàn bộ:

| Var | Dùng cho |
|-----|---------|
| `MONGODB_URI` | Kết nối Atlas |
| `ARK_API_KEY` | Gọi AI |
| `CLERK_SECRET_KEY` | Auth backend |
| `CLAUDE_RUNNER_URL` | URL của Render worker |
| `CLAUDE_RUNNER_SECRET` | Xác thực giữa Vercel ↔ Render |
| `CRON_SECRET` | Bảo vệ daily-scrape |
| `BILLING_MOR_SECRET` | Verify webhook Paddle/LS |
| `BILLING_VN_SECRET` | Verify webhook VNPay/MoMo |

Lấy các giá trị này từ Vercel Dashboard hoặc hỏi project owner. **Không commit vào git.**
