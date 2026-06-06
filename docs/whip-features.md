---
id: whip-features
title: Tính năng & NLE Matrix
sidebar_label: 🎯 Tính năng
sidebar_position: 2
---

# Tính năng — có đủ một NLE không?

> Trả lời thẳng: **engine là superset của NLE** (keyframe-mọi-thứ + GPU composite + multitrack +
> WebAudio). Hết **v1** là có **NLE basic hoàn chỉnh**, thắng CapCut đúng 2 chỗ nó tệ nhất
> (audio, keyframe), thắng AE/Resolve ở weight + price + viral preset + render.

---

## Ba nỗi đau → ba thế mạnh

| Nỗi đau của bạn | Cách Whip giải |
|---|---|
| **Audio CapCut quá kì** | WebAudio cho **native** volume automation keyframe + `BiquadFilter` (EQ) + `DynamicsCompressor` (compressor/limiter) + skill auto-ducking → audio pro, free, không cần Fairlight |
| **Keyframe tay đau** | [**Smart Animation**](./whip-behaviors.md): bind motion vào *lời nói/nội dung*, không vào giây cứng. "Nhắc tới graph → zoom in, nói xong → zoom out." Sửa lời thì animation tự dời. Keyframe là output compiled, hiếm khi chạm tay (kiểu Unreal procedural + bake) |
| **Render là nỗi đau** | WebCodecs **hardware encode** = GPU render, async, không freeze app, nhanh — cái đỡ nhất hằng ngày |

---

## Feature matrix (benchmark thật)

`✓✓` = best-in-class · `✓` = solid · `~` = yếu/kì · `✗` = không có.
Cột phải = version Whip ship.

| Feature | CapCut | Resolve | AE | **Whip** |
|---|:---:|:---:|:---:|:---:|
| Multi-track timeline, trim/split/ripple | ✓ | ✓✓ | ~ | ✓ **v1** |
| Snapping / markers / copy-paste | ✓ | ✓✓ | ✓ | ✓ **v1** |
| Transitions (dissolve/fade/wipe) | ✓ | ✓✓ | ✓ | ✓ **v1** |
| Text / titles / lower-thirds | ✓ | ✓ | ✓✓ | ✓ **v1** |
| Color correction (basic) | ~ | ✓✓ | ✓ | ✓ **v1** |
| Speed / time-remap / ramps | ✓ | ✓ | ✓ | ✓ **v1** |
| **Viral effect presets** (glitch/shake/grain) | ✓✓ | ✗ | ~ manual | ✓✓ **v1** ← edge |
| **Smart Animation** (bind motion vào lời nói) | ✗ | ✗ | ✗ | ✓✓ **v1** ← unique |
| Keyframe tay + bezier curves (override) | ~ kì | ✓ | ✓✓ | ✓✓ **v1** |
| Graph / curve editor (khi cần bake) | ✗ | ✓ | ✓✓ | ✓ **v1** |
| Audio waveform + multi-track mix | ✓ | ✓✓ | ~ | ✓ **v1** |
| **Audio volume automation keyframes** | ~ kì | ✓✓ | ✓ | ✓✓ **v1** ← edge |
| **EQ / compressor / limiter** | ✗ | ✓✓ Fairlight | ~ | ✓ **v1** (WebAudio native) |
| Auto-ducking (nhạc dưới voice) | ~ | ✓ | ✗ | ✓ **v2** skill |
| Captions (auto/animated) | ✓✓ | ✓ | ~ manual | ✓ **v2** (Whisper) |
| Chroma key / masking | ✓ | ✓✓ | ✓✓ | **v2** |
| LUT / film grading | ~ | ✓✓ | ✓ | **v2** |
| **GPU render speed** | ✓ | ✓ | ✗ đau | ✓✓ **v0** ← edge |
| Social aspect presets (9:16/1:1) | ✓✓ | ✓ | ~ manual | ✓ **v1** |
| **Agent-drivable (LLM edit timeline)** | ✗ | ✗ | ✗ | ✓✓ **v1** ← unique |
| **Giá** | free | $$$ | $$$/tháng | free |
| **Nhẹ / ổn định** | nhẹ | nặng | nặng/crash | nhẹ |

---

## Whip thắng ở đâu

- **vs CapCut**: keyframe + curve thật, audio automation + EQ/compressor thật, không jank.
- **vs Resolve/AE**: nhẹ, free, viral preset built-in, GPU render không đau, **có agent**.
- **Độc nhất**: không tool nào cho LLM cut video bằng cách sửa một file project readable.

---

## Talking-head — khác biệt sản phẩm

Không rebuild AE. Tập trung 5 cú chuyển động + skill agent:

**Preset chuyển động** (CapCut-fast, AE-smooth):
- `smoothZoomIn` — punch-in mượt (bezier `[0.16,1,0.3,1]`)
- `whipPan` — cú whip (tên app luôn)
- `drift` — parallax/trôi nhẹ
- `shake` — rung theo beat
- `punchIn` — zoom cứng vào điểm nhấn

**Effect viral** (shader stack): shake, RGB-split/glitch, zoom-blur, film grain, light leaks,
vignette, chromatic aberration.

**Agent skills** (v2 — xem [MCP](./whip-mcp.md)): `autoPunchIn`, `autoCutOnSilence`, `beatSync`,
`autoCaptions` (Whisper), `autoReframe` (MediaPipe), `autoDuck`.
