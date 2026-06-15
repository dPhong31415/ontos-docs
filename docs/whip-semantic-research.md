---
id: whip-semantic-research
title: Semantic Understanding — Research A/B/C (kết luận)
sidebar_label: 🔬 Semantic Research
sidebar_position: 10
---

# Research video understanding — A/B/C trên nhiều mẫu (kết luận)

> Đo KHÁCH QUAN (harness `research/vgrounding/`, dashboard live, 0-token) cách đưa video → semantic temporal segments.
> Test trên **3 loại video** (talking-head / action-some-talk / action-no-speech). Kết luận này định hình
> [[whip-semantic-pipeline]]. Nguồn dữ liệu: `frontend/whip/research/vgrounding/README.md` + `out/runs.jsonl`.

## 3 phương pháp × 3 loại video
| Method | Cơ chế | talking-head | action-some-talk | action-no-speech | Verdict |
|---|---|---|---|---|---|
| **A** MediaPipe→LLM | perception (face/gesture/pose) → LLM | person+bottle detect OK, semantic NÔNG ("person speaking") | "person hands down" 🟡 | "person+fridge standing" 🟡 | 🟡 perception tốt, hiểu-nghĩa nông |
| **B** SmolVLM2 in-browser | 12-frame thưa → on-device VLM | sai bản chất temporal (thưa) | — | — | ❌ on-browser VLM 2026 chưa chín |
| **B'** Frame-VLM (sample→VLM mạnh, ARK seed-1-6) | sample frame → VLM cloud rẻ | đọc đúng nội dung | "holding shirt→put on→adjust→walk away" ✅ | "Cutting Mix container→open→display→consume" ✅ | ✅ **≈90% TwelveLabs**, rẻ, ko upload cả video |
| **C** TwelveLabs Pegasus | upload cả video → model chuyên | bối cảnh+hành động+camera+text overlay ✅ | "muscular man putting on shirt in closet" ✅ | "yellow milk-mix container, opens, displays Peel stick" ✅ | ✅ tốt nhất, nhưng upload+cost |

## ⭐ Kết luận (Phong chốt — KHÔNG dùng 1 model đơn)
**Không có 1 model thắng tất cả → KẾT HỢP 5-LAYER FUSION** (mỗi layer mạnh 1 khía cạnh):
1. **Speech** — Deepgram word-level (cloud, đã wire).
2. **Scene/visual** — **Frame-VLM (B')** primary (TwelveLabs Pegasus khi cần chất lượng tối đa). ← gap lớn nhất đã giải.
3. **Gesture** — MediaPipe (granular cử chỉ, TwelveLabs KHÔNG có) — local.
4. **Expression** — MediaPipe (biểu cảm mặt) — local.
5. **Prosody** — ebur128 loudness peaks → emphasis — local.
→ CROSS-MODAL fuse, emphasis neo vào TỪ → editActions (punch-in/zoom/beat-cut). (`semanticGraph.ts buildSemantic`.)

## Vì sao KẾT HỢP, không 1 model
- MediaPipe THẮNG gesture/expression granular (timeline cử chỉ) — VLM/TwelveLabs không có.
- Frame-VLM THẮNG hiểu nội dung cảnh (vật/hành động/bối cảnh) — MediaPipe không có.
- TwelveLabs tốt nhất nhưng upload+cost → chỉ khi cần; Frame-VLM ≈90% mà rẻ + ít upload.
- On-browser VLM (SmolVLM2) 2026 **chưa đủ chín** cho video temporal → theo dõi FastVLM/SmolVLM2 tiến triển ([[whip-semantic-pipeline]] B4).

## TYPE-AWARE (đo signal → chọn spine)
`detectVideoType` (signal-based): talking-head / voiceover-broll / music-montage / silent-broll / interview — mỗi loại
spine khác (speech/scene/beat). Validated 3 loại. → pipeline ko one-size-fits-all (đúng lo "nhiều loại video" của Phong).

## Trạng thái wire vào Whip
- ✅ Feeder #1 scene (frame-VLM + TwelveLabs) wired (`sceneVlm.ts`, `twelvelabs.ts`).
- ✅ Prosody + buildSemantic + smart-animation wired (selftest:semantic 15/15).
- ⏳ Feeder MediaPipe gesture/expr: hoãn (GPU/WebGL, cần browser thật confirm trước critical path).
- ⏳ Mở rộng provider on-device (FastVLM/SmolVLM2) khi chín → no-upload (Moat #2).
