---
id: whip-data-model
title: Project Document
sidebar_label: 🗄 Project Document
sidebar_position: 4
---

# Project Document — `project.whip`

> Single source of truth. JSON khai báo, diff-able, git-able, **agent đọc/sửa được như text**.
> Đủ mạnh để thay After Effects trong talking-head production; đủ đơn giản để CapCut-user học được.

:::info Xem thêm
`compositions[]` (CompositionBrief): [F11 — Whip It pipeline](./whip-features) · MCP command: [apply_composition](./whip-mcp)
:::

---

## Toàn bộ Schema — production-complete

```jsonc
{
  "version": 1,
  "fps": 30,
  "resolution": [1920, 1080],
  "aspect": "16:9",          // "9:16" | "1:1" | "4:5" | "2.39:1"
  "duration": 142.5,

  // ── Preset Registry ──────────────────────────────────────────────────
  // Import từ Preset Builder output hoặc Marketplace download
  // Engine chỉ đọc compiled field; graph field dành cho Preset Builder editor
  "presetRegistry": {
    "gawx_cinematic": {
      "type": "look",
      "compiled": { "effects": [
        {"type":"colorCorrect","params":{"liftB":-0.02,"saturation":0.85}},
        {"type":"bloom",      "params":{"threshold":0.75,"intensity":0.3}},
        {"type":"filmGrain",  "params":{"amount":0.15}},
        {"type":"rgbSplit",   "params":{"offset":1.5}}
      ]}
    },
    "hormozi_bold": {
      "type": "look",
      "compiled": { "effects": [
        {"type":"colorCorrect","params":{"contrast":0.15,"saturation":0.2}},
        {"type":"bloom",      "params":{"threshold":0.6,"intensity":0.5}},
        {"type":"vignette",   "params":{"intensity":0.4}}
      ]}
    },
    "hard_cut":           { "type":"transition","compiled":{"type":"cut","duration":0} },
    "cross_dissolve":     { "type":"transition","compiled":{"type":"crossDissolve","duration":0.3} },
    "auto_duck_podcast":  { "type":"audio","compiled":{"duckDb":-14,"attackMs":200,"releaseMs":800} }
  },

  // ── Assets ────────────────────────────────────────────────────────────
  "assets": {
    "a_video":   { "type": "video",  "src": "interview.mp4",
                   "duration": 600, "w": 1920, "h": 1080,
                   "hasAlpha": false },

    "a_music":   { "type": "audio",  "src": "bgm.mp3",  "duration": 180 },

    "a_logo":    { "type": "image",  "src": "logo.png",
                   "hasAlpha": true },       // PNG/WEBP với alpha channel

    "a_graphic": { "type": "image",  "src": "generated_overlay.png",
                   "hasAlpha": true,
                   "generatedBy": "seedream", "prompt": "..." },  // AI gen asset

    "a_vector":  { "type": "svg",    "src": "stat_bar.svg" },     // vector graphic

    "a_srt":     { "type": "srt",    "src": "captions_en.srt",
                   "language": "en" }        // import SRT/VTT file
  },

  // ── Tracks ────────────────────────────────────────────────────────────
  "tracks": [

    // ── Video track (main talking-head) ──
    {
      "id": "v1", "kind": "video",
      "label": "Main Camera",
      "locked": false, "muted": false, "solo": false,
      "clips": [
        {
          "id": "c1", "asset": "a_video",
          "start": 0, "end": 8.2,
          "in": 12.0,              // in-point trong source video
          "speed": 1.0,            // constant speed (1x, 0.5x, 2x...)
          "speedKeys": [],         // speed ramp keyframes [{t, speed}]
          "pitchLock": true,       // giữ pitch khi speed thay đổi
          "blend": "normal",       // BLEND MODE: normal|multiply|screen|overlay|add|soft_light
          "opacity": 1.0,
          "maskId": null,          // SAM2 segment mask (nếu có)
          "reframe": null,         // { x: 0.5, y: 0.3, scale: 1.2 } smart reframe
          "cropAspect": null,      // "9:16" — crop clip sang aspect khác
          "properties": {
            "scale":    [ {"t":0,"v":1.0,"ease":"smooth"},
                          {"t":2.0,"v":1.08,"ease":[0.16,1,0.3,1]} ],  // punch-in
            "position": [ {"t":0,"v":[0,0]} ],
            "rotation": [ {"t":0,"v":0} ],
            "opacity":  [ {"t":0,"v":1} ],
            "crop":     [ {"t":0,"v":[0,0,0,0]} ]   // [top, right, bottom, left] normalized
          },
          "lookPresetId": "gawx_cinematic",  // OPTIONAL: live reference tới preset (xem §Preset System)
          "transitionIn":  { "presetId": "hard_cut" },   // preset cho cut vào đầu clip
          "transitionOut": { "presetId": "cross_dissolve", "duration": 0.3 }, // preset cut ra
          "effects": [
            // ── Color / Look ──
            // Nếu lookPresetId set → engine MERGE baked params dưới đây với preset definition
            // applyPreset() bake preset vào đây; lookPresetId giữ để biết nguồn gốc
            { "id":"e_grade", "type":"colorCorrect",
              "params": {
                "liftR":0, "liftG":0, "liftB":0,           // shadows
                "gammaR":1,"gammaG":1,"gammaB":1,           // midtones
                "gainR":1, "gainG":1, "gainB":1,            // highlights
                "saturation":1.0, "contrast":1.0,
                "temperature":0, "tint":0
              }
            },
            // ── Atmosphere ──
            { "id":"e_grain", "type":"filmGrain",
              "params": {
                "amount": [ {"t":0,"v":0.15} ],             // KEYFRAME-able
                "size": 1.2, "blendMode": "overlay"
              }
            },
            // ── Distortion ──
            { "id":"e_rgb", "type":"rgbSplit",
              "params": {
                "offset": [ {"t":0,"v":0}, {"t":0.3,"v":6}, {"t":0.6,"v":0} ]  // keyframe
              }
            },
            // ── Bloom ──
            { "id":"e_bloom", "type":"bloom",
              "params": { "threshold":0.7, "intensity":0.4, "radius":20 }
            }
          ]
        }
      ]
    },

    // ── Overlay track (generated graphics từ F11) ──
    {
      "id": "ov1", "kind": "overlay",
      "label": "AI Graphics",
      "clips": [
        {
          "id": "ov_stat", "asset": "a_graphic",
          "start": 0, "end": 3.0,
          "blend": "normal",       // screen | add hay dùng cho light effects
          "properties": {
            "scale":    [ {"t":0,"v":0.8}, {"t":0.2,"v":1.0,"ease":[0.16,1,0.3,1]} ],
            "opacity":  [ {"t":0,"v":0}, {"t":0.1,"v":1} ]
          },
          "compositionRef": "comp_001"   // link về compositions[] element
        }
      ]
    },

    // ── Caption track ──
    {
      "id": "cap1", "kind": "caption",
      "stylePack": "loud",          // loud | clean | cinematic | terminal
      "pacing": "chunk",            // word | chunk | karaoke
      "language": "vi",
      "posY": 0.82,
      "speakerMap": {               // diarization: speaker ID → display style
        "SPEAKER_00": { "color": "#ffffff", "label": "Host" },
        "SPEAKER_01": { "color": "#7c6af7", "label": "Guest" }
      },
      "blocks": [
        {
          "text": "Bí mật nằm ở",
          "start": 12.04, "end": 13.50,
          "speakerId": "SPEAKER_00",
          "style": null,            // null = inherit track style; override per-block nếu cần
          "srcAsset": "a_video", "srcIn": 12.04, "srcDur": 1.46,  // SmartLink anchor
          "words": [
            { "w":"Bí",   "start":12.04, "end":12.30 },
            { "w":"mật",  "start":12.31, "end":12.50 },
            { "w":"nằm",  "start":12.51, "end":12.90 },
            { "w":"ở",    "start":12.91, "end":13.50 }
          ]
        }
      ]
    },

    // ── Audio track ──
    {
      "id": "aud1", "kind": "audio",
      "label": "Background Music",
      "clips": [
        {
          "id": "m1", "asset": "a_music",
          "start": 0, "end": 142.5, "in": 0,
          "gainDb": -6,
          "pitchLock": true,         // pitch không đổi khi speed thay đổi
          "audioPresetId": "auto_duck_podcast",   // OPTIONAL: reference audio preset
          "automation": {
            "gainDb": [ {"t":0,"v":-6},{"t":40,"v":-18},{"t":48,"v":-6} ]  // ducking
          },
          "fx": [
            { "type":"eq",
              "bands": [ {"f":80,"gain":-4,"q":1}, {"f":8000,"gain":2,"q":0.7} ] },
            { "type":"compressor", "threshold":-18, "ratio":3, "attack":5, "release":100 },
            { "type":"noiseRemoval", "strength":0.6, "mode":"auto" },  // noise gate AI
            { "type":"limiter", "ceiling":-1 }
          ]
        }
      ]
    }
  ],

  // ── Transitions ───────────────────────────────────────────────────────
  "transitions": [
    {
      "id":"x1", "between":["c1","c2"],
      "presetId": "cross_dissolve",   // OPTIONAL: reference preset → baked params dưới đây
      "type": "crossDissolve",        // crossDissolve | dipToBlack | wipe | flashCut | zoomCut | whipPan | glitchCut
      "duration": 0.5,
      "ease": "smooth"
    }
  ],

  // ── Anchors + Behaviors (smart animation layer) ───────────────────────
  "anchors": {
    "regions": [
      { "id":"r_chart", "label":"nói về graph",
        "start":12.4, "end":18.9,
        "source":"transcript:revenue chart",  // tự động match từ transcript
        "clipId": "c1" }
    ],
    "cues": [
      { "id":"cue_emph_3", "t":24.1, "kind":"emphasis", "source":"speech" },
      { "id":"cue_beat_7", "t":14.0, "kind":"beat", "source":"dsp" }
    ],
    "beats": [
      { "t": 0.5 }, { "t": 1.0 }, { "t": 1.5 }   // beat map từ DSP
    ]
  },
  "behaviors": [
    { "id":"b1", "type":"zoomToRegion",
      "target":"c1", "bind":"r_chart",
      "params":{ "amount":1.15, "ease":"smooth", "releaseAfter":true }
    },
    { "id":"b2", "type":"followSubject",
      "target":"c1", "bind":"auto",   // MediaPipe face tracking
      "params":{ "smoothing":0.8, "maxOffset":0.1 }
    }
  ],

  // ── F11 "Whip It" ──────────────────────────────────────────────────────
  "styleProfile": {
    "source": "recipe",              // "recipe" | "extracted"
    "recipeId": "iman_editorial",
    "palette": ["#0a0a0a","#ffffff","#7c6af7"],
    "motionStyle": "fast_cut",       // fast_cut | slow_burn | rhythmic | cinematic
    "energy": "high",
    "graphicDensity": "heavy",
    "typography": { "family": "Montserrat", "weight": 900, "case": "upper" }
  },

  "compositions": [
    {
      "id": "comp_001",
      "t": 0, "duration": 3.0,
      "type": "stat_reveal",
      "data": { "value": "$10M", "label": "in 12 months" },
      "style": "hormozi_impact",
      "layers": [
        { "assetId": "a_graphic", "blend": "normal", "scale": 1.0 }
      ],
      "animation": { "in": "text_slam", "out": "cut", "ease": "expo_out" },
      "beatSync": true,
      "phonemeSync": false
    },
    {
      "id": "comp_002",
      "t": 18.5, "duration": 5.0,
      "type": "section_card",
      "data": { "title": "Sai lầm #1", "subtitle": "Mà 90% founder mắc phải" },
      "style": "iman_editorial",
      "animation": { "in": "slide_up", "out": "cut" }
    },
    {
      "id": "comp_003",
      "t": 35.0, "duration": 8.0,
      "type": "kinetic_list",
      "data": { "items": ["Research", "Build", "Ship"] },
      "style": "ali_clean",
      "animation": { "in": "stagger_reveal" },
      "phonemeSync": true          // từng item xuất hiện đúng phoneme tương ứng
    },
    {
      "id": "comp_004",
      "t": 48.0, "duration": 4.0,
      "type": "callout_arrow",
      "data": { "text": "MacBook Pro M4", "direction": "left" },
      "maskId": "mask_laptop",     // arrow bám SAM2 mask → tự track khi camera di chuyển
      "animation": { "in": "draw_arrow", "out": "fade" }
    }
  ],

  // ── Masks (SAM2 segmentation) ──────────────────────────────────────────
  "masks": [
    {
      "id": "mask_laptop",
      "clipId": "c1",
      "seedPoint": { "x": 0.62, "y": 0.45, "frameT": 48.2 },  // điểm user click
      "tracked": true,             // SAM2 track qua toàn clip
      "boundingBoxes": []          // populated after tracking: [{t, x, y, w, h}]
    }
  ]
}
```

---

## Composition types — đầy đủ

| Type | Dùng cho | Data fields |
|---|---|---|
| `stat_reveal` | Số liệu lớn bay vào | `value`, `label`, `prefix`, `suffix` |
| `section_card` | Full-screen chapter break | `title`, `subtitle`, `background` |
| `kinetic_list` | Danh sách 2-5 items xuất hiện theo lời | `items[]`, `icon?` |
| `lower_third` | Name tag, title dưới màn | `name`, `title`, `style` |
| `callout_arrow` | Mũi tên chỉ vào object | `text`, `direction`, `maskId?` |
| `quote_card` | Quote to nổi bật | `text`, `attribution?` |
| `progress_bar` | Thanh tiến độ animated | `value`, `label`, `color` |
| `broll_suggest` | Gợi ý b-roll (placeholder) | `visual_desc`, `duration` |
| `logo_sting` | Logo fly-in | `assetId`, `position` |
| `social_proof` | Follower/review count | `platform`, `count`, `style` |

---

## Blend modes — khi nào dùng cái nào

| Mode | Dùng cho | Cách hoạt động |
|---|---|---|
| `normal` | Clip thông thường | Pixel trên đè pixel dưới theo opacity |
| `screen` | Light leaks, glow overlay, lens flare | Sáng lên — đen = transparent |
| `multiply` | Shadow overlay, dark vignette | Tối đi — trắng = transparent |
| `overlay` | Texture, grain, film look | Sáng thêm sáng, tối thêm tối |
| `add` | Neon glow, particle effects | Tổng pixel — rất sáng |
| `soft_light` | Subtle color grade | Nhẹ hơn overlay |

**⚠️ Hiện tại**: chỉ `normal` được render. Các mode khác = P0 blocker cho overlay/composite bất kỳ.

---

## Edge cases quan trọng trong schema

### Speed ramp + caption sync
```jsonc
// Clip có speed ramp 0.5x tại t=10–12s
// CaptionService phải stretch word timestamps theo factor:
// word.start_timeline = clip.start + (word.srcIn - clip.in) / speedAt(word.srcIn)

"speedKeys": [
  { "t": 0, "speed": 1.0 },
  { "t": 10.0, "speed": 0.5 },   // vào slow-mo
  { "t": 12.0, "speed": 1.0 }    // ra slow-mo
]
// pitchLock: true → audio không bị pitch-down khi 0.5x
```

### Multi-speaker diarization
```jsonc
"speakerMap": {
  "SPEAKER_00": { "color": "#fff",   "label": "Phong", "position": "bottom" },
  "SPEAKER_01": { "color": "#7c6af7","label": "Guest", "position": "top" }
}
// blocks có speakerId → render position/color khác nhau
// khi cắt clip: chỉ relink block cùng speakerId với audio segment tương ứng
```

### Asset hết frame (mask out of bounds)
```jsonc
"masks": [{
  "id": "mask_001",
  "outOfFramePolicy": "freeze",  // freeze | hide | extrapolate
  // freeze: giữ bounding box cuối cùng trước khi ra frame
  // hide: ẩn overlay khi mask ra frame
  // extrapolate: tiếp tục theo velocity cuối
}]
```

### B-roll compositing trên talking head
```jsonc
// Track overlay với blend = "normal", clip broll có opacity keyframe
{
  "id": "c_broll", "asset": "a_broll",
  "blend": "normal",
  "properties": {
    "opacity": [
      {"t":0,"v":0},
      {"t":0.3,"v":0.85},    // fade in đến 85% opacity → vẫn thấy speaker mờ
      {"t":8.7,"v":0.85},
      {"t":9.0,"v":0}
    ]
  }
}
```

### Import SRT (captions có sẵn)
```jsonc
// SRT asset import → parse → fill captionTrack.blocks[]
// word-level timing không có từ SRT → set words = [{w: full_text, start, end}]
// SmartLink vẫn hoạt động: srcAsset + srcIn được set theo transcript offset
```

---

## Keyframe — đơn vị nhỏ nhất

```ts
type Keyframe<V> = {
  t: number;                              // giây
  v: V;                                   // number | [x,y] | color string
  ease: "smooth" | "linear" | "hold"
      | "expo_out" | "expo_in" | "snappy_back"
      | [number,number,number,number];    // cubic-bezier tùy chỉnh
  source?: "manual" | `behavior:${string}`;  // manual = user tay; behavior = compiled
};

// Properties keyframe-able trên clip:
type AnimatableProps = {
  scale: number;
  position: [x: number, y: number];      // normalized 0..1 từ center
  rotation: number;                       // degrees
  opacity: number;                        // 0..1
  crop: [top, right, bottom, left];      // normalized 0..1
  // effect params (nếu effect support keyframe):
  "filmGrain.amount": number;
  "rgbSplit.offset": number;
  "bloom.intensity": number;
  "colorCorrect.saturation": number;
  // ... mỗi effect param có thể keyframe nếu định nghĩa là array
};
```

> ⚠️ **Phần lớn keyframe KHÔNG đặt tay** — chúng được sinh ra bởi [Behaviors](./whip-behaviors.md).
> Bạn chỉ chạm keyframe tay khi "bake" để tinh chỉnh. Đây là khác biệt lõi với AE.

---

:::info Properties Reference
Bảng tra cứu đầy đủ property × data type × UI component (Text / Caption / Super / Clip / Effect / Composition): **[Properties Reference →](./whip-properties)**
:::


## Preset System — cách preset kết nối vào schema

### Bake vs Reference

Preset **không thay thế** schema — chúng được áp vào schema theo 2 cách:

```
┌── Reference (live link) ─────────────────────────────────────────────┐
│  clip.lookPresetId = "gawx_cinematic"                                 │
│  → Engine tra preset registry → merge params vào effects[] khi render │
│  → Đổi preset definition → TẤT CẢ clip dùng preset đó cập nhật       │
│  → Dùng cho: team build → test nhanh → chưa cần bake                 │
└───────────────────────────────────────────────────────────────────────┘

┌── Bake (flatten) ────────────────────────────────────────────────────┐
│  applyPreset(clipId, "gawx_cinematic")                                │
│  → Expand preset → fill clip.effects[] trực tiếp                     │
│  → lookPresetId vẫn giữ (để biết nguồn gốc, hiện trong UI)           │
│  → User có thể chỉnh effects[] sau khi bake mà không ảnh hưởng preset│
│  → Dùng cho: user apply preset → tùy chỉnh per-clip                  │
└───────────────────────────────────────────────────────────────────────┘
```

**Quy tắc engine:** nếu `lookPresetId` set VÀ `effects[]` có dữ liệu → dùng `effects[]` (baked wins). `lookPresetId` chỉ merge nếu `effects[]` rỗng.

---

### Preset types và field gắn vào schema

| Preset type | Field trong schema | Preset file output |
|---|---|---|
| **Look / Effect** | `clip.lookPresetId` + `clip.effects[]` (baked) | `type: "look"` |
| **Caption** | `captionTrack.stylePack` | `type: "caption"` |
| **Transition** | `transitions[].presetId` + `transitionIn/Out.presetId` | `type: "transition"` |
| **Super / Composition** | `compositions[].style` | `type: "super"` |
| **Audio** | `clip.audioPresetId` + `clip.fx[]` (baked) | `type: "audio"` |
| **Template Recipe** | `styleProfile.recipeId` (Whip It) | `type: "recipe"` |

---

### Preset registry

Preset được load từ 2 nguồn:

```jsonc
// Trong project.whip (presets user đã mua / import vào project)
"presetRegistry": {
  "gawx_cinematic": {
    "id": "gawx_cinematic",
    "name": "Gawx Cinematic",
    "type": "look",
    "compiled": {
      "effects": [
        { "type": "colorCorrect", "params": { "liftB": -0.02, "saturation": 0.85 } },
        { "type": "bloom",        "params": { "threshold": 0.75, "intensity": 0.3 } },
        { "type": "filmGrain",    "params": { "amount": 0.15 } },
        { "type": "rgbSplit",     "params": { "offset": 1.5 } }
      ]
    }
  },
  "hormozi_bold": {
    "id": "hormozi_bold", "type": "look",
    "compiled": {
      "effects": [
        { "type": "colorCorrect", "params": { "contrast": 0.15, "saturation": 0.2 } },
        { "type": "bloom",        "params": { "threshold": 0.6, "intensity": 0.5 } },
        { "type": "vignette",     "params": { "intensity": 0.4 } }
      ]
    }
  },
  "hard_cut":         { "id": "hard_cut",    "type": "transition",
                        "compiled": { "type": "cut", "duration": 0 } },
  "cross_dissolve":   { "id": "cross_dissolve", "type": "transition",
                        "compiled": { "type": "crossDissolve", "duration": 0.3, "ease": "smooth" } },
  "auto_duck_podcast":{ "id": "auto_duck_podcast", "type": "audio",
                        "compiled": { "duckDb": -14, "attackMs": 200, "releaseMs": 800 } }
}
```

→ Preset từ **Preset Builder** output `.preset.json` → import vào đây.
→ Preset từ **Marketplace** download → cũng import vào `presetRegistry`.
→ **Engine chỉ đọc `compiled` field** — không cần biết graph node bên trong.

---

### `applyPreset` command flow

```
applyPreset(clipId: "c1", presetId: "gawx_cinematic")
  1. Lookup project.presetRegistry["gawx_cinematic"]
  2. Lấy compiled.effects[]
  3. Merge vào clip.effects[] (thêm nếu chưa có, override nếu cùng type)
  4. Set clip.lookPresetId = "gawx_cinematic"  // giữ để UI hiện badge "Gawx Cinematic ×"
  5. Undo stack ghi lại trạng thái effects[] trước
```

User thấy badge preset trên clip → click `×` để remove (xóa effects[] và `lookPresetId`).

---

## Tại sao JSON khai báo, không phải code?

- **Agent sửa an toàn** — data có schema, không exec code tùy ý (khác Remotion).
- **Diff-able** — mỗi edit của agent là 1 diff review được, undo được.
- **Portable** — `.whip` + `assets/`, git-able, sharable.
- **Một schema, ba consumer** — UI render, agent mutate, engine đọc.
  Cùng triết lý "[1 parameter_schema → REST + MCP + UI](./ontology-kinetic.md)" của Ontos.
