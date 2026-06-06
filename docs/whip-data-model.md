---
id: whip-data-model
title: Project Document
sidebar_label: 🗄 Project Document
sidebar_position: 4
---

# Project Document — `project.whip`

> Single source of truth. JSON khai báo, diff-able, git-able, **agent đọc/sửa được như text**.
> Về bản chất là một **đồ thị nodes/edges** — chính là ontology, nhưng cho timeline.

---

## Project = đồ thị (map sang ontology)

| Ontology (Ontos) | Whip |
|---|---|
| Object / Node | `asset`, `track`, `clip`, `keyframe`, `effect`, `transition` |
| Property (JSONB) | `clip.properties`, `effect.params` |
| Link / Edge (typed) | `clip → asset` (uses), `track → clip` (contains), `clip → keyframe` (animates) |
| Action Type | [Command](./whip-api.md) (addClip, setKeyframe…) |
| action_log | undo log (before/after) |

→ Cùng metamodel với [Ontology Metamodel](./ontology-metamodel.md), nhưng **instance sống trong
RAM client**, không phải Postgres. Lý do ở [Ontology Reuse](./whip-ontology-reuse.md).

---

## Schema (zod = validate + TS types + agent guardrails)

```jsonc
{
  "version": 1,
  "fps": 30,
  "resolution": [1920, 1080],
  "aspect": "16:9",                     // | "9:16" | "1:1" | "4:5"
  "duration": 142.5,                    // giây

  "assets": {
    "a1": { "type": "video", "src": "interview.mp4", "duration": 600, "w": 1920, "h": 1080 },
    "a2": { "type": "audio", "src": "music.mp3", "duration": 180 },
    "a3": { "type": "image", "src": "logo.png" }
  },

  "tracks": [
    {
      "id": "v1", "kind": "video", "muted": false, "solo": false,
      "clips": [
        {
          "id": "c1", "asset": "a1",
          "start": 0, "end": 8.2,        // vị trí trên timeline
          "in": 12.0,                    // in-point trong source
          "speed": 1.0,                  // time-remap
          "blend": "normal",
          "properties": {                // mọi prop là keyframe track
            "scale":    [ {"t":0,"v":1.0,"ease":"smooth"},
                          {"t":2.0,"v":1.08,"ease":[0.16,1,0.3,1]} ],   // punch-in
            "position": [ {"t":0,"v":[0,0]} ],
            "rotation": [ {"t":0,"v":0} ],
            "opacity":  [ {"t":0,"v":1} ],
            "crop":     [ {"t":0,"v":[0,0,0,0]} ]
          },
          "effects": [
            { "id":"e1", "type":"filmGrain", "params":{"amount":0.2} },
            { "id":"e2", "type":"rgbSplit",  "params":{"offset":[ {"t":0,"v":0},{"t":0.3,"v":6} ]} }
          ]
        }
      ]
    },
    {
      "id": "txt1", "kind": "text",
      "clips": [
        { "id":"t1", "start":1.0, "end":4.0,
          "text":"Khải Phong", "font":"Inter", "size":72, "color":"#fff",
          "preset":"lowerThird",
          "properties": { "position":[{"t":0,"v":[120,880]}], "opacity":[{"t":0,"v":0},{"t":0.4,"v":1}] } }
      ]
    },
    {
      "id": "aud1", "kind": "audio",
      "clips": [
        { "id":"m1", "asset":"a2", "start":0, "end":142.5, "in":0,
          "gainDb": -6,
          "automation": { "gainDb": [ {"t":0,"v":-6},{"t":40,"v":-18},{"t":48,"v":-6} ] },  // ducking tay
          "fx": [ { "type":"eq", "bands":[{"f":120,"gain":-3}] },
                  { "type":"compressor", "threshold":-18, "ratio":3 } ] }
      ]
    }
  ],

  "transitions": [
    { "id":"x1", "between":["c1","c2"], "type":"crossDissolve", "duration":0.5 }
  ]
}
```

---

## Keyframe — đơn vị nhỏ nhất

```ts
type Keyframe<V> = {
  t: number;                              // giây
  v: V;                                   // value (number | [x,y] | color…)
  ease: "smooth" | "linear" | "hold" | [number,number,number,number];  // tên hoặc cubic-bezier
  source?: "manual" | "behavior:<id>";    // generated bởi behavior hay đặt tay
};
```

**Interpolator** đi qua mọi track tại time `t`, lerp từng property theo bezier của keyframe.

> ⚠️ **Phần lớn keyframe KHÔNG đặt tay** — chúng được **sinh ra** bởi [Behaviors](./whip-behaviors.md)
> (bind vào nội dung lời nói), đánh dấu `source: "behavior:<id>"`. Bạn chỉ chạm keyframe tay khi
> "bake" để tinh chỉnh. Đây là khác biệt lõi với AE — xem [Smart Animation](./whip-behaviors.md).

---

## Anchors & Behaviors (tầng smart trên keyframe)

Hai field top-level nữa, là **source of truth thật** cho animation (keyframe chỉ là output compiled):

```jsonc
"anchors": {
  "regions": [ { "id":"r_chart", "label":"nói về graph",
                 "start":12.4, "end":18.9, "source":"transcript:revenue chart" } ],
  "cues":    [ { "id":"cue_emph_3", "t":24.1, "kind":"emphasis" } ]
},
"behaviors": [
  { "id":"b1", "type":"zoomToRegion", "target":"c1", "bind":"r_chart",
    "params":{ "amount":1.15, "releaseAfter":true } }
]
```

→ `anchors.start/end` derive từ transcript; behavior bám anchor; compiler sinh keyframe.
Trim clip → recompile → animation tự dời. Chi tiết: [Smart Animation](./whip-behaviors.md).

---

## Preset = template keyframe có tham số

```jsonc
"smoothZoomIn": {
  "scale": [ {"t":0,"v":1.0,"ease":[0.16,1,0.3,1]},
             {"t":"$dur","v":"$amount"} ]
}
```

CapCut-fast = "apply `smoothZoomIn(amount=1.12, dur=0.6)` vào clip c1" — **một command**.
Đây là cơ chế biến "keyframe tay đau" thành "một dòng". Danh sách preset ở [Tính năng](./whip-features.md).

---

## Tại sao JSON khai báo, không phải code?

- **Agent sửa được an toàn** — data có schema, không exec code tùy ý (khác Remotion).
- **Diff-able** — mỗi edit của agent là một diff review được, undo được.
- **Portable** — `.whip` + folder `assets/`, git được, share được.
- **Một schema, ba consumer** — UI render, agent mutate, engine đọc. Cùng triết lý
  "[một parameter_schema → REST + MCP + UI](./ontology-kinetic.md)" của Ontos.
