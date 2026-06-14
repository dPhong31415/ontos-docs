---
id: seam-architecture
title: Kiến trúc SOTA 2026
sidebar_label: 🏗 Kiến trúc SOTA 2026
sidebar_position: 2
---

# Seam — Kiến trúc SOTA 2026

> Stack thực tế Q2/2026. Mỗi lựa chọn có lý do kỹ thuật cụ thể, không phải trend-chasing.

---

## Tổng quan hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                        FIGMA SIDE                           │
│  Variables API ──┐                                          │
│  Components API──┼──▶ Figma Webhook (FILE_VERSION_UPDATE)   │
│  Styles API ─────┘                                          │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼────────────────────────────────┐
│                      SEAM WORKER                            │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ Diff Engine │──▶│BindingGraph  │──▶│ Change Resolver │  │
│  │ (ts-morph)  │   │ (SQLite DAG) │   │ (Claude Sonnet) │  │
│  └─────────────┘   └──────────────┘   └────────┬────────┘  │
│                                                 │           │
│  ┌──────────────────────────────────────────────▼────────┐  │
│  │                   Action Router                       │  │
│  │  TokenChange → auto-commit                            │  │
│  │  VariantChange → PR generator                         │  │
│  │  StructuralChange → AI diff + PR                      │  │
│  │  NewComponent → human review queue                    │  │
│  └──────────────────────────────────────────────┬────────┘  │
└───────────────────────────────────────────────  │ ──────────┘
                                                  │
              ┌───────────────────────────────────┤
              │                                   │
┌─────────────▼──────────┐          ┌─────────────▼──────────┐
│      GITHUB SIDE        │          │     CODEBASE SIDE       │
│                         │          │                         │
│  GitHub App             │          │  tokens/index.json      │
│  Auto-commit to branch  │          │  (W3C DTCG format)      │
│  Open PR                │          │                         │
│  Chromatic visual diff  │          │  src/ui/*.tsx           │
│  Storybook build        │          │  tailwind.config.ts     │
└─────────────────────────┘          │  src/styles/tokens.css  │
                                     └─────────────────────────┘
```

---

## Layer 1 — Figma Integration

### Figma Variables API (2024+ — SOTA)

Đây là API quan trọng nhất được launch năm 2024. Variables là Figma's first-class design token system:

```typescript
// Figma Variables API response
{
  variables: {
    "VariableID:1:23": {
      id: "VariableID:1:23",
      name: "color/primary/500",
      resolvedType: "COLOR",
      valuesByMode: {
        "1:0": { r: 0.145, g: 0.388, b: 0.922, a: 1 }  // light mode
        "1:1": { r: 0.259, g: 0.467, b: 0.961, a: 1 }  // dark mode
      },
      scopes: ["FILL", "STROKE", "EFFECT_COLOR"],
      hiddenFromPublishing: false,
      variableCollectionId: "VariableCollectionId:1:5"
    }
  },
  variableCollections: {
    "VariableCollectionId:1:5": {
      id: "VariableCollectionId:1:5",
      name: "Primitives",
      modes: [{ modeId: "1:0", name: "Light" }, { modeId: "1:1", name: "Dark" }],
      defaultModeId: "1:0"
    }
  }
}
```

**Tại sao Variables API là game-changer:**
- Trước 2024: phải parse Figma styles (flat, không có mode)
- Variables API: typed (Color, Number, String, Boolean), multi-mode, scoped
- Mapping 1:1 với W3C DTCG token format → zero-loss transform

### Figma Components API

```typescript
// Seam fetch component structure
const component = await figma.getComponent(componentKey);
// {
//   key: "btn:9f2a",
//   name: "Button",
//   componentSetId: "set:1234",  ← belongs to a component set (variant group)
//   documentationLinks: [],
//   remote: false,
// }

const componentSet = await figma.getComponentSet(setKey);
// {
//   key: "set:1234",
//   name: "Button",
//   componentPropertyDefinitions: {
//     "size": { type: "VARIANT", variantOptions: ["sm", "md", "lg"] },
//     "variant": { type: "VARIANT", variantOptions: ["primary", "secondary", "destructive"] },
//     "disabled": { type: "BOOLEAN", defaultValue: false }
//   }
// }
```

### Webhook setup

```typescript
// Seam registers webhook on workspace
POST https://api.figma.com/v2/webhooks
{
  "event_type": "FILE_VERSION_UPDATE",
  "team_id": "...",
  "endpoint": "https://seam.app/webhooks/figma",
  "passcode": "<hmac_secret>"
}

// Payload on publish:
{
  "event_type": "FILE_VERSION_UPDATE",
  "file_key": "abc123",
  "timestamp": "2026-06-09T10:32:00Z",
  "version_id": "1234567890",
  "triggered_by": { "id": "...", "handle": "designer@company.com" }
}
```

---

## Layer 2 — Token Pipeline (SOTA 2026)

### W3C DTCG Format (Design Token Community Group — 2023 spec)

Seam lưu tokens theo chuẩn quốc tế, không vendor-locked:

```json
// tokens/index.json (W3C DTCG format)
{
  "color": {
    "primary": {
      "500": {
        "$type": "color",
        "$value": { "light": "#2563EB", "dark": "#3B82F6" },
        "$description": "Primary brand color — buttons, links, focus rings",
        "$extensions": {
          "seam": {
            "figmaId": "VariableID:1:23",
            "lastSync": "2026-06-09T10:32:00Z",
            "confidence": 1.0
          }
        }
      }
    }
  },
  "spacing": {
    "4": { "$type": "dimension", "$value": "16px" }
  },
  "borderRadius": {
    "button": { "$type": "dimension", "$value": "8px" }
  }
}
```

### Style Dictionary v4 — Transform Pipeline

```typescript
// seam.config.ts — Style Dictionary v4 (2024)
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/index.json'],
  platforms: {
    // CSS custom properties
    css: {
      transformGroup: 'css',
      prefix: 'seam',
      files: [{
        destination: 'src/styles/tokens.css',
        format: 'css/variables',
        filter: (token) => token.$type !== 'dimension' || token.attributes?.category !== 'spacing'
      }]
    },
    // Tailwind v4 @theme
    tailwind: {
      transformGroup: 'js',
      files: [{
        destination: 'src/styles/tokens.theme.css',
        format: 'css/tailwind-theme',  // custom format
      }]
    }
  }
});

await sd.buildAllPlatforms();
```

### Tailwind v4 Integration (SOTA — CSS-first)

Tailwind v4 (2025) thay config JS bằng CSS `@theme` directive — token sync trở nên trivial:

```css
/* src/styles/tokens.theme.css — auto-generated by Seam */
@theme {
  /* Colors */
  --color-primary-500: #2563EB;
  --color-primary-400: #3B82F6;
  --color-destructive: #E63946;

  /* Border radius */
  --radius-button: 8px;
  --radius-card: 12px;

  /* Typography */
  --font-size-sm: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
}
```

```css
/* src/styles/globals.css */
@import "tailwindcss";
@import "./tokens.theme.css";
/* ← Tất cả component dùng --color-primary-500 tự update khi token thay đổi */
```

**Kết quả:** Token sync = chỉ update `tokens/index.json` + regenerate `tokens.theme.css`. Không cần sửa component file nào. Auto-commit.

---

## Layer 3 — Codebase Analysis (ts-morph)

### Đọc React component structure

```typescript
import { Project, SyntaxKind } from 'ts-morph';

// Seam scans codebase
const project = new Project({ tsConfigFilePath: 'tsconfig.json' });

function analyzeComponent(filePath: string): CodeComponentDef {
  const sourceFile = project.getSourceFileOrThrow(filePath);

  // Find exported React component
  const component = sourceFile
    .getExportedDeclarations()
    .entries()
    .find(([name]) => /^[A-Z]/.test(name));  // PascalCase = component

  // Extract props interface
  const propsInterface = sourceFile
    .getInterface(`${componentName}Props`);

  const props = propsInterface?.getProperties().map(prop => ({
    name: prop.getName(),
    type: prop.getTypeNode()?.getText(),
    optional: prop.hasQuestionToken(),
    default: extractDefaultValue(prop),
  }));

  // Extract variant patterns (discriminated union or enum)
  const variantProp = props?.find(p => p.name === 'variant' || p.name === 'size');

  return {
    filePath,
    exportName: componentName,
    props: props ?? [],
    tokenRefs: extractTokenRefs(sourceFile),  // scan for CSS var usage
    variants: extractVariants(variantProp),
  };
}
```

### Write component changes (incremental)

```typescript
// Seam adds new variant prop value — does NOT regenerate file
function addVariantValue(
  filePath: string,
  propName: string,
  newValue: string
): string {
  const sourceFile = project.getSourceFileOrThrow(filePath);

  // Find: type ButtonVariant = 'primary' | 'secondary'
  const typeAlias = sourceFile.getTypeAlias(`Button${capitalize(propName)}`);

  // Transform: add | 'destructive' to union type
  const currentType = typeAlias.getTypeNode()!;
  typeAlias.setType(`${currentType.getText()} | '${newValue}'`);

  // Find variant→class mapping object
  const variantMap = findVariantMap(sourceFile, propName);
  variantMap.addPropertyAssignment({
    name: `'${newValue}'`,
    initializer: `'bg-destructive text-destructive-foreground hover:bg-destructive/90'`
    // ↑ AI-suggested class based on token name + existing pattern
  });

  return sourceFile.getFullText();
}
```

---

## Layer 4 — BindingGraph (SQLite DAG)

### Schema

```sql
-- Figma nodes
CREATE TABLE figma_nodes (
  id TEXT PRIMARY KEY,               -- figmaId (stable)
  type TEXT NOT NULL,                -- 'component' | 'token' | 'variant_group'
  name TEXT NOT NULL,
  data JSONB NOT NULL,               -- full Figma API response
  version_snapshot TEXT,             -- last seen version_id
  created_at DATETIME DEFAULT NOW()
);

-- Code nodes
CREATE TABLE code_nodes (
  id TEXT PRIMARY KEY,               -- hash(filePath + exportName)
  type TEXT NOT NULL,                -- 'component' | 'token_ref' | 'prop_def'
  file_path TEXT NOT NULL,
  export_name TEXT,
  data JSONB NOT NULL,               -- parsed AST summary
  last_scanned DATETIME
);

-- Bindings (edges)
CREATE TABLE bindings (
  id TEXT PRIMARY KEY,
  figma_node_id TEXT REFERENCES figma_nodes(id),
  code_node_id TEXT REFERENCES code_nodes(id),
  binding_type TEXT NOT NULL,        -- 'BOUND_TO' | 'TOKEN_MAPS_TO' | 'VARIANT_MAPS_TO'
  confidence REAL NOT NULL,          -- 0.0 – 1.0
  method TEXT NOT NULL,              -- 'auto_name' | 'auto_semantic' | 'ai_resolved' | 'manual'
  transform JSONB,                   -- transform rules (e.g. hex_lower, camelCase)
  auto_resolvable BOOLEAN DEFAULT FALSE,
  drift_score REAL DEFAULT 0,        -- 0 = in sync, 1 = fully drifted
  last_sync DATETIME,
  status TEXT DEFAULT 'confirmed',   -- 'proposed' | 'confirmed' | 'synced' | 'drifted'
  provenance JSONB                   -- {source, modelId, timestamp}
);

-- Change history
CREATE TABLE change_log (
  id TEXT PRIMARY KEY,
  binding_id TEXT REFERENCES bindings(id),
  change_type TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  resolved_by TEXT,                  -- 'auto' | 'pr' | 'human'
  pr_url TEXT,
  committed_at DATETIME
);

-- Indexes
CREATE INDEX idx_bindings_figma ON bindings(figma_node_id);
CREATE INDEX idx_bindings_status ON bindings(status);
CREATE INDEX idx_bindings_drift ON bindings(drift_score) WHERE drift_score > 0;
```

### Drift Detection

```typescript
async function detectDrift(bindingId: string): Promise<DriftRecord | null> {
  const binding = await db.getBinding(bindingId);
  const figmaNode = await figmaApi.getVariable(binding.figmaNodeId);
  const codeNode = await codeScanner.getTokenRef(binding.codeNodeId);

  // Token value drift
  if (binding.bindingType === 'TOKEN_MAPS_TO') {
    const figmaValue = figmaNode.valuesByMode[defaultMode];
    const codeValue = codeNode.value;

    if (normalizeColor(figmaValue) !== normalizeColor(codeValue)) {
      return {
        type: 'TOKEN_VALUE_DRIFT',
        figmaValue: formatColor(figmaValue),
        codeValue,
        autoResolvable: true,
        severity: 'low',
      };
    }
  }

  // Missing variant
  if (binding.bindingType === 'VARIANT_MAPS_TO') {
    const figmaVariants = figmaNode.variantOptions;
    const codeVariants = extractUnionValues(codeNode.type);
    const missing = figmaVariants.filter(v => !codeVariants.includes(v));

    if (missing.length > 0) {
      return {
        type: 'VARIANT_DRIFT',
        missingInCode: missing,
        autoResolvable: false,
        severity: 'medium',
        aiSuggestion: await ai.suggestVariantImpl(missing, binding),
      };
    }
  }

  return null;
}
```

---

## Layer 5 — AI Resolution (Claude Sonnet 4.6)

### Binding resolution (bootstrap phase)

```typescript
const BINDING_RESOLVER_PROMPT = `
You are analyzing a design system to create semantic bindings between Figma components and React components.

Figma components:
{figmaComponents}

React components found in codebase:
{codeComponents}

For each Figma component, suggest the best matching React component.
Consider: naming similarity, prop structure similarity, variant patterns.

Return JSON array of bindings with confidence scores.
Only include high-confidence bindings (>0.7). Flag ambiguous ones for human review.
`;

async function resolveBindings(
  figmaComponents: FigmaComponentDef[],
  codeComponents: CodeComponentDef[]
): Promise<BindingProposal[]> {
  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: BINDING_RESOLVER_PROMPT
        .replace('{figmaComponents}', JSON.stringify(figmaComponents, null, 2))
        .replace('{codeComponents}', JSON.stringify(codeComponents, null, 2))
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Structural change PR generation

```typescript
async function generateStructuralPR(
  change: FigmaStructuralChange,
  binding: Binding
): Promise<PRContent> {
  const context = await buildingGraph.getContext(binding.id);

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    system: `You are a React/TypeScript expert updating a component to match a Figma design change.
    You generate minimal, surgical code changes — never rewrite the whole file.
    Follow the existing code style and patterns exactly.`,
    messages: [{
      role: 'user',
      content: `
Figma change detected:
${JSON.stringify(change, null, 2)}

Current component code:
\`\`\`tsx
${context.currentCode}
\`\`\`

Existing binding context:
${JSON.stringify(context.binding, null, 2)}

Generate:
1. Minimal TypeScript diff to implement this change
2. PR title (conventional commit format)
3. PR description explaining the change and linking to Figma
`
    }]
  });

  return parsePRContent(response.content[0].text);
}
```

---

## Layer 6 — MCP Agent Interface

Seam exposes tất cả actions như MCP tools — agentic-ready từ ngày 1:

```typescript
// seam-mcp.ts
const SEAM_MCP_TOOLS = [
  {
    name: 'seam_get_bindings',
    description: 'Query BindingGraph for design-code bindings, optionally filtered by status or drift',
    inputSchema: {
      type: 'object',
      properties: {
        status: { enum: ['all', 'drifted', 'unbound', 'proposed'] },
        figmaComponent: { type: 'string' },
        includeTokens: { type: 'boolean', default: true }
      }
    }
  },
  {
    name: 'seam_explain_drift',
    description: 'Explain why design and code are out of sync for a specific binding',
    inputSchema: {
      type: 'object',
      properties: {
        bindingId: { type: 'string', description: 'Binding ID from BindingGraph' }
      },
      required: ['bindingId']
    }
  },
  {
    name: 'seam_sync_tokens',
    description: 'Trigger token sync — fetch latest Figma variables and commit changes',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'seam_propose_binding',
    description: 'Propose a new binding between a Figma component and React component',
    inputSchema: {
      type: 'object',
      properties: {
        figmaId: { type: 'string' },
        codePath: { type: 'string' },
        reason: { type: 'string' }
      },
      required: ['figmaId', 'codePath']
    }
  },
  {
    name: 'seam_open_pr',
    description: 'Open a GitHub PR for pending structural changes',
    inputSchema: {
      type: 'object',
      properties: {
        changeIds: { type: 'array', items: { type: 'string' } },
        draftMode: { type: 'boolean', default: false }
      }
    }
  }
];

// Agent workflow example:
// User: "What's out of sync between Figma and our codebase?"
// Agent:
//   1. seam_get_bindings({ status: 'drifted' })
//   2. seam_explain_drift({ bindingId: 'bind:123' })
//   3. seam_open_pr({ changeIds: ['auto-resolvable ones'] })
//   4. Report remaining PRs for human review
```

---

## Deployment Architecture

### Seam Worker — Cloudflare Workers (preferred) hoặc Vercel Edge

```
Figma Webhook → Cloudflare Worker (edge, global)
                     │
                     ▼
              Cloudflare D1 (SQLite — BindingGraph)
                     │
                     ▼
              Cloudflare Queue (async diff processing)
                     │
                     ▼
              Worker (heavy): ts-morph parse + Claude API + GitHub API
```

**Tại sao Cloudflare:**
- D1 = SQLite ở edge, không cần managed Postgres cho giai đoạn đầu
- Queue = async job processing, tránh webhook timeout
- Workers KV = cache Figma API responses (file fetch có thể 5-30s)
- $0 ở giai đoạn MVP (Workers free tier + D1 free tier)

### GitHub App

```yaml
# seam.github-app.yml
name: Seam Design Sync
permissions:
  contents: write      # auto-commit token changes
  pull-requests: write # open PRs for component changes
  statuses: write      # update commit status with sync result
  checks: write        # visual diff check on PRs

webhook_events:
  - push              # detect manual token overrides
  - pull_request      # validate design consistency on PRs
```

---

## SOTA Stack Summary

| Layer | Technology | Lý do chọn |
|---|---|---|
| Design API | Figma Variables API v2 | First-class typed tokens, multi-mode |
| Token format | W3C DTCG (2023 spec) | Platform-agnostic, không vendor-locked |
| Token transform | Style Dictionary v4 | Best-in-class, extensible platform |
| CSS runtime | Tailwind v4 `@theme` | CSS-first, zero-JS token propagation |
| Component parse | ts-morph (TypeScript AST) | Surgical edits, not code generation |
| BindingGraph | SQLite (Cloudflare D1) | Local-first, zero ops, DAG queries |
| AI binding | Claude Sonnet 4.6 | Best code+reasoning for TS/React |
| Visual diff | Chromatic (Storybook) | Industry standard, Figma plugin available |
| Deployment | Cloudflare Workers + Queue | Edge-first, $0 MVP, global |
| CI integration | GitHub App | First-class permissions, not webhook hack |
| MCP | @modelcontextprotocol/sdk | Anthropic standard, agent-native |
