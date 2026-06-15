---
id: whip-semantic-pipeline
title: Semantic Whip It — luồng hiểu-nghĩa đầy đủ (SOTA-2026)
sidebar_label: 🧠 Semantic Pipeline
sidebar_position: 8
---

# Semantic Whip It — luồng hiểu-nghĩa đầy đủ

> **Quan trọng nhất (Phong):** phần HIỂU NGỮ NGHĨA. "Editor lọc source → hiểu nghĩa từng source (ý nghĩa, ko chỉ
> miêu tả) → match với script khách → review swap → dựng + caption/semantic pill dính 2 chiều". Doc này = bản thiết
> kế logic đàng hoàng từng bước, có research SOTA-2026. Liên kết: [[whip-scene-cut]], [[whip-feature-map]].

## Nguyên tắc nền
- **Substrate = OntologyGraph** (Moat #1): mọi data hiểu-nghĩa neo vào graph theo span/word_id → cut/move thì caption
  + semantic + broll tự dời theo (cut-proof, 2 chiều). KHÔNG lưu rời theo timecode.
- **Browser-first nhưng thực dụng** [[feedback-browser-tradeoff]]: ưu tiên on-device khi khả thi; cloud khi cần chất
  lượng. Mọi model nặng: lazy-load + cache OPFS + bounded.

## Bước 1 — Lọc source: Scene-cut (shot boundary)
- Hiện: `sceneCutCore` (histogram, PySceneDetect-class). SOTA: **TransNetV2** (two-stage, xem [[whip-scene-cut]]).
- SOTA mới đáng xem: **Scene-VLM** (arxiv 2512.21778) — VLM segment SCENE (gộp shot theo nghĩa), +13.7 F1 trên MovieNet.
  → có thể gộp luôn bước 1+2 (cut + nhóm cảnh theo nghĩa) ở tầng cloud. Cân sau khi TransNetV2 chạy.

## Bước 2 — Hiểu NGHĨA từng source (★ trọng tâm) → SourceMeaning schema (cache)
Mỗi sub-clip/scene → 1 record **SourceMeaning** (cache vào graph, đủ field để match + dựng, KHÔNG decode lại):

| Field | Nghĩa | Nguồn trích |
|---|---|---|
| `mainSubject` | chủ thể chính (con mèo con / người nói) + thuộc tính (1 mắt, lông xám) | VLM |
| `action` | hành động/sự kiện đang diễn ra | VLM |
| `background` | bối cảnh/địa điểm (lồng shelter / nhà / phòng khám) | VLM |
| `objects[]` | vật thể phụ đáng kể (nebulizer, carrier) | VLM |
| `emotion`/`state` | cảm xúc/trạng thái (sick, playful, eye-contact) | VLM |
| `onScreenText` | text/caption CÓ SẴN trong khung (OCR) | VLM/OCR |
| `camera` | locked / smooth-move / handheld | đo (sceneCutCore) |
| `transitionIn` | cut / dissolve / fade / whip vào cảnh | đo (sceneCutCore) |
| `motion`/`energy` | mức chuyển động, năng lượng | đo (prosody/diff) |
| `suggestedEffect` | hiệu ứng/text-anim hợp cảnh (gợi ý, ko bắt buộc) | suy luận |
| `embedding` | vector nghĩa (để match nhanh + dedup) | VLM/text-embed |
> "Nghĩa" = `mainSubject+action+background+emotion` (cảnh NÀY KỂ gì), không chỉ caption mô tả bề mặt.

**Model trích nghĩa (research SOTA-2026):**
- **Browser/on-device (Moat #2, no-upload)** — khả thi VỚI dep hiện có (transformers.js + ORT WebGPU đã staged):
  - **FastVLM** (Apple) — chạy real-time TRONG browser qua transformers.js+WebGPU.
  - **SmolVLM2-500M** — video understanding on-device, no cloud.
- **Cloud (chất lượng cao nhất)** — đã/đáng tích hợp:
  - **TwelveLabs Pegasus** (đã wire, `twelvelabs.ts`) · **Qwen3-VL** (ngang GPT-5/Opus, video) · **InternVL3**.
- **Chiến lược:** on-device VLM (FastVLM/SmolVLM2) cho privacy + $0; cloud (Qwen3-VL/TwelveLabs) khi user cần chất
  lượng tối đa. Cùng output → SourceMeaning. (Hiện `sceneVlm.ts` = TwelveLabs + Claude frame-VLM → mở rộng provider.)

## Bước 3 — Match SourceMeaning ↔ script khách (tối ưu thuật toán)
Đa khía cạnh, theo THỨ TỰ ƯU TIÊN:
1. **Hard constraint "nhắc gì → hiện nấy":** script nhắc thực thể X (mèo/nebulizer/shelter) → cảnh có X trong
   `mainSubject/objects/background` được ƯU TIÊN tuyệt đối (boost điểm/ràng buộc cứng). Đây là yêu cầu #1 của Phong.
2. **Semantic similarity:** embedding(script beat) × embedding(SourceMeaning) — nghĩa khớp, ko chỉ keyword.
3. **Gán TỐI ƯU 2 list** (đã có `matchAssignment.ts`): score matrix N beat × M scene → assignChrono (giữ thứ tự
   arc) / assignFree (cold-open reorder). KHÔNG greedy. Threshold → gap (gen-card/stock).
- Nâng cấp: matrix = w1·entityHit (hard) + w2·semanticCos + w3·chronoBonus. LLM chấm semantic, thuật toán cổ điển gán.

## Bước 4 — Review tổng thể: có footage NÀO OK hơn không? → swap
- Sau khi gán: với mỗi beat đã match, quét TOÀN vault xem có scene **chưa dùng** điểm cao hơn đáng kể (Δ > ngưỡng)
  → swap. Không → giữ. (Bài toán cải thiện cục bộ sau gán toàn cục.) Lớp verify độc lập (`verify-match.ts`) giữ.

## Bước 5 — Dựng + caption/semantic pill DÍNH 2 CHIỀU
- Match xong → đặt clip lên timeline (in-point = cảnh khớp, cut-proof). Caption pill + semantic pill neo vào graph
  span/word_id.
- **2 chiều (đủ function):**
  - Sửa VIDEO (cut/move/trim) → caption + semantic span tự dời (đã có `relinkCaptions`/`resolveAnchors`).
  - Sửa CAPTION/SEMANTIC (đổi lời, kéo pill) → cập nhật graph span → ảnh hưởng ngược về clip/match (CẦN verify +
    bổ sung function còn thiếu: pill drag ghi vào span thật; đổi semantic → re-match optional).

## Lộ trình build (phased, verify từng bước)
1. **SourceMeaning schema** trong graph (Zod) + adapter từ `sceneVlm` output hiện tại. [pure, test được]
2. **Entity-hit hard-constraint** vào match matrix (`matchAssignment` + `match-scenes`). [selftest]
3. **Swap-review pass** sau assignment. [selftest]
4. **Browser VLM** (FastVLM/SmolVLM2 qua transformers.js) → provider trong `sceneVlm` (lazy, OPFS cache). [browser test]
5. **Bidirectional pill** đủ function (pill drag → span; cut → pill). [browser test]
6. **TransNetV2** scene-cut (song song, xem whip-scene-cut.md).

## Eval (đo, không cảm tính)
- Cut: `sceneCutEval` (P/R/F1+boundary). Match: cần `matchEval` (entity-hit rate + human-judge swap). Trên NHIỀU loại video.
