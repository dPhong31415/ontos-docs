---
id: whip-behaviors
title: Smart Animation (Behaviors)
sidebar_label: 🎚 Smart Animation
sidebar_position: 5
---

# Smart Animation — Behaviors & Anchors

> **Đây là thứ làm Whip KHÁC After Effects.** Không keyframe tay. Animation **bind vào ý nghĩa**
> (lời nói, cấu trúc nội dung), không bind vào thời gian tuyệt đối. Sửa lời → animation tự dời theo.
> Triết lý kiểu **Unreal**: procedural + override, không phải đặt keyframe thủ công từng cái.

---

## Vấn đề với keyframe tay (AE/CapCut)

```
AE:  bạn đặt keyframe zoom ở giây 12.4
     ↓ trim clip / cut lại câu nói
     lời "cái graph" dời sang giây 14.0
     ↓
     keyframe vẫn ở 12.4 → LỆCH → sửa tay lại từ đầu  😩
```

Keyframe **độc lập** với nội dung. Đó chính là cái bạn không muốn. Mỗi lần đụng audio là
animation vỡ. Với talking-head (cut liên tục) → ác mộng.

---

## Ý tưởng: bind motion to meaning

```
       Zoom in KHÔNG phải vì "giây 12.4"
       mà vì "người ta ĐANG NÓI VỀ cái graph"
       → lời dời thì zoom tự dời theo
```

Ba lớp, keyframe nằm ở **đáy** và **được sinh ra**, không sửa tay:

```
┌─ ANCHORS ─────────────┐   ┌─ BEHAVIORS ──────────┐   ┌─ KEYFRAMES ──────────┐
│ mốc theo NỘI DUNG     │──▶│ animation THAM SỐ    │──▶│ compiled, derived     │
│ (transcript, beat,    │   │ bind vào anchor      │   │ tự sinh lại khi       │
│  region, emphasis)    │   │                      │   │ content đổi           │
└───────────────────────┘   └──────────────────────┘   └──────────────────────┘
        source of truth            reusable logic          compiled artifact
```

---

## Lớp 1 — Anchors (mốc theo nội dung)

Anchor = tham chiếu thời gian **dẫn xuất từ nội dung**, không phải số giây cứng.

| Anchor | Là gì | Nguồn |
|---|---|---|
| `region` | một khoảng có nghĩa: "đoạn nói về graph" [12.4–18.9] | transcript match / chọn tay |
| `cue` | một điểm: emphasis, đầu câu, từ khóa được nói | speech analysis / Whisper |
| `beat` | nhịp nhạc | beat detect |
| `marker` | mốc thủ công | bạn đặt |
| `subject` | event bám chủ thể: mặt vào/ra khung | MediaPipe |

```jsonc
"anchors": {
  "regions": [
    { "id":"r_chart", "label":"nói về graph",
      "start":12.4, "end":18.9, "source":"transcript:revenue chart" }
  ],
  "cues": [
    { "id":"cue_emph_3", "t":24.1, "kind":"emphasis", "source":"speech" }
  ]
}
```

**Quan trọng:** `start/end` của region **derive từ transcript**. Trim clip → transcript dời →
region tự cập nhật → mọi behavior bám nó dời theo. **Không đụng một keyframe nào.**

---

## Lớp 2 — Behaviors (animation tham số, bind vào anchor)

Behavior = logic animation tái sử dụng, gắn vào anchor. **Không chứa số giây** — chỉ chứa "làm gì".

```jsonc
"behaviors": [
  {
    "id":"b1", "type":"zoomToRegion",
    "target":"c1",            // clip nào
    "bind":"r_chart",         // bám region "nói về graph"
    "params":{ "amount":1.15, "ease":"smooth",
               "holdDuring":true, "releaseAfter":true }
    // → compile: scale 1.0 @start ─ease-in→ 1.15 ─hold─ →1.0 @end ─smooth release
  }
]
```

Thư viện behavior (talking-head):

| Behavior | Làm gì | Ví dụ của bạn |
|---|---|---|
| `zoomToRegion` | zoom in mượt suốt region, zoom out khi hết | **"nhắc tới graph → zoom in, nói xong → zoom out"** ✅ |
| `punchOnEmphasis` | punch-in tại mỗi cue emphasis | nhấn mạnh → giật nhẹ vào |
| `sequenceReveal` | rải N graphic theo region (xem dưới) | **graphic layer 1-2-3 map theo thời lượng** ✅ |
| `followSubject` | bám mặt speaker khi zoom | giữ mặt giữa khung |
| `settleDrift` | trôi parallax nhẹ cả clip | nền sống động |
| `beatPulse` | scale pulse theo beat | sync nhạc |

---

## Lớp 3 — Compiler (behaviors + anchors → keyframes)

```
compile(project):
  for mỗi behavior b:
     anchor = resolve(b.bind)              // region/cue → {start,end} thực tại
     kf = generator[b.type](anchor, b.params)   // sinh keyframe + bezier
     ghi kf vào clip.properties (đánh dấu source: "behavior:b1")
```

- Chạy **mỗi khi** anchor đổi (trim, re-transcribe, kéo region).
- Keyframe sinh ra **đánh dấu `generated`** — khác keyframe tay (`manual`).
- Preview/export đọc keyframe đã compile như thường → engine [render](./whip-system-design.md) không cần biết behavior là gì.

---

## Override / Bake (khi cần tay như Unreal)

Procedural lo 95%. 5% cần chỉnh tay:

```
behavior generated keyframes        bạn muốn cong curve khác ở 1 chỗ
        │                                      │
        ├── Override 1 keyframe ───────────────┘   (giữ behavior, ghi đè 1 điểm)
        │
        └── Bake → manual ─────────────────────────►  đông cứng thành keyframe tay,
                                                       ngắt khỏi behavior (full control)
```

Giống Unreal: chạy procedural, "bake to keyframes" khi cần tinh chỉnh thủ công. Mặc định bạn
**không bao giờ** phải mở curve editor — chỉ khi muốn.

---

## Hai ví dụ của bạn, đầy đủ luồng

### A. "Nhắc tới graph → zoom in smooth, nói xong → zoom out"

```
1. autoCaptions → transcript có timestamp từng chữ
2. tạo region:  bindRegion("revenue chart" hoặc chọn tay)  → r_chart [12.4–18.9]
3. gắn behavior: zoomToRegion(c1, r_chart, amount=1.15, releaseAfter=true)
4. compile → scale: 1.0 @12.4 ─ease→ 1.15, hold, ─ease→ 1.0 @18.9 (+0.4s release)
5. sửa lại câu, "graph" dời sang 14.0 → region tự thành [14.0–20.5]
   → recompile → zoom tự dời. KHÔNG sửa keyframe.  ✅
```

### B. "Graphic layer 1-2-3 map theo thời lượng talking head"

```
1. region r_explain = đoạn người ta giải thích 3 ý  [30.0–48.0]  (18s)
2. có sẵn 3 graphic: g1, g2, g3
3. behavior: sequenceReveal([g1,g2,g3], bind=r_explain,
                mode="distribute", in="fadeUp", out="fadeOut", stagger="auto")
4. compile → chia đều 18s:
      g1 hiện 30.0–36.0, g2 36.0–42.0, g3 42.0–48.0  (fade in/out tự tính)
5. region co/giãn (nói nhanh hơn → 12s) → 3 graphic TỰ co theo, vẫn chia đều.  ✅
   graphic KHÔNG independent — nó slaved vào region.
```

---

## So với Unreal (để bạn dễ map)

| Unreal | Whip |
|---|---|
| Sequencer (track theo thời gian) | Timeline + keyframe layer |
| Blueprint / event trigger | **Behavior** bám anchor |
| Gameplay event / data binding | **Anchor** từ transcript/beat/subject |
| Control Rig (procedural) | **Compiler** sinh keyframe |
| "Bake to keyframes" | Override / Bake |

→ Whip = "Sequencer + Blueprint + Control Rig" cho talking-head. Animation là **hàm của nội dung**,
không phải bảng keyframe tĩnh.

---

## UI: behavior = action-card, không phải keyframe

User **không nhìn keyframe** trên timeline. Họ thấy một **chuỗi action-card nối nhau** (kiểu Unreal
Sequencer): mỗi behavior là một thẻ có tên + span thời gian.

```
Clip "interview" ─ actions:
  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐
  │ ⚡ Smooth Punch│ │ 🔍 Zoom: graph │ │ ✨ Fade out   │
  └──────────────┘ └───────────────┘ └──────────────┘
        0–1.2s          8–12s            14–15s
  (keyframe ẩn bên dưới — là output compiled của các card này)
```

- Thêm action = chọn từ thư viện preset (Smooth Punch, Zoom to region…), không đặt keyframe.
- Sửa card (amount/ease/region) = sửa param, compiler sinh lại keyframe.
- Muốn tay: mở card → "bake" → curve editor ([Signature Look](./whip-look.md#curve-editor)).

🩻 Scaffold: `ClipPanel` mục **Actions** hiện behavior card (derive từ `kf.source`). TODO: card có
span, kéo được, gắn vào [Content View](./whip-content-view.md) event.

---

## Vì sao điều này hợp với agent

Agent **không rải keyframe** (dễ sai, khó review). Agent làm việc ở tầng **ý nghĩa**:

```
agent đọc transcript → tạo anchors → gắn behaviors
   "câu này nói về số liệu → zoomToRegion"
   "đoạn này liệt kê 3 điểm → sequenceReveal 3 graphic"
→ compiler lo keyframe. Bạn review ở tầng behavior (đọc được), không phải 200 keyframe.
```

Đây là lý do behaviors **là** giao diện tự nhiên cho [MCP & Agent](./whip-mcp.md): agent phát
`bindRegion` + `addBehavior`, không phát `setKeyframe` × 200. Xem skill `autoZoomOnMention`.
