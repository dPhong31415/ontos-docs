---
id: whip-properties
title: Properties Reference
sidebar_label: 📐 Properties Reference
sidebar_position: 10
---

# Properties Reference — schema × data type × UI component

> Bảng tra cứu cho dev build panel và agent biết field nào là gì, data type gì, UI component nào render.
> Hierarchy: **Text** (primitive) → **Caption Block** → **Caption Track** → **Disclaimer** → **Super** → **Overlay Clip** → **Composition**

:::info Liên quan
[Project Document & Schema](./whip-data-model) · [Preset Library & Look](./whip-look) · [Preset Builder](./whip-preset-builder)
:::

---

## Text (primitive — base của mọi text element)

Tất cả text-bearing elements (caption block, super, disclaimer, lower third…) đều kế thừa các fields này.

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

## Caption Block (extends Text)

Thêm timing + SmartLink anchor + word-level data.

| Property | Type | Ghi chú | UI Component |
|---|---|---|---|
| `text` | `string` | nội dung block | TextInput (editable trên caption timeline) |
| `start` | `number` | timeline time (giây) | Caption timeline handle kéo |
| `end` | `number` | timeline time (giây) | Caption timeline handle kéo |
| `words` | `Word[]` `{w,start,end}[]` | word-level timing từ Deepgram — read-only | Highlight overlay trên canvas |
| `speakerId` | `string \| null` | SPEAKER_00 / SPEAKER_01 | Tag/badge + color dot |
| `style` | `Partial<TextStyle> \| null` | per-block style override | "Override" collapsible panel (hiện diff với track style) |
| `srcAsset` | `AssetId` | SmartLink anchor — internal | Không hiện UI |
| `srcIn` | `number` | SmartLink anchor — internal | Không hiện UI |
| `srcDur` | `number` | SmartLink anchor — internal | Không hiện UI |

---

## Caption Track (container)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `stylePack` | `"loud"\|"clean"\|"cinematic"\|"terminal"` | — | StylePackPicker (4 card thumbnail) |
| `pacing` | `"word"\|"chunk"\|"karaoke"` | — | SegmentedControl 3 |
| `posY` | `number` | 0–1 (0=top, 1=bottom) | Vertical Slider trên canvas |
| `style` | `TextStyle` | inherits từ stylePack, override được | Collapsible Text panel |
| `blocks` | `CaptionBlock[]` | — | Caption Timeline Editor |
| `speakerMap` | `Record<speakerId, {color,posY}>` | auto-populate từ diarization | SpeakerEditor (mỗi speaker = 1 row: color + posY) |

---

## Disclaimer (extends Text — text nhỏ cố định góc)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `content` | `string` | — | TextInput |
| `position` | `"bottom-left"\|"bottom-right"\|"top-left"\|"top-right"` | — | PositionSelect (4 corner buttons) |
| `fontSize` | `number` | 8–14 px | NumberSlider (small range) |
| `color` | `Color` | — | ColorPicker |
| `background` | `BackgroundStyle \| null` | — | Toggle + BackgroundEditor |
| `start` / `end` | `number` | timeline time | Clip handle |

---

## Super (extends Text — full-frame text card)

Super = text overlay chiếm phần lớn / toàn frame: section header, stat reveal, quote card. Không phải caption phụ đề.

| Property | Type | Values | UI Component |
|---|---|---|---|
| `content` | `string` | — | TextInput multiline |
| `layout` | `"center"\|"left"\|"right"\|"bottom-bar"` | — | LayoutSelect (4 preview icons) |
| `backgroundColor` | `Color` | — | ColorPicker |
| `backgroundOpacity` | `number` | 0–1 | Slider |
| `padding` | `number` | 0–100 px | NumberSlider |
| `font` / `fontSize` / `color` / … | `TextStyle` fields | — | kế thừa từ Text panel |
| `animation` | `{ in, out, ease, duration }` | — | AnimPicker |
| `start` / `end` | `number` | timeline time | Clip handle |

---

## Video / Image Clip

| Property | Type | Values | UI Component |
|---|---|---|---|
| `speed` | `number` | 0.1–4× | Speed preset buttons + input |
| `speedKeys` | `{t,speed}[]` | speed ramp keyframes | Ramp curve editor |
| `pitchLock` | `boolean` | — | Toggle |
| `blend` | `BlendMode` | normal/multiply/screen/overlay/add/soft_light | Select 6 |
| `opacity` | `number` | 0–1 | Slider |
| `maskId` | `MaskId \| null` | — | MaskSelector |
| `reframe` | `{x,y,scale} \| null` | — | ReframeHandle trên canvas |
| `cropAspect` | `string \| null` | "9:16" / "1:1" / … | AspectPicker |
| `lookPresetId` | `string \| null` | preset trong presetRegistry | PresetBadge (hiện tên + × xóa) |
| `transitionIn` | `{presetId,duration?} \| null` | — | TransitionPicker |
| `transitionOut` | `{presetId,duration?} \| null` | — | TransitionPicker |
| `properties` | `AnimatableProps` | scale/position/rotation/opacity/crop | Properties panel + keyframe |
| `effects` | `Effect[]` | xem bảng Effect dưới | Effect Stack panel |

---

## Effect (item trong `effects[]`)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `id` | `string` | unique | (internal) |
| `type` | `EffectType` | colorCorrect / bloom / filmGrain / rgbSplit / vignette / chromatic / haze / lensDistort | Label + icon |
| `params` | `object` | type-specific (xem bảng dưới) | Param panel auto-gen |
| `enabled` | `boolean` | — | Toggle trên stack item |

### Effect params chi tiết

| Effect type | Params | UI |
|---|---|---|
| `colorCorrect` | liftR/G/B, gammaR/G/B, gainR/G/B, saturation, contrast, temperature, tint | Grouped sliders (Shadows / Midtones / Highlights) |
| `bloom` | threshold `0–1`, intensity `0–2`, radius `1–50` | 3 sliders |
| `filmGrain` | amount `0–1`, size `0.5–3`, blendMode | Slider + blend select |
| `rgbSplit` | offset `0–20px` | 1 slider (hoặc Keyframe[]) |
| `vignette` | intensity `0–1`, feather `0–1` | 2 sliders |
| `chromatic` | offset `0–10px` | 1 slider |
| `haze` | opacity `0–1`, color | Slider + ColorPicker |
| `lensDistort` | amount `−1–1` | 1 slider |

---

## Audio Clip

| Property | Type | Values | UI Component |
|---|---|---|---|
| `gainDb` | `number` | −60–6 dB | dB Slider |
| `pitchLock` | `boolean` | — | Toggle |
| `audioPresetId` | `string \| null` | preset trong presetRegistry | PresetBadge |
| `automation` | `{gainDb: Keyframe[]}` | gain over time | Gain automation lane |
| `fx` | `AudioFx[]` | eq / compressor / noiseRemoval / limiter | Audio FX rack |

---

## Overlay Clip (wrapper cho tất cả overlay trên overlay track)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `blendMode` | `BlendMode` | normal/multiply/screen/overlay/add/soft_light | Select 6 |
| `maskId` | `MaskId \| null` | — | MaskSelector |
| `opacity` | `number` | 0–1 | Slider |
| `position` | `[x,y]` | 0–1 normalized | TransformHandle trên canvas |
| `scale` | `number` | 0.1–5 | Scale handle / NumberSlider |
| `rotation` | `number` | deg | Rotation handle |
| `start` / `end` | `number` | timeline time | Clip handle |

---

## Composition (Whip It generated)

| Property | Type | Values | UI Component |
|---|---|---|---|
| `type` | `CompositionType` | stat_reveal / section_card / kinetic_list / lower_third / callout_arrow / quote_card / progress_bar / broll_suggest / logo_sting / social_proof | Label read-only (set bởi Whip It) |
| `t` | `number` | giây | Timeline position handle |
| `duration` | `number` | giây | Duration drag handle |
| `data` | `object` | type-specific fields | Auto-form từ type schema |
| `style` | `string` | iman_editorial / hormozi_bold / ali_clean / mrbeast_energy / gawx_cinematic | RecipePicker (5 cards) |
| `animation` | `{ in, out, ease }` | — | AnimPicker |
| `beatSync` | `boolean` | — | Toggle |
| `phonemeSync` | `boolean` | — | Toggle |
| `layers` | `Layer[]` | sub-layers | LayerStack panel |
| `maskId` | `MaskId \| null` | — | MaskSelector |

### Composition `data` fields per type

| Type | data fields |
|---|---|
| `stat_reveal` | `value: string`, `label: string`, `prefix?: string`, `suffix?: string` |
| `section_card` | `title: string`, `subtitle?: string`, `background?: Color` |
| `kinetic_list` | `items: string[]`, `icon?: string` |
| `lower_third` | `name: string`, `title: string`, `style?: string` |
| `callout_arrow` | `text: string`, `direction: "left"\|"right"\|"up"\|"down"` |
| `quote_card` | `text: string`, `attribution?: string` |
| `progress_bar` | `value: number`, `label: string`, `color?: Color` |
| `broll_suggest` | `visual_desc: string`, `duration: number` |
| `logo_sting` | `assetId: AssetId`, `position: string` |
| `social_proof` | `platform: string`, `count: string`, `style?: string` |

---

## Hierarchy tóm tắt

```
Text (primitive — 18 properties)
  ├─ Caption Block     + start/end, words[], speakerId, SmartLink anchor
  │    └─ Caption Track  (container) + stylePack, pacing, posY, speakerMap
  ├─ Disclaimer        + corner position, small fontSize range
  └─ Super             + layout, backgroundColor, fullframe, animation

Video / Image Clip     + speed, blend, effects[], lookPresetId, transition
  └─ effects[]         → Effect stack (colorCorrect, bloom, grain…)

Audio Clip             + gainDb, fx[], audioPresetId, automation

Overlay Clip           + blendMode, maskId, transform
  ├─ Composition       (Whip It) + type, data, style recipe, beatSync
  ├─ Image / SVG layer
  └─ Super / Text layer → Text fields trên
```

---

## Animatable properties (có thể đặt keyframe)

| Property | Type | Keyframe-able |
|---|---|---|
| `scale` | `number` | ✅ |
| `position` | `[x,y]` | ✅ |
| `rotation` | `number` | ✅ |
| `opacity` | `number` | ✅ |
| `crop` | `[top,right,bottom,left]` | ✅ |
| `filmGrain.amount` | `number` | ✅ |
| `rgbSplit.offset` | `number` | ✅ |
| `bloom.intensity` | `number` | ✅ |
| `colorCorrect.saturation` | `number` | ✅ |
| `gainDb` (audio) | `number` | ✅ (automation lane) |
| `font`, `color`, `fontSize` | — | ❌ static only |

→ Xem full keyframe schema: [Project Document](./whip-data-model#keyframe--đơn-vị-nhỏ-nhất)
