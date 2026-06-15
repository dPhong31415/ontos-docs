---
id: whip-preset-builder
title: Preset Builder (Node Graph)
sidebar_label: 🔧 Preset Builder
sidebar_position: 11
---

# Preset Builder — Visual Node Graph

> Công cụ nội bộ để **build và tinh chỉnh preset** bằng giao diện node graph — không cần code.
> AI scaffold ra đống node → team ngồi kéo/chỉnh từng giá trị → save → preset xuất hiện trong library.
> V1: internal tool cho team. V2: mở cho user → marketplace bán preset.

:::info Liên quan
[Preset Library](./whip-look) · [Properties Reference](./whip-data-model) · [Tính năng F6](./whip-features)
:::

---

## Tại sao node graph, không phải form?

Form (slider + input) chỉ edit 1 preset tại 1 thời điểm, không thấy relationship giữa các thành phần.
Node graph cho phép:

```
ColorNode (#FF6B00) ──────────────────────────────► LookPresetNode
                                                        │
NumberNode (contrast: 0.15) ─► ColorCorrectNode ───────┤  → "Hormozi Bold"
NumberNode (saturation: 0.2) ─►                         │
                                                        │
NumberNode (threshold: 0.6) ─► BloomNode ──────────────┘
NumberNode (intensity: 0.5) ─►
```

- **Reuse node**: 1 `ColorNode` feed vào nhiều effect → đổi màu accent 1 chỗ, tất cả cập nhật
- **AI scaffold** → generate graph JSON → team chỉ kéo value, không tạo structure từ đầu
- **Preview live** ngay khi kéo node/slider
- **Export** ra `.preset.json` → import vào preset library

---

## Tech stack — React Flow

**[React Flow (xyflow)](https://reactflow.dev/)** — MIT license, best-in-class node editor cho React.

```
src/
  preset-builder/
    PresetBuilder.tsx      ← main canvas (ReactFlow)
    nodes/
      primitives/          ← ColorNode, NumberNode, TextNode, EnumNode…
      effects/             ← BloomNode, ColorCorrectNode, GrainNode…
      text/                ← FontNode, TextStyleNode, CaptionStyleNode…
      animation/           ← EaseNode, BehaviorNode, KeyframeNode…
      composition/         ← SuperNode, StatRevealNode, SectionCardNode…
      output/              ← LookPresetNode, CaptionPresetNode, RecipeNode…
    edges/
      TypedEdge.tsx        ← màu theo port type
    store/
      graphStore.ts        ← Zustand (tách với main editor store)
    compiler/
      graphToPreset.ts     ← flatten graph → preset JSON
    PreviewPane.tsx        ← Pixi compositor preview (reuse engine)
    AIScaffold.tsx         ← "AI Generate" button → call LLM → load graph
```

---

## Node types đầy đủ

### Primitive nodes (source — không có input port)

| Node | Output port | UI inline | Mô tả |
|---|---|---|---|
| `ColorNode` | `Color` 🔴 | ColorPicker | Màu sắc |
| `NumberNode` | `number` 🔵 | NumberSlider + input | Số thực |
| `IntNode` | `integer` 🔵 | Stepped slider | Số nguyên |
| `BooleanNode` | `boolean` 🟢 | Toggle | True/false |
| `EnumNode` | `string` 🟡 | Select dropdown | Chọn từ list |
| `TextNode` | `string` 🟡 | TextInput | Chuỗi ký tự |
| `EaseNode` | `Ease` 🟣 | EasePicker (curve preview) | Ease curve preset hoặc custom bezier |
| `AssetRefNode` | `AssetId` ⚪ | Asset picker | Tham chiếu tới asset |

---

### Effect nodes

| Node | Input ports | Output port | Params inline |
|---|---|---|---|
| `BloomNode` | threshold `number`, intensity `number`, radius `number` | `Effect` 🟠 | 3 sliders |
| `ColorCorrectNode` | saturation, contrast, liftR, liftG, liftB, gainR… | `Effect` 🟠 | Slider nhóm |
| `GrainNode` | amount `number`, size `number` | `Effect` 🟠 | 2 sliders |
| `VignetteNode` | intensity `number`, feather `number` | `Effect` 🟠 | 2 sliders |
| `ChromaticNode` | offset `number` | `Effect` 🟠 | 1 slider |
| `HazeNode` | opacity `number`, color `Color` | `Effect` 🟠 | slider + colorpicker |
| `LensDistortNode` | amount `number` | `Effect` 🟠 | 1 slider |
| `EffectBundleNode` | effects `Effect[]` (multi-input) | `EffectStack` 🟠 | Thứ tự drag |

---

### Text style nodes

| Node | Input ports | Output port | Params inline |
|---|---|---|---|
| `FontNode` | — | `FontStyle` 🟡 | FontPicker + weight + size + case |
| `TextColorNode` | color `Color`, gradient toggle | `ColorStyle` 🔴 | ColorPicker + GradientEditor |
| `TextEffectsNode` | stroke color+width, shadow, glow | `TextEffects` 🟣 | Shadow/glow toggles + sliders |
| `TextStyleNode` | font `FontStyle`, color `ColorStyle`, effects `TextEffects` | `TextStyle` 🟡 | Preview text |
| `CaptionStyleNode` | style `TextStyle`, stylePack `Enum`, pacing `Enum`, posY `number` | `CaptionPreset` 🟡 | Dropdowns + slider |

---

### Animation nodes

| Node | Input ports | Output port | Params inline |
|---|---|---|---|
| `AnimationNode` | in `Enum`, out `Enum`, ease `Ease`, duration `number` | `Animation` 🟣 | EnumSelect + duration |
| `BehaviorNode` | type `Enum`, params (varies) | `Behavior` 🟣 | Param panel per type |
| `KeyframeNode` | prop `Enum`, values `number[]`, times `number[]`, ease `Ease` | `Keyframe[]` 🟣 | Mini curve editor |
| `SpeedRampNode` | keyframes `[{t,speed}]` | `SpeedRamp` 🔵 | Ramp curve editor |

---

### Composition nodes (Whip It output types)

| Node | Input ports | Output port | Params inline |
|---|---|---|---|
| `SuperNode` | content `string`, style `TextStyle`, layout `Enum`, bgColor `Color`, animation `Animation` | `Composition` ⭐ | Layout picker |
| `StatRevealNode` | value `string`, label `string`, style `TextStyle`, animation `Animation` | `Composition` ⭐ | — |
| `SectionCardNode` | headline `string`, subtitle `string`, style `TextStyle`, bgColor `Color` | `Composition` ⭐ | — |
| `KineticListNode` | items `string[]`, style `TextStyle`, stagger `number` | `Composition` ⭐ | Item list editor |
| `LowerThirdNode` | text `string`, subtext `string`, style `TextStyle` | `Composition` ⭐ | — |
| `CalloutArrowNode` | text `string`, direction `Enum`, maskId `string\|null` | `Composition` ⭐ | Direction picker |
| `QuoteCardNode` | quote `string`, author `string`, style `TextStyle` | `Composition` ⭐ | — |

---

### Transition nodes

| Node | Input ports | Output port | Params inline |
|---|---|---|---|
| `TransitionNode` | type `Enum`, duration `number`, ease `Ease`, direction `Enum` | `Transition` 🔵 | Enum + sliders |
| `BlendModeNode` | mode `Enum` | `BlendMode` | Select 6 options |

---

### Output nodes (terminal — không có output port)

Output node = kết quả cuối cùng, serialize thành preset JSON khi Save.

| Node | Input ports | Preset type |
|---|---|---|
| `LookPresetNode` | effects `EffectStack`, colorGrade `Effect` | `look` preset |
| `CaptionPresetNode` | style `CaptionPreset` | `caption` preset |
| `TransitionPresetNode` | transition `Transition` | `transition` preset |
| `SuperPresetNode` | composition `Composition` | `super` preset |
| `TemplateRecipeNode` | caption `CaptionPreset`, look `LookPreset`, transition `Transition`, supers `Composition[]`, audio params | `recipe` preset (Whip It template) |

---

## Port type color system

| Type | Màu | Hex |
|---|---|---|
| `Color` | Đỏ hồng | `#FF6B8A` |
| `number` / `integer` | Xanh dương | `#5B9CF6` |
| `string` / `Enum` | Vàng | `#F6C94E` |
| `boolean` | Xanh lá | `#4EF6A0` |
| `Ease` / `Animation` / `Behavior` | Tím | `#A78BFA` |
| `Effect` / `EffectStack` | Cam | `#F6974E` |
| `TextStyle` / `FontStyle` | Vàng nhạt | `#F6E54E` |
| `Composition` | Gold ⭐ | `#FFD700` |
| `Transition` / `BlendMode` | Xanh cyan | `#4EE4F6` |
| `AssetId` | Trắng xám | `#B0B8C1` |

Connection chỉ cho phép giữa **cùng type** — mismatched port = red snap rejection.

---

## Graph schema (`.preset.json`)

```jsonc
{
  "id": "preset_hormozi_bold",
  "name": "Hormozi Bold",
  "type": "look",                    // look | caption | transition | super | recipe
  "version": 1,
  "graph": {
    "nodes": [
      { "id": "n_accent",  "type": "ColorNode",        "pos": [80, 120],
        "value": "#FF6B00" },
      { "id": "n_cc",      "type": "ColorCorrectNode", "pos": [320, 80],
        "params": { "contrast": 0.15, "saturation": 0.2, "liftR": 0.02 } },
      { "id": "n_bloom",   "type": "BloomNode",        "pos": [320, 220],
        "params": { "threshold": 0.6, "intensity": 0.5, "radius": 12 } },
      { "id": "n_vignette","type": "VignetteNode",     "pos": [320, 360],
        "params": { "intensity": 0.4, "feather": 0.6 } },
      { "id": "n_bundle",  "type": "EffectBundleNode", "pos": [560, 200] },
      { "id": "n_out",     "type": "LookPresetNode",   "pos": [760, 200] }
    ],
    "edges": [
      { "from": "n_cc.out",      "to": "n_bundle.effects[0]" },
      { "from": "n_bloom.out",   "to": "n_bundle.effects[1]" },
      { "from": "n_vignette.out","to": "n_bundle.effects[2]" },
      { "from": "n_bundle.out",  "to": "n_out.effects" },
      { "from": "n_accent.out",  "to": "n_cc.accentTint" }
    ]
  },
  "compiled": {            // flatten từ graph → engine đọc trực tiếp
    "effects": [
      { "type": "colorCorrect", "params": { "contrast": 0.15, "saturation": 0.2 } },
      { "type": "bloom",        "params": { "threshold": 0.6, "intensity": 0.5 } },
      { "type": "vignette",     "params": { "intensity": 0.4 } }
    ]
  }
}
```

`compiled` field = flatten graph → engine không cần chạy lại graph mỗi frame. Graph chỉ cần khi *edit*.

---

## AI Scaffold flow

```
User click "✨ AI Generate"
  → modal: mô tả preset muốn ("Hormozi look - high contrast, orange accent, aggressive")
  → gửi lên Claude/Gemini với system prompt:
    "You are a Whip preset designer. Given a description, output a valid preset graph JSON
     using these node types: [...list]. Return only JSON, no explanation."
  → response JSON → parse → load vào ReactFlow canvas
  → team thấy graph → kéo slider/chỉnh màu → Save
```

**System prompt cho AI scaffold** phải include:
- Full node type list + input/output port definitions
- Example graph JSON (few-shot)
- Constraint: output phải valid (node types phải nằm trong whitelist)

---

## Preview pane

Cạnh graph editor = preview pane reuse **Pixi compositor**:

```
┌─ Node Graph (70%) ───────────────┐ ┌─ Preview (30%) ──────────────────┐
│  [nodes + edges]                 │ │  Sample clip (talking-head 5s)    │
│                                  │ │  + current preset applied live    │
│                                  │ │                                   │
│                                  │ │  [16:9] [9:16] [1:1]  toggle     │
│                                  │ │  [before] [after]  split preview  │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

Kéo slider trên node → preview update real-time (không cần save trước).

---

## Workflow nội bộ (v1 — team dùng)

```
1. AI scaffold  → "Hormozi Bold look" → graph JSON
2. Load graph   → canvas
3. Team chỉnh   → kéo contrast slider, đổi accent color, tắt bloom
4. Preview      → so với reference video (Hormozi)
5. Save         → preset_hormozi_bold.json → commit vào repo
6. Import       → preset xuất hiện trong Effect panel của editor
7. Lặp lại      → build đủ 6 looks + 7 transitions + 8 supers + 5 recipes
```

---

## Marketplace (v2 — mở cho user)

Khi mở ra user:
- User build preset trong Preset Builder → publish lên **Whip Marketplace**
- Preset có: name, preview gif, price ($0 free / $2–10 paid)
- Billing: Lemon Squeezy → creator nhận 70%, Whip giữ 30%
- Discover: filter by category (look / caption / transition / recipe) + style (cinematic / viral / clean)
- 1-click apply: user mua → preset xuất hiện trong library → apply lên clip

---

## Trạng thái & build plan

| Phần | Trạng thái | Phụ thuộc |
|---|---|---|
| React Flow canvas + typed edges | ❌ | — |
| Primitive nodes (Color/Number/Text/Enum/Ease) | ❌ | — |
| Effect nodes (7 types) | ❌ | — |
| Text style nodes | ❌ | — |
| Output nodes + graph compiler | ❌ | — |
| Preview pane (Pixi reuse) | ❌ | Pixi compositor ✅ |
| AI Scaffold (Claude API) | ❌ | Claude API ✅ |
| Save → preset library import | ❌ | — |
| Animation/Composition nodes | ❌ | behaviors ✅ |
| Marketplace (v2) | ❌ | v1 ship trước |

**V1 target:** Primitive + Effect + Output nodes + Preview + AI Scaffold + Save. Đủ để team build 39 preset còn thiếu.
