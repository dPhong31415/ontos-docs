---
id: whip-behaviors
title: Smart Animation (Behaviors)
sidebar_label: 🎚 Smart Animation
sidebar_position: 9
---

# Smart Animation — Behavior System

> **Đây là thứ làm Whip KHÁC After Effects.** Không keyframe tay. Animation **bind vào ý nghĩa** — lời nói, cử chỉ, cấu trúc nội dung. Sửa lời → animation tự dời theo.
> Và quan trọng hơn: **behavior không phải hardcode** — LLM generate chúng từ semantic understanding.

---

## Vấn đề với Keyframe Tay (AE/CapCut)

```
AE:  đặt zoom keyframe ở giây 12.4
     ↓ trim clip / cắt lại câu
     "graph" dời sang 14.0
     keyframe vẫn ở 12.4 → LỆCH → sửa tay lại  😩
```

Keyframe **độc lập** với nội dung. Mỗi lần đụng audio là animation vỡ. Với talking-head (cắt liên tục) = ác mộng.

---

## Ba Lớp: Anchors → Intents → Keyframes

```
┌─ ANCHORS ──────────────┐   ┌─ EDITORIAL INTENTS ────┐   ┌─ KEYFRAMES ──────────┐
│ mốc theo NỘI DUNG      │──▶│ LLM generate           │──▶│ compiled, derived    │
│                         │   │ open vocabulary        │   │ tự sinh lại khi      │
│ word_id (stable UUID)  │   │ không hardcode type     │   │ anchor đổi           │
│ visual_event_id        │   │                        │   │                      │
│ beat, speaker, subject │   │                        │   │                      │
└────────────────────────┘   └────────────────────────┘   └──────────────────────┘
        source of truth         LLM-generated logic           compiled artifact
```

**Keyframe nằm ở đáy và được sinh ra** — không sửa tay. User làm việc ở tầng Intent, không tầng keyframe.

---

## Lớp 1 — Anchors (Mốc Theo Nội Dung)

Anchor = tham chiếu **dẫn xuất từ nội dung**, không phải số giây cứng.

| Anchor Type | Là gì | Nguồn |
|---|---|---|
| `word_id` | ID stable của 1 từ trong transcript | Whisper ONNX ingestion |
| `word_range` | [startWordId, endWordId] — khoảng ngữ nghĩa | Whisper + LLM segment |
| `visual_event_id` | 1 khoảnh khắc: gesture/expression/motion | MediaPipe ingestion |
| `temporal_span_id` | TemporalSpan — closure audio+visual | OntologyGraph aggregate |
| `beat` | nhịp nhạc tại index N | DSP beat detection |
| `speaker_segment` | đoạn 1 speaker nói | pyannote diarization |

**Quan trọng:** Anchor vào `word_id` (UUID stable), không vào timestamp. Cắt bỏ đoạn từ w_005 đến w_010 → behavior anchor vào w_011 vẫn sống, tự recompute position.

```jsonc
// BehaviorNode anchor — word_id thay vì timestamp
{
  "id": "beh_001",
  "anchor": {
    "type": "word_range",
    "startWordId": "w-3f8a2b",    // UUID stable, không phải index
    "endWordId":   "w-9c1d4e"
  }
}
```

---

## Lớp 2 — Editorial Intents (LLM-Generated, Open Vocabulary)

Đây là điểm khác biệt lớn nhất với mọi editor khác.

**Không phải:**
```jsonc
{ "type": "zoomToRegion", "params": { "amount": 1.15 } }
// ← hardcoded type, AI phải "biết" type này tồn tại
// ← AI bị giới hạn bởi vocabulary cố định của developer
```

**Mà là:**
```jsonc
{
  "id": "beh_001",
  "semanticIntent": "high_energy_hook",         // LLM đặt tên, open
  "anchor": { "type": "word_range", "startWordId": "w-3f8a", "endWordId": "w-9c1d" },
  "signals": {
    "audioEnergy": 0.92,
    "gesture": "pointing",
    "expression": "emphatic",
    "wordsPerSec": 4.2,
    "keywords": ["quan trọng nhất", "phải biết"]
  },
  "editorialIntent": {
    "cameraFeel":       "aggressive",     // compiled → punch-in zoom 1.18x expo-out
    "captionEnergy":    "explosive",      // compiled → word pacing + size×1.3 + weight 900
    "visualTension":    "peak",           // compiled → filmGrain↑ + rgbSplit flash
    "audioPresence":    "dry"             // compiled → music duck -20dB attack 80ms
  },
  "provenance": {
    "source": "claude_haiku",
    "confidence": 0.87,
    "createdAt": 1749456000000
  }
}
```

**LLM generate cả `semanticIntent` lẫn `editorialIntent`** từ cross-modal signals. Vocabulary mở — LLM có thể tạo intent mới chưa từng có (`"gradual_revelation"`, `"comedic_pause"`, `"data_anchor"`).

---

## Intent Compiler — Map Intent → Primitives

```
editorialIntent                    →    technical primitives
─────────────────────────────────────────────────────────────
cameraFeel: "aggressive"           →    scale: 1.0→1.18, expo-out 0.12s, hold, →1.0 smooth 0.3s
cameraFeel: "curious"              →    slow pan +0.03, gentle zoom 1.06, ease settle
cameraFeel: "static"               →    no scale change, minor drift only

captionEnergy: "explosive"         →    pacing=word, size×1.3, weight=900, rgb-split 0.15s
captionEnergy: "calm_informative"  →    pacing=chunk, size×0.9, weight=400, fade in
captionEnergy: "building"          →    size ramp từ 1.0→1.15 over span

visualTension: "peak"              →    filmGrain.amount↑0.4, rgbSplit.offset 3px flash
visualTension: "release"           →    filmGrain.amount↓0.1, brightness +0.05

audioPresence: "dry"               →    music gainDb -20, attack 80ms, release 1.2s
audioPresence: "full"              →    music gainDb 0, no automation
```

Compiler là **data, không phải code** — mapping table, có thể extend mà không rebuild engine. LLM generate intent mới → add row vào mapping table → tự hoạt động.

---

## Lớp 3 — Compile (Intents + Anchors → Keyframes)

```
compileRender(project):
  for mỗi BehaviorNode b:
     anchor   = resolve(b.anchor, ontologyGraph)    // word_id → {start, end} hiện tại
     intents  = b.editorialIntent
     keyframes = intentCompiler.compile(intents, anchor, creatorStyleGraph)
     write(keyframes → clip.properties, source="behavior:beh_001")
```

- Chạy mỗi khi anchor đổi (trim, re-transcribe, user cut)
- Keyframe sinh ra đánh dấu `source: "behavior:id"` — phân biệt với keyframe tay
- `creatorStyleGraph` calibrate output: cùng intent "aggressive" nhưng creator A thích 1.10x, creator B thích 1.18x

---

## Cross-Modal Behaviors

Behavior mạnh nhất khi anchored vào INTERSECTION của audio + visual:

```jsonc
{
  "id": "beh_cm_001",
  "links": [
    { "type": "CROSS_MODAL", "targetId": "beh_audio_042" },   // audio: emphasis
    { "type": "CROSS_MODAL", "targetId": "beh_visual_071" }   // visual: pointing gesture
  ],
  // Chỉ trigger khi CẢ HAI signal active đồng thời
  "triggerLogic": "AND",
  "editorialIntent": {
    "cameraFeel": "decisive",       // mạnh hơn chỉ audio hoặc chỉ visual đơn lẻ
    "captionEnergy": "highlight"
  }
}
```

"Zoom tại đây vì: người đang nói từ 'quan trọng' (Word) ĐỒNG THỜI chỉ tay về phía bảng (GestureEvent)" — semantic depth mà không editor nào làm được.

---

## Override / Bake

Procedural lo 95%. 5% cần chỉnh tay:

```
behavior generated keyframes     →    user muốn cong curve khác ở 1 chỗ
        │
        ├─ Override 1 keyframe   →    giữ behavior, ghi đè 1 điểm
        │                              behavior vẫn recompute các điểm còn lại
        └─ Bake → manual         →    đông cứng thành keyframe tay
                                       ngắt khỏi behavior, full control
```

Giống Unreal "Bake to Keyframes": chạy procedural, bake khi cần tinh chỉnh thủ công. Mặc định không bao giờ mở curve editor.

---

## Agent Làm Việc Ở Tầng Intent

Agent không rải keyframe (dễ sai, khó review). Agent làm việc ở tầng **ngữ nghĩa**:

```
Analyzer Agent:
  → đọc OntologyGraph (Word[], FaceEvent[], GestureEvent[])
  → hiểu: "span này là high-energy hook với pointing gesture và emphatic speech"

Editor Agent:
  → generate BehaviorNode[] với editorialIntent
  → propose → evaluate → refine (tự iterate)
  → calibrate theo Creator Style Graph

Compiler:
  → intentCompiler.compile() → keyframes
  → User review ở tầng intent (readable), không phải 200 keyframe
```

**Đây là lý do behaviors là giao diện tự nhiên cho MCP:** agent phát `synthesize_behaviors(spanId)`, không phát `set_keyframe(t=12.4, scale=1.15)` × 200.
