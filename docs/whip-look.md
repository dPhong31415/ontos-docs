---
id: whip-look
title: Signature Look (Ease + Glow)
sidebar_label: 🎨 Signature Look
sidebar_position: 6
---

# Signature Look — Ease Curves + Glow

> Whip phải làm ra được **đúng** cái look talking-head viral hiện tại. Có **2 cực style** tham chiếu,
> một **đường ease đặc trưng** (không phải linear, không phải easy-ease thường), và một **glow stack**.
> Trang này pin chính xác để build, kèm curve editor đủ mọi interpolation + speed ramp.

---

## Hai cực style tham chiếu

| Style | Đại diện | Đặc trưng | Whip làm bằng |
|---|---|---|---|
| **Clean punch-in** | **Ali Abdaal** | smooth zoom subtle, face-tracked, B&W grade + selective color, caption viết tay, snappy cut | [Smart Animation](./whip-behaviors.md) `zoomToRegion` + ease "Smooth Punch" |
| **Cinematic glow** | **Gawx Art** | haze/light rays, milky blacks, grain, color tone-curve, montage cinematic | Glow stack (dưới) + color grade |

> Hai cực này là **hai đầu** của talking-head: một bên sạch-giáo dục (Ali Abdaal), một bên
> điện-ảnh-mơ màng (Gawx). Whip cần cover cả hai. (Bạn nhắc "abi abdall / gandzhi" — chốt 2 ref này;
> nếu ý bạn là editor khác, sửa lại tên ở đây.)

---

## Đường ease đặc trưng — vì sao không phải easy-ease thường

Cú punch-in viral **không** phải linear, cũng **không** phải Easy Ease (F9) mặc định. Bí mật là
**Easy Ease rồi kéo influence handle ra cực mạnh trong Speed Graph** → tạo **expo-out**: *snap nhanh
lúc đầu, settle dài mượt lúc cuối*. Đây là thứ mắt thấy "đắt tiền".

```
Value (scale)                       Velocity (Speed Graph)
1.15 ┤            ____________       cao ┤█
     │        ___/                       │ █
     │     __/                           │  █___
     │   _/                              │      ‾‾‾‾‾_______
1.0  ┤__/                            0   └────────────────────
     └──────────────────────              nhanh → chậm dần (expo out)
       fast snap, long settle
```

**Preset ease built-in** (chọn tên, KHÔNG tune bezier tay):

| Tên Whip | cubic-bezier | Dùng cho |
|---|---|---|
| **Smooth Punch** ⭐ | `[0.16, 1, 0.3, 1]` (expo-out) | punch-in talking-head — cú signature |
| **Smooth In-Out** | `[0.65, 0, 0.35, 1]` (expo in-out) | zoom 2 chiều, transition |
| **Snappy Back** | `[0.34, 1.56, 0.64, 1]` (back-out, overshoot nhẹ) | pop graphic/text vui |
| **Settle** | `[0.22, 1, 0.36, 1]` | drift/relax kết thúc |
| Linear / Hold | — | kỹ thuật, freeze |

→ Mặc định behavior dùng **Smooth Punch**. Bạn không bao giờ phải biết `[0.16,1,0.3,1]` là gì —
chỉ thấy "Smooth Punch". Muốn tinh chỉnh thì mở curve editor (dưới).

---

## Curve Editor — đủ mọi interpolation

Có, **đủ** mọi mode như AE (đây là phần override, dùng khi cần — phần lớn để [behavior](./whip-behaviors.md) lo):

| Mode | Là gì | AE tương đương |
|---|---|---|
| **Linear** | rate đều, cơ học | Linear (diamond) |
| **Bezier** (manual) | full control 2 handle | Bezier |
| **Continuous Bezier** | smooth qua keyframe, handle nối | Continuous Bezier |
| **Auto Bezier** | tự smooth | Auto Bezier |
| **Hold** | đứng yên tới keyframe sau | Hold (square) |
| **Ease preset** | chọn từ bảng trên | Easy Ease + tuned |

**Hai graph** (như AE):

```
┌─ VALUE GRAPH ────────────┐   ┌─ SPEED GRAPH (velocity) ──┐
│ chỉnh giá trị theo thời  │   │ chỉnh VẬN TỐC trực tiếp    │
│ gian (vị trí keyframe)   │   │ — kéo influence handle 0–100% │
│                          │   │ = độ "đắt" của ease        │
└──────────────────────────┘   └────────────────────────────┘
```

- **Influence handle 0–100%**: kéo càng mạnh → ease càng expo → "Smooth Punch" càng rõ. Đây chính
  là thao tác bí mật của AE, Whip cho slider trực tiếp + preset sẵn.
- Per-property, per-keyframe. Bezier handle kéo được trên cả 2 graph.

---

## Speed Ramp (time-remap)

Có. Ramp tốc độ = keyframe **speed** + ease velocity (không phải cắt cứng):

```
speed
100% ┤‾‾‾‾\                    /‾‾‾‾   ← freeze → whoosh → normal
     │     \                  /
  0% ┤      \________________/         (slow-mo / freeze)
     └────────────────────────────
        ease vào/ra bằng Smooth In-Out
```

- `setSpeed(clip, factor)` cho speed cố định; **ramp** = keyframe speed track + ease.
- Slow-mo mượt: **optical-flow frame blending** (v2) — nội suy frame thay vì lặp frame.
- Đây là cú "freeze rồi phóng" viral — bind được vào [beat](./whip-behaviors.md) (`beatSync`).

---

## Glow Stack (look Gawx)

Mỗi cái là một shader/overlay trong [effect stack](./whip-data-model.md) của clip, real-time WebGL:

| Effect | Làm gì | Cơ chế |
|---|---|---|
| **Bloom / Glow** ⭐ | vùng sáng tỏa sáng, "đắt" | threshold → blur → screen blend (shader) |
| **Light leaks** | vệt sáng quét qua | overlay asset (screen/add) hoặc gradient sweep procedural |
| **Lens flare / sunbeams** | tia sáng từ điểm sáng | procedural từ bright point |
| **Haze / atmosphere** | mờ ảo điện ảnh | fog overlay low-contrast |
| **Milky blacks + ashen whites** | nâng đen, hạ trắng | **tone curve** (lift shadow, pull highlight) — grade Gawx |
| **Film grain** | filmic | grain overlay (đã có ở [features](./whip-features.md)) |
| **Chromatic aberration** | RGB tách ở mép | RGB offset shader |
| **Neon / text glow** | chữ phát sáng | outer glow trên text layer |

**Preset "Gawx Cinematic"** = bundle sẵn: milky-black tone curve + bloom nhẹ + haze + grain +
chromatic aberration. Một click, không layer effect tay.

**Preset "Clean Punch" (Ali Abdaal)** = B&W/desat grade + selective color + subtle bloom 0.

---

## Tất cả expose cho behavior + agent

Ease preset và glow đều là **param của behavior/effect** → agent set được:

```
addBehavior(c1, zoomToRegion, { bind:r_chart, ease:"Smooth Punch", amount:1.15 })
addEffect(c1, "bloom", { threshold:0.7, intensity:0.4 })
applyLook(c1, "Gawx Cinematic")          // bundle grade+glow 1 lệnh
```

→ Agent nói "làm clip này kiểu Gawx, punch-in mỗi điểm nhấn" → set look + behavior, không tay.

---

## Sources (research)

- [Motion Array — Edit like GAWX Art](https://motionarray.com/learn/video-editing/how-to-edit-a-video-like-gawx-art/) (glow, haze, milky blacks, grain)
- [School of Motion — AE Keyframe Types](https://www.schoolofmotion.com/blog/after-effects-keyframe-types) (linear/bezier/continuous/auto/hold)
- [Filmora — Smooth Keyframes in AE](https://filmora.wondershare.com/video-editing-tips/after-effects-smooth-keyframes.html) (influence handle technique)
- [Increditors — Ali Abdaal / Hormozi / MrBeast editing styles](https://increditors.com/an-ultimate-guide-to-alex-hormozi-ali-abdaal-and-mr-beast-video-editing-style-and-methods/) (clean punch-in, face-zoom, grade)
