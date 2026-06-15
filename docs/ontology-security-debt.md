---
id: ontology-security-debt
title: Nợ kỹ thuật & Security
sidebar_label: ⚠️ Nợ & Security
sidebar_position: 8
---

# Nợ kỹ thuật & Security (đang treo)

> Ghi lại các khoản nợ phải trả TRƯỚC khi ontos deploy public, và các điểm bảo mật
> của integration jobradar ⇄ ontos hiện tại. Cập nhật 15/06/2026.

---

## 🔴 BẮT BUỘC trước khi deploy ontos public

### 1. ontos API chưa xác thực (Clerk JWT)
- `core_web` `AuthContext` plug đang chạy **dev mode**: tin thẳng header `x-workspace-id`,
  **không verify gì**. Bất kỳ ai gọi được `:4000` là đọc/ghi mọi workspace nếu đoán ra UUID.
- **Hiện rủi ro thấp** vì Phoenix bind `127.0.0.1` (chỉ process local trên máy dev gọi được).
- **Phải làm trước khi expose ra ngoài:** nhánh `:clerk` trong `AuthContext`
  (`apps/core_web/lib/core_web_web/plugs/auth_context.ex`) — verify Clerk JWT (JWKS fetch +
  verify chữ ký) → map `sub` → user → workspace membership. Hiện là stub raise "not implemented".
- Đây là mục M0 "Auth plug verify Clerk JWT" trong [Roadmap](./ontology-roadmap.md) chưa hoàn tất.

### 2. Không có shared-secret giữa jobradar và ontos
- jobradar gọi ontos qua REST không kèm secret nào. Khi cùng deploy, thêm header bí mật
  (kiểu `RUNNER_SECRET` của jobradar) hoặc dựa hẳn vào (1) Clerk JWT.

### 3. Entitlement/credit GATE đang no-op
- `Kinetic.Actions.invoke` bước GATE trả `:ok` luôn (jobradar = internal tool, billing đã cắt).
- Nếu sau này có app con cần tính phí, phải hiện thực hoá entitlement + credit ở đây
  (đã chừa structure). Xem [Kinetic](./ontology-kinetic.md).

---

## 🟡 Bảo mật integration jobradar ⇄ ontos (Chi phí / MÍSK ops)

Trạng thái hiện tại của tính năng **Chi phí** (jobradar `/expenses` → ontos app `misk`):

### Đã xử lý
- **Owner-gate (jobradar side):** mọi route `/api/expenses*` kiểm `MISK_OWNER_CLERK_ID`
  (`lib/expense-auth.ts`), **fail-closed**. jobradar có 14 Clerk user nhưng tất cả chung 1
  ontos workspace cố định (`ONTOS_WORKSPACE_ID`) → nếu không gate thì ai cũng thấy expenses
  của owner. Giờ chỉ đúng 1 user.
- **Hoá đơn private:** lưu key random UUID trong bucket R2, **không lộ public URL**, chỉ xem
  qua presigned URL ngắn hạn (5 phút) tại `/api/expenses/receipt/view` (cũng owner-gated).

### Còn nợ
- **ontos workspace dùng chung, không map theo user.** Owner-gate nằm ở jobradar, **ontos tự
  thân vẫn không bảo vệ** (xem #1). Khi ontos có Clerk auth: map mỗi user → workspace riêng,
  bỏ `ONTOS_WORKSPACE_ID` cố định.
- **Bucket hoá đơn chưa private thật.** Access key R2 hiện **không tạo được bucket mới**
  (AccessDenied — key chỉ scoped bucket `portfolio`). Hoá đơn nằm trong bucket `portfolio`
  (có public domain r2.dev) dưới key random → private-bằng-presign + key khó đoán, nhưng
  **chưa phải bucket cấm-public thật sự**. Việc cần làm: tạo bucket private riêng
  (`misk-receipts`) trong Cloudflare dashboard hoặc cấp admin API token → đổi
  `R2_BUCKET_NAME` cho luồng receipt.
- **Creds R2 plaintext** ở `~/.credentials/cloudflare-r2.md` và `jobradar/.env.local`
  (đã gitignore). Local thì ổn; đừng commit.

---

## Tham chiếu
- Roadmap M0→M2: [Roadmap](./ontology-roadmap.md)
- Auth plug: `apps/core_web/lib/core_web_web/plugs/auth_context.ex`
- Owner gate jobradar: `lib/expense-auth.ts`, `app/api/expenses/*`
