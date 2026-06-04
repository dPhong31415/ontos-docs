import { Redirect } from "@docusaurus/router";

// index.md with routeBasePath:"/" renders at "/" not "/jobradar-overview"
// so redirect to the architecture page which has a real slug
export default function Home() {
  return <Redirect to="/jobradar-overview" />;
}
