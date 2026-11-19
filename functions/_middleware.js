// A missing hashed script must not come back as the HTML page.
// Browsers then refuse it, and can remember that wrong response.
export async function onRequest(context) {
  context.passThroughOnException();
  const { request, env, next } = context;
  const path = new URL(request.url).pathname;
  if (!path.startsWith("/assets/")) return next();

  const assets = env && env.ASSETS;
  if (!assets || typeof assets.fetch !== "function") return next();

  const asset = await assets.fetch(request);
  const type = asset.headers.get("content-type") || "";
  if (asset.ok && !type.includes("text/html")) return asset;

  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
