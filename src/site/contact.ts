/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Single source of truth for the address every contact link points at. */
export const CONTACT_EMAIL = "coreosgmail.com@gmail.com";

/** Builds a mailto: URL with a pre-filled subject and body. */
export function mailto(subject: string, body = ""): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}
