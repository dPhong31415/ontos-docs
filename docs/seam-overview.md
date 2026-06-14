---
id: seam-overview
title: Seam — Design-Code CI/CD
sidebar_label: 🗺 Tổng quan
sidebar_position: 1
---

# Seam — Ngôn ngữ lập trình cho design system

> **Một câu:** Seam là CI/CD pipeline đầu tiên bridge Figma và React bằng semantic binding — designer chỉnh UI, codebase tự update, không ai kéo tay.

---

## Vấn đề — 40 năm chưa ai giải

Mọi team có design system đều sống với vòng lặp này:

```
Designer sửa border-radius của Button trong Figma
  → Dev không biết (hoặc biết sau 3 ngày qua ticket)
  → Dev sửa tay → mis-implement → designer QA lại
  → "Ủa sao code khác design vậy?" mỗi sprint

Designer thêm variant "destructive" cho Button
  → Tạo ticket → sprint planning → 2 tuần backlog
  → Trong thời gian đó: designer dùng Figma, dev dùng hardcode #e63946

Token drift tích lũy:
  Figma: color/primary/500 = #2563EB
  Code:  --color-primary = #2563eb  ← typo 2022, không ai biết
  CSS:   bg-blue-600               ← dev đoán mò
  → 3 version của cùng 1 màu tồn tại song song
```

Đây không phải vấn đề quy trình. Đây là **vấn đề kiến trúc dữ liệu**: Figma và React tồn tại trong hai thế giới data hoàn toàn tách biệt, không có semantic bridge giữa chúng.

---

## Insight cốt lõi

**Design system là code. Token là biến. Component là function. Variant là overload.**

Figma và React đang biểu diễn cùng một thực thể — `Button/Primary/Large` — nhưng trong hai ngôn ngữ khác nhau, không có translator nào hiểu cả hai.

Các tool hiện tại dùng 2 approach đều sai:

**Approach 1 — Export/Import thủ công** (Tokens Studio, Zeplin):
```
Designer click "Export tokens" → download JSON → dev copy vào repo → commit
```
Human-in-the-loop = drift tiếp tục. Không scale.

**Approach 2 — Generate code từ Figma** (Locofy, Anima):
```
Figma frame → AI generate React component → paste vào codebase
```
Output là code rác không maintainable. Dev không dùng sau lần đầu.

**Seam approach — Semantic binding + incremental sync:**
```
Figma publish → Seam diff → resolve qua BindingGraph → commit đúng thứ thay đổi
```
Không generate code mới. Không manual export. Chỉ update đúng phần đã thay đổi, trong codebase thật, theo binding đã được confirm.

---

## BindingGraph — Cái không ai có

Seam xây một **typed semantic graph** bridge hai thế giới:

```
DesignGraph (Figma)                    CodeGraph (React/TS)
────────────────────                   ──────────────────────
FigmaComponent                         CodeComponent
  id: "btn:9f2a"                         path: "src/ui/Button.tsx"
  name: "Button"                         export: "Button"
  variants: {size, variant, state}       props: {size, variant, disabled}

DesignToken                            TokenRef
  figmaId: "var:col/pri/500"             cssVar: "--color-primary-500"
  name: "color/primary/500"              tailwindKey: "primary.500"
  value: "#2563EB"                       value: "#2563EB"
  scope: [FILL, STROKE]                  usedIn: ["Button", "Badge", ...]

VariantGroup                           PropDef
  property: "size"                       name: "size"
  values: [sm, md, lg]                   type: "'sm' | 'md' | 'lg'"
  defaultValue: "md"                     default: "md"

              BindingGraph ← THE MOAT
              ──────────────────────────────────────
              FigmaComponent ──[BOUND_TO]──▶ CodeComponent
                confidence: 0.97
                method: "auto_name"
                lastSync: 2026-06-09T10:32Z
                driftScore: 0            ← 0 = in sync

              DesignToken ──[TOKEN_MAPS_TO]──▶ TokenRef
                transform: "hex_lower"
                autoResolvable: true

              VariantGroup ──[VARIANT_MAPS_TO]──▶ PropDef
                mapping: {sm: "sm", md: "md", lg: "lg"}
                confidence: 1.0
```

**BindingGraph là "Semantic Temporal Graph" của Seam** — tương tự OntologyGraph của Whip, nhưng bridge hai domain thay vì một.

---

## Seam hoạt động thế nào

### Phase 1 — Bootstrap (một lần, khi setup)

```
1. Connect Figma workspace (OAuth) + GitHub repo (GitHub App)
2. Seam scan Figma: index all ComponentDef, VariantGroup, Variable
3. Seam scan codebase: ts-morph parse all React components + props
4. Auto-match bằng name similarity + semantic heuristics:
     "Button" (Figma) → "Button" (src/ui/Button.tsx): confidence 0.97
     "color/primary/500" → "--color-primary-500": confidence 0.99
5. Low-confidence bindings → human review queue
6. Confirmed bindings → BindingGraph locked in
```

### Phase 2 — CI/CD (liên tục, tự động)

```
Figma FILE_VERSION_UPDATE webhook
    │
    ▼
Diff Worker
  → fetch new version via Figma API
  → compare với BindingGraph snapshot
  → classify mỗi thay đổi:

      TokenValueChange  → BindingGraph.autoResolvable = true
        → update tokens/index.json
        → CSS vars auto-update → Tailwind @theme auto-update
        → commit "chore(tokens): sync color/primary/500 #2563EB → #2B6FF0"

      VariantAddition   → confidence check
        → nếu high confidence: generate PropDef + open PR
        → nếu low confidence: notify human review queue

      StructuralChange  → AI analysis
        → Claude Sonnet phân tích impact
        → generate minimal code diff
        → open PR với explanation + visual diff

      ComponentAddition → suggest binding
        → human confirm binding → add to BindingGraph
    │
    ▼
Visual Validation
  → Storybook build trigger
  → Chromatic snapshot compare
  → attach diff screenshot to PR

    │
    ▼
Merge → deploy
  → BindingGraph update: confidence++, lastSync, driftScore = 0
```

---

## Seam trong Ontos platform

Seam là **app #3** trong Ontos ecosystem (sau jobradar, Whip):

```
ObjectType: FigmaComponent   implements Trackable, Bindable
ObjectType: CodeComponent    implements Trackable, Bindable
ObjectType: DesignToken      implements Trackable
ObjectType: Binding          implements Trackable
  status: unbound → proposed → confirmed → synced → drifted → resolved

ActionType: sync_tokens      → auto-executable
ActionType: resolve_binding  → human-in-the-loop
ActionType: open_pr          → git integration
ActionType: explain_drift    → AI-powered
ActionType: approve_binding  → locks confidence = 1.0
```

Không viết lại auth, billing, agent infrastructure — kế thừa toàn bộ từ Ontos core.

---

## Đọc tiếp

1. [Kiến trúc SOTA 2026](./seam-architecture.md) — BindingGraph, pipeline, SOTA stack
2. [5 Moats](./seam-moat.md) — tại sao Supernova/Locofy không thể copy
3. [Competitor Analysis](./seam-competitor.md) — honest teardown
4. [MVP & Validation](./seam-mvp-scope.md) — checklist + milestones
5. [YC Pitch — $1B Thesis](./seam-pitch.md) — unicorn path
