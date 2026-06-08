---
id: whip-api
title: Command API
sidebar_label: 🔌 Command API
sidebar_position: 5
---

# Command API

> Mọi thay đổi project đi qua **một command layer**. GUI, agent, MCP đều phát cùng command.
> Đủ để thay AE trong production talking-head; đủ đơn giản để CapCut-user học được.

:::info Xem thêm
Agent workflow + MCP tool surface: [MCP & Agent Skills](./whip-mcp)
:::

---

## Vì sao command là first-class

```
                    ┌─→ GUI    (nút bấm / kéo handle)
command  ───────────┼─→ Agent  (LLM quyết định)
(1 định nghĩa)      ├─→ MCP    (tool ngoài gọi vào)
                    └─→ REST   (server-side khi cần)
```

→ **Undo/redo free** (command log), **agent-safe** (zod validate), **audit** (before/after diff),
**MCP auto-gen** (1 command = 1 MCP tool, schema = input schema). Xem [MCP & Agent](./whip-mcp.md).

---

## Command engine

```
invoke(command_name, params)
 1. RESOLVE   tra command registry → không có → {error: unknown_command}
 2. VALIDATE  zod.parse(schema, params) → sai → {error: invalid_params, details}
 3. PRECOND   eval preconditions (clip tồn tại? track đúng kind?)
 4. APPLY     produce(project, draft => { mutate }) — Immer, immutable
              push {before, after, cmd, params} vào undo stack
 5. NOTIFY    Zustand emit → Render Engine repaint
 6. RESULT    {ok, project} — lỗi giữa chừng → state không đổi
```

---

## Command reference đầy đủ

### Nhóm 1 — "Whip It" editorial pipeline (F11)

```ts
whipIt({ recipe?: RecipeId | { refVideoId: string } })
// Trigger full AI editorial:
//   transcript → LLM Art Director → CompositionBrief → asset gen → overlay → animate
// recipe: "iman_editorial" | "hormozi_bold" | "ali_clean" | "mrbeast_energy" | "gawx_cinematic"
// Không có recipe → dùng styleProfile đã set hoặc auto-detect

setStyleProfile({ recipeId: RecipeId } | { refVideoId: string })
// Extract StyleProfile từ reference video (5 frames → vision LLM)
// hoặc set từ recipe. Dùng cho whipIt() và mọi asset gen sau

generateAsset({
  description: string,  // "abstract geometric overlay, purple on black"
  style?: StyleRef,     // inherit từ styleProfile nếu không set
  type: "raster" | "vector",
  removeBackground?: boolean   // default true với raster
})
// raster: Seedream 5.0 / Flux → PNG → RMBG → transparent PNG → assetId
// vector: Recraft / Ideogram → SVG → assetId

removeBackground(assetId: string)
// RMBG local WebGPU → transparent PNG → trả assetId mới
// Dùng cho asset tự import (logo, product photo)

segmentObject(clipId: string, { x: number, y: number, frameT?: number })
// SAM2 magic mask: click điểm trong frame → segment object đó
// tracked: true → track qua toàn clip (dùng SAM2 propagation)
// Trả về maskId để dùng trong compositionRef, callout_arrow, replace_background

applyComposition(compositionJson: CompositionBrief)
// Apply mảng compositions[] vào timeline
// Tạo overlay clips, bind behaviors, set animations theo JSON
// Idempotent: gọi lại → diff và update, không duplicate
```

---

### Nhóm 2 — Timeline

```ts
addClip(trackId: string, assetId: string, {
  start: number,     // vị trí trên timeline (giây)
  in?: number,       // in-point trong source (default 0)
  end?: number,      // tự tính từ duration nếu không set
  label?: string
})

splitClip(clipId: string, t: number)
// Tạo 2 clip từ 1 clip tại t
// SmartLink tự relink captions cho cả 2 half

trimClip(clipId: string, { start?: number, end?: number, in?: number })
// Trim cạnh clip. Nếu rippleEnabled → shift tất cả clip sau

moveClip(clipId: string, trackId: string, start: number)
// Di chuyển clip sang track khác hoặc vị trí khác
// Behaviors và captions tự follow

rippleDelete(clipId: string)
// Xóa clip + dồn khoảng trống: mọi clip sau trượt lên
// SmartLink recompute tất cả caption offsets

duplicateClip(clipId: string, { offset?: number })
// Copy clip sang vị trí khác. Behaviors được copy, captions được copy với srcAnchor

groupClips(clipIds: string[], { label?: string })
// Group clips để move/delete cùng lúc (không phải nested comp)

reframeForAspect(clipId: string, aspect: "9:16" | "1:1" | "4:5", {
  subject?: "face" | "center" | { x: number, y: number }
})
// Crop clip sang aspect ratio mới, giữ subject trong frame
// face: MediaPipe face detection → center crop tại face position

reframeProject(aspect: "9:16" | "1:1", { subject?: "face" | "center" })
// Reframe TẤT CẢ video clips sang aspect mới trong 1 command
// Dùng khi cần xuất cùng video theo nhiều format (16:9 web + 9:16 Reels)
```

---

### Nhóm 3 — Smart Animation (tầng chính — xem [Behaviors](./whip-behaviors.md))

```ts
bindRegion({
  clipId: string,
  from: number, to: number,    // thủ công
  label?: string
} | {
  clipId: string,
  transcript: string           // auto-match: "revenue chart" → tìm trong transcript
})
// Tạo region anchor. Source of truth cho behaviors bind vào

addCue({ clipId: string, t: number, kind: "emphasis" | "beat" | "cut" | "custom" })
// Điểm cue. Behaviors punchOnEmphasis bind vào đây

addBehavior(targetClipId: string, type: BehaviorType, {
  bind: regionId | cueId | "auto",
  params: BehaviorParams
})
// Gắn behavior → compiler sinh keyframe. Xem danh sách behaviors ở whip-behaviors.md

setBehaviorParam(behaviorId: string, key: string, value: any)
removeBehavior(behaviorId: string)

bakeBehavior(behaviorId: string)
// Đông cứng → keyframe manual. Ngắt khỏi anchor. Dùng khi muốn tinh chỉnh tay.
```

---

### Nhóm 4 — Transform & Animate (low-level)

```ts
setKeyframe(clipId: string, prop: AnimatableProp, {
  t: number, v: number | [number,number],
  ease: EaseName | CubicBezier,
  source?: "manual"   // default manual
})
removeKeyframe(clipId: string, prop: AnimatableProp, t: number)
copyKeyframes(fromClipId: string, toClipId: string, props?: AnimatableProp[])
// Copy keyframe từ clip này sang clip khác (match theo relative time)

setEase(clipId: string, prop: AnimatableProp, t: number, ease: EaseName | CubicBezier)
applyPreset(clipId: string, presetId: string, params?: Record<string,any>)
// Preset = behavior cố định: smoothZoomIn, whipPan, hormoziPop, glitch...
```

---

### Nhóm 5 — Effects & Compositing

```ts
addEffect(clipId: string, type: EffectType, params: EffectParams)
setEffectParam(clipId: string, effectId: string, key: string, value: any)
// value có thể là Keyframe[] để keyframe effect param:
// setEffectParam(c1, e_bloom, "intensity", [{t:0,v:0.2},{t:2,v:0.8}])

removeEffect(clipId: string, effectId: string)
reorderEffects(clipId: string, effectIds: string[])
// Thứ tự effect stack quan trọng: grain trước bloom vs bloom trước grain = kết quả khác

setBlendMode(clipId: string, mode: BlendMode)
// normal | multiply | screen | overlay | add | soft_light | hard_light
// Screen: light leaks, glow asset, lens flare overlay
// Multiply: shadow, dark vignette, texture overlay
// Add: neon, particle, luma matte

setMask(clipId: string, maskId: string | null)
// Áp SAM2 mask lên clip → chỉ render vùng mask
// null = xóa mask

addTransition(clipA: string, clipB: string, type: TransitionType, duration: number)
// crossDissolve | dipToBlack | wipe | flashCut | zoomCut | swipe
```

---

### Nhóm 6 — Text & Captions

```ts
addText(trackId: string, {
  text: string, start: number, end: number,
  preset?: "lowerThird" | "title" | "caption" | "annotation",
  font?: string, size?: number, color?: string, weight?: number,
  shadow?: boolean, glow?: boolean
})

setText(clipId: string, params: Partial<TextParams>)

autoCaptions(clipId: string, {
  language?: string,      // default: "auto-detect"
  speakerLabels?: boolean // diarization: tách speaker
})
// Deepgram → word timestamps → fill captionTrack.blocks[]
// Cache per asset (không re-transcribe nếu đã có)

importCaptions(trackId: string, assetId: string)
// Import SRT/VTT file → parse → fill blocks[] (no word-level)

exportCaptions(captionTrackId: string, format: "srt" | "vtt" | "txt")
// Export ra file phụ đề

translateCaptions(captionTrackId: string, targetLang: string)
// Gọi LLM translate từng block. Giữ timing, chỉ đổi text.
// Tạo captionTrack mới (không xóa original)

setCaptionStyle(captionTrackId: string, stylePack: StylePack)
setCaptionBlockStyle(blockId: string, style: Partial<CaptionStyle>)
// Per-block override: highlight 1 từ với màu khác, size khác
```

---

### Nhóm 7 — Speed & Audio

```ts
setSpeed(clipId: string, factor: number)
// Constant speed: 0.25x slow-mo, 4x timelapse

setSpeedRamp(clipId: string, keyframes: { t: number, speed: number }[])
// Speed ramp: viral "freeze rồi phóng"
// [{t:0, speed:1}, {t:5, speed:0.3}, {t:7, speed:1}]
// Captions tự stretch/compress theo speed

setPitchLock(clipId: string, enabled: boolean)
// enabled: true → audio không bị pitch-down khi slow-mo
// Dùng formant-preserving time-stretch (phase vocoder)

setGain(clipId: string, db: number)
setGainAutomation(clipId: string, keyframes: { t: number, v: number }[])
// Manual ducking: [{t:0,v:-6},{t:40,v:-18},{t:48,v:-6}]

autoDuck(musicClipId: string, voiceTrackId: string, {
  duckDb: number,    // default -12
  attackMs: number,  // default 20
  releaseMs: number  // default 200
})
// Smart ducking: tự detect voice → hạ nhạc khi có tiếng người

addAudioFx(clipId: string, fx: AudioFxConfig)
// eq: { bands: [{f: number, gain: number, q: number}] }
// compressor: { threshold, ratio, attack, release, knee }
// noiseRemoval: { strength: 0-1, mode: "auto"|"voice"|"broadband" }
// limiter: { ceiling: number }

detachAudio(clipId: string)
// Tách audio track ra clip riêng → có thể edit độc lập
```

---

### Nhóm 8 — Mask & Segmentation

```ts
segmentObject(clipId: string, { x: number, y: number, frameT?: number })
// SAM2: click điểm → segment object
// x, y: normalized 0..1 từ top-left
// frameT: giây trong source (default = current playhead relative to clip)
// Trả về { maskId: string }

trackMask(maskId: string, { range?: { from: number, to: number } })
// SAM2 propagation: track mask qua toàn clip hoặc range
// Điền boundingBoxes[] vào mask

replaceMaskBackground(clipId: string, maskId: string, {
  replacement: "blur" | "color" | { assetId: string }
})
// Virtual background: blur bg | solid color | replace với image/video

pinOverlayToMask(overlayClipId: string, maskId: string)
// Overlay clip tự di chuyển theo bounding box của mask
// Dùng cho callout arrows, name tags, product highlights chạy theo người/vật
```

---

### Nhóm 9 — Project

```ts
setCanvas({ resolution: [w, h], aspect: string, fps: number })

importBrandKit({ palette: string[], font: string, logoAssetId?: string })
// Set brand colors + font → tất cả compositions inherit

undo() / redo()

render({
  range?: { from: number, to: number },
  out: string,            // filename
  preset: "h264_1080" | "h264_4k" | "h264_720" | "gif" | "webm",
  watermark?: boolean
})
```

---

## Production workflow examples

### AE workflow: cinematic talking-head với b-roll

```ts
// 1. Grade cả video
addEffect("c1", "colorCorrect", { saturation: 0.85, liftB: -0.02 })
addEffect("c1", "filmGrain",    { amount: 0.15 })
addEffect("c1", "bloom",        { threshold: 0.75, intensity: 0.3 })

// 2. B-roll overlay (speaker mờ dần 15%)
addClip("ov1", "a_broll", { start: 18, end: 26 })
setBlendMode("c_broll", "normal")
setKeyframe("c_broll", "opacity", { t: 18, v: 0 })
setKeyframe("c_broll", "opacity", { t: 18.4, v: 0.85, ease: "smooth" })
setKeyframe("c_broll", "opacity", { t: 25.6, v: 0.85 })
setKeyframe("c_broll", "opacity", { t: 26, v: 0 })

// 3. Callout arrow bám laptop
segmentObject("c1", { x: 0.62, y: 0.45, frameT: 48.2 })
// → { maskId: "mask_laptop" }
trackMask("mask_laptop")
// Thêm composition với callout bám mask
applyComposition([{
  type: "callout_arrow", t: 48, duration: 5,
  data: { text: "MacBook Pro M4", direction: "left" },
  maskId: "mask_laptop"
}])

// 4. Light leak overlay (screen blend)
addClip("ov1", "a_lightleak", { start: 0, end: 2 })
setBlendMode("c_lightleak", "screen")
setKeyframe("c_lightleak", "opacity", { t: 0, v: 0 })
setKeyframe("c_lightleak", "opacity", { t: 0.5, v: 0.6, ease: "smooth" })
setKeyframe("c_lightleak", "opacity", { t: 2, v: 0 })
```

---

### CapCut workflow: short-form viral từ 1h podcast

```ts
// 1. Transcribe + detect silence
autoCaptions("c1", { speakerLabels: true })
// 2. Cắt dead air
auto_cut_on_silence("c1", { threshold: -40, minSilence: 0.4 })
// 3. Tìm 5 đoạn viral (LLM đọc transcript → chọn hooks)
// agent phân tích → chọn moments → tạo 5 sub-project
// 4. Cho từng clip ngắn:
reframeForAspect("clip_short_1", "9:16", { subject: "face" })
setCaptionStyle("cap1", "loud")
setStyleProfile({ recipeId: "hormozi_bold" })
whipIt({ recipe: "hormozi_bold" })
autoDuck("m1", "v1", { duckDb: -14 })
render({ range: { from: 0, to: 60 }, out: "clip_1_9x16.mp4" })
```

---

### Edge case: speed ramp + caption + pitch lock

```ts
// Slow-mo viral moment tại giây 5-7
setSpeedRamp("c1", [
  { t: 0, speed: 1.0 },
  { t: 5.0, speed: 0.3 },   // vào slow-mo
  { t: 7.0, speed: 1.0 }    // ra slow-mo
])
setPitchLock("c1", true)     // audio không bị pitch-down
// CaptionService tự detect speedKeys → stretch word timestamps × (1/0.3)
// → "Bí mật" kéo dài 3.3× trên timeline nhưng vẫn sync với miệng
```

---

## Undo = audit = agent transparency

```
[12:03:01] whipIt({ recipe: "hormozi_bold" })                   ← agent F11
[12:03:02] generateAsset({ description: "purple stat graphic" }) ← agent asset gen
[12:03:02] applyComposition([{ type: "stat_reveal", t: 0 }])    ← agent
[12:03:05] setKeyframe(c1, scale, { t: 2.0, v: 1.12 })          ← human tinh chỉnh tay
[12:03:08] setBlendMode(c_lightleak, "screen")                  ← human
```

Mỗi step undo được. Agent log đọc được — không phải hộp đen.

---

## REST server-side actions

Chỉ khi tích hợp Ontos (nặng / tốn tiền / async):

```
POST /apps/whip/actions/auto_captions      Whisper job   (credit_cost: 1/video)
POST /apps/whip/actions/whip_it            Full pipeline (credit_cost: 5/video)
POST /apps/whip/actions/render_cloud       4K render farm (credit_cost: 2/video)
POST /apps/whip/actions/translate_captions LLM translate (credit_cost: 1/lang)
```

Client-side actions (kéo keyframe, apply preset, trim) không lên server — $0 COGS.
