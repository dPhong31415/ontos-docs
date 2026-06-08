---
id: whip-auto-viral-pipeline
title: AI Pipelines
sidebar_label: 🔥 AI Pipelines
sidebar_position: 13
---

# Whip — AI Pipelines

> Whip có 2 killer AI pipeline chạy song song — **Auto-Viral Caption** (đã ship) và **"Whip It" Editorial** (v1 target).
> Cả hai cùng tạo ra moat: Caption đánh CapCut, Whip It đánh AE.

| Pipeline | Trạng thái | Mô tả |
|---|---|---|
| **Auto-Viral Caption** | ✅ Live | Paste video → 10s → caption word-level viral, SmartLink bám audio khi cắt |
| **"Whip It" Editorial** | ❌ v1 target | 1 nút → LLM Art Director → graphic + animation style Iman/Hormozi/Gawx |

→ Spec đầy đủ cho "Whip It": [F11 — Whip It](./whip-features) · [MCP tools: whip_it](./whip-mcp) · [Schema: CompositionBrief](./whip-data-model)

---

## Auto-Viral Caption Pipeline (Killer Feature #1)

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
| **Whip Editor** (client-only: cut, preset, shape, text, export) | $0 | **Lifetime $59** (100 suất → $99) | Funnel, validate, cash ngay |
| **Auto-Viral Caption** (AI: transcribe + chunk + style) | ~$0.06/video | **Credits / Subscription** | Recurring revenue + margin |

**Pricing credits (đồng bộ với [Launch & Infra](./whip-launch-infra.md)):**

| Tier | Giá | Caption credits/tháng | Ghi chú |
|---|---|---|---|
| **Free** | $0 | 3 video | Hook — thấy wow moment, muốn thêm |
| **Pro** | $8.99/mo | 50 video | Target: daily creator |
| **Studio** | $29/mo | 200 video | Agency / high-volume |

Margin ~95% (COGS $0.06/video, bán ~$0.18-0.24/video). → Caption credits là **MRR thật**. Editor lifetime là mồi vào funnel.

→ Editor lifetime = cash ngay + validate. Caption credits = máy in tiền. Hai cái bổ trợ, không mâu thuẫn.

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
- **Credits/auth**: Supabase (user + credit balance) + Lemon Squeezy webhook cộng credit. Worker check credit trước khi gọi Deepgram.
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

---

## "Whip It" Editorial Pipeline (Killer Feature #2) ❌ v1 target

> Talking-head nhàm → editorial video style Iman/Hormozi/Gawx trong vài phút. Không cần AE. Không cần design skill.
> **Đây là lý do creator trả tiền** — không phải caption, không phải keyframe.

### Tại sao Whip It là v1 moat (không phải v2)

CapCut không có. AE đòi skill + 4-8 giờ. Opus Clip chỉ cắt, không làm graphic. Thiếu F11 → Whip chỉ là "CapCut với keyframe tốt hơn".

### Kiến trúc tóm tắt (4 phase)

```
Phase 1 — Local analysis (không upload video)
  Whisper tiny (WebGPU) → transcript + prosody
  DSP → beat map + BPM
  MediaPipe → face/gaze, speaker bounding box

Phase 2 — LLM Art Director
  Input: transcript + StyleProfile + beat timestamps (text only, không có video)
  Output: CompositionBrief JSON
    [{t, type, data, style, animation}, ...]
    types: stat_reveal | section_card | kinetic_list | lower_third |
           callout_arrow | quote_card | progress_bar | broll_suggest |
           logo_sting | social_proof

Phase 3 — Asset generation
  Path A (raster): text prompt → Seedream 5.0 / Flux → PNG → RMBG local WebGPU
  Path B (vector): text prompt → Recraft / Ideogram → SVG
  Path C (code-gen): LLM → Pixi component code → sandboxed eval

Phase 4 — Animate + Semantic Sync
  Behaviors gắn vào assets: beat sync, phoneme sync, energy sync
  Transition style từ StyleProfile (Gadzhi hard cut / Gawx crossfade / Hormozi snap zoom)
```

### StyleProfile + Template Recipes

User có 2 cách set style:
1. **Upload video tham chiếu** → 5 frames → vision LLM → StyleProfile JSON
2. **Chọn Template Recipe**: Iman Editorial / Hormozi Bold / Ali Clean / MrBeast Energy / Gawx Cinematic

### COGS và credit

| Action | Tier | Credit cost |
|---|---|---|
| Caption pipeline | Ontos (Deepgram) | $0.06/video |
| Whip It full pipeline | Ontos (LLM + image gen) | $0.30/video |
| StyleProfile extraction | Ontos (vision LLM) | $0.02/video |
| RMBG local | Client free | $0 |
| Beat detect, VAD | Client free | $0 |

→ Pricing tiers: [Launch & Infra](./whip-launch-infra)

### Trạng thái thực tế

| Sub-feature | Trạng thái |
|---|---|
| Shape primitives + text overlay | ✅ live |
| Pixi compositor + behaviors | ✅ live |
| LLM API integration (CF Worker) | ✅ live |
| "Whip It" orchestration (Phase 1-4) | ❌ chưa có |
| StyleProfile extraction | ❌ chưa có |
| Seedream/Flux image gen | ❌ chưa có |
| RMBG local WebGPU | ❌ chưa có |
| SAM2 magic mask | ❌ chưa có |
| CompositionBrief compiler | ❌ chưa có |
| Template Recipe library (5 recipes) | ❌ chưa có |

→ Spec đầy đủ + luồng logic: [F11 trong Tính năng](./whip-features) · [MCP tools](./whip-mcp) · [Schema](./whip-data-model)
