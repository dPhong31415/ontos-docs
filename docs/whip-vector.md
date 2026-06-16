---
id: whip-vector
title: Vector SOP — Procedural Shape Engine
sidebar_label: ✏️ Vector (SOP)
sidebar_position: 13
---

# Vector SOP — Procedural Shape Engine

> Lõi tạo & sửa **vector shape** của Whip. Triết lý Houdini: **hình KHÔNG phải dữ liệu tĩnh, hình là KẾT QUẢ của một chuỗi operator**. Pen vẽ tay, kéo bezier, Repeater, Trim — tất cả là **node** trên cùng một graph, non-destructive, parametric.

---

## Vì sao viết doc này (chẩn đoán hướng cũ)

Trạng thái trước doc này (xem `whip-vector-tool` memory + `current.md`):

- `schema/project.ts → clip.shape` chỉ có primitive **chết** (`rect/ellipse/line/background`, mỗi cái chỉ `fill`+gradient) và `path` = `paths: { d: string, fill }[]` **read-only** trace từ ảnh BytePlus (`vectorizeCore.ts`).
- Hướng đã đi: `shape gradient` + `addPainStack` template + `PainStackEditor` → **nhảy thẳng tới template, bỏ qua lõi tạo hình**.

Gốc rễ sai: **chuỗi SVG `d="M.. C.."` là format để RENDER/EXPORT, không phải để EDIT.** Không ai (AE/Figma/Illustrator/Cavalry) lưu path bằng `d` string để chỉnh. Vì model sai nên không thể có pen / sửa bezier / procedural. Đây là thứ phải **làm chuẩn 1 lần** (CTO mandate · `do-it-right-once`).

---

## SOTA-2026 đã research (benchmark trước khi build)

| Hệ | Mô hình geometry | Bài học áp cho Whip |
|---|---|---|
| **Houdini SOP** | Geometry = points/vertices/primitives, mỗi element mang **attributes** (pos, normal, weight…) chảy qua mọi node. Node = pure transform. Sửa tay = **Edit SOP** (lưu delta, vẫn non-destructive). | Lõi: Geometry chảy qua DAG; **pen-edit cũng là node** (Edit node lưu delta), không phá upstream. |
| **Cavalry** | Node graph 2D: generators / transformers / animators / **effectors** (falloff-driven nhân bản). Fully procedural, JS API drive param. | Taxonomy node 2D + param **drivable** (audio/semantic/expression) = trục moat. Analog thương mại gần nhất đã chứng minh chạy real-time. |
| **Blender Geometry Nodes** | Phân biệt **control points** (Bézier handle) vs **evaluated points** (resample). Attributes = **fields** per-element drivable. | Giữ parametric (control points) ở upstream, **evaluate/flatten** ở downstream → cache được. |
| **Rive** | Runtime vector + state machine, chạy nhẹ trên web/mobile. | Khả thi browser; tách *authoring model* khỏi *runtime tessellation*. |

**Kết luận**: cả 4 hội tụ ở "geometry chảy qua operator, parametric, non-destructive". Whip làm **thông minh hơn** (mandate `benchmark-smarter`) ở chỗ param/attribute **drive được bằng semantic graph + agent** — cái Illustrator/Cavalry không có.

---

## Reuse — KHÔNG đẻ impl song song (mandate `systematic-reuse`)

Backend Elixir `Ontos.NodeGraph` (xem `.ai/domains/core-engine.md`) **đã định nghĩa luật node**:

> Node = pure transform `(input, params) → output` · side-effect chỉ ở **Sink** node cuối · ID = UUID v4 · cycle-detection compile-time · node KHÔNG tự spawn.

**Vector SOP theo ĐÚNG luật node đó** — coi như cùng một họ engine, nhất quán mental-model. **Khác biệt sống còn**: vector SOP graph chạy **CLIENT-SIDE** (trong browser, đánh giá ngay trên main/worker thread, render PixiJS).

> ⚠️ **Moat #2 + #5**: editing vector **KHÔNG được roundtrip Elixir mỗi frame**. Elixir DAG lo pipeline nặng (ingest/proxy/export); vector SOP graph lo authoring zero-latency. Cùng *luật*, khác *nơi chạy*.

Zod schema (`project.ts`) mirror struct thủ công — giữ nguyên quy ước hiện có.

---

## Geometry — kiểu dữ liệu chảy giữa các node

Đây là "value" duy nhất truyền dọc graph (như `VEX geometry` của Houdini, rút gọn cho 2D):

```typescript
// 1 anchor point: vị trí + 2 tay bezier (in/out) tương đối anchor.
// Tay = [0,0] → góc nhọn (corner). Tay ≠ 0 → smooth. Đây là format ĐỂ EDIT.
interface VEdge { x: number; y: number }          // delta tương đối anchor
interface VPoint {
  p:   [number, number];                            // vị trí (composition-space)
  in:  VEdge;                                        // tay bezier vào  (mặc định {0,0})
  out: VEdge;                                        // tay bezier ra   (mặc định {0,0})
  attrs?: Record<string, number>;                   // per-point attribute (radius, weight…) — drivable
}

interface VPath {
  closed: boolean;
  points: VPoint[];
  attrs?: Record<string, number | string>;          // per-path attribute (fillId, z-order…)
}

// Geometry = nhiều path + attribute toàn cục (detail domain của Houdini).
interface Geometry {
  paths: VPath[];
  bbox?: [number, number, number, number];          // cache, recompute khi dirty
  attrs?: Record<string, number | string>;          // detail attribute
}
```

**Hai domain (theo Blender)**: *control representation* = `VPoint` (anchor + tangent, ít điểm, để edit/parametric). *evaluated representation* = polyline đã flatten (nhiều điểm, để tessellate/render) — **sinh ra khi cần, không lưu trong model**.

`d` string SVG chỉ còn ở **2 biên**: import (`ImportSVG` node parse `d` → `Geometry`) và export/serialize. Không bao giờ là model edit.

---

## Node taxonomy (4 lớp)

Mỗi node: `eval(inputs: Geometry[], params) → Geometry`. Appearance node là Sink (gắn fill/stroke, không đổi geometry tiếp).

### 1. Sources (sinh Geometry, không input)
| Node | Params | Ghi chú |
|---|---|---|
| `Pen` | `points: VPoint[]`, `closed` | Pen tool đẻ ra. Source-of-truth khi vẽ tay. |
| `Rect` | `w, h, cornerRadius` | **Parametric sống** — đổi radius hình tự đổi, không bẻ điểm. |
| `Ellipse` | `rx, ry` | |
| `Polystar` | `points, innerR, outerR, kind:star\|poly` | (Cavalry/AE star) |
| `ImportSVG` | `d[], viewBox` | **Migrate** `clip.shape.paths` cũ. Trace BytePlus đổ vào đây. |

### 2. Edit (sửa tay non-destructive — Houdini Edit SOP)
| Node | Params | Ghi chú |
|---|---|---|
| `Edit` | `deltas: { pointIdx, dp, din, dout }[]` | Kéo anchor/handle trên canvas → lưu **delta** lên input geometry. Đổi upstream vẫn giữ ý đồ sửa. Đây là cách "vẽ tay" sống chung với "procedural". |

### 3. Modifiers (biến đổi Geometry — trục procedural = moat)
| Node | Params | "Thông minh hơn" |
|---|---|---|
| `Repeater` | `count, transform/step (pos/rot/scale), opacityStep` | count drivable bằng số entity semantic ("nhắc 3 ý → 3 bản"). |
| `TrimPath` | `start%, end%, offset` | start/end drive bằng audio/beat → path vẽ chạy theo nhịp. |
| `RoundCorners` | `radius` | |
| `Offset` | `amount, join` | outline/inline path. |
| `ZigZag` / `Wiggle` | `amp, freq, seed` | amp drive bằng energy curve (`styleGraph`). |

### 4. Appearance (Sink — gắn vẻ ngoài)
| Node | Params |
|---|---|
| `Fill` | `kind: solid\|gradient\|none`, `color`/`gradient{from,to,angle}` (reuse `makeGradient` chung với text/shape cũ) |
| `Stroke` | `color, width, cap, join, dash[], align: center\|inner\|outer` |

> Stroke thật (cap/join/dash/align) hiện CHƯA có cho shape (chỉ text có `stroke`+`strokeWidth`). Đây là parity tối thiểu phải đạt.

---

## Param drivable = nơi cắm moat

Mỗi param/attribute có thể là **giá trị tĩnh** hoặc **binding**:

```typescript
type Param<T> = { v: T } | { drive: Driver };
type Driver =
  | { kind: "keyframe"; keys: Keyframe[] }           // như clip animation hiện có
  | { kind: "audio";    feature: "rms"|"beat";  map: [number,number] }
  | { kind: "semantic"; query: string }              // entity-hit count, sentiment… (Moat #1)
  | { kind: "expr";     code: string };              // Cavalry-style JS (sandboxed)
```

- **Moat #1 (Semantic Graph)**: `Repeater.count = semantic("✗ pain items")` → graphic tự khớp số ý.
- **Moat #3 (Agent/MCP)**: graph = danh sách node có schema → agent thêm/sửa node = tool call (xem §Action Surface).
- **Moat #4 (Style Graph)**: amp/freq/ease học từ fingerprint creator.

---

## Evaluation & Perf (Moat #5 — đo, không regress 60fps)

**Pipeline mỗi node**: `Geometry → (flatten bezier adaptive) → earcut tessellate → triangles → PixiJS`.

Research perf (PixiJS): tessellation dùng **earcut** (~5× nhanh hơn libtess); bezier **flatten adaptive**; `cacheAsTexture` cho graphics tĩnh.

**Chiến lược "do it right once":**
1. **Dirty-subtree recompute** — mỗi node cache `Geometry` output. Đổi param node X → chỉ re-eval **X và downstream**, không cả graph. (DAG topo-order, memo theo `(nodeId, paramHash, inputHash)`.)
2. **Cache tessellated geometry** — triangles cache theo geometry hash; chỉ re-tessellate path dirty.
3. **Static → `cacheAsTexture`** — shape không có driver động ⇒ bitmap cache, 0 chi phí/frame.
4. **Driven param** — chỉ node có `drive` mới re-eval theo thời gian; phần graph tĩnh đứng yên.
5. **Bounded eval** — graph > N node hoặc tessellate > T ms ⇒ degrade (skip flatten chi tiết) + log `perfMonitor`. Tay người KHÔNG bao giờ làm graph nặng tới mức treo; agent sinh graph phải qua cùng guard.

> Quyết định: vector eval chạy **main thread** cho tới khi đo thấy chạm budget; nếu vượt → đẩy tessellation sang worker (geometry là plain struct, transferable). Đo trước khi tối ưu — không đoán.

---

## Editor Architecture — tool-based + dual-mode (Phong chốt 17/06)

> **Sửa hướng lớn**: bản P1 đầu tiên làm "pen DÍNH LIỀN shape" (chọn pen = vừa tạo vừa sửa 1 clip) — SAI.
> Editor vector thật = **hệ tool** (Photoshop/Illustrator) + **2 mode/layer** (Blender Object/Edit). Pen chỉ là MỘT tool.

### A. Tool model (thanh công cụ — global `activeTool`)
Như Photoshop: 1 thanh tool dọc cạnh viewport. `activeTool` là state global, không thuộc 1 clip.

| Tool | Phím | Việc |
|---|---|---|
| **Pointer** (move) | `V` | Object mode: click chọn layer; kéo thân = move; kéo bbox handle = scale/rotate. Áp cho MỌI layer (video/text/shape). |
| **Direct Select** | `A` | Sub-select: chọn & kéo từng anchor/edge (mũi tên trắng Illustrator) = vào Edit mode. |
| **Pen** | `P` | Vẽ/sửa bezier. Click canvas trống → **tự tạo shape layer mới** rồi vẽ. Click segment = thêm anchor; Alt = Convert Point. |
| **Lasso** | `Q` | Quét tự do chọn nhiều anchor (edit) hoặc nhiều layer (object). |
| **Hand** | `H` / giữ `Space` | Pan viewport (đang có ở `useViewport`). |

> Pen ≠ shape. Pen là tool; vẽ thì SINH RA shape layer. Đây là điểm sửa cốt lõi so với bản cũ.

### B. Hai mode mỗi layer (Blender Object ↔ Edit; `Tab` đổi)
Phong gọi "đang vẽ = SOP, xong ra có bounding box". Đính chính tên cho doc chuẩn: Houdini **SOP = mức sửa geometry = Edit mode**; cái có bbox lúc xong = **Object mode** (KHÔNG phải VOP — VOP là node shader VEX). Adopt đúng ý, đặt đúng tên:

- **Object mode** *(mặc định, mọi layer)* — **bounding box** quanh cả layer. Pointer/Hand nắm đâu kéo cũng đi (như clip video). Gizmo scale 4 góc + xoay (tái dùng `ViewportGizmo` hiện có, mở rộng cho cả anchor-point).
- **Edit mode (SOP)** *(chỉ shape)* — hiện anchor + handle, sửa geometry. Vào bằng: double-click shape, `Tab`, hoặc chọn Pen/Direct-Select khi đang chọn shape.

### C. Selection mode trong Edit (Blender `1`/`2`/`3`)
- `1` **Point** (vertex) — chọn/di anchor.
- `2` **Edge** (segment) — chọn/di 1 đoạn bezier (kéo cong cả đoạn).
- `3` **Face** (subpath/fill region) — chọn cả path con kín.
2D map thẳng. Thứ tự làm: Point → Edge → Face.

### D. Modal transform kiểu Blender (`G`/`S`/`R`)
Selection (anchor đang chọn ở Edit, hoặc cả layer ở Object) → bấm:
- `G` grab/move · `S` scale · `R` rotate → **di chuột áp realtime**, `X`/`Y` khoá trục, click/`Enter` chốt, `Esc`/phải huỷ.
- Pivot = anchor-point của layer (Object) hoặc median các anchor chọn (Edit).

Đây là moat UX: **chưa editor web nào có modal-transform kiểu Blender**. Nhanh hơn hẳn kéo handle chuột.

### E. Anchor-point (pivot) cho MỌI layer type — AE-style
Mỗi clip thêm `anchorPoint: [x,y]` (mặc định [0,0] = tâm). Scale/rotate xoay quanh nó; handle anchor (vòng tròn chữ thập) kéo được ở Object mode. **Cross-cutting**: đụng `ClipProperties` + transform trong `compositor.applyTransforms` (hiện pivot cứng ở tâm) → ảnh hưởng text/video/shape. Foundational → làm 1 pass riêng, cẩn thận.

### F. Photoshop handle parity (so PS — bù cái thiếu)
Bản P1 cũ **thiếu**: phải bổ. Model anchor cần `handleType`:
| Hành vi PS | Whip |
|---|---|
| Click = corner; click-drag = smooth (handle đối xứng) | ✅ có |
| **Alt-drag 1 handle = bẻ gãy** (2 bên độc lập, persist) | ❌ → thêm: anchor `broken`, lưu trạng thái (ko chỉ live-mirror) |
| **Alt-click anchor = convert** smooth↔corner | ❌ → thêm Convert Point |
| **Click segment = thêm anchor**; Alt-click anchor = xoá | ❌ → thêm add/remove on path |
| Rubber-band tới con trỏ | ✅ có |

### G. Stack/DAG (procedural) — giữ nguyên §trên
Tool/mode ở trên là lớp **edit hình**; stack operator (Source→Modifier→Appearance) là lớp **procedural**. Hai lớp trực giao: Edit mode sửa Source (pen), panel sửa Modifier. Model DAG không đổi; UI bước đầu = stack tuyến tính.

---

## Migration (backward-compat, không phá project cũ)

`clip.shape` (project.ts) tiến hoá:

```
clip.shape.kind = "rect"|"ellipse"|"line"|"background"   → giữ, coi như shorthand 1 Source + 1 Fill node
clip.shape.kind = "path" + paths[] + viewBox             → migrate: 1 ImportSVG node + 1 Fill node
clip.shape.graph?: VectorGraph                            → MỚI: { nodes: VNode[], edges: VEdge[] }
```

- Project cũ không có `graph` ⇒ render path đúng như hiện tại (đường lùi).
- Khi user mở vector tool trên shape cũ ⇒ lazy-build `graph` từ primitive/paths (một lần).
- `vectorizeCore.parseSvgPaths` giữ nguyên — chỉ đổi đích: output đi vào `ImportSVG` node thay vì `clip.shape.paths` trực tiếp.

---

## Action Surface & MCP (Moat #3 — agent điều khiển được)

Vector graph là **Target hạng nhất** trong `actionSurface.ts`. Capability `graphics.vector` (đã liệt kê "chưa register" trong `current.md`) expose qua cùng 3 cửa (right-click / Cmd+K / panel) + MCP tool:

```
vector.addNode(target, kind, params)
vector.setParam(target, nodeId, key, value|driver)
vector.connect(target, fromId, toId)
vector.editPath(target, nodeId, deltas)        // pen/handle edit qua agent
```

→ Cùng một graph mà **tay người và agent thao tác**. `addPainStack` cũ trở thành **một preset graph** (Pen/Rect + Repeater + Fill/Stroke), không phải code template cứng.

---

## Phạm vi (chốt lại 17/06 — kiến trúc tool/mode)

**Đã có (P0, cần sửa lỗi):** geometry type + SOP eval + Repeater + render earcut + fill/stroke + pen sơ khai. → giữ engine, **làm lại lớp interaction** theo tool/mode.

| Phase | Nội dung | Trạng thái |
|---|---|---|
| **P1a — Fix + nền tool** | Sửa lỗi self-review (toạ độ retina dùng `canvas.width`; rebuild incremental ko full setProject; undo gesture nonce; theme token). Dựng **tool model** (`activeTool` + thanh tool Pointer/Pen/Hand) + **dual-mode** (Object bbox ↔ Edit). | ⏳ tiếp theo |
| **P1b — Edit hoàn chỉnh** | Direct-Select; Photoshop handle parity (§F: break/convert/add/remove); selection mode Point (`1`). | |
| **P1c — Modal + anchor-point** | Modal `G/S/R` (+ X/Y) ở cả 2 mode; **anchor-point cho mọi layer** (§E, pass cross-cutting riêng). | |
| **P2 — Procedural** | Modifier stack đầy (Trim/RoundCorners/Offset/ZigZag) + driver (audio/keyframe/semantic). Edge/Face select. | |
| **P3 — Agent** | `graphics.vector` capability + MCP tool → agent author. `addPainStack` → preset graph. | |
| **P4 — DAG UI + reference** | Node-graph UI (multi-input/boolean) + match-from-reference thay nhánh trace; migrate `paths` → ImportSVG. | |

> Nguyên tắc: **engine SOP đứng yên**, mọi việc còn lại là lớp editor (tool/mode/selection/transform). Không đẻ impl rect/ellipse song song — nút shape cũ phải hội về cùng vector source (xoá lỗi 2 impl trong self-review).

---

## Liên kết
- `whip-data-model.md` — Geometry/VectorGraph thêm vào OntologyGraph.
- `whip-action-surface.md` — `graphics.vector` capability + Target.
- `whip-moat.md` — trục procedural+semantic+agent là moat của vector.
- `.ai/domains/core-engine.md` — luật node (pure transform) mà vector SOP tuân theo.
