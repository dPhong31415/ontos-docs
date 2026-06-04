import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    { type: "doc", id: "jobradar-overview",       label: "🗺 Tổng quan" },
    { type: "doc", id: "jobradar-features",       label: "🎯 Tính năng" },
    { type: "doc", id: "jobradar-system-design",  label: "🏗 System Design" },
    { type: "doc", id: "jobradar-schema",         label: "🗄 Schema & Models" },
    { type: "doc", id: "jobradar-api",            label: "🔌 API Reference" },
    { type: "doc", id: "jobradar-agent",          label: "🤖 AI Agent & Memory" },
    { type: "doc", id: "jobradar-colab",          label: "👥 Colab & Claude Code" },
    { type: "doc", id: "jobradar-roadmap",        label: "✅ Roadmap & Checklist" },
    { type: "doc", id: "jobradar-ops",            label: "⚙️ Ops & Deploy" },
  ],
};

export default sidebars;
