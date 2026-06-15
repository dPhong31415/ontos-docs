---
id: whip-scene-cut
title: Scene-Cut — Kiến trúc & Lộ trình SOTA
sidebar_label: ✂️ Scene-Cut
sidebar_position: 6
---

# Scene-Cut Detection — kiến trúc & lộ trình lên SOTA

> **Quyết định 16/06/2026 (Phong):** detector hiện tại KHÔNG phải SOTA. Lên TransNetV2 (SOTA-2026), giữ classical
> làm pass rẻ. Moat Whip KHÔNG nằm ở thuật toán cắt shot (đã commoditized) mà ở **semantic scene understanding** trên đó.

## Hiện trạng (classical — pass rẻ)
- `sceneCutCore.ts` (THUẦN): histogram-diff 24-bin + adaptive threshold (median+k·MAD) + `isRealCut` (so quần thể
  frame 2 bên, loại whip-pan/flash) + classify (cut/dissolve/fade/whip) + camera. = lớp **PySceneDetect**.
- 2 frame-source: `analyzeReference` rVFC playback (clip ngắn) · `sceneCutSeek` seek 2-pha (footage dài).
- **Hạn chế (Phong đúng):** threshold "sensitive to content + editing style" → KHÔNG generalize nhiều loại video.
  Mạnh với hard cut; yếu với dissolve/fade dần + cảnh giống màu. KHÔNG train, KHÔNG SOTA.

## Đích SOTA-2026 — TransNetV2 (two-stage)
- **TransNetV2** = 3D-CNN có train (open weights, GitHub soCzech/TransNetV2). Input **48×27 RGB**, cửa sổ 100 frame,
  output xác suất transition/frame. ~250 fps. *Có cả nhánh histogram bên trong* → histogram ko sai, chỉ ko đủ.
- **Two-stage (đúng SOTA paper):** classical pass-1 (rẻ, đã có) → TransNetV2 vớt gradual/missed. Output TransNetV2
  chảy qua **cùng interface `SceneCutResult`/cut times** → ko phá pipeline (split/longFootageIndex/nút Detect giữ nguyên).
- **Chạy đâu:** onnxruntime-web đã có (wasm jsep/WebGPU staged ở `public/ort/`). TransNetV2 ONNX served local
  (no-cloud, moat). Hoặc cloud endpoint cho proof nhanh.

## Ground-truth loop (đổi vai: EVAL, không hand-tune)
- `sceneCutEval.ts` (THUẦN): `evalCuts(predicted, truth, tol)` → precision/recall/F1 + boundary-error. selftest:scenecut-eval 10/10.
- GT = cut Phong sửa tay (split/join trên timeline) trên NHIỀU loại video → fixture `{video, gt, hists, times}`.
- Dùng để: (a) đo classical hiện tại, (b) chứng minh TransNetV2 > classical bằng SỐ, (c) feed semantic scene-grouping.

## Lộ trình (phased, mỗi phase verify được)
1. ✅ **Eval scorer** (`sceneCutEval` + selftest) — thước đo chung. [DONE 16/06]
2. **Capture fixture**: debug-hook stash `{hists,times,predicted}` lúc detect + dump GT (cut Phong sửa) qua harness Playwright (`window.whip`) → `research/scenecut/`.
3. **Baseline**: chấm classical trên fixture nhiều loại video → biết gap thật.
4. **TransNetV2**: lấy/convert ONNX → `transnet.ts` (onnxruntime-web, frame→48×27 sequence qua decodeGate) → SceneCutResult.
5. **Two-stage + chọn**: merge classical+TransNet; eval chọn cấu hình tốt nhất/loại video.
6. **Semantic scene-grouping** (moat): gom shot→scene bằng graph+VLM (khác biệt thật của Whip).

## Tham chiếu
- Files: `sceneCutCore.ts`, `sceneCutSeek.ts`, `sceneCutEval.ts`, `histogram.ts`. Selftest: `selftest:scenecut`, `selftest:scenecut-eval`.
