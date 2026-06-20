---
id: whip-levels
title: Mô hình Tầng Trừu Tượng — Timeline 3D (SPINE)
sidebar_label: 🧠 Tầng trừu tượng (spine)
sidebar_position: 3
---

# Mô hình Tầng Trừu Tượng + Timeline 3D — doc xương sống của Whip

> **Trạng thái:** SPINE (la bàn lớn nhất, ngang `whip-moat.md`). Khởi tạo 20/06/2026 từ vision của Phong.
> **Một câu:** *Một video có nhiều TẦNG tư duy. Whip cho user nhảy giữa các tầng, sửa ở tầng phù hợp, và
> tầng semantic tự dàn lại sự phức tạp của tầng dưới.* Mọi feature Whip phải soi vào doc này: *"nó sống ở
> tầng nào? nhảy tầng có gãy không? sửa tầng trên thì tầng dưới có tự dàn không?"*

---

## 0. Vision gốc (Phong, 20/06)

> "Một video cần các layer abstraction khác nhau. 3D software làm tốt hơn 2D: chia vertex level / object
> level (Houdini SOP & OBJ). Photoshop/Illustrator luôn kẹt ở đơn vị nhỏ nhất = pixel & path. NLE thì kẹt ở
> cut → vô cùng manual. Whip đưa ra ontology là các lớp khác nhau: thấp nhất là cut, rồi semantic, rồi cao
> hơn. Timeline không chỉ 2D mà là 3D có các lớp, user nhảy giữa các level tư duy. Ở cut thì lo độ dài clip;
> lên semantic chỉ cần biết clip A cạnh clip B và mỗi clip nghĩa gì; tầng cao hơn là những clip ý nghĩa đứng
> cạnh nhau đem lại CẢM GIÁC gì. User kéo-thả đổi chỗ section nhanh gọn — dù tầng thấp là overlay phức tạp
> giữa background/foreground/sfx, semantic quản hết, user chỉ kéo thả thay chỗ."

Ẩn dụ hình ảnh Phong gửi: **exploded axonometric** (Tate Modern nổ tầng, ORE nổ lớp) — một vật thể bổ ra
theo tầng để thấy & thao tác từng lớp. Timeline Whip = vật thể đó.

### Vì sao 3D > 2D > NLE (luận điểm nền)
| Hệ | Đơn vị thấp nhất | Tầng trên | Hệ quả |
|---|---|---|---|
| Photoshop/Illustrator | pixel / path | (gần như không) | mọi thao tác ở đơn vị nhỏ nhất → manual |
| 3D (Houdini/Blender) | vertex / point | object, SOP↔OBJ, scene graph, LOD | **nhảy tầng tư duy** → mạnh & nhanh |
| NLE (Premiere/FCP/CapCut) | **cut** | (roles/compound = yếu, chỉ gom) | kẹt ở cut → manual như Photoshop của video |
| **Whip** | cut | **semantic → cảm giác** (ontology tầng) | sửa đúng tầng; semantic dàn tầng dưới |

> Whip = "đem mental-model 3D vào video". NLE đang ở thời Photoshop; Whip nhảy thẳng lên thời Houdini.

---

## 1. Các TẦNG (mapping vào ontology đã có)

> Quan trọng: phần lớn **đã có substrate trong `whip-data-model.md`** — `TemporalNode` lồng nhau
> (`CONTAINS`: chapter › section › moment) + `FOLLOWS` (A cạnh B) + anchor theo `wordId` (bền qua cut).
> Cái thiếu là **lôi các tầng này lên thành mặt-bằng-để-SỬA**, và **luật cascade khi reorder** (mục 3).

### Tầng 0 — CUT / FRAME (đã có)
- **Đơn vị:** clip, track, keyframe, transition, overlay (bg/fg/sfx/lower-third).
- **User nghĩ gì:** độ dài clip này, trim ở đâu, track nào đè track nào, transition gì.
- **Whip đã có:** timeline hiện tại, compositor, per-cut decode, vector tool (có **sub-tầng riêng**:
  Object ↔ Edit/vertex — xem `whip-vector.md`, đã chốt 17/06 → tiền lệ "nhảy tầng" trong Whip).

### Tầng 1 — SEMANTIC (substrate có, mặt-sửa chưa)
- **Đơn vị:** `TemporalNode` / `SemanticSpan` = **một Ý NGHĨA** (1 clip nói/ thể hiện điều gì).
- **User nghĩ gì:** "clip A (claim) đứng cạnh clip B (proof)", mỗi clip nghĩa gì — **KHÔNG** lo độ dài/track.
- **Substrate:** `FOLLOWS` (cạnh nhau), `CONTAINS` (lồng cấp), anchor `wordId` (đổi chỗ không vỡ tham chiếu).
- **Thiếu:** UI mặt-bằng semantic để kéo-thả khối ý nghĩa; reorder ở đây = thao tác chính của tầng này.

### Tầng 2 — CẢM GIÁC / BỐ CỤC (đang lên kế hoạch riêng)
- **Đơn vị:** chuỗi/section các ý nghĩa → **arc cảm xúc** & nhịp.
- **User nghĩ gì:** "hook → build → payoff này đem lại cảm giác gì? đủ căng chưa? dạng kể chuyện nào?"
- **Đây CHÍNH là `whip-archetype.md`** (đường cảm xúc + cut profile). Tầng 2 không phải ý mới — nó là mái
  của doc archetype. `curves.energy` = "cảm giác" đo được; archetype = hình dạng của tầng này.

> Vector (đồ hoạ) có nhánh tầng riêng (object ↔ vertex) chạy **song song**, gắn vào clip ở Tầng 0. Cùng
> triết lý "nhảy tầng", khác trục (đồ hoạ vs thời gian).

---

## 2. Timeline 3D — nhảy tầng MƯỢT (UI/UX) — phần quyết định sống còn

> Phong (20/06): "làm sao user nhảy giữa tầng MƯỢT. View kế bên timeline break tầng ra cho user tab giữa các
> view thì useful. KHÔNG chui rabbit hole như AE (comp parent → comp con = 1 cú nhảy mất ngữ cảnh). Mà comp
> con **display ngay chỗ parent**, như animator Nhật lật từng tờ frame so sánh. UX cho dạng one-of-a-kind này
> rất quan trọng — research SOTA."

### Tên học thuật của ý này (để bám SOTA, không sáng chế lại bánh xe)
| Ý của Phong | Tên SOTA | Bài học áp vào |
|---|---|---|
| "nhảy tầng = đổi độ phân giải tư duy" | **Semantic Zoom (ZUI)** — Pad++/Jazz. Nội dung đổi **về CHẤT** theo tầng, ko chỉ to/nhỏ. | Mỗi tầng render khác hẳn (section ↔ pill nghĩa ↔ clip), ko phải zoom hình. |
| "view kế bên + tab giữa các view" | **Overview + Detail** (linked views) | Mạnh, NHƯNG điểm yếu đã biết: user tốn sức *liên hệ 2 view*. Phải khử (xem dưới). |
| "comp con display ngay chỗ parent, KHÔNG rabbit hole" | **In-place / inline nested editing** (vs nested-modal anti-pattern) + **Focus+Context** | Bung tại chỗ (accordion/disclosure), đẩy hàng xóm xuống — KHÔNG mở màn mới. Esc thu. Như code folding. |
| "animator Nhật lật tờ so sánh" | **Onion-skinning** | Hé tầng kề bằng lớp mờ chồng tại chỗ → giữ ngữ cảnh khi peek. |
| "cảm giác leo lên/xuống mức trừu tượng" | **Bret Victor — Ladder of Abstraction** (tham chiếu khái niệm) | Leo thang trơn tru, ko teleport; luôn thấy bậc kề. |

### Thiết kế chốt (gộp 5 cái trên, khử điểm yếu overview+detail)

**Trục đứng = mức trừu tượng, trục ngang = thời gian (CHUNG).** Đây là chìa khoá: 3 view tầng **xếp chồng,
DÙNG CHUNG trục thời gian X + chung playhead**. Ba đọc dọc xuống = cùng một khoảnh khắc ở 3 mức trừu tượng.
Chính là **exploded axonometric** (ẩn dụ Tate/ORE của Phong) nhưng "nổ" theo trục trừu tượng. → khử điểm yếu
"khó liên hệ 2 view" của overview+detail: chúng **thẳng hàng theo thời gian**, ko phải 2 cửa sổ rời.

- **Mặc định:** 1 tầng "đang lái" chiếm chính + dải mỏng tầng trên & dưới (focus+context), cùng cột thời gian.
- **Tab/phím** đổi tầng đang lái → tầng cũ co thành dải mỏng, tầng mới nở ra (animate mượt, ko cắt cảnh).
- **Peek (giữ phím/hover):** onion-skin tầng kề hiện rõ tạm thời, thả ra về cũ → "lật tờ" so sánh.
- **In-place dive:** click 1 bundle ở Tầng 1 → **nở ngay tại chỗ** lộ track Tầng 0 của riêng nó, đẩy hàng xóm
  xuống; KHÔNG mở comp mới (chống bệnh AE rabbit hole). Chỉ bung cái đang đụng (progressive disclosure).
- **Liên kết cứng:** chọn 1 phần tử ở tầng nào → highlight đồng bộ ở mọi tầng (cùng anchor `wordId`) + playhead
  chung → mắt ko lạc.

> Whip hơn AE/DAW/NLE: AE = rabbit hole (modal dive); DAW = 2 view rời (arrangement↔clip, phải liên hệ tay);
> NLE = 1 tầng phẳng. Whip = **các tầng thẳng hàng thời gian, sửa-tại-chỗ, lật-so-sánh** — chưa ai làm cho video.

> ⚠️ Moat #5: chuyển tầng là animate UI nhẹ + đổi cách *vẽ* cùng dữ liệu graph (ko re-decode video) → ko đụng
> render loop. Đo khi build (đừng để tab tầng giật).

---

## 3. CASCADE — tim của moat (sửa tầng cao → tầng thấp tự dàn)

> Đây là khác biệt sống còn so với mọi thứ đang có. Adobe et al. mới làm "XEM theo tầng". Whip làm "SỬA ở
> tầng cao thì tầng thấp **tự re-resolve**". Lý do `semantic graph` (Moat #1) tồn tại để kiếm cơm.

**Bài toán:** user kéo đổi chỗ section X ↔ Y ở Tầng 1/2. Tầng 0 bên dưới phải tự dàn lại:
1. **Nhạc nền** — re-time theo độ dài section mới (ducking, beat-align lại).
2. **SFX / lower-third / caption** — gắn theo `wordId` → đi theo ý nghĩa, tự về vị trí mới (không lạc).
3. **B-roll** — cut profile + rules áp lại trên thứ tự mới (xem `whip-archetype.md` cascade rules).
4. **Transition giữa 2 mối nối mới** — chọn lại theo cặp role (hook→proof khác proof→cta).
5. **Đường cảm xúc** — recompute → báo nếu reorder làm hỏng arc ("payoff trước build → tụt căng").

**Cơ chế (bản chất):** *lan truyền ràng buộc trên graph* (constraint propagation) — giống Figma auto-layout
dàn lại khi đổi thứ tự, nhưng cho **video + thời gian + nhiều lớp media**. Mỗi phần tử tầng thấp **anchor vào
ý nghĩa** (`wordId`/spanId), không vào timestamp tuyệt đối → đổi chỗ ý nghĩa thì phần tử đi theo, rồi
**re-resolve** các tham số phụ thuộc lân cận (transition, ducking, nhịp).

**Vì sao NLE không làm được:** clip của họ chỉ có timestamp, không có "ý nghĩa" để mà đi theo → reorder = vỡ
mọi overlay, phải dàn tay. Whip có anchor semantic → cascade tự động khả thi.

**Agent (Moat #3):** mỗi cascade rule expose được làm MCP tool → agent "đổi chỗ proof lên trước" thì cả tầng
dưới tự dàn, đúng tinh thần `whip-action-surface.md`.

---

## 3b. Xử lý OVERLAP thực tế (Phong, 20/06): timeline 64 track thì cascade kiểu gì?

> Phản biện đúng nhất: production thật, overlap giữa hàng chục layer (V1..V64) rất khiếp. Nếu Tầng 0 loạn vậy
> thì "kéo semantic là tầng dưới tự dàn" nghe ảo. Trả lời thẳng — gồm cả giới hạn.

**Đặt lại vấn đề:** cái timeline 64 track đó là **căn bệnh Whip chữa**, không phải phản ví dụ. Nó manual kinh
khủng *chính vì* track là vị trí (V1..V64) không mang nghĩa, và không ai nest. Whip áp đúng kỷ luật mà editor
giỏi vẫn làm tay (pre-comp/nest) — nhưng **mặc định + tự động**.

**5 cơ chế để cascade sống được giữa overlap:**

1. **Bundle / nest theo nghĩa (cái "object" của mô hình tầng).** 64 track thật ra gom về **rất ít đơn vị
   nghĩa**: 1 "title animation" = 10 track text+shape+matte+adjustment; 1 "look" = adjustment phủ tất cả.
   Whip gói các track thuộc-cùng-một-ý-nghĩa thành 1 **semantic bundle** (như compound clip / Houdini subnet).
   Reorder = di chuyển **nguyên bundle**; overlap nội bộ niêm phong bên trong, đi theo atomically. Mess là
   *kỹ thuật*, không phải *khái niệm*.

2. **Lane theo ROLE, không theo track index.** Mỗi phần tử gắn role: spine / b-roll / caption / lower-third /
   SFX / grade / transition / nhạc. Cascade chạy **theo lane role**, không theo V-number. Tầng semantic chỉ
   hiện ~6 lane role thay vì 64 track. (FCP "roles" là nửa bước; Whip đẩy tới semantic.)

3. **Phân loại anchor → quyết cách dàn.** Không phải thứ gì cũng neo sạch vào 1 span. Ba nhóm:
   - *Neo vào nội dung* (caption→wordId, b-roll→span): reorder → đi theo, **tự động 100%**.
   - *Toàn cục / kéo dài* (nhạc nền, grade, ambient): KHÔNG nhảy chỗ, chỉ **re-time/stretch**.
   - *Vắt qua ranh giới* (transition straddle 2 section, camera move liên tục, effect sync beat cả bài): đây là
     phần **thật sự khó** → cascade cắt/re-resolve được thì làm, không chắc thì **FLAG trong diff cho user
     quyết**. Moat = tự động ~90%, *nêu ra* 10% cần người, KHÔNG giả vờ 100%.

4. **Progressive disclosure / LOD — không bao giờ vẽ 64 track.** Tầng semantic hiện lane role gọn; chỉ **bung
   1 bundle** khi user lặn vào Tầng 0 của *đúng object đó*. Phức tạp nằm trong DATA, không đổ ra màn hình
   (giống outliner 3D thu gọn subnet). Giải quyết "khiếp" về mặt nhận thức.

5. **Collision policy + diff.** Reorder làm 2 phần tử đụng nhau → luật giải quyết deterministic; cái không tự
   giải được → hiện trong **diff "đã dàn lại gì"** (đã chốt mục 8b) để user xử 1 chỗ, không mò 64 track.

**Giới hạn (scope honesty):** Whip nhắm **short-form creator** (reel 15–90s: vài beat + b-roll + caption +
nhạc) — cascade fit *đẹp* cảnh này. KHÔNG nhắm composite VFX phim 64-track. Khi mật độ cực cao / VFX nặng,
user vẫn **lặn Tầng 0 chỉnh tay** — đó là *thiết kế*, không phải thua. Đừng overclaim "cascade lo mọi
timeline Hollywood".

## 3c. ENGINE cascade = bài toán tối ưu có ràng buộc (Phong: "corporate SOTA math, đừng manual")

> Yêu cầu đúng: cascade KHÔNG được là đống if-else vá tay. Phải là **solver**: editor *khai báo* ràng buộc 1
> lần, máy *giải lại* mỗi lần reorder. Thêm loại media mới = thêm ràng buộc, không thêm code cascade.

**Khung hình thức:** "dàn lại Tầng 0 khi sửa tầng trên" = **hierarchical constrained layout/scheduling trên
trục thời gian**. Ghép 4 mảnh SOTA (đều có impl chạy browser, đều client-side → giữ Moat #2 & #5):

| Bài toán con | Thuật toán SOTA | Vì sao đúng |
|---|---|---|
| **Đặt vị trí/thời điểm phần tử** (hard) | **Cassowary** — incremental linear constraint solver (chính là Apple Auto Layout). Browser: `kiwi.js` (WASM-fast). | Ràng buộc có **STRENGTH**: *required* (caption phải dính word) không bao giờ vỡ; *strong* (b-roll bám beat); *weak* (chừa khoảng thở) vỡ theo thứ tự ưu tiên. **Incremental** = mỗi edit chỉ tính lại phần tối thiểu → zero-latency. |
| **Gom overlap → tối thiểu lane** | **Interval graph coloring** (greedy, tối ưu cho interval, O(n log n)). | Thu 64 track loạn → số lane role nhỏ nhất, **chứng minh tối ưu**, không juggling tay. |
| **Sở thích mềm** (bám beat, nhịp theo archetype, giãn cách) | **Energy minimization kiểu Penrose/Bloom** (CMU) — khai báo ràng buộc → numerical optimization. | Whip = "Penrose cho timeline": style/pacing là *mục tiêu* tối ưu, không hard-code. |
| **Re-time media liên tục** (nhạc/ambient theo độ dài section mới) | **DTW warp** (đã có sẵn trong toolbox để match archetype curve). | Co giãn theo cấu trúc mới mà giữ beat. |

**Cái hay nhất — "flag 10%" cũng là TOÁN, không phải đoán:** strength hierarchy của Cassowary cho biết *chính
xác* ràng buộc weak nào nó phải bẻ, hoặc khi tập required **infeasible** → trả **chứng chỉ vô nghiệm**. Cái
phần "vắt qua ranh giới" (mục 3b.3) chính là chỗ solver báo vô nghiệm → **đó là cái đẩy lên diff cho user**,
nguyên tắc rõ ràng, không heuristic mù.

**Hierarchy giữ tractable:** giải mỗi **bundle/subnet** (mục 3b.1) độc lập rồi *compose* (như scene-graph 3D)
→ n nhỏ mỗi lần giải → nhanh kể cả timeline dày.

**Lớp đề xuất reorder (Tầng 2):** chọn thứ tự section "đỉnh" nhất = **dynamic programming trên điểm số arc**
(montage research: DP cho chuỗi shot điểm cao nhất) — gợi ý sắp xếp, user vẫn quyết.

> Tóm: **Cascade = Cassowary (đặt cứng) + interval-coloring (gom lane) + energy-min kiểu Penrose (style mềm),
> phân cấp theo bundle, vô-nghiệm-của-solver lái cái flag cho người.** Tất cả đã chứng minh, nhanh, chạy
> browser. Thêm media mới = khai báo ràng buộc, KHÔNG đụng lõi.

## 3d. SPEC solver — bảng ràng buộc + độ mạnh theo loại media (đào sâu 3c)

> Lõi: mỗi phần tử là tập **biến** + **ràng buộc có độ mạnh**. Cascade = giải lại tập này. Đây là "vocabulary"
> để khai báo; thêm media mới = thêm dòng vào registry, KHÔNG sửa lõi solver.

**Biến mỗi phần tử `e`:** `e.start`, `e.end` (thời gian, Cassowary giải) · `e.dur = end−start` · `e.lane`
(role lane, do interval-coloring gán, KHÔNG phải Cassowary) · `anchor(e)` = thời điểm của `wordId/spanId` nó neo.

**4 bậc độ mạnh** (map thẳng vào Cassowary `required/strong/medium/weak`):
- **REQUIRED** — tính hợp lệ/toàn vẹn. KHÔNG bao giờ vỡ; vỡ = solver báo **vô nghiệm** → FLAG cho user.
- **STRONG** — ý đồ biên tập (b-roll đúng span, sfx trúng hit, nhạc lấp section).
- **MEDIUM** — style/archetype (pacing target, mật độ cut profile).
- **WEAK** — đánh bóng (khoảng thở, giãn cách đều).

### Bảng ràng buộc theo loại media
| Media | Ràng buộc chính | Độ mạnh |
|---|---|---|
| **Caption / lower-third** | `start == anchor(wordId)`; `dur ≥ minReadable` (đọc kịp); `end ≤ section.end` | REQUIRED |
| **Spine clip (lời nói)** | thứ tự `FOLLOWS`; `next.start ≥ prev.end` (ko đè cùng lane); trim ⇒ đẩy ngược cập nhật span (2 chiều) | REQUIRED |
| **B-roll** | `[start,end] ⊆ span` nó minh hoạ (STRONG); bám cut-profile/nhịp (MEDIUM); chừa khoảng thở giữa 2 b-roll (WEAK) | STRONG→WEAK |
| **SFX (hit)** | `start == hitFrame.time` (trúng nhịp/động tác) | REQUIRED |
| **Nhạc nền** | KHÔNG nhảy chỗ — `span == ghép-section` rồi **DTW re-time**; beat-align (STRONG) | STRONG |
| **Grade / adjustment (toàn cục)** | phủ `[0, total]`; reorder ⇒ **rescale**, ko reshuffle | STRONG |
| **Transition** | thuộc *cặp mối nối*; reorder ⇒ chọn lại theo cặp role mới (hook→proof ≠ proof→cta) | MEDIUM |
| **Bundle / section** | `child ⊆ parent` (con ko tràn ra ngoài); di chuyển atomic | REQUIRED |

### Pipeline mỗi lần reorder (deterministic)
1. Reorder ở Tầng 1/2 → cập nhật thứ tự section → `anchor(e)` tính lại (vị trí `wordId` đã biết).
2. **Cassowary incremental** giải `start/end` theo độ mạnh (chỉ đụng subtree bị ảnh hưởng → nhanh).
3. **Interval-graph coloring** trong từng role-lane → gán sub-lane cho phần còn chồng (min lane).
4. **Energy-min (Penrose-style)** pass: nudge biến weak/medium theo mục tiêu mềm (bám beat, pacing archetype).
5. **DTW** re-time media liên tục (nhạc/ambient) theo độ dài section mới.
6. Nếu Cassowary báo **required infeasible** → trích **conflict set** → đẩy lên **diff "đã dàn lại gì" + FLAG**.
7. Emit diff + **1 undo gộp** (mục 8b).

### Tractable + mở rộng
- Giải **per-bundle/subnet** rồi compose (scene-graph) → n nhỏ mỗi lần → mượt kể cả timeline dày. Nặng thì đẩy worker.
- **Registry ràng buộc** gắn vào `whip-action-surface.md` capability registry → loại media mới = khai báo
  dòng ràng buộc + độ mạnh, agent (MCP) cũng đọc được. KHÔNG đụng lõi cascade.
- **Lib:** ứng viên `kiwi.js` (Cassowary, nhanh) — verify size/perf trước khi chốt (luật browser-tradeoff).

## 4. Mọi thứ gom về một mái

| Mảnh đã/đang làm | Là tầng / vai gì trong mô hình này |
|---|---|
| Semantic Temporal Graph (Moat #1) | **bộ xương** của mọi tầng + chất keo cascade |
| Cut profile (19–20/06) | **cầu nối Tầng 0 ↔ 1** (nhịp cắt thật → ý đồ) |
| Archetype / đường cảm xúc (`whip-archetype.md`) | **Tầng 2** (cảm giác) + cascade rules khi reorder |
| Vector SOP dual-mode (`whip-vector.md`) | nhánh tầng cho **đồ hoạ** (object↔vertex) |
| Agent / MCP (Moat #3) | bộ điều khiển nhảy tầng + chạy cascade |
| Action surface (`whip-action-surface.md`) | gom thao tác mọi tầng vào registry chung |

→ Vision này **không thêm cột mới**, nó là **mái nhà** cho các cột đã dựng. Đó là tín hiệu nó đúng.

---

## 5. Hiện trạng vs thiếu (thật)
- **Đã có:** `TemporalNode` CONTAINS/FOLLOWS (lồng tầng) · anchor `wordId` bền qua cut · vector dual-mode ·
  StyleGraphModal (đường cảm xúc — nhưng read-only) · cut profile lái edit.
- **Thiếu:** (1) UI nhảy tầng + mặt-sửa ở Tầng 1/2; (2) **cascade engine** (mục 3) — phần khó & đáng giá
  nhất; (3) reorder semantic kéo-thả; (4) re-resolve transition/ducking/nhịp tự động.

## 6. Kiểm 5 Moat
- **#1 Semantic:** đây là biểu hiện trọn vẹn nhất của Moat #1 (graph làm mọi tầng + cascade). ✅✅
- **#2 Local-first:** cascade chạy client trên graph (như vector SOP), không roundtrip mỗi thao tác. ✅
- **#3 Agent:** mỗi tầng + cascade rule = MCP tool. ✅ khuếch đại.
- **#4 Lock-in:** cascade rules + archetype học được = gu riêng, càng dùng càng dính. ✅
- **#5 Thread:** cascade là tính trên graph (nhẹ), KHÔNG đụng render loop; re-resolve nặng (re-time nhạc) đẩy
  worker + back-off. ⚠️ phải đo khi build (đừng để reorder giật).

## 7. Lộ trình (phased)
1. ✅ **P1 — Định nghĩa tầng + nhảy tầng (xem)** (DONE 20/06). `src/components/LevelView.tsx` — 3 tầng
   Cảm-giác/Ý-nghĩa/Cut chung trục thời gian + playhead; Tab/click header đổi tầng-lái; click khối ý nghĩa →
   highlight đồng bộ. viewTab "levels" + tab 🧠. Read-only, surface từ graph có sẵn. ui-sweep 0 err.
2. 🟡 **P2 — Reorder + cascade.** ✅ **LÕI cascade DONE**: `src/engine/cascade.ts` (`cascade`/`colorLanes`/
   `diffLayouts`) — reorder section → element neo đi theo + nhạc re-time + interval-coloring + diff. `selftest:cascade`
   11/11. ⏳ **CÒN: wire drag-drop UI vào LevelView + apply vào store thật** (mutate temporalNodes/clips/captions —
   để session tỉnh táo, rủi ro cao khi unattended).
3. **P3 — Cascade đầy đủ.** Transition theo cặp role + ducking/nhịp re-time (DTW) + cảnh báo hỏng arc + Cassowary
   (kiwi.js) cho soft-constraint beat-align (eval size/perf trước — §3d).
4. **P4 — Tầng 2 sửa được** (đổi archetype/đường cảm xúc → đề xuất reorder, DP §3d) + agent drive qua MCP.

## 8. Quyết định (Phong chốt 20/06)
- **(a) 3 tầng** trục thời gian: Cut / Semantic / Cảm-giác + nhánh vector riêng cho đồ hoạ. "Section/Chapter"
  KHÔNG là tầng riêng — là cấp con trong `CONTAINS` của Tầng 1 (Semantic). Gọn, dễ nhớ.
- **(b) Cascade tự động** khi reorder + **undo gộp 1 bước** + **diff "đã dàn lại gì"** cho user thấy (theo
  `feedback_ux_pass`). Không bắt user duyệt từng bước.
- **(c) Reorder HAI CHIỀU.** Sửa tay ở Tầng 0 (trim/xoá cut) → đẩy ngược cập nhật ý nghĩa Tầng 1; sửa Tầng
  trên → dàn Tầng dưới. Anchor `wordId` cho phép đồng bộ 2 chiều. → cần re-derive span/ý nghĩa khi cut đổi.

## 9. Ghi chú IP (thực dụng, không phải tư vấn luật)
- Adobe có patent timeline phân tầng (clip›scene›act, outline) — **phạm vi là claim cụ thể, không phải ý
  tưởng**. Whip khác cơ chế (semantic-graph cascade, client-side, agentic) → tránh claim của họ.
- Việc nên làm: đừng nhái UI/wording patent họ; **doc này (có ngày) = bằng chứng sáng chế riêng**; nếu phần
  cascade đủ mới → cân nhắc tự nộp provisional. FTO review với luật sư patent khi Whip đủ lớn.

---

> Liên quan: [whip-moat.md](./whip-moat.md) · [whip-data-model.md](./whip-data-model.md) (TemporalNode
> CONTAINS/FOLLOWS) · [whip-archetype.md](./whip-archetype.md) (Tầng 2) · [whip-vector.md](./whip-vector.md)
> (nhánh tầng đồ hoạ) · [whip-action-surface.md](./whip-action-surface.md) · [whip-mcp.md](./whip-mcp.md).
