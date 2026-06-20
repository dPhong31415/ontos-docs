---
id: whip-archetype
title: Archetype Library + Học tích luỹ (Moat #4 thật)
sidebar_label: 🧬 Archetype & Lock-in
sidebar_position: 13
---

# Archetype Library + Học tích luỹ — kế hoạch (Moat #4 phiên bản thật)

> **Trạng thái:** KẾ HOẠCH ĐÃ CHỐT (20/06/2026) — 3 quyết định kiến trúc (mục 7) đã duyệt. Chưa code; sẵn sàng vào P1.
> **Nguồn gốc:** Phong — *"vid con mèo này có 4 dạng kể chuyện (tuần tự, cao trào…), mỗi cái phải có graph
> và công thức viral riêng (moat 4) — coi đã làm đủ chưa, SOTA chưa."*
> **Trả lời ngắn:** Chưa đủ, chưa SOTA. Hiện = bắt chước 1 reel. Đích = thư viện công thức theo dạng kể
> chuyện + học tích luỹ per-creator. Doc này thiết kế đường tới đó.

---

## 1. Hiện trạng (sự thật, đã verify trong code 20/06)

| Thành phần | Có chưa | Thực tế |
|---|---|---|
| Học per-reel → 1 `ReferenceStyleGraph` | ✅ | `analyzeReference.ts`: 1 video mẫu → beats + curves (energy/cutDensity) + look + rules. |
| **Cut profile lái edit** | ✅ (20/06) | `styleGraphApply.cutProfileFrom` → `brollIntent.deriveInsertionIntents` dồn b-roll theo nhịp cắt mẫu. |
| `archetype` (story/listicle/claim-proof/tutorial/rant) | ⚠️ NHÃN CHẾT | Máy đoán ra nhưng chỉ hiện chữ "Type" trong modal + log. **Không lái cấu trúc gì.** |
| `rules` (pattern→intent — schema gọi là "linh hồn") | ⚠️ DATA CHẾT | `StyleRule` parse + lưu trong graph, **không chỗ nào tiêu thụ**. Không drive cắt/chèn/chữ. |
| **Thư viện archetype** (general profile per dạng kể chuyện) | ❌ | Không tồn tại. Mỗi Whip It = copy đúng 1 reel Phong chọn. Không có "dạng tuần tự khung thế này / cao trào thế kia". |
| Học tích luỹ per-creator (Bayesian) | ❌ | `whip-moat.md` ghi là ĐÍCH, chưa làm. Mỗi reel độc lập, không bồi vào prior. |

**Kết luận:** đang ở *single-reel mimicry*. Ý Phong = *archetype-keyed generative structure + per-creator
posterior*. Khoảng cách lớn nhưng đúng hướng moat.

---

## 2. Nền SOTA (research 20/06 — không nói chay)

### 2a. "Dạng kể chuyện" = HÌNH DẠNG đường cảm xúc (có khoa học)
Reagan et al. (UVM/Adelaide) phân tích ~1.300 truyện Project Gutenberg → **6 emotional arc cơ bản**
(Rise / Fall / Man-in-a-hole = fall→rise / Icarus = rise→fall / Cinderella = rise→fall→rise /
Oedipus = fall→rise→fall). Vonnegut đề xuất từ 1980s rằng story shape "feed được vào máy tính".

→ **Insight cho Whip:** "archetype" KHÔNG nên là enum chữ rời rạc. Nó là **một hình dạng đường cong**
(energy + cutDensity theo normalized time) + cấu trúc beat. Whip đã có sẵn `curves` đúng định dạng này →
archetype = *canonical curve shape + beat skeleton*. Cực hợp.

### 2b. Học tích luỹ ít data = Hierarchical Bayesian (partial pooling / shrinkage)
- HBayes, shrinkage priors (Horseshoe/Dirichlet-Laplace), Pep framework (2025): cold-start bằng
  **structured prior** đạt 77–87% oracle với 3–5× ít tương tác hơn RL.
- Ý tưởng: tham số của 1 creator được **kéo (shrink) về prior của nhóm** (archetype/population) khi
  data ít, và **tách dần ra gu riêng** khi data nhiều. Giải đúng bài "Phong mới có 1–2 reel mẫu".

→ **Insight cho Whip:** archetype = **group-level prior**; mỗi reel creator phân tích = **observation**
cập nhật posterior; số reel ít → bám archetype; nhiều → ra gu riêng. Đây CHÍNH là Moat #4 "compound theo
thời gian → không thể clone".

### 2c. Thị trường (đối chiếu để HƠN, không clone)
OpusClip/Submagic/auto-clip 2026: cắt-để-giữ-chân, cấu trúc lặp ~35–55s, 3 giây đầu quyết định, nhân vật
nhất quán. **KHÔNG ai có** kho công thức theo dạng kể chuyện + học tích luỹ per-creator. Đó là chỗ Whip
hơn nhờ moat (cần *data tích luỹ*, model xịn cỡ nào cũng không copy).

---

## 3. Kiến trúc đề xuất — 3 lớp

```
        ┌─────────────────────────────────────────────┐
  L1    │  ARCHETYPE LIBRARY (general profile / prior)  │  ← "4 dạng kể chuyện" của Phong
        │  mỗi archetype = canonical graph + công thức  │
        └───────────────┬─────────────────────────────┘
                        │ prior
        ┌───────────────▼─────────────────────────────┐
  L2    │  CREATOR POSTERIOR (hierarchical Bayesian)    │  ← học tích luỹ, shrink về L1 khi ít data
        │  mỗi reel mẫu = observation → update posterior│
        └───────────────┬─────────────────────────────┘
                        │ effective style graph (blend)
        ┌───────────────▼─────────────────────────────┐
  L3    │  APPLY ENGINE (đã có, mở rộng)                │  ← cutProfile (xong) + RULES (bật dậy)
        │  styleGraphApply → brollIntent / storyPlan    │
        └─────────────────────────────────────────────┘
```

### L1 — Archetype Library (the "general profile")
- **File mới:** `src/engine/archetypes.ts` — kho ~4–6 archetype, mỗi cái:
  - `id`, `label`, `description` (vd "Cao trào — build→peak→release").
  - `arcShape`: canonical `energy` + `cutDensity` curve (normalized 0..1) — *hình dạng* chuẩn (Icarus,
    Cinderella…). Đây là "graph riêng" Phong nói.
  - `beatSkeleton`: chuỗi role + tỉ lệ thời lượng (hook 8% → context 20% → … → cta 12%).
  - `formula`: rules mặc định (pattern→intent) + ngưỡng (cutEvery, brollDensity, introHold) như **prior**.
- **Nguồn khởi tạo:** seed thủ công từ 6 emotional arc (mục 2a) + chỉnh theo short-form (đầu mạnh, CTA cuối).
  KHÔNG cần ML ngay — seed deterministic, học sau (L2).
- **Reuse:** `whipStyles.ts` (6 WhipStyle look/caption) trở thành *bảng look* gắn vào archetype, không phải
  thực thể song song. Tránh 2 hệ recipe.

### L2 — Creator Posterior (học tích luỹ)
- **Detect archetype** từ reel mẫu: so `curves` reel với `arcShape` từng archetype (DTW / cosine trên
  đường cong) → archetype gần nhất + độ khớp. Thay cho `archetype` chuỗi LLM hiện tại (hoặc dùng LLM làm
  tie-break, nhưng *anchor bằng curve* — đo được, không hallucinate).
- **Update posterior:** mỗi reel = observation. Tham số creator (cutEvery, brollDensity, punchZoom, caption
  voice, arcShape) = **shrinkage** về prior archetype:
  `θ_creator = (n·x̄ + κ·θ_prior) / (n + κ)` (κ = sức kéo của prior; n = số reel). Ít reel → bám archetype;
  nhiều → ra gu. (Bắt đầu bằng công thức conjugate đơn giản, không cần MCMC.)
- **Lưu:** per-creator store (Moat #2 local-first → IndexedDB/OPFS trước; serverside sync sau khi có account).
- **Schema mới:** `CreatorStyleProfile { byArchetype: Record<archetypeId, PosteriorParams>, nReels }`.

### L3 — Apply Engine (mở rộng cái đã có)
- **cutProfile:** ✅ đã nối (20/06). Khi có L1/L2, profile lấy từ *effective graph* (posterior blend) thay
  vì chỉ reel đơn.
- **Bật RULES (đang chết):** `src/engine/applyRules.ts` (mới) — đọc `graph.rules` (pattern→intent:
  `when {role?, keyword?, energyGt?} → effect/broll/text`) → áp lên content graph trong `deriveInsertionIntents`
  + chọn camera/effect + text. Đây là "công thức viral" thật sự lái edit. Có rules → ưu tiên rules; thiếu →
  fallback heuristic hiện tại (an toàn).
- **Footage-story path:** truyền cutProfile + rules vào `planFootageStory` (hiện chưa nhận).

---

## 4. Thay đổi data model (tóm tắt)
- `archetypes.ts`: `Archetype { id, label, arcShape{energy,cutDensity}, beatSkeleton[], formula{rules,thresholds} }`.
- `styleGraph.ts`: thêm `archetypeId` + `archetypeFit` (độ khớp) bên cạnh `archetype` chuỗi (giữ tương thích).
- `CreatorStyleProfile` (mới): posterior per-archetype + `nReels`.
- `styleGraphApply.ts`: nhận thêm `creatorProfile?` → trả effective params (blend prior↔posterior↔reel).

## 5. Lộ trình (phased — làm chuẩn, verify từng bước)
1. ✅ **P1 — Archetype Library (L1) + detect bằng curve** (DONE 20/06). `src/engine/archetypes.ts` (6 dạng:
   cao-trào/tuần-tự/liệt-kê/tutorial/vấn-đề-giải-pháp/lột-xác, arcShape energy+cut + beatSkeleton + formula).
   `detectArchetype` = Pearson(hình)+RMSE(mức) → phân biệt cả 2 dạng cùng hình. analyzeReference set
   `archetypeId/Fit` từ curve. StyleGraphModal hiện "Dạng: … · khớp %". `selftest:archetype` 11/11.
   *Còn:* dùng beatSkeleton để DRIVE roles khi Whip It (giờ mới surface + làm prior cho L2).
2. ✅ **P2 — Bật RULES (L3)** (DONE). `src/engine/applyRules.ts` `resolveRules`/`ruleFootageBoost`; brollIntent
   `ruleBoost`; WhipItButton truyền `styleGraph.rules`. Rule cụ thể (keyword/energy) ghi đè rule chung (role).
   `selftest:rules` 13/13.
3. ✅ **P3 — Creator Posterior (L2)** (DONE). `src/engine/creatorProfile.ts` hierarchical Bayesian shrinkage
   per-(creator×dạng), localStorage. `store.saveStyleGraph` → `learnFromReel` mỗi reel. `selftest:creator` 6/6
   (n=1 bám prior 2.05, n=20 hội tụ gu 1.18).
4. ✅ **P4 — Effective blend vào edit** (DONE phần chính). `styleGraphToWhipParams(g, dur, learned)` — gu đã học
   override cutEvery/brollDensity/punchZoom; WhipItButton dùng `effectiveParams(getPosterior(...))`.
   *Còn:* footage-story path (`planFootageStory`) chưa nhận; UI "vì sao bản dựng này" (giải trình learned) chưa.

## 6. Kiểm 5 Moat
- **#1 Semantic:** archetype/rules neo vào graph ngữ nghĩa, không pixel. ✅ củng cố.
- **#2 Local-first:** posterior lưu local trước (IndexedDB/OPFS), không bắt buộc server. ✅ giữ.
- **#3 Agent/MCP:** archetype + rules expose được làm tool ("dựng kiểu Cao trào"). ✅ mở rộng được.
- **#4 Lock-in:** ĐÂY là phần làm Moat #4 thật (prior→posterior compound). ✅ trọng tâm.
- **#5 Thread:** detect curve (DTW) nhẹ, chạy được khi analyze; không đụng render loop. ✅ ko regress.

## 7. Quyết định (Phong chốt 20/06)
- **(a) Seed = CẢ HAI.** `arcShape` lấy theo 6 emotional arc khoa học (Rise/Fall/Man-in-hole/Icarus/
  Cinderella/Oedipus) làm xương đường cong đo-được; `label` dùng ngôn ngữ creator (tuần tự / cao trào /
  liệt kê / tutorial) cho dễ hiểu. → 1 archetype = (arc khoa học) × (nhãn creator). Mapping arc↔nhãn định
  nghĩa trong `archetypes.ts` (vd cao trào = Icarus/rise→fall hoặc Cinderella tuỳ CTA).
- **(b) Posterior = per-(creator × archetype).** Gu của creator ở dạng "cao trào" tách khỏi "liệt kê".
  Hệ quả: cần shrinkage mạnh (κ lớn) lúc ít reel/dạng để không lệch sớm — nhấn mạnh ở P3.
- **(c) Reel lạ = ngưỡng + đẻ dạng mới.** Khớp < ngưỡng (vd fit < 0.55) → gắn `archetypeId="custom"` + giữ
  arcShape thật của reel. Khi gom đủ N reel "custom" cụm gần nhau (clustering trên arcShape) → đẻ archetype
  mới (data-driven), bổ sung vào library. → library lớn dần theo data creator (củng cố Moat #4).

---

> Liên quan: [whip-moat.md](./whip-moat.md) (Moat #4), [whip-pipeline.md](./whip-pipeline.md) (Whip It flow),
> [whip-broll-match.md](./whip-broll-match.md) (deriveInsertionIntents + cutProfile).
