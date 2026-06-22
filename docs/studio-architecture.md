---
id: studio-architecture
title: Kiến trúc
sidebar_label: 🏗 Kiến trúc
sidebar_position: 4
---

# 🏗 Kiến trúc

Next.js 15 (App Router) + tldraw. Key giấu server-side; client không bao giờ thấy.

---

## Pipeline

```
Recipe (Lab) ──compileRecipe──┐
                              ├─► prompt ─► /api/generate ─► provider ─► ảnh ─► canvas
Free-text (3 mode kia) ───────┘                (server)      (registry)
```

- **Client** (`components/Studio.tsx`): state UI, dựng skeleton, gọi `/api/generate`, đặt shape lên tldraw. Không giữ key.
- **API** (`app/api/generate/route.ts`): cổng `STUDIO_PASSWORD` tùy chọn; nhận `{provider, prompt, size, quality, n, imageUrls}`; clamp `n` ≤ 4, `imageUrls` ≤ 14; gọi registry.
- **Registry** (`lib/providers/index.ts`): `generate(id, opts)` switch sang provider; `listProviders()` báo `enabled` theo env key (UI xám provider thiếu key).

## Provider interface

Một shape duy nhất để mọi provider thay thế lẫn nhau (`lib/providers/types.ts`):

```ts
interface GenerateOptions { prompt; size; quality; n; imageUrls?; }
interface ProviderResult  { images: { dataUrl }[]; }
```

| Provider | Model | Ghi chú |
|---|---|---|
| OpenAI | `gpt-image-2` | map size về kích thước hợp lệ gần nhất |
| Gemini | `gemini-2.5-flash-image` (Nano Banana) | |
| Seedream | `seedream-5-0` (BytePlus ARK) | scale lên ≥3.69M px, snap bội 16, cap 4096; nhận `image` reference |

Thêm provider = thêm 1 file + 1 case. Không sửa client.

## Layout engine trên canvas

- `placeColumn` — xếp option của một provider thành cột (3 mode sản xuất).
- `placeOne` — đặt 1 ảnh tại toạ độ cho ma trận ablation của Lab.
- Cả hai tạo `asset` + `image` shape, lưu `meta: { mode, prompt, provider, name }` → nền cho Redo & nhãn overlay.
- Batch mới đặt dưới `getCurrentPageBounds()` để không đè.

## State & sync

- Canvas persist **local** qua `persistenceKey="misk-studio"`.
- ⏳ **Chưa có realtime sync** — để team chung một board thật cần tldraw sync hoặc backend store (xem [Roadmap](./studio-competitor#cần-làm-gì)).

## Token metering & admin (`/admin`)

ARK cho 500k free token/model → mọi call phân tích **metered**, model chạm cap thì **chặn** (không bao giờ bị charge).

- `lib/usage.ts` — store file-backed (`.data/ark-usage.json`, gitignored), ghi tuần tự qua promise-chain để 6 chuyên gia chạy song song không đạp file; `withinCap()` guard trước mỗi call.
- `GET /api/usage` → snapshot (per-model totals + log), gated `STUDIO_PASSWORD`.
- `/admin` → bảng per-model (used/remaining/% quota/calls/cached) + log từng call, refresh 5s.

## Stack

- Next.js 15, React, TypeScript (strict, `tsc --noEmit` sạch)
- tldraw (canvas SDK) — production cần license key (free tier có watermark)
- Theme: neumorphism token dùng chung với Whip (`app/globals.css`)
