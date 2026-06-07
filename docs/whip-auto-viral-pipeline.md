---
id: whip-auto-viral-pipeline
title: Auto-Viral Pipeline (Killer Feature)
sidebar_label: 🔥 Auto-Viral Pipeline
sidebar_position: 13
---

# Whip — Auto-Viral Caption Pipeline (Killer Feature)

> Paste video talking-head → 10 giây sau ra reel có caption viral (word-level, style pack, auto-zoom).
> Đây là lõi của OpusClip / Captions.ai. Nó **đổi mô hình tiền** của Whip — đọc §1 trước.

---

## 1. Quyết định kinh doanh QUAN TRỌNG NHẤT

**Tính năng này có COGS thật (mỗi video tốn tiền API) → KHÔNG bán unlimited lifetime được.**

- 1 video 10 phút: Deepgram nova-2 ~$0.04 + LLM chunking (Haiku/4o-mini) ~$0.02 = **~$0.06/video**.
- Nếu bán lifetime "unlimited caption" → user xài 1000 video = lỗ.

→ **2 dòng sản phẩm tách bạch:**

| Sản phẩm | COGS | Mô hình | Vai trò |
|---|---|---|---|
| **Whip Editor** (client-only: cut, preset, shape, text, export) | $0 | **Lifetime $59** | Funnel, validate, cash ngay |
| **Auto-Viral Caption** (AI: transcribe + chunk + style) | ~$0.06/video | **Credits / Subscription** | Recurring revenue + margin |

**Pricing credits gợi ý:** Free 3 video/tháng (hook) · Creator $12/mo = 50 video · Pro $29/mo = 200 video. Margin ~95% (COGS $0.06, bán ~$0.24/video). → đây mới là **MRR thật**, không phải editor.

→ Editor lifetime = mồi. Caption credits = máy in tiền. Hai cái bổ trợ, không mâu thuẫn.

---

## 2. Kiến trúc — RẺ, KHÔNG cần Elixir lúc đầu

Pipeline là **request/response stateless** → 1 serverless function là đủ. **Đừng dựng Elixir/Fly cho cái này** (Elixir để dành realtime collab/agent sau).

```
[Browser]                          [Serverless 1 endpoint]            [APIs]
 tách audio (WebAudio)  ──MP3──>   /api/caption                ──>  Deepgram nova-2 (word timestamps)
 (chỉ vài MB, không up video)                                  ──>  Claude Haiku / 4o-mini (chunk scenes)
 nhận caption_track JSON  <────────  trả JSON                        
 render PixiJS (client)
```

- **Backend = Cloudflare Worker / Supabase Edge Function** (free tier rộng, giữ API key bí mật). Stateless, không DB cho bước transcribe.
- **Chỉ up AUDIO MP3** (vài MB) — video gốc KHÔNG rời máy → rẻ băng thông + privacy = bán được.
- **Credits/auth**: Supabase (user + credit balance) + LS/Gumroad webhook cộng credit. Worker check credit trước khi gọi Deepgram.
- Cost hạ tầng: free tier đến vài trăm user. Chỉ trả tiền Deepgram/LLM theo lượng dùng (đã tính vào giá credit).

→ Có thể ship **trong vài ngày**, không cần Elixir, không cần Fly.

---

## 3. Schema — nhúng vào project (video-as-data)

```jsonc
"captionTrack": {
  "stylePack": "loud",            // loud | clean | cinematic | terminal
  "pacing": "chunk",              // word | chunk | karaoke
  "posY": 0.8,
  "blocks": [
    {
      "text": "Bí mật nằm ở",
      "start": 12.04, "end": 13.50,
      "words": [
        { "w": "Bí",   "start": 12.04, "end": 12.30 },
        { "w": "mật",  "start": 12.31, "end": 12.50 },
        { "w": "nằm",  "start": 12.51, "end": 12.90 },
        { "w": "ở",    "start": 12.91, "end": 13.50 }
      ]
    }
  ]
}
```

- AI fill `blocks` + `words` (từ Deepgram). User chỉ chọn `stylePack` + `pacing` → đổi look tức thì, không sửa từng từ.
- Tách bạch **phân tích** (backend fill JSON) ↔ **render** (PixiJS đọc `words[]`) → không nghẽn, agent-drivable.

---

## 4. Style Packs (đặt tên TRÁNH trademark — xem §8 bản quyền)

| Pack (tên trong app) | Vibe | Font (open-license) | Fill | Đặc trưng |
|---|---|---|---|---|
| **Loud** | gào thét, đập mắt | Montserrat Black 900, UPPERCASE | #FFF | viền đen dày, từ active vàng |
| **Clean** | tri thức, tối giản | Inter SemiBold | #E5E5E5 | shadow nhẹ |
| **Cinematic** | sang, tài liệu | Playfair Display Italic | #F3F4F6 | nhỏ, đặt 1/3 dưới |
| **Terminal** | tech, bóc phốt | Fira Code | #00FF00 | glow mờ |

> ⚠️ **KHÔNG** đặt tên `hormozi_`/`abdaal_`/`gadzhi_` trong sản phẩm (tên người = quyền nhân thân/trademark). Tên generic. Marketing có thể nói "inspired by top creators" chung chung.

---

## 5. Render — 3 pacing mode (PixiJS, đã có glyph engine sẵn)

Dựa trên `renderStaggerText` đã build, mở rộng đọc `words[]` + word-level timestamp:

1. **Word kinetic** (1 chữ đập mặt): mỗi `word.start` → render đúng 1 chữ to giữa màn; chữ cũ biến mất. Cho đoạn nói nhanh.
2. **Chunk highlight** (nhóm 3-5 chữ): hiện cả `block.text`; từ đang đọc (theo `word` timestamp) sáng lên (active color), còn lại xám. ← **mặc định, viral nhất**.
3. **Karaoke reveal**: cả câu dàn sẵn, mask màu chạy đè theo word timestamp.

Tất cả đọc từ JSON → đổi pacing/style = đổi data, không re-transcribe.

---

## 6. Observability & feedback (solo dev phải có)

| Mục | Tool | Vì sao |
|---|---|---|
| Product analytics + **session replay** | **PostHog** (free 1M events) | XEM người dùng click gì, drop ở đâu — vàng cho solo dev |
| Error tracking | **Sentry** (free) | biết app crash chỗ nào ngoài thực tế |
| Funnel events | PostHog custom events | `import` → `auto_caption_used` → `export` → `hit_paywall` → `purchase` |
| Feedback in-app | nút "Feedback" → **Tally/Canny** form | gom yêu cầu tính năng |
| Business metric | Gumroad/LS dashboard + 1 sheet | MRR, credit usage, COGS/video |

**Trên UI nên track:** thời gian tới-first-export, % dùng auto-caption, pacing/style nào chọn nhiều, chỗ user bỏ giữa chừng. → quyết định build gì tiếp dựa data, không đoán.

---

## 7. Marketing — auto-caption là content tự viral

- **Hero demo**: split-screen "paste video → 8 giây → reel có caption". Before/after = nội dung TikTok hoàn hảo.
- **So sánh 3 cột** (xem §9): AE vs CapCut vs Whip cho cùng 1 hiệu ứng.
- Watermark free tier = funnel.
- Build-in-public: mỗi style pack = 1 video demo.
- Kênh: r/NewTubers, r/SideProject, X #buildinpublic, TikTok, nhóm creator VN, Product Hunt.

---

## 8. KHÔNG dính bản quyền (làm đúng từ đầu)

| Hạng mục | An toàn | Tránh |
|---|---|---|
| **Font** | Montserrat, Inter, Playfair Display, Fira Code — **đều SIL OFL / Apache** → bundle + thương mại OK ✅ | Helvetica, Gotham, font proprietary |
| **Nhạc** | Pixabay / Uppbeat / YouTube Audio Library (license rõ) cho DEMO | bundle nhạc có bản quyền vào app |
| **Footage demo** | Pexels / Pixabay (free commercial, no-attribution) hoặc tự quay | clip TV/film/creator khác |
| **Tên style/đối thủ** | tên generic (Loud/Clean/Cinematic); marketing nói "inspired by" chung | đặt tên người thật trong app (Hormozi/Gadzhi…) |
| **"Look" hiệu ứng** | 1 style (font+màu+animation) KHÔNG có bản quyền → tự do làm | copy logo/asset cụ thể của họ |
| **Deepgram/LLM output** | ToS cho phép dùng output thương mại ✅ | — |

→ Quy tắc: **font open-license + tên generic + nhạc/footage license-clear + không dùng tên người trong sản phẩm.** Làm đúng 4 cái này là sạch.

---

## 9. Chưa có clip talking-head để test → lấy ở đâu

1. **Tự quay 30s bằng điện thoại** — nhanh nhất, authentic, bạn thành luôn nhân vật demo. ← khuyên dùng.
2. **Pexels/Pixabay**: search "person talking", "vlogger", "speaker" — free commercial.
3. **AI avatar**: HeyGen free / D-ID trial → tạo talking-head (cũng test được góc "avatar").
4. **Tạo bằng nút ✨ Demo** đã build (cho test render, chưa có audio thật để transcribe).

→ Để test full pipeline (cần audio): tự quay 1 clip 30-60s nói rõ ràng là đủ.

---

## 10. Thứ tự build (đề xuất)

1. **Render-side trước (client, $0 COGS):** `captionTrack` schema + 4 Style Pack + 3 pacing mode trong PixiJS, đọc transcript **dán tay** hoặc upload .srt. → tính năng có giá trị NGAY, không cần backend, không tốn tiền.
2. **Backend caption (thin serverless):** Worker + Deepgram + Haiku chunk → fill `captionTrack` tự động. Bật credit gate.
3. **Credits + Supabase + webhook** → recurring revenue.
4. Observability (PostHog/Sentry) cắm song song từ bước 1.

→ Bước 1 ship được trong 1-2 ngày, đã đủ "wow" để marketing. Backend AI là bước 2.

---

## 11. ĐÃ BUILD (07/06/2026) — cả 3 bước

| Bước | File | Trạng thái |
|---|---|---|
| 1 · Render | `schema/project.ts` (captionTrack) · `engine/stylePacks.ts` (4 pack) · `engine/captions.ts` (parse SRT/transcript) · `compositor.renderCaptions` (3 pacing) · `components/CaptionPanel.tsx` · tab **Caption** trong left rail | ✅ chạy client, $0 |
| 2 · AI backend | `scripts/caption-worker.mjs` (Deepgram nova-2 + Claude Haiku chunk; CF Worker `export default` + Node local) · `engine/captionService.ts` (tách audio→WAV 16k mono, POST, offset) · `wrangler.toml` | ✅ code xong, cần cắm key |
| 3 · Credits | `engine/credits.ts` (free 3/tháng reset + paid, consume/add) · gate trong CaptionPanel · `.env.example` | ✅ local; nâng Supabase server-side sau |

**Cách bật full pipeline:**
1. Deepgram key → `npx wrangler secret put DEEPGRAM_API_KEY` (+ optional `ANTHROPIC_API_KEY`).
2. `npm run caption:deploy` (hoặc `npm run caption:dev` chạy local :8787).
3. Điền `VITE_CAPTION_API=<worker url>` vào `.env.local` → app gọi thật, trừ credit.
- Chưa cắm key → app dùng **ước lượng demo** (caption chữ mẫu, $0) để marketing/test render.

**Font đã bundle** (index.html, đều SIL OFL/Apache): Montserrat, Inter, Playfair Display, Fira Code.
