---
id: whip-graphics-pipeline
title: Graphics Pipeline — auto-graphic dày đặc (Gadzhi-style)
sidebar_label: 🎨 Graphics Pipeline
sidebar_position: 9
---

# Graphics Pipeline — sinh & chèn graphic tự động (Gadzhi-style)

> **Task (Phong):** video gốc `InovaOS_YT_Video1_RAW.mp4` → bản mẫu `InovaOs_Video1-V4.mp4` (effect kiểu Gadzhi,
> GRAPHIC DÀY ĐẶC). Whip cần: LLM thông minh **định đoạt chỗ nào cần graphic + ý tưởng** → LLM chuyên graphic
> **define concept hợp mẫu** → gọi **BytePlus gen ảnh** → **vectorize** chèn vào Whip → **auto-animate preset +
> toạ độ chính xác hoàn toàn bằng MCP**. Research SOTA-2026 ở dưới.

## Phân tích mẫu trước (bắt buộc — học style từ V4)
- Chạy mẫu `InovaOs_Video1-V4.mp4` qua `analyzeReference` (sceneCuts + style) + VLM đọc graphic: loại graphic (lower-third,
  callout, icon, big-number, arrow, highlight box), nhịp xuất hiện, vị trí, màu, animation in/out. → `GraphicStyleGraph`
  (mở rộng StyleGraph hiện có) làm khuôn cho gen. KHÔNG đoán style — đọc từ mẫu (Moat #1 + #4).

## Luồng 5 bước
### B1 — LLM định đoạt CHỖ NÀO cần graphic + ý tưởng
- Input: transcript + semantic graph (SourceMeaning từ [[whip-semantic-pipeline]]) + GraphicStyleGraph (mẫu).
- LLM (planner) → danh sách `GraphicIntent[]`: `{ atSec, anchorWordId, kind, purpose, keyMessage, emphasisWord }`.
  Vd: "nhắc số liệu 40% → big-number callout tại 0:12 neo vào từ 'forty'". Neo vào word_id (cut-proof, Moat #1).
### B2 — LLM chuyên graphic define CONCEPT (hợp mẫu)
- Input: GraphicIntent + GraphicStyleGraph. → `GraphicConcept`: `{ layout, palette(theo mẫu), typography, iconIdea,
  composition, animIn/Out preset, exact prompt cho gen }`. Đảm bảo ĐỒNG BỘ style mẫu (consistency = chất Gadzhi).
### B3 — Gen ảnh (BytePlus/Seedream)
- `GraphicConcept.prompt` → BytePlus Seedream (đã có pipeline `gen-ai-skill`/tiktok). Ra raster PNG (nền trong suốt nếu
  có thể). Cân: **Recraft** (gen NATIVE vector — bỏ bước vectorize lossy) làm provider thứ 2 cho graphic phẳng/icon.
### B4 — Vectorize → chèn Whip (editable)
- **Research SOTA-2026 (quyết định):**
  | Cách | Browser/no-cloud | Chất lượng | Dùng khi |
  |---|---|---|---|
  | **VTracer (Rust→WASM)** | ✅ in-browser (npm `vectortracer`/wasm) | tốt cho màu phẳng/icon | **mặc định** (Moat #2, vectorize output BytePlus) |
  | **Recraft native-vector** | ❌ cloud | tốt nhất (vector THẬT, ko trace) | graphic phẳng cần sạch tuyệt đối |
  | **Adobe `image_vectorize` (MCP)** | ❌ cloud | tốt | có sẵn MCP, fallback |
  | LLM→SVG (StarVector/Chat2SVG) | tuỳ | bất nhất (research) | chưa production |
- Chốt: **VTracer WASM in-browser** mặc định (no-upload, $0) → SVG paths. Recraft/Adobe khi cần chất lượng cao.
- Chèn: SVG paths → Whip **shape/path clip** (`clip.shape` đã có; cần mở rộng kind="path" + fill/stroke). Neo timeline tại `atSec`/anchorWordId.
### B5 — Auto-animate preset + toạ độ chính xác (MCP)
- Toạ độ: tính từ composition (safe-zone, neo cạnh subject qua constraint "Pin to" đã có) → EXACT x/y/scale.
- Animate: map `GraphicConcept.animIn/Out` → preset motion (`presets.ts`) → behaviors → keyframe. Toàn bộ qua **MCP tool**
  (Moat #3): `whip-mcp` thêm tool `place_graphic({conceptId, atSec, x, y, scale, animIn, animOut})` → agent đặt chính xác.

## Tích hợp Whip (tái dùng, ko đẻ trùng — [[feedback-systematic-reuse]])
- StyleGraph (analyzeReference) → +graphic layer. `clip.shape` → +path/fill. `presets.ts` → preset anim graphic.
- MCP (`whip-mcp.mjs`) → tool place_graphic/gen_graphic. BytePlus client (gen-ai-skill) → reuse.

## Lộ trình build (phased)
1. **VTracer WASM** → `engine/vectorize.ts` (raster→SVG paths, in-browser, gated). [browser test]
2. **Path clip** trong schema + compositor render (PixiJS Graphics từ path). [render test]
3. **GraphicStyleGraph** từ mẫu (analyzeReference + VLM graphic-read). [browser]
4. **B1/B2 LLM** (planner + concept) — api endpoints. [eval trên InovaOS]
5. **BytePlus gen** wire (reuse). **MCP place_graphic**. [e2e]
6. Eval: dựng lại V4 từ RAW, so graphic density/vị trí với mẫu.

## Hai video mẫu (tham chiếu task)
- Gốc: `/Users/phong/Downloads/InovaOS_YT_Video1_RAW.mp4` · Mẫu: `/Users/phong/Downloads/InovaOs_Video1-V4.mp4`.
- Mục tiêu: RAW → (scene-cut + semantic + match + graphics auto) → ≈ V4. Dùng làm e2e benchmark.
