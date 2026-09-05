/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cross-origin access for the endpoints an operator drives from outside the site.
 *
 * The operator console (coreos-operator.html) runs from a file on someone's own
 * machine, so its origin is `null` and every call it makes to a deployment is
 * cross-origin. Without these headers the browser refuses the request before it
 * is ever sent, and the console can read a deployment's health but never change
 * its model — which is the one thing it exists to do.
 *
 * WHY `*` DOES NOT WEAKEN /api/lab/settings.
 *
 * The gate on that endpoint is ADMIN_TOKEN, compared in a way that does not
 * short-circuit on the first wrong byte, and it was never the browser's origin.
 * A hostile page could always have POSTed here; what it could not do, and still
 * cannot, is know the token. Allowing the response to be read back changes
 * nothing for a caller that cannot get past the 401.
 *
 * It matters that the token travels in a header rather than a cookie: with
 * `allow-origin: *` a browser will not attach credentials, so there is no
 * ambient authority for a hostile page to ride on. A cookie-authenticated
 * version of this endpoint would need an origin allowlist instead.
 */

/** Headers to merge into every cross-origin response. */
export const CORS_HEADERS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, PUT, POST, OPTIONS",
  /* x-admin-token is what makes the request preflighted in the first place. */
  "access-control-allow-headers": "content-type, x-admin-token",
  "access-control-max-age": "86400",
};

/** Answer a preflight, or null when this is a real request to get on with. */
export function preflight(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/** The same response, with the cross-origin headers added. */
export function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
