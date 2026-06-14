---
id: seam-mvp-scope
title: MVP & Validation
sidebar_label: ✅ MVP & Validation
sidebar_position: 5
---

# Seam — MVP Scope & Validation Milestones

> Audit thực tế: cái gì cần build để launch, cái gì để sau, và bằng chứng nào để prove ở từng giai đoạn.

---

## MVP Definition — Đủ để launch và charge tiền

### Giai đoạn 0 — Token Sync Only (MVP, 4–6 tuần build)

**Scope tối thiểu có người trả tiền:**

```
✅ Connect: Figma OAuth + GitHub App install
✅ Bootstrap: scan Figma Variables → match với token files trong repo
✅ Webhook: nhận Figma FILE_VERSION_UPDATE
✅ Diff: detect token value changes
✅ Auto-commit: update tokens/index.json → tokens.theme.css → commit
✅ Dashboard: view token sync history, drift status
✅ Notification: Slack/email khi sync xảy ra
```

**Giá trị ngay lập tức:** Zero token drift. Không cần làm gì thêm sau setup.

**Pricing MVP:** $49/team/month (token sync only)

---

### Giai đoạn 1 — Component Binding (v1, 8–12 tuần)

```
✅ Bootstrap component: scan React components via ts-morph
✅ Auto-match: Figma ComponentSet ↔ CodeComponent (name similarity + AI)
✅ Human review queue: low-confidence bindings → web UI để confirm/reject
✅ Variant drift detection: Figma variant not in React prop union
✅ PR generation: open GitHub PR cho variant additions
✅ Visual diff: Chromatic integration trên PR
✅ BindingGraph dashboard: view all bindings, drift scores, history
```

**Pricing v1:** $149/team/month (token sync + component binding)

---

### Giai đoạn 2 — Structural Change & AI (v2, 12–16 tuần)

```
✅ Structural change detection: new props, renamed variants, deleted components
✅ AI-generated PR description (Claude Sonnet)
✅ Component owner assignment (git blame integration)
✅ MCP server: agent interface cho BindingGraph
✅ Bidirectional feedback: code changes → flag potential design inconsistency
✅ Multi-repo support
```

**Pricing v2:** $149/team/month base + $0.10/component change resolved via AI

---

## P0 — Blockers trước khi launch

| Feature | Why | Status |
|---|---|---|
| Figma Variables API auth flow (OAuth PKCE) | Without this, nothing works | Build |
| GitHub App install + permission flow | Without this, can't commit | Build |
| Token diff engine (Figma Variable → DTCG JSON) | Core value prop | Build |
| Auto-commit to `design-tokens` branch | The "wow" moment | Build |
| Basic dashboard (sync history + token list) | User needs to see it working | Build |
| Onboarding: 5-minute setup flow | Setup complexity is #1 churn | Build |

---

## P1 — v1 Feature Set (cần để charge $149/mo)

| Feature | Priority | Notes |
|---|---|---|
| ts-morph component scanner | P1 | Bootstrap phase for component binding |
| Binding confidence UI (confirm/reject) | P1 | Human-in-the-loop trust building |
| Variant drift detection | P1 | Most common pain after token drift |
| PR generator (GitHub API) | P1 | Core v1 value |
| Chromatic integration | P1 | Visual proof for PR reviewers |
| Slack notification | P1 | Awareness = adoption |
| W3C DTCG format support | P1 | Industry standard, not vendor-locked |
| Tailwind v4 `@theme` output | P1 | SOTA 2026 stack target |
| Style Dictionary v4 config | P1 | Transform pipeline |

---

## P2 — Post-PMF

| Feature | Notes |
|---|---|
| MCP server | v2 — agent interface |
| Structural change AI (Claude) | v2 — complex, needs BindingGraph mature |
| iOS/Android token platform output | v2 — Supernova territory |
| Multi-mode (dark/light) token resolution | v2 |
| Component owner assignment | v2 — git blame integration |
| Analytics: design system health score | v2 |
| Enterprise SSO + audit log | v2 |

---

## Validation Milestones

### Stage 0 — Launch Validation (tuần 1–4 sau launch)
**Câu hỏi:** "Có team nào thật sự dùng và trả tiền không?"

| Metric | Target |
|---|---|
| Paying teams | 5 |
| Token syncs triggered (automatic) | 50+/tuần |
| Setup-to-first-sync time | Dưới 10 phút |
| "Aha moment" rate | 80% thấy sync xảy ra trong 48h đầu |

**Tín hiệu thất bại:** Team setup xong nhưng không có Figma publish event trong 2 tuần → designer không dùng Figma thường xuyên, sai target segment.

---

### Stage 1 — Token PMF (tháng 1–2)
**Câu hỏi:** "Token sync có đủ để justify $49/mo không?"

| Metric | Target |
|---|---|
| Paying teams | 30 |
| MRR | $1.5K |
| Week-4 retention | 80% (token sync = habitual) |
| NPS | 50+ |
| "Token drift incidents" avoided/team/month (self-report) | 3+ |

**Key insight:** Token sync là habitual product — designer publishes → sync happens → dev sees commit. Loop reinforces itself. Retention tự nhiên cao.

---

### Stage 2 — Component Binding PMF (tháng 3–5)
**Câu hỏi:** "Component binding có đủ để justify $149/mo và upgrade từ $49?"

| Metric | Target |
|---|---|
| Paying teams | 100 |
| MRR | $10K |
| L1→L2 upgrade rate | 40% |
| PR automation acceptance rate | 70% (dev merge PR without edit) |
| Average bindings confirmed per team | 50+ (signal: BindingGraph growing) |
| Avg. time saved/sprint (self-report) | 3+ hours |

**Flywheel trigger:** Khi 1 team có 50+ confirmed bindings → confidence scores đủ accurate → PR acceptance rate tăng lên 80%+ → team giới thiệu cho team khác.

---

### Stage 3 — Seed Round Ready (tháng 6–9)
**Câu hỏi:** "Có network effect thật không?"

| Metric | Target |
|---|---|
| Paying teams | 300 |
| MRR | $35K |
| Enterprise inquiry (10+ seats) | 5 |
| MCP usage (agent queries/day) | 100+ |
| BindingGraph dataset | 50K+ confirmed bindings (aggregate) |
| "Seam is part of our CI pipeline" (survey) | 70% of teams |

**Story cho investor:** "Seam không chỉ là tool — nó là tiêu chuẩn trong pipeline. 70% team báo cáo họ không thể remove Seam vì BindingGraph đã là source of truth cho design-code relationship."

---

### Stage 4 — Series A Path (năm 1–2)
**Câu hỏi:** "Có platform play không?"

| Metric | Target |
|---|---|
| Paying teams | 2,000 |
| ARR | $3M |
| Enterprise accounts | 20 ($50K+/năm) |
| MCP API usage | Developer teams build automation trên Seam MCP |
| BindingGraph dataset | 5M+ confirmed bindings |
| Bootstrap accuracy cho team mới | 95%+ (vs 70% lúc đầu) |

---

## Unicorn Path

```
L1: Token Sync ($49/team/mo)
    → 10,000 teams × $49 = $5.9M ARR

L2: Component CI/CD ($149/team/mo)
    → 5,000 teams × $149 = $8.9M ARR

L3: Design System Intelligence ($500+/team/mo hoặc enterprise)
    → 500 teams × $500 = $3M ARR
    → 50 enterprise × $50K/yr = $2.5M ARR

Total realistic Year 3: ~$20M ARR = strong Series B

    Nếu platform effect:
L4: Seam API (third-party tools, IDE plugins, design tool integrations)
    → 1,000 developer tools × $0.001/binding resolved = 💰

L5: Design System Consultancy marketplace (Seam certified partners)
    → Revenue share model
```

---

## Risk Register

| Risk | Xác suất | Mitigation |
|---|---|---|
| Figma thay đổi Variables API | Trung bình | W3C DTCG format là abstraction layer — API thay đổi → chỉ update transformer |
| Supernova build component binding | Trung bình | BindingGraph + incremental diff cần 12-18 tháng engineering — head start matters |
| Team không dùng Figma Variables (dùng old Styles) | Cao | Support cả Figma Styles API lẫn Variables API — migration path |
| shadcn/ui pattern không phù hợp với team's codebase | Trung bình | ts-morph agnostic với CSS architecture — works with CSS Modules, Emotion, etc. |
| "Set it and forget it" → low engagement | Thấp | Engagement = notification + dashboard. Low engagement = high retention (it just works) |
| Enterprise security concern (GitHub App access) | Cao | SOC2 Type II path, private deployment option, read-only mode for audit |
