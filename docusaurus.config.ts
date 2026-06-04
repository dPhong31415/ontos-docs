import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "jobradar docs",
  tagline: "AI-powered job intelligence — architecture, API, ops",
  favicon: "img/favicon.ico",
  future: { v4: true },
  url: "https://jobradar-docs.vercel.app",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  i18n: { defaultLocale: "en", locales: ["en"] },
  presets: [
    ["classic", {
      docs: {
        sidebarPath: "./sidebars.ts",
        routeBasePath: "/",
        editUrl: "https://github.com/dPhong31415/jobradar/edit/main/",
      },
      blog: false,
      theme: { customCss: "./src/css/custom.css" },
    } satisfies Preset.Options],
  ],
  themeConfig: {
    colorMode: { defaultMode: "dark", respectPrefersColorScheme: false },
    navbar: {
      title: "jobradar docs",
      items: [
        { type: "docSidebar", sidebarId: "docs", position: "left", label: "Docs" },
        { href: "https://jobradar.vercel.app", label: "Live app", position: "right" },
        { href: "https://github.com/dPhong31415/jobradar", label: "GitHub", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      links: [
        { title: "App", items: [{ label: "jobradar", href: "https://jobradar.vercel.app" }] },
        { title: "Source", items: [{ label: "GitHub", href: "https://github.com/dPhong31415/jobradar" }] },
      ],
      copyright: `© ${new Date().getFullYear()} jobradar`,
    },
    prism: { theme: prismThemes.dracula, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
