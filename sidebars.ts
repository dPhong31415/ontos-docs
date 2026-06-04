import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
  docs: [
    { type: "doc", id: "jobradar-overview",     label: "🗺 Overview" },
    { type: "doc", id: "jobradar-architecture", label: "🏗 Architecture" },
    { type: "doc", id: "jobradar-agent",        label: "🤖 AI Agent & Memory" },
    { type: "doc", id: "jobradar-api",          label: "🔌 API Reference" },
    { type: "doc", id: "jobradar-ops",          label: "⚙️ Ops & Deploy" },
  ],
};

export default sidebars;
