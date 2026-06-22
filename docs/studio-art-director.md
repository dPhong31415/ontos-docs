---
id: studio-art-director
title: Art Director Agent
sidebar_label: 🎬 Art Director Agent
sidebar_position: 5
---

# 🎬 Art Director Agent — phân tích ảnh như một studio thật

> **Một câu:** Một panel chuyên gia *quan sát* ảnh, hai lead (Art Director + Brand Strategist) *tổng hợp* thành recipe + lý do + trục variation, có **trí nhớ tích luỹ** để thông minh dần.

> **Vấn đề:** 6 chuyên gia chạy song song trích lát rời = bảng kê thuộc tính, KHÔNG phải tư duy art director (hiểu *vì sao*, thấy hệ thống, biết *giữ gì/đổi gì*).

```
TẦNG LEAD (tổng hợp)   🎬 Art Director   🧭 Brand Strategist
                              ▲ đọc summary cô đọng ▲
TẦNG OBSERVER (quan sát) 🎨 Color · 🔤 Type · ✍️ Copy · 📐 Layout · 💡 Lighting
```

---

## Công thức Seedream — đã validate (23/06)

Figured out qua 3 probe khác hẳn nhau (**FERN** 1:1/2-cột/9-section calm · **VOLT** 1:1 bold · **KOI** 4:5/1-cột/6-section warm) — tất cả ra đẹp ⇒ tổng quát, không overfit.

**Công thức = phép biến đổi** `analyze(mẫu) → recipe có cấu trúc → render bằng luật harness`:

- **BIẾN (suy từ mẫu, vào recipe):** `aspect` · `grid` · **`boardType`** (guidelines|moodboard) · **`sections[{label,content}]` của chính mẫu** · palette · typography · style · brand/product. → Layout Architect observer xuất các field này; KHÔNG hardcode 9-section/2-col/1:1/numbered (overfit cũ đã bỏ).
- **BẤT BIẾN (cách "nói chuyện" với Seedream — `lib/boardPrompt.ts`):**
  1. liệt kê **từng vùng = `"nhãn" + nội dung`** (vùng địa chỉ rời; moodboard thì bỏ số);
  2. text trong **"ngoặc kép"**, cụm ngắn;
  3. palette = **list hex** strict;
  4. clause **legibility / no-gibberish**;
  5. khai báo **canvas (aspect + grid)** tường minh;
  6. **mọi cell phải ĐẦY ảnh/nội dung — cấm ô màu trống** (trừ palette strip). ← learned từ Bare Earth.
- **Density:** **one-shot** kể cả mẫu dày (chốt 23/06) — chấp nhận glitch text nhỏ ở ô chật. Nguyên lý: *độ nét chữ ∝ nghịch mật độ ô* (KOI 6 ô sạch tuyệt; FERN/VOLT 9 ô có typo nhỏ).
- **Bug fix kèm theo:** `normalizeSize` (seedream.ts) làm-tròn-xuống bội-16 khiến ảnh non-vuông tụt dưới min 3.69M px → 400; đã đổi ceil + margin 2%.

Đã codify: `lib/boardPrompt.ts` (render từ recipe) + Layout Architect xuất `aspect/grid/sections` + app gen dùng `buildBoardPrompt` (thay `compileRecipe` lỏng). Verify CØSÚ → ra đúng aspect 2:3 + 6 section của nó.

### Token optimization (23/06)
Phân tích từng-expert tốn khủng (gửi ảnh × 8 call). Đã tối ưu → **~3.1k token/analyze** (trước ~13–15k, **~4–5×**):
- **Gộp 8 call → 2:** 1 observer combined (có ảnh, json_schema lấy mọi field) + 1 lead combined (**không gửi ảnh**, đọc observation text → 0 vision-token).
- **json_schema** (structured output, model hỗ trợ — guide) thay "xin JSON bằng lời" → JSON sạch, ít token, hết parse-fail. (Per-expert path giữ cho diagnostic.)
- **Downscale ảnh ~1024px** trước khi gửi VLM (client) → cắt mạnh vision-token. Cap `max_tokens`.

---

## Tính năng (mỗi cái: vai trò · SOTA · chốt)

### F1 — Observer tier (5 chuyên gia quan sát)
- **Vai trò:** mỗi observer 1 system prompt, ghi **dữ kiện thô** phần mình (hex, font class, text tokens, đếm layout). Không phán xét.
- **SOTA:** sub-agent trả **summary cô đọng 1–2k token**, **3–5 song song là sweet-spot** ([Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)). 5 observer = đúng sweet-spot.
- **Chốt:** observer **tắt `thinking`** (tiết kiệm token, đã làm); trả bản cô đọng, không dump thô.

### F2 — Lead tier (Art Director + Brand Strategist) ✅ đã chạy
- **Vai trò:** đọc TOÀN BỘ observation + ảnh → 🎬 Art Director ra **design system + bố cục + giữ-gì/đổi-gì + variationAxes**; 🧭 Brand Strategist ra **định vị + chủ đích + rationale**.
- **SOTA:** orchestrator→worker là chuẩn production 2026; nhưng multi-agent **không mặc nhiên hơn** single-agent cùng token budget ([RL multi-agent](https://arxiv.org/abs/2605.02801)) — chỉ thắng khi task tách theo chuyên môn (đúng ca ta). Pattern **Planner→Generator→Evaluator** ([Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)).
- **Đã làm (22/06):** 2 pha trong `/api/analyze` — observers (tắt think) → leads (bật `think`) đọc observation cô đọng → recipe + `designSystem`+`rationale`+`variationAxes`. Verify trên CØSÚ: AD ra design-system + GIỮ/ĐỔI; BS ra rationale "vì sao". UI hiện 3 dòng tóm tắt.
- **Còn:** A/B vs 1-VLM-1-prompt (xác nhận đáng giá) + Evaluator pass (board vs 9 section + lint).

### F3 — Image → Recipe (VLM extraction)
- **Vai trò:** VLM đọc ảnh → JSON field recipe.
- **SOTA:** structured extraction qua VLM ([Seedream 4.0 §3.3](https://arxiv.org/abs/2509.20427)); đang dùng Seed-1.6 (ARK) + rotation chain + cap free-quota.
- **Chốt:** ✅ đã chạy (verify trên board CØSÚ).

### F4 — Memory: closed learning loop (archetype-as-skill)
- **Vai trò:** rút **archetype** ("quiet-luxury heritage") từ mỗi phân tích → recall lần sau → nhanh + nhất quán hơn (thông minh dần).
- **SOTA:** **KHÔNG append thô.** Hermes closed-loop: *tạo skill → cải thiện khi dùng → tự nhắc persist*, recall **FTS5 + tóm tắt LLM**, 20+ skill → nhanh 40% ([Hermes](https://hermes-agent.nousresearch.com/docs/)). Hoặc **Mem0** extract→consolidate / **[A-MEM](https://arxiv.org/abs/2502.12110)** note tự tiến hoá. Học per-archetype kiểu Bayesian → [[whip-archetype]].
- **Chốt:** archetype = "skill"; cache per-image-hash trước (rẻ); memory FTS+summary sau; lâu dài đẩy vào ontos.

### F5 — Compositional assembly (ráp đủ section, không one-shot)
- **Vai trò:** sinh từng phần tử/section rồi ráp theo `recipe.layout` — vượt trần one-shot của T2I trên board nhiều vùng.
- **SOTA:** **[ART (CVPR 2025)](https://arxiv.org/abs/2502.18364)** multi-layer trong suốt + anonymous-region (hơn COLE, nhanh 12×); **[RPG](https://arxiv.org/abs/2401.11708)** MLLM planner → subregion → regional diffusion (hơn DALL-E 3/SDXL). COLE/OpenCOLE (2024) đã bị ART vượt.
- **Chốt:** theo **ART + RPG**, KHÔNG stitch element thô. (phase sau — cần infra khác Seedream gen)

### F6 — Branding showcase sections (template chuẩn)
9 section bắt buộc; Art Director dùng để check thiếu/đủ + đảm bảo output đủ:

| # | Section | Vai trò |
|---|---|---|
| 1 | Hero / cover | wordmark trên texture, set mood |
| 2 | Logo system | primary + lockup + monogram + clear-space |
| 3 | Logo variations | logo qua nhiều nền/colorway |
| 4 | Color palette | swatch + hex (+ pattern) |
| 5 | Typography | primary+secondary typeface, specimen Aa/A–Z/0–9 |
| 6 | Brand elements | pattern, motif, icon |
| 7 | Art direction | phong cách ảnh, mood |
| 8 | Applications | mockup bao bì/tag/poster/stationery |
| 9 | Tagline / voice | slogan, giọng thương hiệu |

Optional: positioning, grid/spacing, do/don't logo. **Thứ tự:** Hero→Logo→Variations→Palette→Type→Elements→Art-direction→Applications. → đóng băng hằng `BRANDING_SECTIONS`.

### F7 — Variation generation
- **Vai trò:** từ recipe (prompt chuẩn) gen N biến thể, xê theo `variationAxes` (giữ linh hồn, đổi cái cho phép).
- **SOTA:** plan-then-generate ([RPG recaption-plan-generate](https://arxiv.org/abs/2401.11708)); recipe = plan. ✅ đúng trục.
- **Chốt:** ✅ gen N variation đã chạy; nâng: xê theo variationAxes do lead quyết.

---

## Agentic best-practice áp dụng (Anthropic + Hermes)
- System prompt **đúng altitude** (heuristic + section, không if-else giòn); **tool tối thiểu không chồng lấn**.
- **Few-shot canonical:** đưa board CØSÚ làm exemplar cho lead.
- **Note-taking ngoài context** + **JIT retrieval** (recall theo hash/query, không preload).
- **Compaction** khi phiên dài. **Honcho** dialectic user-modeling → học gu Phong/khách (nối creator-lock-in).

## Build order
1. ✅ **DONE (22/06)** F1+F2: tách `role: observer|lead`, thêm Art Director + Brand Strategist; observer→summary cô đọng → lead synthesize. Recipe +`rationale`+`variationAxes`+`designSystem`. Verify CØSÚ.
2. ✅ **DONE** Evaluator closed-loop: `lib/evaluator.ts` + `/api/evaluate` (VLM chấm score+fixes) → `generateVariations` gen→eval→refine tới ngưỡng 80 / max 4. Verify FERN=65 bắt đúng lỗi.
3. ✅ **DONE** cache per-image-hash (`lib/recipeCache.ts`). Còn: archetype FTS+summary (Mem0/A-MEM).
4. A/B 2-tầng vs single-agent (xác nhận đáng giá).
5. F5 assembly theo ART/RPG (phase sau; hiện chốt one-shot, chấp nhận glitch nhỏ ô chật).

## Nguồn
- [Seedream 4.0 §3.3, arXiv:2509.20427](https://arxiv.org/abs/2509.20427) · [ART, 2502.18364](https://arxiv.org/abs/2502.18364) · [RPG, 2401.11708](https://arxiv.org/abs/2401.11708) · [A-MEM, 2502.12110](https://arxiv.org/abs/2502.12110) · [RL multi-agent, 2605.02801](https://arxiv.org/abs/2605.02801)
- [Anthropic context engineering](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) · [Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) · [Hermes Agent](https://hermes-agent.nousresearch.com/docs/) · [Hermes 4](https://huggingface.co/NousResearch/Hermes-4-70B)
- [[whip-archetype]] · [[studio-operators]]
