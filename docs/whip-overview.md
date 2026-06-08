---
id: whip-overview
title: Tổng quan
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# Whip — Ngôn ngữ lập trình cho video

> **Một câu:** Whip là editor video đầu tiên nơi bạn thao tác *ý nghĩa*, không phải *thời gian*.

---

## Vấn đề với mọi editor hiện tại

Tất cả editor video — từ Adobe Premiere đến CapCut — đều xây trên cùng một giả định từ những năm 1980:

> **"Timeline = trục thời gian tuyến tính. Subtitle này nằm từ giây 5.0 đến giây 8.0."**

Giả định này tạo ra vô số thao tác thủ công nhàm chán mỗi khi bạn chỉnh sửa:

- Cắt 3 giây đầu video → phải kéo tay lại subtitle, nhạc nền, SFX, motion graphic — mỗi thứ một lần
- Chỉnh lại câu thoại → subtitle bị lệch hình, phải gõ lại
- Đổi nhịp cắt → beat nhạc sai, phải căn lại từng cú

Mỗi lần chỉnh nhỏ đẻ ra 10 tác vụ phụ. Editor giỏi thì làm nhanh hơn — nhưng vẫn *phải tự tay làm*.

---

## Whip đặt cược ngược lại

Thay vì quản lý **thời gian tuyệt đối**, Whip quản lý **mối quan hệ ngữ nghĩa** — tức là *ý nghĩa* của từng phần tử và nó liên quan đến phần tử nào khác.

```
CapCut/Premiere:   subtitle.start = 5.000s        ← ghim cứng vào giây

Whip:              subtitle.anchor = {
                     type: "phoneme",              ← ghim vào âm vị (âm thanh)
                     word: "xin chào",             ← từ cụ thể trong audio
                     clip: "audio_track_1"
                   }
```

**Giải thích phoneme:** Âm vị (phoneme) là đơn vị âm thanh nhỏ nhất — chữ "xin" là 3 âm vị /x/, /i/, /n/. Thay vì nói "subtitle xuất hiện lúc giây 5.0", Whip nói "subtitle này xuất hiện đúng lúc người ta phát âm chữ *xin chào*." Dù bạn có cắt, dời, hay tăng tốc video — câu đó vẫn tự khớp.

Khi bạn cắt 3 giây đầu, Whip tự tính lại toàn bộ. Bạn không kéo tay gì cả.

Đây là lý do chúng tôi gọi Whip là **ngôn ngữ lập trình cho video**: thay vì làm từng bước thủ công, bạn khai báo *ý định* — "subtitle này theo câu này", "SFX này theo transition này" — và hệ thống tự thực thi.

---

## Điểm khác biệt so với đối thủ

| | After Effects | DaVinci Resolve | CapCut | **Whip** |
|---|---|---|---|---|
| Cắt 3s đầu | Tay — kéo lại 10+ thứ | Tay — kéo lại 10+ thứ | Tay — caption lệch | **SmartLink tự tính (live)** |
| Subtitle/caption | Tay hoặc plugin | Tay | Ghim vào giây → lệch khi cắt | **Ghim vào âm vị (live)** |
| Motion graphic / AI editorial | Skill + 4-8h tay | Không có | Basic preset | **"Whip It" 1-click (v1 target)** |
| Background removal | Roto Brush (tay, chậm) | ✅ Magic Mask | ✅ AI auto | ✅ **(v1 target)** |
| AI agent điều khiển | ❌ | ❌ | ❌ (preset only) | **Execute thật qua MCP (v1 target)** |
| Graph editor | ✅ Full | ✅ Full | ❌ | ✅ **(v1 target)** |
| Auto-animate (behaviors) | Không có | Không có | Preset cứng | **32+ bind vào lời nói (live)** |
| Cài đặt | Desktop 30GB+ | Desktop 3GB | App / Web chậm | **Browser, không cài (live)** |
| Export local | ✅ | ✅ | ❌ upload server | ✅ **WebCodecs local (live)** |

---

## Tại sao nó sẽ thắng

Có 5 lý do Adobe và CapCut không thể copy Whip trong 1-2 năm tới:

1. **Semantic Temporal Graph** — kiến trúc dữ liệu hoàn toàn mới (Adobe rebuild mất 5+ năm vì 30 năm technical debt)
2. **Local-first + WebGPU** — render 4K ngay trên trình duyệt, không cần download app, không crash
3. **Agent thật sự điều khiển được** — editor đầu tiên AI có thể *edit thật*, không chỉ "gợi ý"
4. **Creator lock-in** — style và pattern của creator được học và encode, không export sang tool khác được
5. **Zero Latency** — mọi thao tác phản hồi ngay lập tức dù file nặng cỡ nào

→ Giải thích chi tiết từng điểm: [Tại sao Whip sẽ thắng](./whip-moat)

---

## Hiện tại đang ở đâu

| Nhóm tính năng | Trạng thái |
|---|---|
| Engine render video (WebGL/PixiJS) | ✅ Live — ổn định đến 1080p |
| Keyframe animation + bezier easing | ✅ Live — 8 presets + custom cubic-bezier |
| Timeline đa track (video + audio) | ✅ Live — snap, marquee, group move |
| Auto-caption word-level (Deepgram) | ✅ Live — killer feature |
| SmartLink: caption bám audio khi cắt | ✅ Live — **moat vs CapCut** |
| Text effects, gradient, glyph stagger | ✅ Live |
| Smart behaviors (auto-animate 32+) | ✅ Live — **moat vs AE** |
| Export H.264 local qua WebCodecs | ✅ Live — không upload |
| Blend modes per-clip | ❌ **v1 cần — P0 blocker** |
| Background removal / magic mask | ❌ **v1 cần — vs CapCut** |
| "Whip It" editorial AI pipeline | ❌ **v1 cần — core moat** |
| Image gen + RMBG + graphic overlay | ❌ **v1 cần — vs AE** |
| Graph editor UI | ❌ **v1 cần — vs AE/DaVinci** |
| Audio noise removal | ❌ **v1 cần — vs CapCut** |
| MCP agent interface | 🔄 Scaffold — v1 target |
| WebGPU zero-copy 4K | ❌ Roadmap v2 |
| OPFS: file 50GB không load RAM | ❌ Roadmap v2 |
| Semantic Anchor DAG (full) | ❌ Roadmap v2 |
| Yjs CRDT (offline + cộng tác) | ❌ Roadmap v3 |

→ Bảng trạng thái đầy đủ: [MVP Status & Roadmap](./whip-mvp-scope)

---

## Hướng dẫn đọc doc theo vai trò

| Bạn là | Đọc theo thứ tự này |
|---|---|
| Developer mới | [Kiến trúc SOTA 2026](./whip-architecture) → [Tính năng & Luồng Logic](./whip-features) → [Data Model](./whip-data-model) |
| Designer / Creator | [Tính năng](./whip-features) → [Look & Feel](./whip-look) → [Content View](./whip-content-view) |
| Nhà đầu tư / Partner | [Tại sao thắng](./whip-moat) → [Roadmap](./whip-mvp-scope) → [Funding & Legal](./whip-pitch) |
| AI Agent | [MCP & Agent](./whip-mcp) → [Command API](./whip-api) |
