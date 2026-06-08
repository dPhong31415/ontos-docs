import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    {
      type: "category",
      label: "🧬 Ontology Platform",
      collapsed: false,
      items: [
        "ontology-overview",
        "ontology-architecture",
        "ontology-metamodel",
        "ontology-kinetic",
        "ontology-agent-mcp",
        "ontology-jobradar-mapping",
        "ontology-roadmap",
      ],
    },
    {
      type: "category",
      label: "📦 Apps",
      collapsed: false,
      items: [
        {
          type: "category",
          label: "jobradar",
          items: [
            { type: "doc", id: "jobradar-overview",      label: "🗺 Tổng quan" },
            { type: "doc", id: "jobradar-features",      label: "🎯 Tính năng" },
            { type: "doc", id: "jobradar-system-design", label: "🏗 System Design" },
            { type: "doc", id: "jobradar-schema",        label: "🗄 Schema & Models" },
            { type: "doc", id: "jobradar-api",           label: "🔌 API Reference" },
            { type: "doc", id: "jobradar-agent",         label: "🤖 AI Agent & Memory" },
            { type: "doc", id: "jobradar-colab",         label: "👥 Colab & Claude Code" },
            { type: "doc", id: "jobradar-roadmap",       label: "✅ Roadmap & Checklist" },
            { type: "doc", id: "jobradar-ops",           label: "⚙️ Ops & Deploy" },
          ],
        },
        {
          type: "category",
          label: "✂️ Whip",
          collapsed: false,
          items: [

            // ── Vision ──────────────────────────────────────
            {
              type: "category",
              label: "📍 Vision",
              collapsed: false,
              items: [
                { type: "doc", id: "whip-overview", label: "🗺 Tổng quan" },
                { type: "doc", id: "whip-moat",     label: "🏆 Tại sao Whip thắng" },
                { type: "doc", id: "whip-mvp-scope",label: "✅ MVP & Roadmap" },
              ],
            },

            // ── Product ──────────────────────────────────────
            {
              type: "category",
              label: "🎯 Product",
              collapsed: false,
              items: [
                { type: "doc", id: "whip-features",      label: "🎯 Tính năng chi tiết" },
                { type: "doc", id: "whip-content-view",  label: "📑 Content View" },
                { type: "doc", id: "whip-ux",            label: "🖱 UI/UX & Shortcuts" },
                { type: "doc", id: "whip-look",          label: "🎨 Signature Look" },
              ],
            },

            // ── Engineering ───────────────────────────────────
            {
              type: "category",
              label: "🏗 Engineering",
              collapsed: false,
              items: [
                { type: "doc", id: "whip-architecture", label: "🏗 Kiến trúc SOTA 2026" },
                { type: "doc", id: "whip-data-model",   label: "🗄 Project Document & Schema" },
                { type: "doc", id: "whip-api",          label: "🔌 Command API" },
                { type: "doc", id: "whip-mcp",          label: "🤖 MCP & Agent Skills" },
              ],
            },

            // ── AI Pipeline ───────────────────────────────────
            {
              type: "category",
              label: "🔥 AI Pipeline",
              collapsed: false,
              items: [
                { type: "doc", id: "whip-auto-viral-pipeline", label: "🔥 Auto-Viral Caption" },
                { type: "doc", id: "whip-behaviors",           label: "🎚 Smart Animation" },
              ],
            },

            // ── Go To Market ──────────────────────────────────
            {
              type: "category",
              label: "🚀 Go To Market",
              collapsed: false,
              items: [
                { type: "doc", id: "whip-pitch",        label: "💰 Funding & Legal" },
                { type: "doc", id: "whip-gtm-launch",   label: "🚀 GTM & Launch" },
                { type: "doc", id: "whip-launch-infra", label: "🏗️ Launch & Infra" },
                { type: "doc", id: "whip-onboarding",   label: "🎓 Onboarding & Landing" },
              ],
            },

          ],
        },
      ],
    },
  ],
};

export default sidebars;
