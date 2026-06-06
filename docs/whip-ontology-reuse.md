---
id: whip-ontology-reuse
title: Ontology — Reuse vs Build Riêng
sidebar_label: 🧬 Ontology Reuse
sidebar_position: 7
---

# Dùng được gì từ Ontos? Build riêng gì?

> Câu hỏi cốt lõi. Trả lời ngắn: **mượn PATTERN + server-side services của Ontos, build RIÊNG
> real-time engine.** Whip = thick client (engine) + thin Ontos services. Đừng ép cả Whip thành
> app CRUD trên backend Elixir — sẽ giết performance.

---

## Vì sao không phải "app Ontos thuần"

Ontos sinh ra cho domain **CRUD-ish** (jobradar, cafe, nhà hàng) — mọi thứ quy về object + action,
action chạy **server-side** trong Elixir, mutate Postgres trong transaction.

Whip thì khác bản chất:

| | App Ontos (jobradar) | Whip |
|---|---|---|
| Action chạy ở đâu | **Server** (Elixir, Postgres) | **Client** (RAM, GPU) |
| Tần suất mutation | thưa (user bấm nút) | **dày đặc** (kéo keyframe 60fps) |
| Latency cho phép | 100–500ms OK | **dưới 16ms** (1 frame) |
| State sống ở | Postgres | RAM client (project.whip) |

→ Không thể round-trip mỗi cú kéo keyframe lên Elixir. **Real-time engine BẮT BUỘC build riêng,
chạy local.**

---

## ✅ MƯỢN PATTERN (kiến trúc, không phải runtime)

Whip's [Command engine](./whip-api.md) là **bản client-side** của [Kinetic](./ontology-kinetic.md).
Cùng shape, khác host:

| Pattern Ontos | Whip áp dụng |
|---|---|
| 1 `parameter_schema` → MCP + REST + UI | 1 zod command → MCP tool + GUI + (REST khi cần) |
| `action_log` (before/after, actor) | undo log (before/after, agent/human) |
| 3 doors → 1 engine (UI/Agent/MCP) | GUI/Agent/MCP → 1 command bus |
| Effects DSL khai báo | Command primitives khai báo |
| Object/Property/Link metamodel | asset/clip/keyframe + edges ([Data Model](./whip-data-model.md)) |
| materialized view (query nhẹ) | `get_timeline_summary` (token-nhẹ cho agent) |

→ Mượn **cách nghĩ + convention**, viết lại bằng TS in-browser. Lợi: agent story + MCP **đồng nhất**
toàn platform — học Ontos một lần, Whip dùng lại tư duy.

---

## ✅ MƯỢN RUNTIME (server-side, không realtime)

Những thứ **không** latency-critical → cắm thẳng vào Ontos thật:

| Concern | Mượn từ Ontos |
|---|---|
| **Auth + workspace** | y hệt jobradar — không tự làm auth |
| **Entitlement + credit** | "export 4K = X credit", "AI auto-edit = Y credit" → `spendCredits`/`refundCredits` |
| **Project persistence** | `.whip` JSON lưu như một `object`; versioning, share-link (như NDA portfolio) |
| **Asset storage** | R2/S3 (đã có ở portfolio) — upload media, pre-signed URL |
| **Async AI jobs** | Whisper/MediaPipe/cloud-render = `action_type` có `credit_cost`, chạy Oban worker |
| **Realtime sync** | Phoenix Channel — nếu sau này colab nhiều người trên 1 timeline |

→ Các action nặng/tốn tiền thành `action_type` Ontos thật → tự có billing + audit + entitlement.
Whip client gọi `POST /apps/whip/actions/...`. Xem [Command API](./whip-api.md#rest-chỉ-khi-có-server).

---

## 🔨 BUILD RIÊNG (engine — Ontos không đụng tới)

| Phải tự build | Vì sao |
|---|---|
| **Interpolator** (keyframe → value tại t) | latency-critical, chạy 60fps trong client |
| **PixiJS compositor** (WebGL) | GPU composite, Ontos không có khái niệm này |
| **WebCodecs encode/decode** | hardware video, browser-only |
| **WebAudio graph** (clock + EQ + compressor) | A/V sync + audio realtime |
| **Command bus in-memory** (Immer + undo) | mutate RAM, không Postgres |
| **Curve editor / timeline UI** | UI chuyên dụng, không phải form auto-gen |

→ Đây là phần "khó và khác" của Whip. Ontos **không giúp được** chỗ này, và đó là chuyện đúng.

---

## Sơ đồ ranh giới

```
        ┌──────────────── WHIP CLIENT (build riêng) ─────────────────┐
        │  Interpolator · PixiJS · WebCodecs · WebAudio · Command bus │
        │  ↑ mượn PATTERN của Kinetic (command/undo/MCP), viết bằng TS│
        └───────────────────────────┬────────────────────────────────┘
                                    │ chỉ khi: login, save, asset,
                                    │ AI job nặng, cloud render
        ┌───────────────────────────▼────────────────────────────────┐
        │              ONTOS PLATFORM (mượn runtime)                  │
        │  Auth · Workspace · Credits · Persistence · Async AI · R2   │
        │  ← Whip là 1 trong "100 app con", dùng chung backend        │
        └─────────────────────────────────────────────────────────────┘
```

---

## Kết luận một câu

> **Whip mượn *tư duy* Kinetic (command → MCP/undo/3-doors) và *hạ tầng* Ontos (auth/credit/
> storage/AI-job), nhưng *engine real-time build riêng* bằng TS in-browser.**
> Ép engine lên Elixir = giết 60fps. Bỏ qua Ontos = viết lại auth/billing/storage đã có sẵn.
> Ranh giới: **latency-critical → client; không realtime/tốn tiền → Ontos.**

> ⚠️ Theo [cảnh báo over-abstraction](./ontology-roadmap.md): **đừng** build tích hợp Ontos trước.
> Làm Whip standalone (v0/v1) chạy đã, chỉ cắm Ontos khi cần auth/billing thật (v2). Engine không
> phụ thuộc Ontos để chạy.
