---
id: whip-gtm-launch
title: Go-To-Market & Launch (MVP)
sidebar_label: 🚀 GTM & Launch
sidebar_position: 12
---

# Whip — Go-To-Market, Moat & Launch Playbook

> Mục tiêu: **MVP có người trả tiền trong tuần này.** Dev solo ở VN, không công ty US.
> Tài liệu này = moat/USP + pricing + hạ tầng chi phí + pháp lý + các bước promotion step-by-step.

---

## 0. Hướng đã CHỐT (09/06/2026) — đọc trước

- **Positioning: NHỌN vào talking-head viral.** Bán = *"làm reel talking-head kiểu Gadzhi/Ali Abdaal — text động + auto zoom + background removal, web, 5 phút"*. Graph editor / MCP / Semantic DAG là **moat ẩn** (chiều sâu), **KHÔNG** lên ad. Không pitch "browser AE".
- **Monetize: LIFETIME $59 TRƯỚC** (100 suất đầu, sau $99) → tiền mặt ngay, 0 backend, validate willingness-to-pay. Subscription $8.99/mo (caption credits) bật **sau** khi có ~50 khách.
- **Thanh toán: Lemon Squeezy (MoR) — không dùng Gumroad.** LS lo thuế VAT toàn cầu, subscription chuẩn SaaS. Chi tiết ở [Launch & Infra](./whip-launch-infra.md).
- **V1 còn việc phải làm trước launch:** blend modes (P0 blocker), background removal, "Whip It" pipeline, image gen, graph editor UI. Xem [MVP Status](./whip-mvp-scope.md) P0/P1. → **Tập trung hoàn thành P0 trước, sau đó launch.**
- Asset đã dựng: `whip/landing/index.html` (landing 1 trang) · `whip/landing/DEMO-SCRIPT.md` (demo 45–60s, dùng nút ✨ Demo).

---

## 1. Định vị một câu (positioning)

> **Whip = công cụ làm reel talking-head viral (kiểu Gadzhi/Ali) — text động + auto punch-in zoom + caption, chạy thẳng trên trình duyệt, GPU export, xuất trong 5 phút.**

Không phải "another editor", cũng KHÔNG bán là "browser AE". Nhọn vào **người làm short-form talking-head** (coach, course creator, founder update, faceless caption) — tệp trả tiền để *ra video nhanh*, không muốn học AE.

---

## 2. Moat & USP (vì sao khó copy)

| # | USP | Vì sao là moat |
|---|---|---|
| 1 | **"Whip It" — AI editorial 1 nút** (LLM Art Director → CompositionBrief → graphic + animate) | **Không tool nào có.** AE cần 4-8h tay. CapCut không làm graphic. Đây là lý do creator trả tiền. [F11](./whip-features) |
| 2 | **Smart Animation — bind motion vào lời nói** (zoomToRegion, không keyframe tay) | Trim lời → animation tự dời. [Smart Animation](./whip-behaviors). Đây là **moat sản phẩm** dài hạn. |
| 3 | **Agent-drivable qua MCP** (project = JSON, command auto-gen thành MCP tool) | AI *thực thi* thật, không chỉ gợi ý. Đối thủ kiến trúc binary (AE) không làm sạch được. [MCP docs](./whip-mcp) |
| 4 | **Browser-native + WebCodecs GPU render** | Không cài đặt, không account nặng, render nhanh. CapCut desktop nặng; Resolve/AE khổng lồ. |
| 5 | **Giá + MoR cho thị trường global từ VN** | Lemon Squeezy lo thuế/chargeback → dev VN bán global không cần công ty US. |

**Moat thật sự = #1 + #2** (data-model + behaviors). #3/#4/#5 là lợi thế nhập cuộc, dễ bị bắt chước; #1/#2 cần kiến trúc từ gốc — đối thủ phải viết lại engine.

**Tagline bán hàng:** *"Made with Whip."* — watermark free tier chính là cỗ máy marketing.

---

## 3. Pricing — LIFETIME-first (đã chốt)

| Tier | Giá | Gồm |
|---|---|---|
| **Free** | $0 | Export 1080p, **watermark "Made with Whip"**, preset cơ bản + shapes/text/caption |
| **Pro Lifetime (Launch)** | **$59 một lần** (100 suất đầu) | Xóa watermark · 4K/60fps · **toàn bộ viral preset 👑** · update tương lai · 7-day money-back |
| Pro Lifetime (sau 100) | $99 một lần | như trên |
| Pro Subscription (v2) | $8.99/mo | bật **sau** khi có ~50 khách + cloud sync |

**Vì sao Lifetime trước:** solo dev cần cash sớm, từ 0 audience subscription ra tiền chậm. Lifetime = tiền mặt ngay, 0 backend (chỉ cần Lemon Squeezy), validate giá nhanh. Subscription để dành cho lúc có traffic + feature cloud.

**The Hook:** *"Lifetime $59 cho 100 người đầu — pay once, own forever, kể cả khi có AI auto-edit. Sau đó lên $99 rồi chuyển sang thuê bao. Khóa ngay."* → FOMO + anchor $99.

> Đã code: `FREE_PRESETS` set trong `engine/presets.ts`; watermark trong `engine/export.ts`; paywall gate trong `store.applyPreset`.

---

## 4. Hạ tầng & chi phí MVP (dev VN, scale dần)

### 4.1 Hiện trạng (MVP today — chi phí ~$0)
Whip **client-only**: project lưu `localStorage` + media bytes ở **OPFS** (Origin Private File System) trong máy user. Không cần server lưu file → **không tốn tiền hosting storage** giai đoạn đầu.

| Hạng mục | Giải pháp MVP | Chi phí |
|---|---|---|
| Host app (static SPA) | **Vercel / Cloudflare Pages** (free tier) | $0 |
| Domain | `whipeditor.com` (Namecheap/Cloudflare) | ~$10/năm |
| Lưu media user | **OPFS local** (đã có, `engine/assetStore.ts`) | $0 |
| Thanh toán + thuế | **Lemon Squeezy** (MoR) | 5% + 50¢/giao dịch (chỉ khi có doanh thu) |
| License check | **LS License API** (client-side, không backend) | $0 |
| Pháp lý (Terms/Privacy/Refund) | gen template (xem §6) | $0 |

→ **Burn rate MVP ≈ $10/năm.** Có thể launch ngay hôm nay.

### 4.2 Khi cần "user up file lên lưu trữ cloud" (sau khi có trả phí)
Đây là feature **Pro** (project sync đa thiết bị + media cloud). Lựa chọn rẻ→scale:

| Layer | Khuyến nghị | Lý do |
|---|---|---|
| Object storage media | **Cloudflare R2** | **$0 egress** (quan trọng cho video!), $0.015/GB-tháng. S3 tính egress đắt → tránh. |
| DB user/subscription | **Supabase** (Postgres free 500MB) hoặc **Cloudflare D1** | Free tier rộng, auth sẵn (Supabase Auth) |
| Backend/API + webhook | **Cloudflare Workers** / **Supabase Edge Functions** | Serverless, free tier lớn, nhận LS webhook → set `is_pro` |
| Auth | **Supabase Auth** (magic link / Google) | Khỏi tự code |

→ Chi phí khi có ~100 Pro user: vẫn trong free/near-free tier, ước dưới $20/tháng. R2 egress free là chìa khoá vì video tốn băng thông.

### 4.3 Ontos — launch chung hay tách?
**Khuyến nghị: KHÔNG block MVP Whip vào Ontos.** Lý do:
- Whip MVP cần ship *hôm nay*; Ontos platform (Elixir, ontology) là tầm nhìn dài hạn — build chung sẽ chậm và over-engineer.
- **Nhưng giữ đường tương thích:** project = JSON qua command-layer có schema (đã làm) → sau này Ontos chỉ là **backend đồng bộ + agent host**, không phải viết lại Whip.

**Lộ trình tách → hội tụ:**
1. **Now (MVP):** Whip standalone, client-only, LS license. Ship.
2. **+Cloud (khi có doanh thu):** thêm Supabase + R2 cho sync/auth/webhook. Whip vẫn chạy offline-first.
3. **+Ontos (v2):** Ontos thành "control plane" — host agent (auto-edit), ontology đa app. Whip là app con đầu tiên cắm vào, qua đúng command API hiện có. Không refactor engine.

→ Ontos là **đích đến kiến trúc**, không phải điều kiện launch. Build Whip sạch theo data-model là đã "Ontos-ready".

### 4.4 Media storage: OPFS L1 cache + Relink fallback (kiến trúc đã chốt)
Mục tiêu: mượt như native app, **không bao giờ mất dữ liệu**, vẫn rẻ.
- **L1 cache (OPFS):** import file → **Web Worker** copy bytes vào OPFS (KHÔNG block UI khi copy video 4K hàng GB — bắt buộc đẩy xuống worker). Project JSON lưu "chữ ký" asset `{id, name, size, opfs_path}`.
- **Khôi phục siêu tốc:** mở lại / F5 → quét JSON → đọc thẳng OPFS (0.1s). 99% trường hợp file còn đó.
- **Ultimate fallback (Relink):** OPFS bị browser dọn rác / mở JSON ở máy khác → OPFS null → hiện **khối đỏ Media Offline**, yêu cầu trỏ lại file gốc (khớp `size` chữ ký) → nối lại keyframe + copy vào OPFS máy mới.
- → Che giấu sự mỏng manh của Web SPA: load nhanh (OPFS) + an toàn (relink). Hiện `engine/assetStore.ts` đã dùng OPFS; cần thêm: copy qua Web Worker + relink UI + size-signature trong schema asset.

### 4.5 Backend real-time (Elixir/Phoenix trên Fly.io) — khi lên Agent/collab
BEAM gánh hàng ngàn WebSocket/RAM nhỏ; video decode/encode ở **local (OPFS/WebCodecs)** nên server chỉ điều phối **text JSON + lệnh API** → băng thông ~0.
- Compute: `shared-cpu-1x` 256MB ~ dưới $2/máy; deploy 2 máy (SG+US) cluster → vẫn trong **hoá đơn tối thiểu $5/tháng**.
- Egress: free ~100GB đầu (dùng thực ~0 vì video ở local), sau $0.02/GB.
- Postgres 1GB ~ $4–5/tháng (user, session Lemon Squeezy, project metadata).
- **Tổng ~$10/tháng** cho hạ tầng real-time phân tán toàn cầu, sẵn cho AI Agent sửa video đồng thời.

→ MVP hiện tại **chưa cần** backend này (client-only + LS license). Bật khi mở **cloud sync / collab / AI agent live**.

---

## 5. Tích hợp Lemon Squeezy (đã code sẵn client)

Đã làm trong app: `engine/license.ts`, `components/Paywall.tsx`, gate ở `store`.

**Việc cần làm trên dashboard LS (≈15 phút):**
1. Đăng ký lemonsqueezy.com → tạo Store "Whip".
2. Settings → Payout: nối **tài khoản ngân hàng VN** (Wire) hoặc **Payoneer**. LS payout mỗi ~15 ngày.
3. Tạo Product **"Whip Pro"**, type **Subscription**, $8.99/mo. Bật **License keys** (Settings sản phẩm → "Generate license keys").
4. Copy **Checkout URL** của variant → dán vào `LEMON.checkoutUrl` trong `engine/license.ts`.
5. (v2) Webhook → backend set `is_pro`. MVP dùng license-key activate, không cần webhook.

**Luồng user:** chạm preset 👑 → Paywall mở → "Nâng cấp Pro" → LS checkout → email license key → user dán key vào Paywall → `activateLicense()` validate qua LS API → `isPro=true` → unlock + xóa watermark.

---

## 6. Pháp lý bắt buộc

### 6A. Tối thiểu để Lemon Squeezy cho live

Footer phải có 3 trang (LS từ chối nếu thiếu):
- **Terms of Service** · **Privacy Policy** · **Refund Policy**

Không cần luật sư. Gen bằng **Termly** / **iubenda** (free) hoặc LLM cho "SaaS digital product", host static cùng app (`/terms`, `/privacy`, `/refund`).

**Refund (chọn 1):**
- ✅ **Money-back 7 ngày** (khuyên cho giai đoạn đầu — tăng tỉ lệ chốt): *"Hoàn 100% trong 7 ngày nếu app không export được như quảng cáo."*
- Zero-refund: *"Có gói Free để thử, nên giao dịch Pro không hoàn lại."*

Bản nháp đã đặt ở `whip/legal/` (terms.md, privacy.md, refund.md) — review rồi host.

---

### 6B. Luật Việt Nam 2026 — bóc tách theo công nghệ

> Solo dev VN bán SaaS global → phải biết các quy định dưới đây. Phần lớn không cần làm ngay khi MVP nhỏ, nhưng biết để không bị surprise.

#### Nhóm 1 — Luật An ninh mạng (Luật 24/2018/QH14, sửa đổi bổ sung 2023)

| Công nghệ / tính năng | Yêu cầu pháp lý | Thủ tục | Thời hạn | Chi phí |
|---|---|---|---|---|
| **Lưu dữ liệu người dùng VN** (email, video project, credit log) | **Lưu cục bộ trong lãnh thổ VN** nếu có 10.000+ user VN hoặc bị coi là "mạng xã hội" / "dịch vụ cung cấp thông tin trực tuyến" theo Điều 26 | Giai đoạn MVP: chưa bắt buộc (quy mô nhỏ). Khi có >10k MAU VN: liên hệ Bộ TTTT để xin hướng dẫn; cân nhắc Supabase VN region hoặc Viettel IDC | ~3-6 tháng nếu bị yêu cầu | $0–$500/th (hosting VN) |
| **Dữ liệu nhận dạng cá nhân** (email, name) qua Clerk Auth | Tuân thủ Nghị định 13/2023/NĐ-CP (PDPD — data protection) | Privacy Policy phải rõ: mục đích thu thập, bên thứ 3 (Clerk/Deepgram), quyền xóa dữ liệu | Trước khi launch | $0 (tự làm) |
| **Deepgram** — gửi audio lên server Mỹ | Dữ liệu âm thanh người dùng VN rời lãnh thổ → cần thông báo rõ trong Privacy Policy ("audio được xử lý bởi bên thứ 3 ngoài VN") | Ghi rõ trong Privacy Policy + Terms | Trước launch | $0 |
| **Seedream/Flux API** — gửi text prompt lên | Prompt text không chứa PII → ít rủi ro; ghi rõ trong Privacy Policy | Privacy Policy | Trước launch | $0 |
| **SAM2 / RMBG local WebGPU** | Chạy hoàn toàn trên máy user → không có dữ liệu rời máy → không cần khai báo gì | Không cần | — | $0 |

#### Nhóm 2 — Đăng ký doanh nghiệp / hoạt động thương mại điện tử

| Tình huống | Yêu cầu | Thủ tục | Thời hạn | Chi phí |
|---|---|---|---|---|
| **Nhận tiền từ nước ngoài** (LS payout) | Cá nhân nhận < 200 lần/năm hoặc < $5k/năm qua tài khoản ngân hàng thường là hợp lệ theo quy định ngoại hối. Trên ngưỡng đó → cần hóa đơn xuất khẩu dịch vụ | Giai đoạn đầu: không cần thêm gì. Khi doanh thu lớn: đăng ký hộ kinh doanh hoặc công ty TNHH → xuất hóa đơn dịch vụ phần mềm 0% VAT (dịch vụ xuất khẩu) | MVP: không cần. Khi có MRR ổn định | Hộ kinh doanh: ~500K VNĐ. Công ty TNHH: ~2–5 triệu VNĐ |
| **Website TMĐT bán trực tiếp** (domain VN hoặc có người dùng VN) | Nếu bán qua domain VN (.vn) hoặc hiển thị giá VNĐ → đăng ký sàn TMĐT / website bán hàng với Bộ Công Thương (online.gov.vn). Dùng domain .com + Lemon Squeezy làm MoR → **LS là merchant, không phải Phong** → ít bị áp | LS là bên bán (MoR) → cân nhắc không dùng domain .vn giai đoạn đầu | MVP: không cần nếu dùng LS MoR + domain .com | $0 |
| **Thuế TNCN** (thu nhập cá nhân từ phần mềm) | Thu nhập từ bản quyền/phần mềm > 10 triệu VNĐ/hợp đồng = thuế suất 5% TNCN | Khai thuế năm; giữ bằng chứng nhận tiền từ Wise/Payoneer (LS payout) | Nộp trước 31/3 năm sau | Thuế = 5% (thực ra 5% × 40% taxable = 2% effective nếu khai đúng loại thu nhập bản quyền) |

#### Nhóm 3 — Chứng nhận kỹ thuật / thông báo với Bộ TTTT

| Công nghệ | Bắt buộc không? | Ghi chú |
|---|---|---|
| **Ứng dụng web (SPA)** | ❌ Không cần chứng nhận kỹ thuật cho web app phần mềm thông thường | Chỉ cần nếu là hệ thống thông tin cấp độ 3+ (ngân hàng, y tế, chính phủ) |
| **AI/LLM sử dụng** (Claude/Gemini API) | ❌ Giai đoạn hiện tại Bộ TTTT chưa có quy định cụ thể buộc đăng ký với dịch vụ AI B2C nhỏ. Dự thảo Nghị định về AI 2025 đang lấy ý kiến — theo dõi | Sẽ update khi NĐ về AI được ban hành (dự kiến 2026) |
| **Thu thập sinh trắc học** (MediaPipe — gaze, face bounding box) | ⚠️ **Cẩn thận:** dữ liệu sinh trắc học = dữ liệu nhạy cảm theo NĐ 13/2023. Tuy nhiên MediaPipe chạy **local, không lưu, không upload** → KHÔNG thu thập theo nghĩa pháp lý. Ghi rõ trong Privacy Policy "xử lý tại thiết bị, không lưu trữ" | Ghi rõ trong Privacy Policy |
| **Deepgram** — xử lý giọng nói | ⚠️ Nếu giọng nói người dùng VN được coi là sinh trắc học + gửi ra nước ngoài → cần có đồng ý rõ ràng trước khi xử lý | Consent popup / Privacy Policy rõ trước khi user bấm "Auto Caption" đầu tiên |
| **Lưu key Deepgram / Anthropic trên server** | Tuân thủ Thông tư 12/2022/TT-BTTTT (an toàn hệ thống thông tin cấp 1) nếu hệ thống xử lý dữ liệu thường | Secrets trong Cloudflare Worker env, không commit git — đã làm đúng |

#### Tóm tắt việc cần làm ngay (trước launch)

| Việc | Ai làm | Thời gian |
|---|---|---|
| Privacy Policy ghi rõ: Deepgram nhận audio, Clerk nhận email, MediaPipe xử lý local, Seedream nhận text prompt | Phong | 30 phút |
| Consent rõ ràng trước khi "Auto Caption" lần đầu ("Audio của bạn sẽ được xử lý bởi Deepgram…") | Code | 1 giờ |
| Terms of Service + Refund Policy | Gen bằng Termly/iubenda | 30 phút |
| Dùng domain .com (không .vn) + LS làm MoR → tránh bị áp TMĐT VN giai đoạn đầu | Infra | đã OK |
| Khi MRR > ~50 triệu VNĐ/năm: đăng ký hộ kinh doanh / công ty → xuất hóa đơn | Sau launch | — |

---

## 7. Promotion — step-by-step để có subscriber

### Tuần 0 — chuẩn bị (1-2 ngày)
1. ✅ Build features + paywall (xong).
2. Điền `LEMON.checkoutUrl`, host app lên Vercel + domain.
3. Host 3 trang legal. Bật LS live.
4. Quay **demo 30-60s**: import → punch-in + Hormozi text + glitch → export. Watermark "Made with Whip" hiện rõ (chính là quảng cáo).
5. Landing page 1 trang: hero demo gif + nút "Try free" + bảng giá Early Bird + FAQ.

### Tuần 1 — launch (kênh không tốn tiền, đúng tệp)
| Kênh | Cách làm | Vì sao hiệu quả |
|---|---|---|
| **Reddit** r/VideoEditing, r/NewTubers, r/SideProject | Post "I built a browser video editor with viral presets — free, no install" + demo gif | Tệp creator short-form đúng target |
| **X/Twitter build-in-public** | Thread demo từng preset (Hormozi pop, glitch). Tag #buildinpublic | Preset viral tự nó là content |
| **TikTok/Reels** | Đăng video edit *bằng chính Whip* — watermark = funnel. CTA "edited with Whip, link bio" | Sản phẩm tự quảng cáo, vòng lặp viral |
| **Product Hunt** | Launch ngày thứ 3-4 trong tuần, sáng PST. Chuẩn bị 10-15 upvote mồi | Burst traffic + backlink |
| **Indie Hackers / Hacker News** ("Show HN") | "Show HN: Whip – agent-drivable browser video editor" | Dev/early adopter, nhấn mạnh USP data-model |
| **Cộng đồng VN** (Facebook group dựng phim, content creator) | Bản tiếng Việt, nhấn "free, chạy web, có preset viral" | Tệp gần, dễ feedback nhanh |

### Đòn bẩy chuyển đổi (đã build vào app)
- **Watermark** free → mỗi video user xuất là 1 quảng cáo.
- **👑 trên preset viral** → tò mò → chạm → Paywall (đã code).
- **Early Bird FOMO** "500 user đầu, khóa giá vĩnh viễn".
- **7-day money-back** giảm rủi ro tâm lý khi quẹt thẻ.

### Tuần 2+ — vòng lặp
- Mỗi preset mới = 1 video demo = 1 post.
- Thu feedback → fix → "shipped this week" post (build-in-public giữ nhiệt).
- Khi đủ ~50 paying: bật webhook + cloud sync (Pro feature mới) → nâng giá public $15 cho user mới (Early Bird vẫn $8.99).

---

## 8. Chỉ số theo dõi (đơn giản)
- **Activation:** % user import + export ít nhất 1 video.
- **Free→Pro CVR:** mục tiêu 2-5% giai đoạn đầu.
- **Watermark reach:** đếm video "Made with Whip" ngoài thị trường (search hashtag).
- **MRR:** Lemon Squeezy dashboard.

---

## 9. Checklist launch (tick là live được)
- [ ] `LEMON.checkoutUrl` đã điền (variant thật)
- [ ] LS product Pro + license keys bật + payout VN nối
- [ ] App deploy Vercel + custom domain
- [ ] 3 trang legal host + link ở footer
- [ ] Demo video + landing page
- [ ] Test e2e: free export (có watermark) → mua → activate key → export sạch (4K) ✓
- [ ] Post Reddit + X + Product Hunt scheduled
