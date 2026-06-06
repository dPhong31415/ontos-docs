---
id: whip-overview
title: Tổng quan
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# Whip — Agentic Talking-Head Motion Editor

> **Whip** là editor video/motion graphic nhẹ, GPU-native, **agent điều khiển được**, tập trung vào
> video talking-head: smooth zoom/punch-in, keyframe sạch (kiểu Abi Abdallah / Gawx Art),
> preset nhanh kiểu CapCut, cut sync nhạc kiểu DaVinci. Là một **app con trên Ontos platform**.

---

## Whip giải quyết nỗi đau gì

| Tool | Vấn đề |
|------|--------|
| **After Effects** | Adobe nặng, hay crash, không tận dụng GPU, render đau, không agent-centric, `.aep` nhị phân |
| **DaVinci Resolve** | OK nhưng cực nặng, không có hiệu ứng viral, keyframe + render vẫn cồng kềnh |
| **CapCut** | Nhẹ + free + có hiệu ứng, **nhưng audio và keyframe vô cùng kì cục**, không control sâu |

Whip ăn đúng **khoảng giữa** mà cả ba bỏ trống: nhẹ + free như CapCut, nhưng keyframe + audio
+ render đúng tầm pro như Resolve/AE — **cộng** một thứ không tool nào có: **agent tự edit được**.

→ Không rebuild AE. Build 10% mà editor talking-head dùng 90% thời gian, và làm *cái đó* nhanh,
ổn định, agent-drivable.

---

## Tên & định vị

- **Codename:** `Whip` — chính là cú whip-pan, là động từ ("whip it together"), 1 âm tiết, gào lên chuyển động.
- **Tagline:** *Made with Whip.* — slogan tự bán trên mọi video talking-head viral.
- **Dự phòng tên:** Glide (mượt-premium) / Swoop (vui, social-native).

> ⚠️ **Đừng nhầm với [Kinetic Layer](./ontology-kinetic.md)** của Ontos — đó là action engine
> của platform. Whip là app con. Editor từng tên nháp "Kinetic" → đã đổi thành **Whip** để tránh đụng.

---

## Ý tưởng lõi: một document, ba client

Toàn bộ kiến trúc gói gọn trong một hình:

```
                 ┌──────────────────────────┐
                 │  project.whip (JSON)      │  ← single source of truth
                 │  timeline khai báo         │
                 └────────────┬──────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐         ┌─────▼──────┐        ┌──────▼──────┐
   │  Human   │         │   Agent    │        │  Renderer   │
   │  GUI     │         │  (MCP/LLM) │        │  preview +  │
   │          │         │            │        │  export     │
   └────┬─────┘         └─────┬──────┘        └──────▲──────┘
        │                     │                      │
        └─────► cùng một Command API ◄───────────────┘
            (addClip, setKeyframe, applyPreset, split…)
```

- **GUI** và **Agent** đều chỉ là client phát cùng một command.
- **Renderer** là hàm thuần: `(project, time) → frame`. Tất định.
- Vì project là JSON đi qua **command layer có schema validate**, agent mutate an toàn — mỗi edit là một diff.

Đây là khác biệt với Remotion (video = code React). Ở Whip **video = data**, agent sửa data chứ
không sửa code → an toàn, review được, undo được, GUI luôn sync. Pattern này chính là phiên bản
**client-side** của [Kinetic Action Engine](./ontology-kinetic.md) — xem [Ontology Reuse](./whip-ontology-reuse.md).

---

## Đọc tiếp

| Trang | Nội dung |
|-------|----------|
| [🎯 Tính năng](./whip-features.md) | Feature matrix đầy đủ vs CapCut/Resolve/AE |
| [🏗 System Design](./whip-system-design.md) | Engine, render pipeline, các luồng, web vs Electron |
| [🗄 Project Document](./whip-data-model.md) | Schema timeline JSON = nodes/edges |
| [🔌 Command API](./whip-api.md) | Action types, REST, validate, undo |
| [🤖 MCP & Agent](./whip-mcp.md) | MCP server, agent skills (autoPunchIn…) |
| [🧬 Ontology Reuse](./whip-ontology-reuse.md) | Dùng được gì từ Ontos, build riêng gì |
| [✅ Roadmap](./whip-roadmap.md) | v0 → v1 (NLE đủ) → v2 |
