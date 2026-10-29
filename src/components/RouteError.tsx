import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { AlertTriangle, Home, RotateCw } from "lucide-react";

const RELOADED_KEY = "devzgo.errorReload";

const STALE_CODE = [
  "must be used within",
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
];

function describe(error: unknown): { title: string; detail: string } {
  if (isRouteErrorResponse(error)) {
    return {
      title: error.status === 404 ? "This page doesn't exist" : `Something went wrong (${error.status})`,
      detail: error.statusText || "",
    };
  }
  const detail = error instanceof Error ? error.message : String(error ?? "");
  return { title: "Something went wrong on this page", detail };
}

/**
 * Shown instead of a page that crashed. Errors caused by old code still in the browser (after a
 * deploy, or a hot reload in development) reload the page once on their own.
 */
export function RouteError() {
  const error = useRouteError();
  const { title, detail } = describe(error);
  const stale = STALE_CODE.some((text) => detail.includes(text));

  useEffect(() => {
    if (!stale || sessionStorage.getItem(RELOADED_KEY)) return;
    sessionStorage.setItem(RELOADED_KEY, "1");
    window.location.reload();
  }, [stale]);

  useEffect(() => {
    const clear = window.setTimeout(() => sessionStorage.removeItem(RELOADED_KEY), 10_000);
    return () => window.clearTimeout(clear);
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f6f0] px-4 text-stone-900">
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-maroon-800">
          <AlertTriangle className="h-6 w-6" aria-hidden />
        </span>
        <h1 className="mt-4 font-serif text-3xl font-normal text-stone-900">{title}</h1>
        <p className="mt-2 text-sm text-stone-600">
          {stale
            ? "A newer version of DevZ-Go is available. Reload to continue."
            : "Your work elsewhere is safe. Reload the page, or head back home and try again."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-full bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-amber-50 hover:bg-maroon-900"
          >
            <RotateCw className="h-4 w-4" aria-hidden /> Reload page
          </button>
          <a
            href="/home"
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            <Home className="h-4 w-4" aria-hidden /> Go home
          </a>
        </div>
        {import.meta.env.DEV && detail && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-stone-500">Details</summary>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-stone-50 p-3 font-mono text-xs text-stone-700">
              {detail}
            </pre>
          </details>
        )}
      </div>
    </main>
  );
}
