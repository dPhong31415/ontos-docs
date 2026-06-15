---
id: whip-data-model
title: Data Model & OntologyGraph
sidebar_label: 📐 Data Model
sidebar_position: 5
---

# Data Model & OntologyGraph

> Đây là schema của "não" Whip. Mọi thứ — rendering, agent, behaviors, style learning — đều đọc và ghi vào đây.

---

## Triết Lý Thiết Kế

**Palantir Ontology pattern:** mọi object có type, identity (UUID), provenance. Relationships giữa objects là typed edges — không phải foreign keys trong bảng phẳng, không phải array nested. Graph traversal là ngôn ngữ tự nhiên.

**Why typed graph over relational tables:**
```
Relational:  SELECT * FROM behaviors WHERE clip_id = 'x' AND start > 12.4
             → phụ thuộc timestamp, cut là vỡ

Graph:       GET BehaviorNodes ANCHORED_TO Word[w_042..w_061]
             → Word IDs stable, cut là recompute, không vỡ
```

---

## Object Types — OntologyGraph

### Primitive Signals (từ Ingestion Worker)

```typescript
// 1 từ trong transcript — immutable sau khi indexed
Word: {
  id:         string    // UUID stable — anchor của mọi thứ
  w:          string    // text
  start:      number    // giây (float)
  end:        number    // giây (float)
  confidence: number    // Whisper confidence 0–1
  speakerId:  string?   // pyannote diarization
  visible:    boolean   // false khi user cut đoạn này
  // provenance
  source:     "whisper_onnx" | "deepgram" | "human"
  modelId:    string?
}

// 1 khoảnh khắc visual từ MediaPipe FaceLandmarker
FaceEvent: {
  id:         string
  frameT:     number    // giây (float) — thời điểm frame
  expression: string?   // "neutral" | "happy" | "emphatic" | "frown"...
  lookAt:     string?   // "camera" | "left" | "down"...
  blinkL:     number    // 0–1
  blinkR:     number    // 0–1
  headPitch:  number    // degree
  headYaw:    number    // degree
  // provenance
  source:     "mediapipe_face"
  confidence: number
}

// 1 gesture từ MediaPipe GestureRecognizer
GestureEvent: {
  id:         string
  frameT:     number
  gesture:    string    // LLM-readable: "pointing" | "open_hands" | "nodding" | "waving"...
  hand:       "left" | "right" | "both"?
  confidence: number
  source:     "mediapipe_gesture"
}

// Body motion intensity từ MediaPipe PoseLandmarker
PoseEvent: {
  id:         string
  frameT:     number
  motionDelta: number   // normalized motion intensity 0–1 (shoulder/torso movement)
  source:     "mediapipe_pose"
}

// Audio acoustic data (10ms resolution)
Acoustic: {
  t:      number    // giây
  energy: number    // 0–1 normalized RMS
  pitch:  number?   // Hz
  rms:    number
  source: "web_audio_api"
}
```

### Semantic Aggregates

```typescript
// Closure: bind audio + visual + caption cho 1 khoảng thời gian
TemporalNode: {
  id:     string    // UUID
  start:  number    // giây
  end:    number    // giây
  label:  string    // human-readable: "intro_hook", "main_argument_1"...
  type:   string    // "intro" | "hook" | "main" | "callout" | "outro" (open, LLM-gen)
  energy: number    // 0–1, aggregate energy của span

  // Cross-modal summary — synthesized từ raw signals
  audio: {
    energy:   number    // average acoustic energy
    pace:     number    // words/sec
    tone:     string?   // "emphatic" | "calm" | "curious"
    keywords: string[]
  }?
  visual: {
    gesture:     string?   // dominant gesture trong span
    expression:  string?   // dominant expression
    headMotion:  number?   // average motion_delta
    lookAt:      string?   // "camera" | "mixed" | "away"
  }?
  caption: {
    topic:     string?
    summary:   string?
    sentiment: number?   // -1 đến 1
    keywords:  string[]
  }?

  source: "ai" | "manual"
  // provenance
  modelId:    string?
  confidence: number?
  createdAt:  number    // ms timestamp
}

// Editorial intent — LLM-generated, không hardcode type
BehaviorNode: {
  id:            string
  semanticIntent: string   // open vocabulary: "high_energy_hook", "data_anchor"...

  // Anchor — word_id based, không timestamp
  anchor: WordRangeAnchor | VisualEventAnchor | TemporalSpanAnchor | BeatAnchor

  // Cross-modal signals khi synthesize
  signals: {
    audioEnergy:  number?
    gesture:      string?
    expression:   string?
    wordsPerSec:  number?
    keywords:     string[]
  }

  // Editorial intent — open vocabulary, compiled bởi IntentCompiler
  editorialIntent: {
    cameraFeel:    string?   // "aggressive" | "curious" | "static" | "gentle"...
    captionEnergy: string?   // "explosive" | "calm_informative" | "building"...
    visualTension: string?   // "peak" | "release" | "building"...
    audioPresence: string?   // "dry" | "full"...
    // open — LLM có thể thêm key mới
    [key: string]: string | undefined
  }

  // Provenance
  source:     "claude_haiku" | "agent" | "human" | "style_graph"
  confidence: number?
  createdAt:  number
}

// User chỉnh tay trên top of BehaviorNode
EditorialDecision: {
  id:          string
  behaviorId:  string    // references BehaviorNode
  overrides:   Partial<BehaviorNode['editorialIntent']>
  bakedKeyframes?: KeyframeSet  // nếu user "bake to manual"
  source:      "human"
  createdAt:   number
}
```

---

## Anchor Types

```typescript
// Anchor vào word range (phổ biến nhất)
WordRangeAnchor: {
  type:        "word_range"
  startWordId: string   // UUID của Word — stable qua cut
  endWordId:   string
}

// Anchor vào 1 visual event cụ thể
VisualEventAnchor: {
  type:    "visual_event"
  eventId: string       // FaceEvent.id | GestureEvent.id
  offset:  number       // giây offset từ event
}

// Anchor vào TemporalNode (span-level)
TemporalSpanAnchor: {
  type:   "temporal_span"
  spanId: string
  event:  "start" | "end" | "center"
  offset: number
}

// Anchor vào beat nhạc
BeatAnchor: {
  type:        "beat"
  musicClipId: string
  beatIndex:   number
  offset:      number
}
```

---

## Link Types — Typed Edges

```
Word          --[PART_OF]-->        TemporalNode
FaceEvent     --[PART_OF]-->        TemporalNode
GestureEvent  --[PART_OF]-->        TemporalNode
PoseEvent     --[PART_OF]-->        TemporalNode
Acoustic      --[PART_OF]-->        TemporalNode

TemporalNode  --[CONTAINS]-->       TemporalNode    (chapter > section > moment)
TemporalNode  --[FOLLOWS]-->        TemporalNode    (sequence)

BehaviorNode  --[ANCHORED_TO]-->    Word | FaceEvent | GestureEvent | TemporalNode
BehaviorNode  --[CROSS_MODAL]-->    BehaviorNode    (AND trigger — cả hai active)

EditorialDecision --[OVERRIDES]-->  BehaviorNode
```

**CROSS_MODAL link** là cơ chế mạnh nhất:
```
BehaviorNode(audio: "emphasis on 'quan trọng'")
    --[CROSS_MODAL]-->
BehaviorNode(visual: "pointing gesture at t=14.2")

→ trigger: chỉ khi CẢ HAI active đồng thời
→ editorialIntent: "decisive" (mạnh hơn riêng lẻ)
```

---

## Creator Style Graph

```typescript
CreatorStyleGraph: {
  creatorId:  string
  updatedAt:  number

  cutRhythm: {
    preferredCutOffset: number   // giây trước/sau beat: -0.08 = 80ms trước
    silenceThreshold:   number   // giây: cut dead air > này
    paceTarget:         number   // cuts/giây trung bình
    bayesianN:          number   // số project đã học từ
  }

  motionSignature: {
    zoomIntensity:  number       // 1.05–1.20 range
    easeProfile:    string       // "expo_out_soft" | "smooth_punch" | "linear"
    driftAmplitude: number       // handheld drift 0–0.02
  }

  captionVoice: {
    stylePack:       string      // "loud" | "clean" | "minimal" | "cinematic"
    pacingMode:      string      // "word" | "chunk" | "phrase"
    fontWeight:      number      // 400 | 700 | 900
    energyThreshold: number      // 0–1: từ nào threshold highlight
  }

  energyCurve: {
    buildDuration:  number    // 0–1: fraction of video
    peakPosition:   number    // 0–1: where peak falls
    releaseStyle:   string    // "gradual" | "hard_cut" | "fade"
  }

  colorSignature: {
    liftR: number; liftG: number; liftB: number
    saturation: number
    bloomThreshold: number
  }
}
```

**Cập nhật:** Bayesian update sau mỗi project — không ghi đè, weight average với posterior. `bayesianN` count cho biết độ tin cậy (N=1 thì prior mạnh hơn, N=50 thì data đã override prior).

---

## Project Schema (whip format)

```typescript
Project: {
  id:      string   // UUID
  version: string   // schema version

  assets:  Asset[]
  clips:   Clip[]
  tracks:  Track[]

  // Semantic layer
  temporalNodes: TemporalNode[]   // indexed sau ingestion
  behaviors:     BehaviorNode[]   // generated bởi AI Worker
  masks:         Mask[]           // SAM2 tracked masks

  // Creator context
  styleProfile:   CreatorStyleGraph?
  presetRegistry: PresetEntry[]

  // Metadata
  fps:       number
  duration:  number
  createdAt: number
  updatedAt: number
}

Asset: {
  id:       string
  kind:     "video" | "audio" | "image" | "font" | "lut"
  src:      string
  duration: number?
  hasAlpha: boolean?
  ingestionStatus: {
    audio:   "pending" | "processing" | "done" | "failed"
    visual:  "pending" | "processing" | "done" | "failed"
    wordsN:  number?
    eventsN: number?
  }
}

Clip: {
  id:       string
  assetId:  string
  trackId:  string
  in:       number   // thời gian đầu của đoạn dùng trong asset
  out:      number
  offset:   number   // vị trí trên timeline
  blend:    BlendMode?
  pitchLock: boolean?
  vol:      number
  muted:    boolean
  captionBlocks: CaptionBlock[]
  speakerId:     string?
}

Track: {
  id:   string
  kind: "video" | "audio" | "caption" | "overlay"
  name: string
  muted:  boolean
  locked: boolean
  index:  number    // z-order
}

CaptionBlock: {
  id:        string
  clipId:    string
  start:     number
  end:       number
  words:     Word[]
  style:     CaptionStyle
  speakerId: string?
}
```

---

## Render Instruction (Compiled Output)

Compiler đọc OntologyGraph + BehaviorNode[] + EditorialDecision[] → RenderInstruction[]. Đây là layer duy nhất Render Worker nhìn thấy — không bao giờ nhận raw BehaviorNode hay Project.

```typescript
RenderInstruction: {
  clipId:    string
  property:  "scale" | "x" | "y" | "opacity" | "rotation"
           | "filmGrain" | "rgbSplit" | "liftR" | "bloom"...
  keyframes: { t: number; value: number; easing: string }[]
  source:    string   // "behavior:beh_001" | "manual" | "style_graph"
}

CaptionInstruction: {
  blockId:   string
  wordStyles: { wordId: string; size: number; weight: number; color: string; delay: number }[]
  source:    string
}
```

`source` field cho biết keyframe do ai tạo — agent inspect được, user review được.

---

## Storage Layout (OPFS)

```
OPFS/
  {projectId}/
    project.whip          ← full Project JSON (< 10MB thường)
    events.log            ← append-only mutation log (infinite undo)
    ontology/
      words.sqlite        ← Word[] + Acoustic[] (queryable)
      visual.sqlite       ← FaceEvent[] + GestureEvent[] + PoseEvent[]
      behaviors.sqlite    ← BehaviorNode[] + EditorialDecision[]
    proxy/
      {assetId}_720p.mp4  ← preview proxy
    cache/
      {assetId}_thumb_{t}.jpg
```

`project.whip` fit trong context window của Sonnet (200K token) cho hầu hết projects. Khi OntologyGraph lớn hơn → typed MCP tools serve slice (progressive disclosure pattern) thay vì dump toàn bộ.
