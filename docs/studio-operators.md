---
id: studio-operators
title: Operator Surface
sidebar_label: 🎯 Operator Surface
sidebar_position: 3
---

# 🎯 Operator Surface — đừng bắt user prompt

> **Một câu:** Thay vì gõ prompt, user **chọn ảnh/vùng trên canvas → click operator**. Mỗi operator mang sẵn một *system prompt model-agnostic* (theo paper Seedream §3.3), gắn vào model nào cũng chạy.

Mượn đúng kiến trúc **Action Surface của Whip**: `Target` + `capability registry` + 3 cửa (context-menu / Cmd+K / panel) = danh sách MCP tool. Xem [[whip-action-surface]].

---

## Vì sao operator, không phải prompt

Ngay cả Seedream 4.5 (model rất mạnh) cho **kết quả prompt-based vẫn chán** nếu user phải tự nghĩ ra prompt. Vấn đề không phải model — mà là **bắt user làm prompt-engineer**. Operator đảo lại:

```
Cũ:  user nghĩ prompt  → model      → (hên xui)
Mới: user chọn vùng    → operator    → system prompt chuẩn  → model  → (ổn định)
        (canvas)          (1 click)     (đã tune, cache)
```

Ví dụ: muốn xoá vật gì → **khoanh nó trên canvas → click `Remove`** → xong. Không gõ chữ nào.

---

## Taxonomy = paper Seedream §3.3

Operator **không bịa** — lấy thẳng từ paper *Seedream 4.0* (arXiv:2509.20427v3) §3.3 "Inspire Creativity", tức đúng những capability model được post-train. Menu bám vào đây → luôn chạy trên *thế mạnh* model, không đấu với trần của nó.

| Nhóm (UI) | Paper | Operator | Input canvas | Model làm được |
|---|---|---|---|---|
| ✏️ Precise edit | §3.3.1 | Remove · Replace · Modify · Replace background | 1 ảnh / vùng | Seedream · OpenAI · Gemini |
| 🪞 Reference | §3.3.2 | Restyle from reference | 1 ảnh | Seedream · OpenAI · Gemini |
| 📐 Visual signal | §3.3.3 | Generate from sketch/pose/depth | 1 ảnh (control) | **Seedream** (native ControlNet) |
| 🧠 Reasoning | §3.3.4 | Reason & continue | 1 ảnh | **Seedream** |
| 🧩 Multi-image | §3.3.5 | Compose multiple images | ≥2 ảnh | Seedream · Gemini |
| 🎞 Sequence | §3.3.6 | Consistent set / sequence | 1 ảnh / none | **Seedream** |
| 🔤 Text & layout | §3.3.7 | Text layout / poster · Edit text in image | none / ảnh | Seedream · Gemini |
| 🖼 Format / 4K | §3.3.8 | Upscale to 4K / recompose | 1 ảnh | **Seedream** |

> Cột "model làm được" là **bộ lọc thật**: `operatorsFor(target, model)` chỉ hiện operator model đó kham được. Seedream phủ trọn §3.3 (unified model); OpenAI/Gemini phủ edit/reference/compose nhưng không control/reason/sequence.

---

## System prompt model-agnostic + cache

Đây là điểm Phong nhấn: **Lab không phải một đống recipe field** — mà là **thư viện system prompt** gán được vào *bất kỳ* model (ark model có sẵn, hay LLM khác làm prompt-engineer), không khoá vào Claude.

```ts
interface Operator {
  id: string;
  group: OperatorGroup;          // 8 nhóm §3.3
  paperRef: string;              // "§3.3.1" — provenance hiện trên UI
  models: ProviderId[];          // model nào kham được
  accepts: (t: Target) => boolean;
  systemPrompt: string;          // ★ model-AGNOSTIC, đã tune
  buildPrompt: (args, t) => string; // user gõ vài chữ, KHÔNG phải prompt
  hint: string;                  // best-practice 1 dòng
  usesImages: boolean;
}
```

- `systemPrompt` được **cache theo content-hash** (`cachedSystemPrompt`) → chạy lại trên model khác không tính lại, executor dedupe response theo key ổn định.
- Image-gen API không có "system role" riêng → API route **prepend** systemPrompt vào instruction. Khi đổi sang backend chat-style (LLM khác), cùng field map thẳng vào `system`.

## Target — selection trên canvas

```ts
type TargetKind = "none" | "region" | "image" | "multi";
interface Target { kind; imageUrls?; region?; baseImageUrl?; }
```

`resolveTarget` đọc selection tldraw → 1 hình dạng (poll nhẹ 250ms, chỉ re-render khi đổi). Operator không bao giờ chạm tldraw trực tiếp — y hệt nguyên tắc reuse-selection của Whip.

## 3 cửa (hiện trạng & kế hoạch)

| Cửa | Trạng thái |
|---|---|
| **Panel** (menu nhóm theo §3.3) | ✅ xong (mode Lab) |
| **Right-click context menu** | ⏳ — đọc cùng `operatorsFor(target)` |
| **Cmd+K palette** | ⏳ — cùng registry |
| **MCP tool list** (cho agent ontos) | ➡️ registry chính là tool list, expose sau |

---

## Định nghĩa Done (mỗi operator)

Theo chuẩn operator-DoD của hệ Whip:

1. **Khớp capability paper** — có `paperRef` §3.3.x.
2. **System prompt tune đúng** — imperative, model-agnostic, giữ "preserve the rest" cho edit.
3. **accepts đúng** — chỉ hiện khi selection hợp lệ.
4. **Best-practice hint** — 1 dòng hiện dưới nút.
5. **Lọc model thật** — không hiện operator model không kham.

## Nguồn

- Seedream 4.0 §3.3 Inspire Creativity — *arXiv:2509.20427v3* (10/12/2025)
- Action Surface pattern — [[whip-action-surface]]
