/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/** Single source of truth for the address every contact link points at. */
export const CONTACT_EMAIL = "coreosgmail.com@gmail.com";

/** Display form of the WhatsApp number, spaced for readability. */
export const CONTACT_PHONE_DISPLAY = "+964 770 609 4646";

/** wa.me wants digits only — no plus, no spaces, country code included. */
const WHATSAPP_DIGITS = "9647706094646";

/** Builds a mailto: URL with a pre-filled subject and body. */
export function mailto(subject: string, body = ""): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set("body", body);
  return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * Builds a wa.me URL, optionally pre-filling the first message.
 *
 * WhatsApp is the default business channel across the region, and the contact
 * page already tells people we would rather call than trade emails — so it
 * needs to offer a way to start that conversation, not just a mailto.
 */
export function whatsapp(message = ""): string {
  const base = `https://wa.me/${WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
