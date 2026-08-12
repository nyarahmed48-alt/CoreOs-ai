/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { lazy, Suspense, type ReactElement } from "react";
import { RouterProvider, useRouter, Link } from "./site/router";
import { LangProvider, useLang } from "./site/i18n";
import { Layout } from "./site/Layout";
import { HomePage } from "./site/HomePage";
import { MissionPage } from "./site/MissionPage";
import { TestingPage } from "./site/TestingPage";
import { CoreOsAiPage } from "./site/CoreOsAiPage";
import { ContactPage } from "./site/ContactPage";
import { BarberDemo } from "./site/demos/BarberDemo";
import { NailsDemo } from "./site/demos/NailsDemo";
import { RestaurantDemo } from "./site/demos/RestaurantDemo";

/* The demos are whole sites of their own, so they render outside <Layout> —
   CoreOs nav and footer around a barbershop would undercut the point. Each
   carries its own DemoBar back to the site instead. */
const DEMOS: Record<string, () => ReactElement> = {
  "/demos/barber": BarberDemo,
  "/demos/nails": NailsDemo,
  "/demos/restaurant": RestaurantDemo,
};

// The SaaS manager is a large bundle and is only reached from /manager, so it
// is split out and never downloaded by ordinary site visitors.
const Manager = lazy(() => import("./App"));

/** Customer portals and iframe embeds are published as `/?portal=<id>` (see
 *  App.tsx). Those links predate the marketing site and are live on client
 *  sites, so they must keep resolving to the portal rather than the homepage. */
function isPortalLink(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.has("portal") || params.has("clientId");
}

function ConsoleFallback() {
  const { t } = useLang();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#05060a] text-sm text-[#8c93ac]">
      {t("misc.loadingConsole")}
    </div>
  );
}

function Routes() {
  const { path } = useRouter();

  if (path === "/manager" || isPortalLink()) {
    /* The console is an internal English tool and its layout was never built
       for RTL. Pin it left-to-right so the site's Arabic default, which sets
       dir on <html>, does not reach in and mirror the dashboard. */
    return (
      <div dir="ltr" lang="en">
        <Suspense fallback={<ConsoleFallback />}>
          <Manager />
        </Suspense>
      </div>
    );
  }

  const Demo = DEMOS[path];
  if (Demo) return <Demo />;

  return (
    <Layout>
      {path === "/" ? <HomePage /> : null}
      {path === "/mission" ? <MissionPage /> : null}
      {path === "/testing" ? <TestingPage /> : null}
      {path === "/coreos-ai" ? <CoreOsAiPage /> : null}
      {path === "/contact" ? <ContactPage /> : null}
      {!["/", "/mission", "/testing", "/coreos-ai", "/contact"].includes(
        path,
      ) ? (
        <NotFound path={path} />
      ) : null}
    </Layout>
  );
}

function NotFound({ path }: { path: string }) {
  const { t } = useLang();

  return (
    <section className="mx-auto max-w-2xl px-5 py-32 text-center">
      <p className="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-[#1878dc]">
        404
      </p>
      <h1 className="mt-4 font-brand text-[clamp(2rem,5vw,3rem)] font-extrabold tracking-[-0.03em] text-white">
        {t("nf.h1")} <span dir="ltr">{path}</span>
      </h1>
      <p className="mt-4 text-[15.5px] text-[#a4abc4]">{t("nf.p")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-[#6c7bf0] px-5 py-3 text-[14.5px] font-semibold text-[#05060a] hover:bg-[#8390f4]"
        >
          {t("nf.back")}
        </Link>
        <Link
          to="/coreos-ai"
          className="rounded-xl border border-[#232b40] px-5 py-3 text-[14.5px] font-semibold text-[#c3c9dd] hover:border-[#3a4460] hover:text-white"
        >
          {t("nf.lab")}
        </Link>
      </div>
    </section>
  );
}

export default function Root() {
  return (
    <LangProvider>
      <RouterProvider>
        <Routes />
      </RouterProvider>
    </LangProvider>
  );
}
