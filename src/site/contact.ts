/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The single contact route for the whole site.
 *
 * Everything that invites someone to get in touch points here. There is
 * deliberately no phone number and no email address anywhere on the public
 * site: one form means enquiries arrive in one place, in a consistent shape,
 * and no personal contact details are left sitting on a page for scrapers.
 *
 * If this ever changes, it changes here and nowhere else.
 */
export const CONTACT_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdUwT349lsfBaom8nuhw3fWeJ7TjV0cIrM2Xd49RXhQKJxHFQ/viewform";

/** Props every link to the form needs, so none of them forgets `noopener`. */
export const FORM_LINK_PROPS = {
  href: CONTACT_FORM_URL,
  target: "_blank",
  rel: "noopener noreferrer",
} as const;

/** Public social accounts. The only other places CoreOs can be reached. */
export const SOCIALS = {
  instagram: { handle: "@core.os44", url: "https://instagram.com/core.os44" },
  tiktok: { handle: "@coreos44", url: "https://tiktok.com/@coreos44" },
} as const;
