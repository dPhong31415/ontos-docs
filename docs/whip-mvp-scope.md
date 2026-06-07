---
id: whip-mvp-scope
title: MVP Scope, Cost & Scaling (master)
sidebar_label: 🎯 MVP Scope & Cost
sidebar_position: 11
---

# Whip — MVP Scope, Cost & Scaling (single source of truth)

> Bảng chốt: tính năng MVP vs post-MVP, chi phí từng giai đoạn, mốc scale theo user, và
> token economics. Đây là **bảng tổng** — các doc khác (GTM, Launch-Infra, Auto-Viral) là chi tiết.

---

## 1. Feature scope — MVP vs Post-MVP

| Nhóm | MVP (launch) | Post-MVP |
|---|---|---|
| **Editor core** | ✅ import, cut/split/trim, ripple, move, multi-track (V/A), undo/redo | speed-ramp, nested seq |
| **Viewport** | ✅ pan/zoom infinite canvas, gizmo move/scale/rotate, safe-area | guides, snapping nâng cao |
| **Animate** | ✅ keyframe + graph editor (bezier), preset behaviors, auto punch-in | expression, motion-blur thật |
| **Text/Shape** | ✅ text full style, shape primitives, ColorField (Figma picker) | gradient, 3D shadow, pen-tool path |
| **Auto-Viral Caption** | ✅ **CÓ trong MVP** (đã build): Deepgram word-level, 4 style pack, 3 pacing, smart-link audio, token-gated | multi-track caption, AI auto-bind ngữ cảnh |
| **Audio** | ✅ waveform, in/out trim, gain, auto-cut silence, ducking | EQ, noise removal |
| **Export** | ✅ WebCodecs H.264 1080p (free) / 4K (pro), watermark free | ProRes, GIF, batch |
| **Scene/Content** | ✅ storyboard frames + caption timeline | AI scene cut, chatbox |
| **Auth/Billing** | ✅ Clerk login + LS subscription + token system | team workspace, seats |
| **Share** | ⏳ cloud (Supabase) — bước 4 | real-time collab |
| **Onboarding** | ⏳ interactive (sau editor ổn) | — |
| **Dev Dashboard** | ❌ post-MVP (LS dashboard tạm) | Phoenix LiveView "ting" real-time |

→ **MVP = editor + auto-caption + auth + billing.** Caption nằm trong MVP vì đã build + là killer feature; bán theo **token** để không lỗ COGS.

---

## 2. Token economics (100 token = $1)

| Thông số | Giá trị |
|---|---|
| Quy đổi | **100 token = $1** |
| Caption | **10 token / phút audio** (~$0.10 bán) |
| COGS caption | ~$0.04–0.06 / phút (Deepgram + LLM) |
| Margin | ~40–60% |
| Free tier | **50 token/tháng** (~5 phút caption) reset hàng tháng |
| Cache | cùng audio re-gen = **0 token** (đã cache client) |

**Token đến từ:**
- Free 50/tháng (hook).
- Gói subscription tặng kèm: Pro $8.99 → 500 token/tháng; Studio $29 → 2000 token/tháng.
- Mua lẻ top-up: $5 = 500 token, $20 = 2200 token (bonus).

→ Token = đơn vị chung cho MỌI tính năng AI tương lai (caption, auto-cut AI, scene-cut, voice…), không phải đếm "video".

---

## 3. Chi phí hạ tầng theo giai đoạn

### 3a. MVP launch — mục tiêu $0
| Phần | Host | Free-tier | Khi nào tốn tiền |
|---|---|---|---|
| App + Landing | Vercel | ✅ (subdomain .vercel.app) | mua domain (~$10/yr, optional) |
| Auth | Clerk | ✅ tới ~10k MAU | vượt MAU |
| Caption endpoint | Cloudflare Worker | ✅ 100k req/ngày | vượt (khó với MVP) |
| Caption AI | Deepgram | ✅ **$200 credit tặng** (~3000+ phút) | hết credit → ~$0.04/phút |
| Billing | Lemon Squeezy | ✅ $0 khi chưa bán | 5%+50¢/giao dịch khi bán |
| Storage/share | (chưa bật) | — | — |
| **Tổng MVP** | | **~$0/tháng** | |

### 3b. Post-MVP (khi có doanh thu)
| Phần | Host | Chi phí | Bật khi |
|---|---|---|---|
| Cloud share | Supabase | $0 → $25 (Pro) | cần share project/team |
| Backend Ontos | Fly.io (Elixir) | ~$5–10 | webhook + entitlement + dashboard |
| Postgres | Fly.io | ~$5 | cùng Ontos |
| Caption AI | Deepgram | theo dùng | đã tính vào giá token |
| **Tổng post-MVP** | | **~$25–40/tháng** | chỉ khi đã có MRR |

---

## 4. Mốc scale theo user (khi nào nâng cấp gì)

| Users (MAU) | Trạng thái | Hành động hạ tầng | Chi phí/tháng |
|---|---|---|---|
| **0–100** | MVP test/launch | Free-tier hết. Vercel + Clerk + CF Worker + Deepgram credit | **~$0** |
| **100–1k** | Có traction | Bật Supabase share (free→Pro nếu cần). Theo dõi Deepgram credit cạn | **$0–25** |
| **1k–5k** | Có MRR | Bật Fly.io (Ontos: webhook entitlement + token DB server-side) + Postgres. Caption endpoint chuyển sang Phoenix (token check) | **~$40** |
| **5k–20k** | Scale | Fly.io scale 2–3 máy (SG+US cluster), Supabase Pro, R2 cho media egress, Deepgram trả theo dùng | **~$100–300** (doanh thu phải > nhiều lần) |
| **20k+** | Established | Cluster BEAM, CDN, cache KV cho caption, có thể tự host Whisper nếu Deepgram đắt | theo doanh thu |

**Tín hiệu nâng cấp (không nâng sớm):**
- Bật **Fly.io/Ontos** khi: cần token-balance chống gian lận server-side HOẶC ~$50+ MRR (đủ trả).
- Bật **R2** khi: video egress Supabase tốn (nhiều người mở project share).
- Tự host **Whisper** thay Deepgram khi: caption volume lớn tới mức Deepgram > tiền thuê GPU.

---

## 5. Đường tới launch (thứ tự)
1. ✅ Editor + auto-caption + token + Clerk (đã build, build xanh).
2. ⏳ Deploy Vercel + CF Worker caption + Clerk production key.
3. ⏳ LS product + webhook (token top-up) — hoặc tạm bán tay.
4. ⏳ Cloud share Supabase (team test project thật).
5. ⏳ Onboarding interactive.
6. Post: Ontos/Phoenix dashboard khi có MRR.

→ **Bước 1-2 đủ để team test qua link.** 3-4 để bán + share. 6 khi có tiền.
