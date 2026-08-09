/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Public catalogue for the CoreOs testing programme.
 *
 * Every agent here is published under a CoreOs codename only. The mapping from
 * a codename to the engine that actually answers lives server-side in
 * server.ts (LAB_ENGINES) and is never serialised to the browser — testers
 * judge the output, not the badge on the box.
 */

export type AgentGroup = "coreos" | "coreos-ai";

export interface PublicAgent {
  /** Stable id used by the /api/lab/chat endpoint. */
  slug: string;
  /** Invented CoreOs codename shown to testers. */
  name: string;
  /** One-line positioning statement. */
  tagline: string;
  /** Short grouping label used for the filter chips. */
  category: string;
  /** What people should point this agent at. */
  uses: string[];
  /** Behavioural characteristics, rendered as small pills. */
  traits: string[];
  group: AgentGroup;
  /** Two-letter monogram for the avatar tile. */
  monogram: string;
}

/* -------------------------------------------------------------------------
   CoreOs — 11 business agents currently in open testing
   ------------------------------------------------------------------------- */

export const OPEN_TESTING: PublicAgent[] = [
  {
    slug: "verano",
    name: "Verano",
    tagline: "The front-line support desk that never puts anyone on hold.",
    category: "Support",
    monogram: "VR",
    uses: [
      "Answering repeat customer questions from your own policies",
      "First-response triage before a human picks the ticket up",
      "Out-of-hours cover for small teams",
    ],
    traits: ["Warm tone", "Escalates early", "Policy-bound"],
    group: "coreos",
  },
  {
    slug: "kestrel",
    name: "Kestrel",
    tagline: "Qualifies inbound leads before they reach your calendar.",
    category: "Sales",
    monogram: "KS",
    uses: [
      "Asking the five questions your sales team always asks",
      "Scoring enquiries by budget, timeline and fit",
      "Handing warm leads to a human with a written summary",
    ],
    traits: ["Direct", "Structured output", "Never oversells"],
    group: "coreos",
  },
  {
    slug: "marlowe",
    name: "Marlowe",
    tagline: "Reads the long document so your staff can read the summary.",
    category: "Documents",
    monogram: "MW",
    uses: [
      "Pulling obligations and dates out of supplier contracts",
      "Turning a forty-page policy into a one-page brief",
      "Flagging clauses that need a human lawyer's eyes",
    ],
    traits: ["Cautious", "Quotes the source", "Long context"],
    group: "coreos",
  },
  {
    slug: "sable",
    name: "Sable",
    tagline: "Billing questions answered without opening the finance inbox.",
    category: "Finance ops",
    monogram: "SB",
    uses: [
      "Explaining a line item on an invoice in plain language",
      "Chasing overdue payments politely and on schedule",
      "Reconciling what a customer says they paid against what you logged",
    ],
    traits: ["Precise", "Numerate", "Audit-friendly"],
    group: "coreos",
  },
  {
    slug: "onyxa",
    name: "Onyxa",
    tagline: "One front desk, three languages, no extra headcount.",
    category: "Multilingual",
    monogram: "ON",
    uses: [
      "Serving English, Arabic and Kurdish customers from one inbox",
      "Keeping brand tone consistent across languages",
      "Translating an internal reply into the customer's language",
    ],
    traits: ["English / العربية / کوردی", "Tone-stable", "Script-aware"],
    group: "coreos",
  },
  {
    slug: "piper",
    name: "Piper",
    tagline: "Books, moves and confirms appointments in a sentence.",
    category: "Scheduling",
    monogram: "PP",
    uses: [
      "Taking booking requests from chat or email",
      "Offering the next three realistic slots instead of a blank calendar",
      "Sending reminders and handling reschedules",
    ],
    traits: ["Fast", "Confirms twice", "Timezone-safe"],
    group: "coreos",
  },
  {
    slug: "halden",
    name: "Halden",
    tagline: "Your internal handbook, but it answers back.",
    category: "Knowledge",
    monogram: "HD",
    uses: [
      "Answering staff questions from your own SOPs",
      "Onboarding new hires without tying up a senior colleague",
      "Finding the one paragraph that actually applies",
    ],
    traits: ["Cites the doc", "Says 'I don't know'", "Internal-only"],
    group: "coreos",
  },
  {
    slug: "cirro",
    name: "Cirro",
    tagline: "Where is my order, answered before anyone has to ask twice.",
    category: "Logistics",
    monogram: "CR",
    uses: [
      "Order and delivery status lookups",
      "Explaining a delay honestly and offering the next step",
      "Stock and availability questions at the counter",
    ],
    traits: ["Literal", "No false promises", "High volume"],
    group: "coreos",
  },
  {
    slug: "wren",
    name: "Wren",
    tagline: "Drafts the reply; a human still presses send.",
    category: "Comms",
    monogram: "WR",
    uses: [
      "Turning bullet points into a finished customer email",
      "Rewriting a blunt reply into something you would sign",
      "Keeping three channels on the same brand voice",
    ],
    traits: ["Draft-first", "Human in the loop", "Voice-matched"],
    group: "coreos",
  },
  {
    slug: "tamsin",
    name: "Tamsin",
    tagline: "Walks new joiners through week one, patiently.",
    category: "People ops",
    monogram: "TM",
    uses: [
      "Answering the same twenty onboarding questions",
      "Checking that paperwork and training steps are done",
      "Pointing people at the right colleague, not just the right document",
    ],
    traits: ["Patient", "Checklist-driven", "Never impatient"],
    group: "coreos",
  },
  {
    slug: "bramble",
    name: "Bramble",
    tagline: "Sorts the feedback pile into things you can act on.",
    category: "Insight",
    monogram: "BR",
    uses: [
      "Grouping reviews and survey replies into themes",
      "Separating an urgent complaint from a mild grumble",
      "Producing a weekly what-changed summary for the owner",
    ],
    traits: ["Analytical", "Ranked output", "Blunt when needed"],
    group: "coreos",
  },
];

/* -------------------------------------------------------------------------
   CoreOs.ai — 20 codenamed models open for testing
   ------------------------------------------------------------------------- */

export const LAB_MODELS: PublicAgent[] = [
  {
    slug: "aurelis",
    name: "Aurelis",
    tagline: "Takes its time and thinks the whole problem through.",
    category: "Reasoning",
    monogram: "AU",
    uses: [
      "Multi-step problems where the first answer is usually wrong",
      "Weighing trade-offs with the reasoning shown",
      "Working out why two sources disagree",
    ],
    traits: ["Deliberate", "Shows working", "Long answers"],
    group: "coreos-ai",
  },
  {
    slug: "nimbex",
    name: "Nimbex",
    tagline: "Everyday answers, back before you finish reading the question.",
    category: "General",
    monogram: "NX",
    uses: [
      "Quick factual questions and short rewrites",
      "High-volume chat where latency matters more than depth",
      "A first pass you can escalate if it isn't enough",
    ],
    traits: ["Very fast", "Concise", "Low cost"],
    group: "coreos-ai",
  },
  {
    slug: "solvane",
    name: "Solvane",
    tagline: "Numbers, and the arithmetic to back them up.",
    category: "Analysis",
    monogram: "SV",
    uses: [
      "Percentages, margins, unit economics and pricing checks",
      "Sanity-checking a figure someone put in a deck",
      "Step-by-step calculations you can audit",
    ],
    traits: ["Numerate", "Step-by-step", "Flags assumptions"],
    group: "coreos-ai",
  },
  {
    slug: "quillex",
    name: "Quillex",
    tagline: "Editing that tightens the text without flattening the voice.",
    category: "Writing",
    monogram: "QX",
    uses: [
      "Cutting a rambling paragraph in half",
      "Fixing grammar while keeping the writer's register",
      "Adapting one piece of copy for three audiences",
    ],
    traits: ["Light touch", "Voice-preserving", "Explains edits"],
    group: "coreos-ai",
  },
  {
    slug: "tessara",
    name: "Tessara",
    tagline: "Writes code that runs the first time more often than not.",
    category: "Engineering",
    monogram: "TS",
    uses: [
      "Small scripts, functions and glue code",
      "Converting a spec into a working starting point",
      "Adding tests to code that never had any",
    ],
    traits: ["Idiomatic", "Comments sparingly", "Runnable output"],
    group: "coreos-ai",
  },
  {
    slug: "verith",
    name: "Verith",
    tagline: "Checks the claim instead of agreeing with it.",
    category: "Research",
    monogram: "VT",
    uses: [
      "Pressure-testing a statement before it goes public",
      "Separating what is established from what is asserted",
      "Summarising research without smoothing over the caveats",
    ],
    traits: ["Sceptical", "Flags uncertainty", "Refuses to guess"],
    group: "coreos-ai",
  },
  {
    slug: "lumora",
    name: "Lumora",
    tagline: "Twenty ideas, then help picking the three worth keeping.",
    category: "Creative",
    monogram: "LM",
    uses: [
      "Naming, campaign angles and product concepts",
      "Breaking a team out of the obvious answer",
      "Divergent lists you can narrow down together",
    ],
    traits: ["High variance", "Playful", "Volume-first"],
    group: "coreos-ai",
  },
  {
    slug: "draven",
    name: "Draven",
    tagline: "Reads the stack trace and tells you what actually broke.",
    category: "Engineering",
    monogram: "DV",
    uses: [
      "Explaining an error message in plain language",
      "Narrowing a bug to the likely line",
      "Suggesting the smallest fix rather than a rewrite",
    ],
    traits: ["Diagnostic", "Minimal fixes", "Asks for context"],
    group: "coreos-ai",
  },
  {
    slug: "calyx",
    name: "Calyx",
    tagline: "Turns messy text into clean rows and fields.",
    category: "Data",
    monogram: "CX",
    uses: [
      "Pulling names, dates and totals out of free text",
      "Normalising inconsistent records into one schema",
      "Producing JSON or CSV another system can ingest",
    ],
    traits: ["Structured output", "Schema-strict", "No embellishment"],
    group: "coreos-ai",
  },
  {
    slug: "orbion",
    name: "Orbion",
    tagline: "Translation that survives the trip to the other language.",
    category: "Language",
    monogram: "OB",
    uses: [
      "English, Arabic and Kurdish business correspondence",
      "Localising marketing copy rather than transliterating it",
      "Checking whether a translated phrase still lands",
    ],
    traits: ["Idiomatic", "Script-aware", "Register-matched"],
    group: "coreos-ai",
  },
  {
    slug: "meridia",
    name: "Meridia",
    tagline: "Turns a vague ambition into a sequence you can start on Monday.",
    category: "Strategy",
    monogram: "MD",
    uses: [
      "Breaking a goal into phases with owners and checkpoints",
      "Stress-testing a plan for the step everyone forgot",
      "Deciding what not to do this quarter",
    ],
    traits: ["Sequenced", "Opinionated", "Names trade-offs"],
    group: "coreos-ai",
  },
  {
    slug: "pyrrha",
    name: "Pyrrha",
    tagline: "Copy written to be chosen, not merely read.",
    category: "Marketing",
    monogram: "PY",
    uses: [
      "Landing page headlines and value propositions",
      "Ad variants for A/B testing",
      "Rewriting feature lists as customer benefits",
    ],
    traits: ["Punchy", "Benefit-led", "Variant-friendly"],
    group: "coreos-ai",
  },
  {
    slug: "vantel",
    name: "Vantel",
    tagline: "Formal documents, explained the way you'd explain them to a friend.",
    category: "Documents",
    monogram: "VN",
    uses: [
      "Plain-English summaries of contracts and terms",
      "Spotting the clause that carries the real risk",
      "Preparing questions to take to an actual lawyer",
    ],
    traits: ["Conservative", "Never advises", "Risk-flagging"],
    group: "coreos-ai",
  },
  {
    slug: "sorrel",
    name: "Sorrel",
    tagline: "Explains it again, differently, until it lands.",
    category: "Teaching",
    monogram: "SR",
    uses: [
      "Training staff on a new tool or process",
      "Explaining a technical concept to a non-technical team",
      "Building practice questions from your own material",
    ],
    traits: ["Patient", "Analogy-rich", "Checks understanding"],
    group: "coreos-ai",
  },
  {
    slug: "halcyon",
    name: "Halcyon",
    tagline: "De-escalates the reply you shouldn't send as written.",
    category: "Comms",
    monogram: "HC",
    uses: [
      "Softening a message to an unhappy customer",
      "Saying no without burning the relationship",
      "Rewriting an angry internal note into a professional one",
    ],
    traits: ["Calming", "Firm but kind", "Keeps the substance"],
    group: "coreos-ai",
  },
  {
    slug: "zephyrine",
    name: "Zephyrine",
    tagline: "Meeting in, decisions and owners out.",
    category: "Productivity",
    monogram: "ZP",
    uses: [
      "Turning a transcript into minutes and action items",
      "Separating decisions from discussion",
      "Producing a follow-up email nobody has to edit",
    ],
    traits: ["Terse", "Action-oriented", "Attributes owners"],
    group: "coreos-ai",
  },
  {
    slug: "corvid",
    name: "Corvid",
    tagline: "Argues with your plan so a customer doesn't have to.",
    category: "Critique",
    monogram: "CV",
    uses: [
      "Finding the weakest assumption in a proposal",
      "Playing the sceptical buyer before a pitch",
      "Listing the objections you'll actually get",
    ],
    traits: ["Adversarial", "Unflattering", "Specific"],
    group: "coreos-ai",
  },
  {
    slug: "ashlin",
    name: "Ashlin",
    tagline: "Spreadsheet logic, written out and explained.",
    category: "Data",
    monogram: "AS",
    uses: [
      "Writing and debugging formulas",
      "Designing a sheet that won't break next quarter",
      "Explaining what an inherited spreadsheet is doing",
    ],
    traits: ["Formula-fluent", "Explains logic", "Edge-case aware"],
    group: "coreos-ai",
  },
  {
    slug: "nocturne",
    name: "Nocturne",
    tagline: "Holds a very long document in its head and answers from it.",
    category: "Documents",
    monogram: "NC",
    uses: [
      "Question-answering over manuals, reports and archives",
      "Finding the contradiction between page 4 and page 91",
      "Summarising at whatever depth you ask for",
    ],
    traits: ["Very long context", "Quotes precisely", "Patient reader"],
    group: "coreos-ai",
  },
  {
    slug: "ferrous",
    name: "Ferrous",
    tagline: "Documentation an engineer will actually follow.",
    category: "Engineering",
    monogram: "FR",
    uses: [
      "READMEs, runbooks and API references",
      "Writing the setup steps in the order they must be done",
      "Documenting code that was never documented",
    ],
    traits: ["Structured", "Example-heavy", "No filler"],
    group: "coreos-ai",
  },
];

export const ALL_AGENTS: PublicAgent[] = [...OPEN_TESTING, ...LAB_MODELS];

export function findAgent(slug: string): PublicAgent | undefined {
  return ALL_AGENTS.find((a) => a.slug === slug);
}
