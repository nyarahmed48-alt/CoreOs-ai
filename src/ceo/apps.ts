/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Everything this project has built, in one list.
 *
 * Every entry is an absolute URL: this console is a file the owner keeps, not
 * a page on the site, and it is deliberately not reachable from the site at
 * all. Adding something new and forgetting to add it here is the failure mode,
 * so the list is a file of its own — one place to open when something ships.
 */

const SITE = "https://coreosai.netlify.app";

export interface AppLink {
  name: string;
  what: string;
  /** Always a full URL. This console is a file on the owner's own device and
      has no site around it, so there are no relative paths to follow. */
  to: string;
  /** Shown as a quiet note — a warning, a password requirement, a caveat. */
  note?: string;
  /** Not deployed yet: the link is shown, and marked. */
  unbuilt?: boolean;
}

export interface AppGroup {
  title: string;
  blurb: string;
  apps: AppLink[];
}

export const GROUPS: AppGroup[] = [
  {
    title: "Running a shop",
    blurb: "The products with customers on the other end.",
    apps: [
      {
        name: "CoreCashier",
        what: "The till — Arabic, Kurdish and English, scanner, debt book, cashier PINs.",
        to: `${SITE}/pos`,
        unbuilt: true,
        note: "Not deployed — use the tablet file",
      },
      {
        name: "SaaS manager",
        what: "The internal client console. English, left to right, not linked from the site.",
        to: `${SITE}/manager`,
      },
      {
        name: "Lab admin",
        what: "Change the agent model and key without a deploy.",
        to: `${SITE}/admin`,
        note: "Asks for ADMIN_TOKEN",
      },
    ],
  },
  {
    title: "The public site",
    blurb: "What a visitor sees. Arabic first, English a press away.",
    apps: [
      { name: "Home", what: "Positioning, the affordability mission, the agents.", to: SITE },
      { name: "Mission", what: "The two commitments, written out.", to: `${SITE}/mission` },
      { name: "Testing", what: "The eleven business agents open for public testing.", to: `${SITE}/testing` },
      { name: "CoreOs.ai", what: "The open model lab — twenty codenamed models.", to: `${SITE}/coreos-ai` },
      { name: "Contact", what: "Every route to the inbox.", to: `${SITE}/contact` },
    ],
  },
  {
    title: "Demo shops",
    blurb: "Whole sites of their own, for showing a prospect what they would get.",
    apps: [
      { name: "Barber", what: "Barbershop demo site.", to: `${SITE}/demos/barber` },
      { name: "Nails", what: "Nail salon demo site.", to: `${SITE}/demos/nails` },
      { name: "Restaurant", what: "Restaurant demo site.", to: `${SITE}/demos/restaurant` },
    ],
  },
  {
    title: "Planning",
    blurb: "Not apps — the papers you work from.",
    apps: [
      {
        name: "Till order sheet",
        what: "67 things the till could do next, with build sizes. Tick and send the codes.",
        to: "https://claude.ai/code/artifact/2383fe77-9793-4e9e-b346-5a7b0101edae",
      },
      {
        name: "The branch",
        what: "Every commit behind the till, on GitHub.",
        to: "https://github.com/nyarahmed48-alt/CoreOs-ai/tree/claude/pos-system-s4fsux",
      },
    ],
  },
];
