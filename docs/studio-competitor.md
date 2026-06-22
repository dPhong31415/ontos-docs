---
id: studio-competitor
title: Đối thủ & Roadmap
sidebar_label: 🔍 Đối thủ 2026 & cần làm gì
sidebar_position: 5
---

# 🔍 Đối thủ 2026 & cần làm gì

Research thị trường canvas-AI sáng tạo tới **06/2026**, đối chiếu với use-case lõi của MÍSK (brand board / layout nhiều vùng cho team).

---

## Bản đồ đối thủ

| Tool | Định vị | Mạnh nhất | Liên quan MÍSK |
|---|---|---|---|
| **Adobe Firefly Boards** | Canvas team, multi-model | Tích hợp sẵn Firefly + Flux, Gemini 2.5 Flash Image (Nano Banana), Veo3, Runway Aleph, Luma Ray3, Pika; select→**remix**, Describe Image, Generative Text Edit; realtime collab; 30+ ngôn ngữ; commercial-safe | **Đối thủ nguy hiểm nhất** — chính là pitch "team canvas nhiều model" của MÍSK, do Adobe làm |
| **Krea** | Realtime canvas | **Real-Time Canvas** (vẽ tới đâu gen tới đó), 30M user, Krea 1, 1000+ style | Moat realtime — không nên đối đầu trực diện |
| **Recraft V4** | Brand asset cho designer | **Vector SVG thật**, **Brand Kit** (3–5 ảnh ref → style tái dùng), style consistency, mockup generator, node workflow (beta) | Trực tiếp đụng use-case brand board |
| **Flora** | "Creative environment" | Canvas node, inpaint/outpaint, review với client | Canvas team sạch |
| **Lovart** | AI Design **Agent** | Lập + thực thi nguyên workflow design từ text → output trong canvas chung | Hướng agentic MÍSK có thể nối với ontos agent |
| **Midjourney** | Thẩm mỹ + reference | **Omni-Reference** ("đặt CÁI NÀY vào ảnh"), Moodboard (trộn 5–10 ảnh), Style Reference `--sref` | Chuẩn mực điều khiển reference |

---

## Đọc ra điều gì

1. **Multi-model trên canvas team đã là table-stakes** — Firefly Boards làm rồi, ở quy mô Adobe. MÍSK *không thắng* bằng "có nhiều model".
2. **Reference / remix là mặc định** — Firefly (select→remix), MJ (omni-ref), Recraft (Brand Kit). MÍSK mới vừa có đường ống `imageUrls`, **chưa có UX select-to-remix trên canvas**.
3. **Brand consistency là mặt trận của brand board** — Recraft Brand Kit & MJ `--sref` cho style tái dùng. MÍSK chưa có; nhưng **recipe schema chính là nền** để làm tốt hơn (style *có cấu trúc*, không phải hộp đen embedding).
4. **Không ai ráp layout có cấu trúc** — tất cả chỉ *remix/average* ảnh, không ai sinh-từng-phần-tử rồi *ráp brand board theo grid*. Đây là khoảng trống.
5. **Không ai có Diagnostic Lab** — tách suggestion/prompt/model là tính năng *chưa từng có*.

---

## Định vị thắng của MÍSK

> Đối thủ chơi **"one-shot + remix"**. MÍSK chơi **"Recipe có cấu trúc → ráp trên canvas"**, được kiểm chứng bằng **Diagnostic Lab**.

Hai thứ này khoá vào nhau: Lab chứng minh model không one-shot nổi brand board → đó chính là lý do tồn tại của ráp-trên-canvas; recipe schema vừa là input của Lab vừa là đơn vị tái dùng cho Brand Kit.

---

## Cần làm gì

Xếp theo đòn bẩy moat, không phải độ dễ.

### P0 — Khoá moat (làm trước)
1. **Compositional assembly** — sinh từng phần tử (wordmark / swatch / chip màu / mockup) **riêng**, ráp theo grid của `recipe.layout` trên tldraw. Đây là câu trả lời cho thứ model không one-shot nổi. *Khác biệt cốt lõi.*
2. **Recipe → Brand Kit** — đóng băng recipe đã chuẩn-lint thành "style tái dùng"; áp lên mọi phần tử để nhất quán. Vượt Recraft nhờ style *có cấu trúc, đọc được*, không phải embedding mờ.
3. **Select-to-remix trên canvas** — chọn ảnh/nhiều ảnh trên board → remix/biến thể (bắt kịp Firefly/MJ). Tái dùng đường `imageUrls` vừa thêm.

### P1 — Team thật
4. **Realtime sync** — tldraw sync / backend store để cả team một board (hiện chỉ local persist). Là lý do tồn tại của sản phẩm.
5. **Board agent (ontos)** — agent tự điền recipe + chạy compositional assembly từ một câu brief; nối với ontos agent/MCP. Đáp Lovart.

### P2 — Mở rộng
6. **Vector qua Whip** — xuất phần tử brand (logo/icon) sang vector bằng tool vector của Whip thay vì đua SVG với Recraft. Cross-link [whip-vector](./whip-vector).
7. **Lint = chứng chỉ** — recipe đạt lint ≥ ngưỡng + qua ablation → gắn nhãn "recipe certified", thành thư viện recipe của MÍSK (lock-in dữ liệu).

---

## Nguồn (06/2026)

- [Firefly Boards — Adobe Blog 09/2025](https://blog.adobe.com/en/publish/2025/09/24/firefly-boards-launches-globally-now-with-runway-aleph-moonvalley-marey-models-new-powerful-ideation-features-flexible-offers)
- [Krea realtime canvas & so sánh — Lovart](https://lovart.fyi/compare/lovart-vs-krea)
- [Recraft V4 brand assets — MindStudio](https://www.mindstudio.ai/blog/what-is-recraft-v4-ai-image-model-brand-assets)
- [Midjourney Omni-Reference — docs](https://docs.midjourney.com/hc/en-us/articles/36285124473997-Omni-Reference)
- [Flora AI review 2026](https://www.aitoolcurator.com/ai-tools/design-creativity/flora-ai/)
