---
id: whip-pipeline
title: Whip It Pipeline — luồng đầy đủ + research SOTA
sidebar_label: ⚙️ Pipeline
sidebar_position: 4
---

# Whip It Pipeline — từ source thô → timeline viral

> 1 doc canonical cho TOÀN luồng "Whip It": lọc shot → hiểu nghĩa → match → review → dựng + pill 2 chiều → graphic.
> Mỗi bước có **research SOTA-2026 + bench khả-thi-browser**. Thay cho các doc cũ tách rời (scene-cut/semantic/graphics).
> Substrate xuyên suốt = **Semantic Temporal Graph** ([[whip-data-model]]). UI ↔ component ↔ engine: [[whip-feature-map]].

## Nguyên tắc
- **Graph, không JSON phẳng:** mọi hiểu-nghĩa = node + typed edge trong OntologyGraph (cut/move → pill tự dời, cut-proof).
- **Browser-first thực dụng:** ưu tiên on-device; cloud khi cần chất lượng. Model nặng → lazy + cache OPFS + bounded.
- **Đo, không cảm tính:** mỗi bước có eval (precision/recall, thời gian) + observability realtime ([[whip-mcp]]).

---

## B1 — Lọc shot: Scene-cut detection
| Method | Cơ chế | Khả thi browser | Verdict |
|---|---|---|---|
| Classical (`sceneCutCore`) | histogram 24-bin + adaptive thr + isRealCut quần thể frame + classify | ✅ rẻ, rVFC playback | pass-1 nhanh, yếu dissolve/đa-loại |
| **TransNetV2** (`transnet.ts`) | 3D-CNN trained (ONNX 31MB, onnxruntime-web WebGPU→wasm) | ⚠️ playback-capture bounded (seek-per-frame ĐO ĐƯỢC quá chậm: clip 45s > 2min) | SOTA; dùng playback rVFC + bound theo clip range |
| Scene-VLM (cloud) | VLM segment scene theo nghĩa | ❌ cloud | gộp B1+B2 ở cloud (cân sau) |
- **Chốt:** two-stage = classical pass-1 + TransNetV2 refine; frame-source = **rVFC playback** (1 pass nhanh), KHÔNG seek-per-frame.
- Eval: `sceneCutEval` (precision/recall/F1/boundary) vs ground-truth cut tay. Console `whipEvalCuts()`.

## B2 — Hiểu NGHĨA từng shot → Scene node (payload SourceMeaning)
Mỗi shot → **Scene node** trong graph, payload đủ field (cache, không decode lại):
`mainSubject · action · background · objects[] · emotion/state · onScreenText(OCR) · camera · transitionIn · motion/energy · suggestedEffect · embedding`.
"Nghĩa" = mainSubject+action+background+emotion (cảnh KỂ gì), không chỉ mô tả bề mặt.

**Research A/B/C (3 loại video — talking-head/action-some-talk/action-no-speech):**
| Method | Cơ chế | Kết quả | Verdict |
|---|---|---|---|
| **A** MediaPipe→LLM | perception face/gesture/pose → LLM | "person standing/speaking" — nông | 🟡 perception tốt, nghĩa nông |
| **B** SmolVLM2 in-browser | 12-frame thưa, on-device | sai bản chất temporal | ❌ on-browser VLM chưa chín |
| **B'** Frame-VLM (sample→VLM mạnh, ARK seed-1-6) | sample frame → VLM cloud rẻ | "holding shirt→put on→adjust→walk away" ≈ TwelveLabs | ✅ **≈90% TwelveLabs**, rẻ, ít upload |
| **C** TwelveLabs Pegasus | upload cả video → model chuyên | bối cảnh+hành động+camera+text overlay | ✅ tốt nhất, upload+cost |

**Kết luận (chốt): 5-LAYER FUSION** (không 1 model thắng tất): speech(Deepgram) + scene(Frame-VLM/TwelveLabs) + gesture + expression(MediaPipe) + prosody(loudness) → cross-modal fuse, emphasis neo vào TỪ. TYPE-AWARE: `detectVideoType` → spine khác mỗi loại video.

## B3 — Match Scene ↔ script (graph traversal, không bag-of-words)
Ưu tiên theo thứ tự:
1. **Hard "nhắc gì→hiện nấy"** (Phong #1): script nhắc entity X → Scene CONTAINS Entity SAME_AS X được ưu tiên cứng. `entityHit.ts` boost matrix (selftest).
2. **Semantic similarity**: embedding(beat) × embedding(scene). LLM chấm matrix (`match-scenes`).
3. **Gán tối ưu** (`matchAssignment`): assignChrono/Free, không greedy, threshold→gap.
4. **swapReview**: scene chưa dùng điểm cao hơn hẳn → đổi.
- Tiến hoá: matrix-match → **graph query** khi node/edge giàu (Entity/SAME_AS/ILLUSTRATED_BY).

## B4 — Review tổng thể + verify
Sau gán: quét vault tìm footage OK hơn (swap). Lớp verify độc lập (`verify-match`) generate→critique: "cảnh này CÓ minh hoạ câu nói?" weak/wrong → gap.

## B5 — Dựng + pill DÍNH 2 CHIỀU
- Clip lên timeline (in-point = cảnh khớp, cut-proof). Caption + semantic pill neo vào span/word_id.
- **2 chiều:** sửa VIDEO (cut/move) → pill tự dời (`relinkCaptions`/`resolveAnchors` ✅). Sửa CAPTION/pill → cập nhật graph span (pill drag ✅; cut→split span = đang bổ sung).
- Voice: ElevenLabs VO theo script. Caption style/effect theo recipe mẫu.

## B6 — Graphic vector tự động (Gadzhi-style, video InovaOS)
> Video mẫu graphic DÀY. LLM định đoạt chỗ cần + ý tưởng → LLM concept hợp mẫu → BytePlus gen → vectorize → MCP place.
- **Vectorize (research SOTA-2026):** **VTracer (Rust→WASM, in-browser, $0)** mặc định cho raster→SVG; **Recraft** (gen native vector) / Adobe MCP `image_vectorize` khi cần sạch tuyệt đối. LLM→SVG (StarVector) chưa production.
- Luồng: phân tích mẫu V4 → `GraphicStyleGraph` → `GraphicIntent[]` (chỗ+ý tưởng, neo word_id) → `GraphicConcept` (layout/palette/anim hợp mẫu) → BytePlus Seedream → VTracer → path clip → MCP `place_graphic` (toạ độ chính xác + animate preset).

---

## Bench khả thi browser (đo thật — cập nhật khi chạy e2e)
| Bước | Engine | Thời gian (clip ~60s) | Khả thi browser | Ghi chú |
|---|---|---|---|---|
| Scene-cut classical | sceneCutSeek | _đo e2e_ | ✅ | rVFC playback |
| Scene-cut TransNetV2 | transnet playback | _đo e2e_ | ⚠️ | bound theo clip; seek-per-frame KO khả thi (>2min/45s) |
| Semantic scene (Frame-VLM) | sceneVlm ARK | _đo e2e_ | ✅ cloud rẻ | ≈90% TwelveLabs |
| Match + swap | entityHit+assign | <0.1s | ✅ pure | — |
| Voice | ElevenLabs | _đo_ | ✅ cloud | — |
| Graphic gen | BytePlus+VTracer | _đo_ | ✅ (VTracer WASM) | — |

## Observability (Moat #3+#5)
- `pipelineLog` (JSON, sống qua crash) + PerfHud (fps always-on) + WhipTrace (live). MCP đọc timeline/cuts/graph + edit (split/join/place) → agent drive đầy đủ. Xem [[whip-mcp]].
