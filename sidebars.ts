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
          label: "whip",
          items: [
            { type: "doc", id: "whip-overview",        label: "🗺 Tổng quan" },
            { type: "doc", id: "whip-features",        label: "🎯 Tính năng" },
            { type: "doc", id: "whip-system-design",   label: "🏗 System Design" },
            { type: "doc", id: "whip-data-model",      label: "🗄 Project Document" },
            { type: "doc", id: "whip-behaviors",       label: "🎚 Smart Animation" },
            { type: "doc", id: "whip-content-view",    label: "📑 Content View" },
            { type: "doc", id: "whip-look",            label: "🎨 Signature Look" },
            { type: "doc", id: "whip-interaction",     label: "🖱 Interaction & Canvas" },
            { type: "doc", id: "whip-api",             label: "🔌 Command API" },
            { type: "doc", id: "whip-mcp",             label: "🤖 MCP & Agent" },
            { type: "doc", id: "whip-ontology-reuse",  label: "🧬 Ontology Reuse" },
            { type: "doc", id: "whip-mvp-scope",       label: "🎯 MVP Scope & Cost" },
            { type: "doc", id: "whip-auto-viral-pipeline", label: "🔥 Auto-Viral Pipeline" },
            { type: "doc", id: "whip-asset-layers",    label: "🧩 Asset Layers" },
            { type: "doc", id: "whip-gtm-launch",      label: "🚀 GTM & Launch" },
            { type: "doc", id: "whip-launch-infra",    label: "🏗️ Launch & Infra" },
            { type: "doc", id: "whip-onboarding",      label: "🎓 Onboarding" },
            { type: "doc", id: "whip-roadmap",         label: "✅ Roadmap" },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
