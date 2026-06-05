import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Ontos",
  tagline: "Ontology platform — một Elixir core, nhiều app",
  favicon: "img/favicon.ico",
  future: { v4: true },
  url: "https://ontos-docs.vercel.app",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    ["classic", {
      docs: {
        sidebarPath: "./sidebars.ts",
        routeBasePath: "/",
        editUrl: "https://github.com/dPhong31415/ontos-docs/edit/main/",
      },
      blog: false,
      theme: { customCss: "./src/css/custom.css" },
    } satisfies Preset.Options],
  ],
  themeConfig: {
    colorMode: { defaultMode: "dark", respectPrefersColorScheme: false },
    navbar: {
      title: "Ontos",
      items: [
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        { href: "https://jobradar.vercel.app", label: "jobradar (app)", position: "right" },
        { href: "https://github.com/dPhong31415/ontos-docs", label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        { title: "Apps", items: [{ label: "jobradar", href: "https://jobradar.vercel.app" }] },
        { title: "Source", items: [{ label: "GitHub", href: "https://github.com/dPhong31415/ontos-docs" }] },
      ],
      copyright: `© ${new Date().getFullYear()} Ontos`,
    },
    prism: { theme: prismThemes.dracula, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
