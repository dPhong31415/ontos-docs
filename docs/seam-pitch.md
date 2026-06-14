---
id: seam-pitch
title: YC Pitch — $1B Thesis
sidebar_label: 🚀 YC Pitch
sidebar_position: 6
---

# Seam — YC Pitch: Luận điểm $1B

> **Một câu:** Seam là CI/CD pipeline đầu tiên bridge Figma và React bằng semantic graph — không phải code generation, không phải manual export, mà là continuous sync qua BindingGraph.

---

## Vấn đề (thật, không bịa)

**4 triệu team dùng Figma. Tất cả đều có vấn đề này.**

```
Mỗi sprint, mỗi team đều trải qua:

Designer: "Tôi đã update Button variant trong Figma 2 tuần trước"
Dev:      "Tôi không biết — không thấy ticket nào"
Designer: "Tôi tưởng nó tự update?"
PM:       "Sao release này button màu sai?"

Token drift tích lũy không lộ ra cho đến khi visual QA:
  Figma:   #2563EB  (design decision 3 tháng trước)
  CSS:     #2463eb  (typo khi copy, không ai phát hiện)
  Storybook: #2563eb  (correct, but different casing)
  Production: background-color: blue  (dev đoán mò)

Engineering cost thật:
  2 hours/sprint reconciling design vs code = 104 hours/year/team
  $150K average engineer salary → $7,500/year/team wasted on grunt work
```

Không phải vấn đề quy trình. **Không có data bridge** giữa Figma và React.

---

## Insight

**Design system là code. Token là biến. Component là function. Variant là overload.**

Nhưng Figma và React đang nói về cùng một thực thể — `Button/Primary/Large` — trong hai ngôn ngữ không có translator.

Giải pháp đúng không phải generate code (Locofy — code rác, không ai dùng sau ngày đầu). Không phải manual export (Tokens Studio — human-in-the-loop = drift tiếp tục). Không phải visual CMS (Builder.io — requires runtime adoption).

Giải pháp đúng: **build semantic graph of relationships, sync incrementally, auto-commit chỉ thứ đã thay đổi.**

Đây là cái Seam làm. Không ai làm trước.

---

## Giải pháp — BindingGraph + Incremental Sync

```
Figma publish → Seam phân tích thay đổi → resolve qua BindingGraph:

TokenValueChange (e.g. #2563EB → #2B6FF0):
  → auto-commit tokens/index.json + tokens.theme.css
  → commit message: "chore(tokens): color/primary/500 → #2B6FF0 [Figma sync]"
  → zero human involvement

VariantAddition (e.g. Button/Destructive mới):
  → detect: variant exists in Figma, not in React prop union type
  → AI generate minimal TypeScript diff
  → open PR với visual diff (Chromatic)
  → assign đúng component owner (git blame)

StructuralChange:
  → Claude Sonnet phân tích impact
  → draft PR + explanation linking to Figma
  → human review (designer + dev đều approve)
```

**Kết quả:** Token drift = 0. Component drift detected trong 5 phút thay vì 2 tuần.

---

## Market

**TAM thật sự:** Không chỉ "design tools" — mà là "developer productivity tools."

| Segment | Size | Willingness to pay |
|---|---|---|
| Figma teams (all) | 4M+ | $49–$149/team/mo |
| Enterprise design systems | 10K+ companies | $500–$50K/yr |
| Developer tooling budget | $50B market | Proven (GitHub Copilot $19/mo, 1M+ users) |

**Realistic addressable:**
- Year 1: 500 paying teams × $80 ARPU = $480K ARR
- Year 2: 5,000 teams × $100 ARPU = $6M ARR
- Year 3: 20,000 teams × $120 ARPU + enterprise = $30M ARR

**Unicorn path ($1B+):**
- L3 Design System Intelligence: $500/team/mo → 10K enterprise teams = $60M ARR
- Platform API (third-party tools, IDE plugins) = multiplier
- Design system consultancy marketplace = revenue share

---

## Tại sao bây giờ (2026)?

**4 thứ converge:**

1. **Figma Variables API GA (2024)** — first-class typed tokens với modes. Trước đây không thể sync đúng. Bây giờ có thể.

2. **Tailwind v4 CSS-first (2025)** — `@theme` directive = tokens → CSS vars → tất cả components update. Token sync trở nên trivial khi codebase dùng Tailwind v4.

3. **shadcn/ui pattern mainstream (2024–2025)** — teams "own" their components → không bị vendor-locked → Seam có thể modify code. Ngược lại với Chakra/MUI era.

4. **MCP standard (2025)** — agent interface native. Seam MCP = designer/dev có thể chat với design system: "What's drifted?" → instant answer.

**2024 quá sớm** (Figma Variables API chưa stable). **2028 có thể muộn** (Figma hoặc Supernova bắt kịp).

---

## Tại sao Seam thắng

**Supernova** ($70M) — token-only. Không component binding. No GitHub App. No MCP. Rebuilding BindingGraph mất 18 tháng.

**Locofy/Anima** — code generation, not sync. Dev churn sau lần đầu. Fundamentally wrong approach.

**Builder.io** — requires runtime. Non-starter cho teams với existing codebase.

**Figma Dev Mode** — read-only. Figma là platform, không phải CI/CD tool. GitHub không build Vercel.

**Gap:** Semantic BindingGraph + incremental AST surgery + GitHub App CI/CD + MCP. **Đây là Seam.**

---

## Traction Targets (trước YC interview)

1. **Demo live:** Setup flow → Figma publish → auto-commit trong 30 giây
2. **10 paying teams** dùng token sync trong 4 tuần
3. **Side-by-side:** Figma Designer adds variant → CapCut dev notices 2 weeks later vs Seam → PR opened in 5 minutes
4. **Metric:** "Design sync time" reduced from 2h/sprint to 5 minutes

---

## Team Angle cho YC

**Tại sao team này:** Builder của Whip (video semantic graph) — đã build OntologyGraph pattern. BindingGraph là cùng architectural pattern, domain khác. Không phải pivot — là portfolio của semantic graph applications.

**Tại sao Vietnam:** Burn rate thấp = 24+ tháng runway trên $200K seed. SEA product team ecosystem đang tăng trưởng = natural first market.

**Unfair advantage:** Đang build Ontos platform — Seam dùng chung agent infrastructure, auth, billing với Whip và jobradar. Không viết lại từ đầu.

---

## 3 Câu hỏi YC sẽ hỏi

**"Tại sao Figma không tự build cái này?"**
Figma là design platform. Dev Mode là read-only spec viewer. Họ sẽ build better APIs (Seam dùng). Họ không build GitHub App + AST surgery + BindingGraph intelligence. Giống GitHub không build Vercel dù có GitHub Actions.

**"Supernova đã có $70M — bạn cạnh tranh thế nào?"**
Supernova giải token problem. Seam giải component problem. Khác nhau như token management (một file) vs component binding (toàn bộ codebase relationship). Supernova users là customer của Seam L1 — họ graduate lên L2 khi cần component CI/CD.

**"Moat là gì nếu team lớn hơn copy?"**
BindingGraph accuracy compound với usage data. Seam có 50K confirmed bindings sau 6 tháng — new entrant bắt đầu từ 0. Bootstrap accuracy của Seam (95%) vs competitor (70%) = 5-minute setup vs 30-minute setup = moat that compounds.
