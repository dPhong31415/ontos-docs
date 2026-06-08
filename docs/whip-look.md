---
id: whip-look
title: Signature Look & Preset Library
sidebar_label: 🎨 Look & Presets
sidebar_position: 6
---

# Signature Look & Preset Library

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

## Properties panel — control thật, không chỉ keyframe

Panel clip phải có **control number + slider + toggle** cho mọi property (như Sound Settings của
CapCut / panel Spline), không bắt user đặt keyframe mới chỉnh được:

```
TRANSFORM
  Scale     ──●────────  [1.00] ◆     ← slider + number + nút key
  Opacity   ●──────────  [1.00] ◆
  Rotation  ──────●────  [0°]   ◆
  Pos  X [0]  Y [0]
SPEED   [0.5x] [1x] [1.5x] [2x]
```

- Kéo slider/sửa number → set value tại playhead (tự thành keyframe nếu clip đã animate).
- Nút **◆** = thêm keyframe tại playhead. User mới không cần hiểu keyframe vẫn chỉnh được.

🩻 Có trong `ClipPanel`: slider+number cho Scale/Opacity/Rotation + Pos X/Y; Speed preset (stub).

---

## Curve Editor — MỘT graph cho mọi property

**Không** mỗi property một graph. Một graph chung, **chọn property hiện qua chip** (kiểu filter, như
graph editor của AE):

```
GRAPH   [Scale] (Opacity) (Rotation)   ← chip bật/tắt đường nào hiện
┌────────────────────────────────────┐
│      ╱‾‾‾‾ (scale, tím)              │
│    ╱                                 │
│  ╱   ___ (opacity, xanh)            │
│ ╱___╱                               │
└────────────────────────────────────┘
   mỗi property một màu, chồng trên cùng trục thời gian
```

🩻 Có trong `ClipPanel`: unified graph, chip toggle Scale/Opacity/Rotation, mỗi đường một màu,
playhead line. TODO: kéo keyframe + bezier handle trực tiếp trên graph.

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

---

## Preset Library — tất cả presets cần build để launch

> Mỗi preset = 1 bundle tham chiếu viral cụ thể. **Tất cả cần có trước launch v1.**
> Cột "Viral ref" = creator style tham chiếu — tên chỉ dùng nội bộ, **tên trong app là generic** (xem [GTM §8](./whip-gtm-launch)).

### Caption presets (4 — đã build)

| Preset (app name) | Vibe | Font | Đặc trưng | Viral ref |
|---|---|---|---|---|
| **Loud** | Gào thét, đập mắt | Montserrat Black 900 | UPPERCASE, active word vàng, viền đen dày | Hormozi, MrBeast |
| **Clean** | Tri thức, tối giản | Inter SemiBold | White nhỏ, shadow nhẹ, backdrop tối | Ali Abdaal |
| **Cinematic** | Điện ảnh, sang | Playfair Display Italic | Serif, đặt 1/3 dưới, fade nhẹ | Gawx |
| **Terminal** | Tech, hacker | Fira Code | Xanh #00FF00, glow mờ, monospace | MrBeast (tech) |

> ✅ Đã build. Cần thêm: per-creator variant (Iman = white uppercase minimal, Hormozi = orange accent, Ali = handwritten-style highlight)

---

### Super presets (full-frame overlay cards — ❌ cần build)

Super = text hoặc graphic element chiếm toàn frame hoặc phần lớn frame, không phải caption phụ đề.

| Preset | Type | Đặc trưng | Viral ref | Whip It type |
|---|---|---|---|---|
| **Section Card** | Full-frame section divider | Nền đen tuyệt đối, chữ trắng to, minimal | Iman Editorial | `section_card` |
| **Stat Slam** | Số liệu impact | Số to + label nhỏ, snap zoom in, nền solid | Hormozi | `stat_reveal` |
| **Quote Pull** | Quote card | Chữ nghiêng, đường viền accent, clean layout | Ali Clean | `quote_card` |
| **Energy Banner** | Lower third banner | Màu sắc nổi, nền gradient, kinetic fly-in | MrBeast | `lower_third` |
| **Cinematic Title** | Moody title card | Grain overlay, serif italic, muted nền | Gawx Cinematic | `section_card` |
| **Progress Bar** | Progress / checklist | Bar fill animation, step counter | Ali/Hormozi | `progress_bar` |
| **Social Proof** | Subscriber / metric count | Counter animation lên, badge-style | MrBeast | `social_proof` |
| **Kinetic List** | 3-item stagger reveal | Items bay vào lần lượt với delay | Iman/Ali | `kinetic_list` |

---

### Graphic / Callout presets (❌ cần build)

| Preset | Type | Đặc trưng | Viral ref | Whip It type |
|---|---|---|---|---|
| **Arrow Callout** | Callout arrow + label | Mũi tên handdrawn-style chỉ vào object | Ali Clean | `callout_arrow` |
| **Circle Highlight** | Vòng tròn nhấn mạnh | Animated circle vẽ quanh subject | Hormozi | `callout_arrow` |
| **B-roll Suggest** | B-roll placeholder | Mô tả visual cần b-roll, replace thủ công | All | `broll_suggest` |
| **Logo Sting** | Intro/outro logo animation | Fade-scale logo + tagline | All | `logo_sting` |

---

### Transition presets (❌ cần build)

| Preset | Type | Cơ chế | Viral ref |
|---|---|---|---|
| **Hard Cut** | Instant cut, không effect | Pure cut, tốc độ cao | Iman, Hormozi |
| **Whip Pan** | Blur wipe sang ngang | Motion blur sweep L→R hoặc R→L | MrBeast, energetic |
| **Zoom Punch Through** | Zoom in cắt qua | Scale lên 1.0→1.3, cut, scale down | Ali, viral punch |
| **Cross Dissolve** | Fade chéo | Opacity fade A→B overlap 0.3s | Gawx, cinematic |
| **Flash Cut** | White flash | Opacity 0→1→0 trắng 1 frame | MrBeast |
| **Dip to Black** | Fade đen | Opacity → 0 → fade in | Cinematic, end |
| **Glitch Cut** | RGB split + noise | Chromatic aberration burst 2-3 frames | Tech/hacker |

---

### Effect / Look presets (bundle — ❌ cần build)

Mỗi preset = bundle nhiều effect layers, 1 click apply cho toàn clip.

| Preset | Effect stack | Viral ref |
|---|---|---|
| **Gawx Cinematic** | Milky blacks tone curve + bloom 0.3 + haze overlay + grain 0.15 + chromatic aberration | Gawx Art |
| **Hormozi Bold** | High contrast (+0.15) + saturation (+0.2) + vignette hard + sharpen | Alex Hormozi |
| **Ali Clean** | Desaturate −0.3 + selective color (skin warm) + subtle bloom 0 + bright whites | Ali Abdaal |
| **MrBeast Energy** | Saturation +0.4 + liftR +0.05 + vignette medium + bloom 0.5 | MrBeast |
| **Iman Editorial** | Muted tones (sat −0.15) + cool shadows + crisp (contrast +0.1) + no grain | Iman Gadzhi |
| **Viral Raw** | Slight overexpose + warm highlights + no effects | Authenticity look |

---

### Music / Audio presets (❌ cần build)

| Preset | Settings | Dùng khi | Viral ref |
|---|---|---|---|
| **Auto Duck Podcast** | −14 dB duck, attack 200ms, release 800ms | Long-form, nhạc nền nhẹ | Ali, podcast |
| **Auto Duck Aggressive** | −20 dB duck, attack 80ms, release 400ms | High-energy, nhạc to | Hormozi, MrBeast |
| **Snap to Beat** | Cut points snap to 1/4 note grid | Montage, music-driven | MrBeast, viral |
| **Silence Cut** | VAD threshold −40dB, min 0.4s | Dead air removal | All |
| **Noise Removal** | Broadband noise gate + spectral denoise | Talking-head clean-up | All |

---

### Template Recipes (Whip It — 5 bundles — ❌ cần build)

Recipe = tổng hợp caption + super + effect + transition + graphic thành 1 pipeline.

| Recipe | Caption | Super | Effect look | Transition | Graphic style |
|---|---|---|---|---|---|
| **Iman Editorial** | Clean uppercase minimal | Section Card (black) | Iman Editorial | Hard Cut | Bold section headers, geometric |
| **Hormozi Bold** | Loud (orange accent) | Stat Slam | Hormozi Bold | Hard Cut + Flash | Big callouts, metric counters |
| **Ali Clean** | Clean (handwritten-style highlight) | Quote Pull | Ali Clean | Zoom Punch Through | Arrow Callout, chapter cards |
| **MrBeast Energy** | Loud (bright) | Energy Banner + Social Proof | MrBeast Energy | Whip Pan + Flash | Bright stickers, score counters |
| **Gawx Cinematic** | Cinematic | Cinematic Title | Gawx Cinematic | Cross Dissolve | Minimal text, moody overlays |

---

### Build checklist

| Nhóm | Số lượng | Trạng thái |
|---|---|---|
| Caption presets | 4 | ✅ Done |
| Super presets | 8 | ❌ Cần build |
| Graphic / callout | 4 | ❌ Cần build |
| Transition presets | 7 | ❌ Cần build |
| Effect/look bundles | 6 | ❌ Cần build |
| Audio presets | 5 | ❌ Cần build |
| Template Recipes | 5 | ❌ Cần build (= Whip It recipes) |

→ Tất cả nhóm trên đều là **P1 trước launch** — không có presets thì Whip It pipeline không có gì để apply.
→ Spec Whip It pipeline đầy đủ: [F11 — Whip It](./whip-features) · [Schema](./whip-data-model)

---

## Sources (research)

- [Motion Array — Edit like GAWX Art](https://motionarray.com/learn/video-editing/how-to-edit-a-video-like-gawx-art/) (glow, haze, milky blacks, grain)
- [School of Motion — AE Keyframe Types](https://www.schoolofmotion.com/blog/after-effects-keyframe-types) (linear/bezier/continuous/auto/hold)
- [Filmora — Smooth Keyframes in AE](https://filmora.wondershare.com/video-editing-tips/after-effects-smooth-keyframes.html) (influence handle technique)
- [Increditors — Ali Abdaal / Hormozi / MrBeast editing styles](https://increditors.com/an-ultimate-guide-to-alex-hormozi-ali-abdaal-and-mr-beast-video-editing-style-and-methods/) (clean punch-in, face-zoom, grade)
