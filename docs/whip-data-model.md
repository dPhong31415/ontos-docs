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
          "effects": [
            // ── Color / Look ──
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
      "type": "crossDissolve",     // crossDissolve | dipToBlack | wipe | flashCut | zoomCut
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

---

## Properties Reference — schema × data type × UI component

> Bảng tra cứu đầy đủ cho dev build panel + agent biết field nào là gì.
> Hierarchy: **Text** (primitive) → **Caption Block** → **Caption Track** → **Disclaimer** → **Super** → **Composition** → **Overlay Clip**

---

### Text (primitive — base của mọi text element)

| Property | Type | Range / Values | UI Component |
|---|---|---|---|
| `content` | `string` | multi-line | TextInput (multiline) |
| `font` | `FontFamily` | Montserrat / Inter / Playfair / Fira Code / … | FontPicker (dropdown + preview) |
| `fontSize` | `number` | 8–400 px | NumberSlider |
| `fontWeight` | `100\|200\|…\|900` | stepped 100 | Slider stepped / Select |
| `color` | `Color` (#hex / rgba) | — | ColorPicker |
| `opacity` | `number` | 0–1 | Slider |
| `letterSpacing` | `number` | −0.2–2 em | NumberSlider |
| `lineHeight` | `number` | 0.8–3 | NumberSlider |
| `textAlign` | `"left"\|"center"\|"right"` | — | SegmentedControl 3 |
| `textCase` | `"none"\|"upper"\|"lower"\|"title"` | — | SegmentedControl 4 |
| `stroke` | `{ color: Color, width: number }` | width 0–20 | ColorPicker + NumberSlider |
| `gradient` | `{ colors: Color[], stops: number[], angle: number } \| null` | toggle on/off | GradientEditor (toggle + strip) |
| `shadow` | `{ color: Color, blur: number, x: number, y: number } \| null` | toggle on/off | ShadowEditor (toggle + 4 fields) |
| `glow` | `{ color: Color, intensity: number, radius: number } \| null` | toggle on/off | GlowEditor (toggle + 3 sliders) |
| `background` | `{ color: Color, opacity: number, paddingX: number, paddingY: number, radius: number } \| null` | toggle on/off | BackgroundEditor |
| `position` | `[x: number, y: number]` | 0–1 normalized từ center | PositionInput (drag handle hoặc X/Y number) |
| `rotation` | `number` | −180–180 deg | NumberSlider + rotation dial |
| `scale` | `number` | 0.1–5 | NumberSlider |
| `animation` | `{ in: AnimType, out: AnimType, duration: number }` | — | AnimPicker dropdown |

---

### Caption Block (extends Text — thêm timing + source anchor)

| Property | Type | Ghi chú | UI Component |
|---|---|---|---|
| `text` | `string` | nội dung block | TextInput (editable trực tiếp trên caption timeline) |
| `start` | `number` | timeline time (giây) | Caption timeline handle kéo |
| `end` | `number` | timeline time (giây) | Caption timeline handle kéo |
| `words` | `Word[]` `{w,start,end}[]` | word-level timing từ Deepgram — read-only | Highlight overlay (không edit tay) |
| `speakerId` | `string \| null` | SPEAKER_00 / SPEAKER_01 | Tag/badge + color dot |
| `style` | `Partial<TextStyle> \| null` | per-block override (override track-level style) | Collapsed "Override" panel (same UI as Text, hiện diff với track style) |
| `srcAsset` | `AssetId` | internal SmartLink anchor | Không hiện UI |
| `srcIn` | `number` | internal | Không hiện UI |
| `srcDur` | `number` | internal | Không hiện UI |

---

### Caption Track (container cho blocks)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `stylePack` | `"loud"\|"clean"\|"cinematic"\|"terminal"` | — | StylePackPicker (4 card thumbnail) |
| `pacing` | `"word"\|"chunk"\|"karaoke"` | — | SegmentedControl 3 |
| `posY` | `number` | 0–1 (0 = top, 1 = bottom) | Vertical Slider trên canvas |
| `style` | `TextStyle` | inherits từ stylePack, override được | Collapsible Text panel |
| `blocks` | `CaptionBlock[]` | — | Caption Timeline Editor (dọc timeline) |
| `speakerMap` | `Record<speakerId, {color,posY}>` | auto-populate từ diarization | SpeakerEditor (mỗi speaker = 1 row với color + posY) |

---

### Disclaimer (text nhỏ cố định — extends Text)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `content` | `string` | — | TextInput |
| `position` | `"bottom-left"\|"bottom-right"\|"top-left"\|"top-right"` | — | PositionSelect (4 button corners) |
| `fontSize` | `number` | 8–14 px (nhỏ cố định) | NumberSlider nhỏ |
| `color` | `Color` | — | ColorPicker |
| `background` | `BackgroundStyle \| null` | — | Toggle + BackgroundEditor |
| `start` / `end` | `number` | timeline time | Clip handle |

---

### Super (full-frame text card — extends Text)

Super = text overlay chiếm phần lớn frame (section header, stat reveal, quote card). Không phải caption phụ đề.

| Property | Type | Values | UI Component |
|---|---|---|---|
| `content` | `string` | — | TextInput multiline |
| `layout` | `"center"\|"left"\|"right"\|"bottom-bar"` | — | LayoutSelect (4 preview icons) |
| `backgroundColor` | `Color` | — | ColorPicker |
| `backgroundOpacity` | `number` | 0–1 | Slider |
| `padding` | `number` | 0–100 px | NumberSlider |
| `font` / `fontSize` / `color` / … | `TextStyle` fields | — | (kế thừa từ Text panel) |
| `animation` | `{ in, out, ease, duration }` | — | AnimPicker |
| `start` / `end` / `track` | clip fields | — | Timeline clip |

---

### Overlay Clip (clip trên overlay track — wrapper cho mọi overlay)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `blendMode` | `"normal"\|"multiply"\|"screen"\|"overlay"\|"add"\|"soft_light"` | — | Select 6 options |
| `maskId` | `MaskId \| null` | — | MaskSelector (dropdown + "click to pick" button) |
| `opacity` | `number` | 0–1 | Slider |
| `position` | `[x,y]` | 0–1 normalized | TransformHandle trên canvas |
| `scale` | `number` | — | Scale handle / NumberSlider |
| `rotation` | `number` | deg | Rotation handle |
| `start` / `end` | clip timing | — | Timeline clip handle |

---

### Composition (Whip It generated — đọc bởi Pixi renderer)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `type` | `CompositionType` | stat_reveal / section_card / kinetic_list / lower_third / callout_arrow / quote_card / progress_bar / broll_suggest / logo_sting / social_proof | Label (set bởi Whip It, read-only) |
| `t` | `number` | giây | Timeline position handle |
| `duration` | `number` | giây | Duration drag handle |
| `data` | `object` | type-specific (text, items[], value, label…) | Auto-form từ type schema |
| `style` | `StyleRecipe \| string` | iman_editorial / hormozi_bold / ali_clean / mrbeast_energy / gawx_cinematic | RecipePicker (5 cards) |
| `animation` | `{ in, out, ease }` | — | AnimPicker |
| `beatSync` | `boolean` | — | Toggle |
| `phonemeSync` | `boolean` | — | Toggle |
| `layers` | `Layer[]` | sub-layers nếu có | LayerStack panel |
| `maskId` | `MaskId \| null` | — | MaskSelector |

---

### Hierarchy tóm tắt

```
Text (primitive)
  ├─ Caption Block     + timing, words[], speakerId, srcAnchor
  │    └─ Caption Track  (container) + stylePack, pacing, speakerMap
  ├─ Disclaimer        + corner position, small size
  └─ Super             + layout, backgroundColor, fullframe

Overlay Clip          (wrapper) + blendMode, maskId, transform
  ├─ Composition       (Whip It) + type, data, style, beatSync
  ├─ Image/SVG layer   + asset ref
  └─ Text/Super layer  → Text fields above
```

→ Xem thêm: [Preset Library](./whip-look) · [Whip It pipeline F11](./whip-features) · [MCP commands](./whip-mcp)

---

## Tại sao JSON khai báo, không phải code?

- **Agent sửa an toàn** — data có schema, không exec code tùy ý (khác Remotion).
- **Diff-able** — mỗi edit của agent là 1 diff review được, undo được.
- **Portable** — `.whip` + `assets/`, git-able, sharable.
- **Một schema, ba consumer** — UI render, agent mutate, engine đọc.
  Cùng triết lý "[1 parameter_schema → REST + MCP + UI](./ontology-kinetic.md)" của Ontos.
