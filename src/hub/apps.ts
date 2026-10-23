/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Everything this project has built, in one list.
 *
 * Adding a route to the app and forgetting to add it here is the failure mode,
 * so the list is kept beside the launcher rather than inside it — one file to
 * open when something new ships.
 */

export interface AppLink {
  name: string;
  what: string;
  /** A path on this site, or a full URL for anything hosted elsewhere. */
  to: string;
  /** Opens in a new tab rather than taking over the launcher. */
  external?: boolean;
  /** Shown as a quiet note — a warning, a password requirement, a caveat. */
  note?: string;
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
        name: "The till",
        what: "Point of sale — Arabic, Kurdish and English, scanner, debt book, cashier PINs.",
        to: "/pos",
      },
      {
        name: "SaaS manager",
        what: "The internal client console. English, left to right, not linked from the site.",
        to: "/manager",
      },
      {
        name: "Lab admin",
        what: "Change the agent model and key without a deploy.",
        to: "/admin",
        external: true,
        note: "Asks for ADMIN_TOKEN",
      },
    ],
  },
  {
    title: "The public site",
    blurb: "What a visitor sees. Arabic first, English a press away.",
    apps: [
      { name: "Home", what: "Positioning, the affordability mission, the agents.", to: "/" },
      { name: "Mission", what: "The two commitments, written out.", to: "/mission" },
      { name: "Testing", what: "The eleven business agents open for public testing.", to: "/testing" },
      { name: "CoreOs.ai", what: "The open model lab — twenty codenamed models.", to: "/coreos-ai" },
      { name: "Contact", what: "Every route to the inbox.", to: "/contact" },
    ],
  },
  {
    title: "Demo shops",
    blurb: "Whole sites of their own, for showing a prospect what they would get.",
    apps: [
      { name: "Barber", what: "Barbershop demo site.", to: "/demos/barber" },
      { name: "Nails", what: "Nail salon demo site.", to: "/demos/nails" },
      { name: "Restaurant", what: "Restaurant demo site.", to: "/demos/restaurant" },
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
        external: true,
      },
      {
        name: "The branch",
        what: "Every commit behind the till, on GitHub.",
        to: "https://github.com/nyarahmed48-alt/CoreOs-ai/tree/claude/pos-system-s4fsux",
        external: true,
      },
    ],
  },
];
