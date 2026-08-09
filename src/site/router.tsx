/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A ~60 line History API router. The site has five routes and no data
 * loading, so pulling in a routing library would cost more than it returns.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface RouterValue {
  path: string;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
}

const RouterContext = createContext<RouterValue>({
  path: "/",
  navigate: () => {},
});

function normalise(raw: string): string {
  const clean = raw.split("?")[0].split("#")[0];
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean || "/";
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => normalise(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPath(normalise(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback(
    (to: string, opts?: { replace?: boolean }) => {
      const next = normalise(to);
      if (next === normalise(window.location.pathname)) return;
      if (opts?.replace) window.history.replaceState({}, "", next);
      else window.history.pushState({}, "", next);
      setPath(next);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    },
    [],
  );

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);
  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}

/** An anchor that stays a real link (middle-click, open-in-new-tab) but
 *  navigates client-side on a plain left click. */
export function Link({
  to,
  children,
  className = "",
  onNavigate,
  ...rest
}: {
  to: string;
  children: ReactNode;
  className?: string;
  onNavigate?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
        onNavigate?.();
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
