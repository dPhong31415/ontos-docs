---
id: studio-lab
title: Recipe Lab
sidebar_label: 🔬 Recipe Lab
sidebar_position: 4
---

# 🔬 Recipe Lab — ảnh mẫu → recipe → variation

> **Một câu:** Thả một ảnh mẫu vào, một panel **chuyên gia** đọc nó thành **recipe có cấu trúc**, recipe compile ra **prompt chuẩn** (lint chứng nhận), rồi gen **N variation** từ prompt đó.

Đây là use-case lõi của Phong: *"phân tích recipe từ hình mẫu → dùng prompt chuẩn để gen nhiều variation"*. Lab **không phải một đống field nhập tay** — nhập tay chỉ là tầng chẩn đoán nâng cao bên dưới.

---

## Flow

```
ảnh mẫu  →  CHUYÊN GIA đọc ảnh   →  recipe   →  compile  →  prompt chuẩn  →  gen N variation
(CØSÚ)      (system prompt/expert)   (struct)     +lint      (đã chứng nhận)
   ①                ②                  ③                          ④
```

1. **Thả ảnh mẫu.**
2. **① Phân tích** — chọn các chuyên gia → mỗi chuyên gia (1 system prompt) đọc ảnh, trả JSON phần recipe mình phụ trách; hệ thống merge thành 1 recipe.
3. **③ Recipe** tự điền (sửa được) → `compileRecipe` ra prompt chuẩn → `lintPrompt` chấm điểm chứng nhận đã theo guideline model.
4. **② Gen N variation** — chạy prompt chuẩn đó N lần độc lập → lưới biến thể trên canvas.

---

## Chuyên gia (analyst registry)

Image → Recipe **không phải một prompt khối**. Là một panel **chuyên gia**, mỗi người một `systemPrompt` model-agnostic, phụ trách một lát recipe (`lib/analysts.ts`):

| Chuyên gia | Phụ trách field | Đọc ảnh ở góc độ |
|---|---|---|
| 🎯 Brand strategist | `subject`, `style` | artefact là gì + art direction |
| 📐 Layout architect | `layout` | bố cục: số section/row/grid, lockup, đếm cụ thể |
| 🎨 Color scientist | `palette` | trích HEX, sáng→tối |
| 🔤 Typographer | `typography` | serif/sans, contrast, monogram |
| ✍️ Copy extractor | `textTokens` | mọi cụm chữ, verbatim, trong ngoặc kép |
| 💡 Lighting & render | `lighting`, `technical` | ánh sáng + chất render |

Tách theo chuyên gia → field yếu (vd palette) **chạy lại riêng** được, và mỗi prompt **tập trung** (prompt tập trung ≫ một prompt ôm hết). Đây là **cùng bản chất** với [Operator registry](./studio-operators): thư viện system prompt gắn vào *bất kỳ* LLM/VLM. Hai nửa của một ý:

- **Operators** = system prompt cho *hành động* (gen/edit) — paper §3.3
- **Analysts** = system prompt cho *phân tích* (ảnh → recipe)

### Model phân tích: Seed multimodal (ARK) + free-quota guard
`/api/analyze` chạy các chuyên gia song song qua endpoint chat OpenAI-compatible của ARK (`lib/providers/arkVision.ts`), model **`seed-1-6-250915`** (Doubao Seed — đọc ảnh → text; đã verify với chính board CØSÚ).

- **Key riêng cho phân tích** (`ARK_ANALYSIS_API_KEY`) — key này có **500k free token/model**; gen ảnh vẫn dùng `SEEDREAM_API_KEY`.
- **`thinking: { type: "disabled" }`** — tắt chain-of-thought (extraction không cần) để khỏi đốt free token; reasoning_tokens về 0.
- **Cap cứng để không bao giờ bị charge**: mỗi call metered, model chạm `ARK_FREE_CAP` (500k, trừ buffer) → analysis **bị chặn**. Số liệu lưu `.data/ark-usage.json`.
- Thực đo: 1 lần phân tích board = 6 chuyên gia ≈ **9.7k token** (~1.6k/chuyên gia) → ~51 lần phân tích trong free quota.

> ⚙️ Vì sao không phải `skylark-vision`: account này không expose skylark-vision cho chat; `seedream/seedance` là gen-only. Model đọc-ảnh-trả-text là họ **Seed** (`seed-1-6`, `seed-2-0`).

### Admin dashboard — `/admin`
Bảng theo dõi token/model (đã dùng · còn lại · % quota · calls · cached · lần cuối) + **log từng call** (operator nào, bao nhiêu token). Tự refresh 5s. Gated bằng `STUDIO_PASSWORD` nếu set. API: `GET /api/usage`.

---

## Recipe schema

```ts
interface Recipe {
  subject: string; style: string; layout: string;
  palette: string[];      // hex chips
  typography: string;
  lighting: string; technical: string;
  textTokens: string[];   // text PHẢI render — mỗi cụm ≤5 chữ
}
```

### Prompt compiler — recipe → prompt chuẩn
`compileRecipe(recipe, version)` deterministic. **4.x**: thứ tự nghiêm `subject→style→composition→lighting→technical`, 30–100 từ. **5.0**: reasoning-forward, diễn đạt ý đồ, chi tiết dài có lợi.

### Linter — chứng nhận prompt
`lintPrompt` ra điểm 0–100 + cờ theo guideline thật (text trong ngoặc kép, mỗi cụm ≤5 chữ, >6 cụm → cảnh báo nên ráp canvas, có ngôn ngữ layout, phạt từ sáo). Điểm cao = "prompt chuẩn" để nhân variation.

---

## Tầng chẩn đoán nâng cao (ẩn) — tách 3 biến

Khi variation vẫn xấu, mở `details` để truy *vì sao*. Ablation cố định 2 biến, đổi 1:

| Test | Giữ | Đổi | Kết luận |
|---|---|---|---|
| **M – model** | golden prompt + ảnh mẫu (ref-probe) | — | ref-probe xấu → trần model |
| **P – prompt** | cùng ý | golden vs recipe trích | golden ≫ recipe → lỗi prompt |
| **S – suggestion** | template chuẩn | đổi recipe | recipe hay render đẹp |

Ma trận: hàng = `golden`/`recipe`/`ref-probe`, cột = provider. Đọc xuống cột = cô lập prompt; đọc ngang hàng = cô lập model.

---

## Nguồn guideline (verified 06/2026)

- Seedream 4.x ordering & 30–100 từ — [fal.ai](https://fal.ai/learn/devs/seedream-v4-5-prompt-guide)
- Text rendering (quotes, ≤5 chữ, font, ≥2K) — [evolink.ai 2026](https://evolink.ai/blog/seedream-prompt-guide-best-practices-2026)
- Seedream 5.0 reasoning-forward — [BytePlus Seed blog](https://seed.bytedance.com/en/blog/deeper-thinking-more-accurate-generation-introducing-seedream-5-0-lite)
- Capability taxonomy §3.3 — *Seedream 4.0*, arXiv:2509.20427v3
