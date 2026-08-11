/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Public catalogue for the CoreOs testing programme.
 *
 * Every agent here is published under a CoreOs codename only. The mapping from
 * a codename to the engine that actually answers lives server-side in
 * lab/agents.ts (LAB_ENGINES) and is never serialised to the browser — testers
 * judge the output, not the badge on the box.
 *
 * Copy is bilingual and lives inline rather than in a parallel Arabic file, so
 * adding an agent is one edit in one place and the two languages cannot drift
 * apart. Codenames and monograms are names: they stay in Latin script.
 */

import type { Copy } from "./strings";

export type AgentGroup = "coreos" | "coreos-ai";

export interface PublicAgent {
  /** Stable id used by the /api/lab/chat endpoint. */
  slug: string;
  /** Invented CoreOs codename shown to testers. Not translated. */
  name: string;
  /** One-line positioning statement. */
  tagline: Copy;
  /** Short grouping label used for the filter chips. */
  category: Copy;
  /** What people should point this agent at. */
  uses: Copy[];
  /** Behavioural characteristics, rendered as small pills. */
  traits: Copy[];
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
    tagline: {
      ar: "مكتب الدعم الأمامي الذي لا يضع أحدًا في الانتظار.",
      en: "The front-line support desk that never puts anyone on hold.",
    },
    category: { ar: "دعم", en: "Support" },
    monogram: "VR",
    uses: [
      { ar: "الإجابة عن أسئلة العملاء المتكررة من سياساتك أنت", en: "Answering repeat customer questions from your own policies" },
      { ar: "الفرز الأولي قبل أن يستلم موظف التذكرة", en: "First-response triage before a human picks the ticket up" },
      { ar: "تغطية ما بعد الدوام للفرق الصغيرة", en: "Out-of-hours cover for small teams" },
    ],
    traits: [
      { ar: "نبرة ودودة", en: "Warm tone" },
      { ar: "يُصعّد مبكرًا", en: "Escalates early" },
      { ar: "ملتزم بالسياسات", en: "Policy-bound" },
    ],
    group: "coreos",
  },
  {
    slug: "kestrel",
    name: "Kestrel",
    tagline: {
      ar: "يفرز العملاء المحتملين قبل أن يصلوا إلى جدولك.",
      en: "Qualifies inbound leads before they reach your calendar.",
    },
    category: { ar: "مبيعات", en: "Sales" },
    monogram: "KS",
    uses: [
      { ar: "طرح الأسئلة الخمسة التي يطرحها فريق مبيعاتك دائمًا", en: "Asking the five questions your sales team always asks" },
      { ar: "تقييم الاستفسارات حسب الميزانية والتوقيت ومدى الملاءمة", en: "Scoring enquiries by budget, timeline and fit" },
      { ar: "تسليم العملاء الجاهزين إلى موظف مع ملخّص مكتوب", en: "Handing warm leads to a human with a written summary" },
    ],
    traits: [
      { ar: "مباشر", en: "Direct" },
      { ar: "مُخرَج منظّم", en: "Structured output" },
      { ar: "لا يبالغ في البيع", en: "Never oversells" },
    ],
    group: "coreos",
  },
  {
    slug: "marlowe",
    name: "Marlowe",
    tagline: {
      ar: "يقرأ المستند الطويل ليقرأ موظفوك الملخّص.",
      en: "Reads the long document so your staff can read the summary.",
    },
    category: { ar: "مستندات", en: "Documents" },
    monogram: "MW",
    uses: [
      { ar: "استخراج الالتزامات والتواريخ من عقود المورّدين", en: "Pulling obligations and dates out of supplier contracts" },
      { ar: "تحويل سياسة من أربعين صفحة إلى موجز من صفحة واحدة", en: "Turning a forty-page policy into a one-page brief" },
      { ar: "الإشارة إلى البنود التي تحتاج عين محامٍ", en: "Flagging clauses that need a human lawyer's eyes" },
    ],
    traits: [
      { ar: "متحفّظ", en: "Cautious" },
      { ar: "يقتبس المصدر", en: "Quotes the source" },
      { ar: "سياق طويل", en: "Long context" },
    ],
    group: "coreos",
  },
  {
    slug: "sable",
    name: "Sable",
    tagline: {
      ar: "أسئلة الفواتير تُجاب دون فتح بريد المحاسبة.",
      en: "Billing questions answered without opening the finance inbox.",
    },
    category: { ar: "عمليات مالية", en: "Finance ops" },
    monogram: "SB",
    uses: [
      { ar: "شرح بند في فاتورة بلغة واضحة", en: "Explaining a line item on an invoice in plain language" },
      { ar: "متابعة المدفوعات المتأخرة بلباقة وفي موعدها", en: "Chasing overdue payments politely and on schedule" },
      { ar: "مطابقة ما يقول العميل إنه دفعه بما سجّلته أنت", en: "Reconciling what a customer says they paid against what you logged" },
    ],
    traits: [
      { ar: "دقيق", en: "Precise" },
      { ar: "قوي في الأرقام", en: "Numerate" },
      { ar: "قابل للتدقيق", en: "Audit-friendly" },
    ],
    group: "coreos",
  },
  {
    slug: "onyxa",
    name: "Onyxa",
    tagline: {
      ar: "مكتب استقبال واحد، وثلاث لغات، وبلا موظفين إضافيين.",
      en: "One front desk, three languages, no extra headcount.",
    },
    category: { ar: "متعدد اللغات", en: "Multilingual" },
    monogram: "ON",
    uses: [
      { ar: "خدمة العملاء بالإنجليزية والعربية والكردية من صندوق وارد واحد", en: "Serving English, Arabic and Kurdish customers from one inbox" },
      { ar: "الحفاظ على نبرة العلامة نفسها عبر اللغات", en: "Keeping brand tone consistent across languages" },
      { ar: "ترجمة رد داخلي إلى لغة العميل", en: "Translating an internal reply into the customer's language" },
    ],
    traits: [
      { ar: "English / العربية / کوردی", en: "English / العربية / کوردی" },
      { ar: "نبرة ثابتة", en: "Tone-stable" },
      { ar: "يراعي الحروف", en: "Script-aware" },
    ],
    group: "coreos",
  },
  {
    slug: "piper",
    name: "Piper",
    tagline: {
      ar: "يحجز المواعيد ويغيّرها ويؤكّدها في جملة واحدة.",
      en: "Books, moves and confirms appointments in a sentence.",
    },
    category: { ar: "جدولة", en: "Scheduling" },
    monogram: "PP",
    uses: [
      { ar: "استقبال طلبات الحجز من الدردشة أو البريد", en: "Taking booking requests from chat or email" },
      { ar: "عرض المواعيد الثلاثة الواقعية التالية بدل جدول فارغ", en: "Offering the next three realistic slots instead of a blank calendar" },
      { ar: "إرسال التذكيرات ومعالجة إعادة الجدولة", en: "Sending reminders and handling reschedules" },
    ],
    traits: [
      { ar: "سريع", en: "Fast" },
      { ar: "يؤكّد مرتين", en: "Confirms twice" },
      { ar: "يراعي المناطق الزمنية", en: "Timezone-safe" },
    ],
    group: "coreos",
  },
  {
    slug: "halden",
    name: "Halden",
    tagline: { ar: "دليلك الداخلي، لكنه يردّ عليك.", en: "Your internal handbook, but it answers back." },
    category: { ar: "معرفة", en: "Knowledge" },
    monogram: "HD",
    uses: [
      { ar: "الإجابة عن أسئلة الموظفين من إجراءاتك المعتمدة", en: "Answering staff questions from your own SOPs" },
      { ar: "تهيئة الموظفين الجدد دون شغل زميل خبير", en: "Onboarding new hires without tying up a senior colleague" },
      { ar: "إيجاد الفقرة الوحيدة التي تنطبق فعلًا", en: "Finding the one paragraph that actually applies" },
    ],
    traits: [
      { ar: "يستشهد بالمستند", en: "Cites the doc" },
      { ar: "يقول «لا أعرف»", en: "Says 'I don't know'" },
      { ar: "للاستخدام الداخلي", en: "Internal-only" },
    ],
    group: "coreos",
  },
  {
    slug: "cirro",
    name: "Cirro",
    tagline: {
      ar: "«أين طلبي؟» تُجاب قبل أن يضطر أحد للسؤال مرتين.",
      en: "Where is my order, answered before anyone has to ask twice.",
    },
    category: { ar: "لوجستيات", en: "Logistics" },
    monogram: "CR",
    uses: [
      { ar: "الاستعلام عن حالة الطلب والتوصيل", en: "Order and delivery status lookups" },
      { ar: "شرح التأخير بصدق مع اقتراح الخطوة التالية", en: "Explaining a delay honestly and offering the next step" },
      { ar: "أسئلة المخزون والتوفّر عند نقطة البيع", en: "Stock and availability questions at the counter" },
    ],
    traits: [
      { ar: "حرفي", en: "Literal" },
      { ar: "بلا وعود كاذبة", en: "No false promises" },
      { ar: "حجم كبير", en: "High volume" },
    ],
    group: "coreos",
  },
  {
    slug: "wren",
    name: "Wren",
    tagline: { ar: "يصوغ الرد؛ والإنسان هو من يضغط إرسال.", en: "Drafts the reply; a human still presses send." },
    category: { ar: "مراسلات", en: "Comms" },
    monogram: "WR",
    uses: [
      { ar: "تحويل نقاط سريعة إلى رسالة عميل مكتملة", en: "Turning bullet points into a finished customer email" },
      { ar: "إعادة صياغة رد فظّ إلى شيء توقّع عليه باسمك", en: "Rewriting a blunt reply into something you would sign" },
      { ar: "إبقاء ثلاث قنوات على نبرة العلامة نفسها", en: "Keeping three channels on the same brand voice" },
    ],
    traits: [
      { ar: "المسودة أولًا", en: "Draft-first" },
      { ar: "بإشراف بشري", en: "Human in the loop" },
      { ar: "مطابق للنبرة", en: "Voice-matched" },
    ],
    group: "coreos",
  },
  {
    slug: "tamsin",
    name: "Tamsin",
    tagline: { ar: "يرافق الموظف الجديد في أسبوعه الأول، بصبر.", en: "Walks new joiners through week one, patiently." },
    category: { ar: "شؤون الموظفين", en: "People ops" },
    monogram: "TM",
    uses: [
      { ar: "الإجابة عن أسئلة التهيئة العشرين نفسها", en: "Answering the same twenty onboarding questions" },
      { ar: "التأكد من إنجاز الأوراق وخطوات التدريب", en: "Checking that paperwork and training steps are done" },
      { ar: "توجيه الناس إلى الزميل الصحيح، لا إلى المستند الصحيح فقط", en: "Pointing people at the right colleague, not just the right document" },
    ],
    traits: [
      { ar: "صبور", en: "Patient" },
      { ar: "يعمل بقوائم تحقق", en: "Checklist-driven" },
      { ar: "لا ينفد صبره", en: "Never impatient" },
    ],
    group: "coreos",
  },
  {
    slug: "bramble",
    name: "Bramble",
    tagline: {
      ar: "يرتّب كومة الملاحظات إلى أمور يمكنك التصرّف بها.",
      en: "Sorts the feedback pile into things you can act on.",
    },
    category: { ar: "رؤى", en: "Insight" },
    monogram: "BR",
    uses: [
      { ar: "تجميع المراجعات وردود الاستبيانات في محاور", en: "Grouping reviews and survey replies into themes" },
      { ar: "تمييز الشكوى العاجلة عن التذمّر البسيط", en: "Separating an urgent complaint from a mild grumble" },
      { ar: "إعداد ملخّص أسبوعي لما تغيّر يقرأه المالك", en: "Producing a weekly what-changed summary for the owner" },
    ],
    traits: [
      { ar: "تحليلي", en: "Analytical" },
      { ar: "مُخرَج مرتَّب بالأولوية", en: "Ranked output" },
      { ar: "صريح عند اللزوم", en: "Blunt when needed" },
    ],
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
    tagline: { ar: "يتمهّل ويفكّر في المسألة كاملة.", en: "Takes its time and thinks the whole problem through." },
    category: { ar: "استدلال", en: "Reasoning" },
    monogram: "AU",
    uses: [
      { ar: "المسائل متعددة الخطوات التي تكون فيها الإجابة الأولى خاطئة عادة", en: "Multi-step problems where the first answer is usually wrong" },
      { ar: "الموازنة بين البدائل مع إظهار الاستدلال", en: "Weighing trade-offs with the reasoning shown" },
      { ar: "معرفة سبب اختلاف مصدرين", en: "Working out why two sources disagree" },
    ],
    traits: [
      { ar: "متأنٍّ", en: "Deliberate" },
      { ar: "يُظهر خطواته", en: "Shows working" },
      { ar: "إجابات طويلة", en: "Long answers" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "nimbex",
    name: "Nimbex",
    tagline: {
      ar: "إجابات يومية تصل قبل أن تُنهي قراءة السؤال.",
      en: "Everyday answers, back before you finish reading the question.",
    },
    category: { ar: "عام", en: "General" },
    monogram: "NX",
    uses: [
      { ar: "أسئلة سريعة وإعادة صياغة قصيرة", en: "Quick factual questions and short rewrites" },
      { ar: "الدردشة كثيفة الحجم حيث السرعة أهم من العمق", en: "High-volume chat where latency matters more than depth" },
      { ar: "محاولة أولى يمكنك تصعيدها إن لم تكفِ", en: "A first pass you can escalate if it isn't enough" },
    ],
    traits: [
      { ar: "سريع جدًا", en: "Very fast" },
      { ar: "موجز", en: "Concise" },
      { ar: "تكلفة منخفضة", en: "Low cost" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "solvane",
    name: "Solvane",
    tagline: { ar: "أرقام، ومعها الحساب الذي يدعمها.", en: "Numbers, and the arithmetic to back them up." },
    category: { ar: "تحليل", en: "Analysis" },
    monogram: "SV",
    uses: [
      { ar: "النِّسب والهوامش واقتصاديات الوحدة وفحص التسعير", en: "Percentages, margins, unit economics and pricing checks" },
      { ar: "التحقق من رقم وضعه أحدهم في عرض تقديمي", en: "Sanity-checking a figure someone put in a deck" },
      { ar: "حسابات خطوة بخطوة يمكنك تدقيقها", en: "Step-by-step calculations you can audit" },
    ],
    traits: [
      { ar: "قوي في الأرقام", en: "Numerate" },
      { ar: "خطوة بخطوة", en: "Step-by-step" },
      { ar: "يوضّح الافتراضات", en: "Flags assumptions" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "quillex",
    name: "Quillex",
    tagline: { ar: "تحرير يشدّ النص دون أن يطمس صوت كاتبه.", en: "Editing that tightens the text without flattening the voice." },
    category: { ar: "كتابة", en: "Writing" },
    monogram: "QX",
    uses: [
      { ar: "اختصار فقرة مسهبة إلى نصفها", en: "Cutting a rambling paragraph in half" },
      { ar: "تصحيح القواعد مع الحفاظ على أسلوب الكاتب", en: "Fixing grammar while keeping the writer's register" },
      { ar: "تكييف نص واحد لثلاثة جماهير", en: "Adapting one piece of copy for three audiences" },
    ],
    traits: [
      { ar: "لمسة خفيفة", en: "Light touch" },
      { ar: "يحفظ الأسلوب", en: "Voice-preserving" },
      { ar: "يشرح تعديلاته", en: "Explains edits" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "tessara",
    name: "Tessara",
    tagline: { ar: "يكتب كودًا يعمل من أول مرة في الغالب.", en: "Writes code that runs the first time more often than not." },
    category: { ar: "هندسة", en: "Engineering" },
    monogram: "TS",
    uses: [
      { ar: "سكربتات ودوال وأكواد ربط صغيرة", en: "Small scripts, functions and glue code" },
      { ar: "تحويل مواصفة إلى نقطة انطلاق تعمل", en: "Converting a spec into a working starting point" },
      { ar: "إضافة اختبارات لكود لم يكن لديه أي اختبارات", en: "Adding tests to code that never had any" },
    ],
    traits: [
      { ar: "أسلوب سليم", en: "Idiomatic" },
      { ar: "تعليقات مقتصدة", en: "Comments sparingly" },
      { ar: "مُخرَج قابل للتشغيل", en: "Runnable output" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "verith",
    name: "Verith",
    tagline: { ar: "يتحقق من الادّعاء بدل الموافقة عليه.", en: "Checks the claim instead of agreeing with it." },
    category: { ar: "بحث", en: "Research" },
    monogram: "VT",
    uses: [
      { ar: "اختبار عبارة قبل نشرها للعلن", en: "Pressure-testing a statement before it goes public" },
      { ar: "تمييز ما هو ثابت عمّا هو مُدّعى", en: "Separating what is established from what is asserted" },
      { ar: "تلخيص البحث دون تمييع التحفّظات", en: "Summarising research without smoothing over the caveats" },
    ],
    traits: [
      { ar: "متشكّك", en: "Sceptical" },
      { ar: "يوضّح عدم اليقين", en: "Flags uncertainty" },
      { ar: "يرفض التخمين", en: "Refuses to guess" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "lumora",
    name: "Lumora",
    tagline: {
      ar: "عشرون فكرة، ثم مساعدة في اختيار الثلاث التي تستحق.",
      en: "Twenty ideas, then help picking the three worth keeping.",
    },
    category: { ar: "إبداع", en: "Creative" },
    monogram: "LM",
    uses: [
      { ar: "التسمية وزوايا الحملات ومفاهيم المنتجات", en: "Naming, campaign angles and product concepts" },
      { ar: "إخراج الفريق من الإجابة البديهية", en: "Breaking a team out of the obvious answer" },
      { ar: "قوائم متشعّبة يمكنكم تضييقها معًا", en: "Divergent lists you can narrow down together" },
    ],
    traits: [
      { ar: "تنوّع عالٍ", en: "High variance" },
      { ar: "مرِح", en: "Playful" },
      { ar: "الكمّ أولًا", en: "Volume-first" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "draven",
    name: "Draven",
    tagline: { ar: "يقرأ أثر الخطأ ويخبرك بما تعطّل فعلًا.", en: "Reads the stack trace and tells you what actually broke." },
    category: { ar: "هندسة", en: "Engineering" },
    monogram: "DV",
    uses: [
      { ar: "شرح رسالة خطأ بلغة واضحة", en: "Explaining an error message in plain language" },
      { ar: "حصر العلّة في السطر المرجَّح", en: "Narrowing a bug to the likely line" },
      { ar: "اقتراح أصغر إصلاح بدل إعادة كتابة", en: "Suggesting the smallest fix rather than a rewrite" },
    ],
    traits: [
      { ar: "تشخيصي", en: "Diagnostic" },
      { ar: "إصلاحات صغرى", en: "Minimal fixes" },
      { ar: "يطلب السياق", en: "Asks for context" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "calyx",
    name: "Calyx",
    tagline: { ar: "يحوّل النص الفوضوي إلى صفوف وحقول نظيفة.", en: "Turns messy text into clean rows and fields." },
    category: { ar: "بيانات", en: "Data" },
    monogram: "CX",
    uses: [
      { ar: "استخراج الأسماء والتواريخ والمجاميع من نص حر", en: "Pulling names, dates and totals out of free text" },
      { ar: "توحيد سجلات غير متسقة في مخطط واحد", en: "Normalising inconsistent records into one schema" },
      { ar: "إنتاج JSON أو CSV يستطيع نظام آخر استيعابه", en: "Producing JSON or CSV another system can ingest" },
    ],
    traits: [
      { ar: "مُخرَج منظّم", en: "Structured output" },
      { ar: "ملتزم بالمخطط", en: "Schema-strict" },
      { ar: "بلا زخرفة", en: "No embellishment" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "orbion",
    name: "Orbion",
    tagline: { ar: "ترجمة تصمد بعد عبورها إلى اللغة الأخرى.", en: "Translation that survives the trip to the other language." },
    category: { ar: "لغات", en: "Language" },
    monogram: "OB",
    uses: [
      { ar: "المراسلات التجارية بالإنجليزية والعربية والكردية", en: "English, Arabic and Kurdish business correspondence" },
      { ar: "توطين النصوص التسويقية بدل نقلها حرفيًا", en: "Localising marketing copy rather than transliterating it" },
      { ar: "التحقق مما إذا كانت العبارة المترجمة ما زالت تؤدي المعنى", en: "Checking whether a translated phrase still lands" },
    ],
    traits: [
      { ar: "أسلوب سليم", en: "Idiomatic" },
      { ar: "يراعي الحروف", en: "Script-aware" },
      { ar: "مطابق للمستوى اللغوي", en: "Register-matched" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "meridia",
    name: "Meridia",
    tagline: {
      ar: "يحوّل طموحًا غامضًا إلى خطوات تبدأ بها يوم الاثنين.",
      en: "Turns a vague ambition into a sequence you can start on Monday.",
    },
    category: { ar: "استراتيجية", en: "Strategy" },
    monogram: "MD",
    uses: [
      { ar: "تقسيم هدف إلى مراحل بمسؤولين ونقاط مراجعة", en: "Breaking a goal into phases with owners and checkpoints" },
      { ar: "اختبار خطة بحثًا عن الخطوة التي نسيها الجميع", en: "Stress-testing a plan for the step everyone forgot" },
      { ar: "تحديد ما لا ينبغي فعله هذا الربع", en: "Deciding what not to do this quarter" },
    ],
    traits: [
      { ar: "متسلسل", en: "Sequenced" },
      { ar: "له رأي", en: "Opinionated" },
      { ar: "يسمّي المقايضات", en: "Names trade-offs" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "pyrrha",
    name: "Pyrrha",
    tagline: { ar: "نصوص مكتوبة ليُختار المنتج، لا لتُقرأ فحسب.", en: "Copy written to be chosen, not merely read." },
    category: { ar: "تسويق", en: "Marketing" },
    monogram: "PY",
    uses: [
      { ar: "عناوين صفحات الهبوط وعروض القيمة", en: "Landing page headlines and value propositions" },
      { ar: "نسخ إعلانية متعددة لاختبار A/B", en: "Ad variants for A/B testing" },
      { ar: "تحويل قوائم الميزات إلى منافع للعميل", en: "Rewriting feature lists as customer benefits" },
    ],
    traits: [
      { ar: "مؤثّر", en: "Punchy" },
      { ar: "يقود بالمنفعة", en: "Benefit-led" },
      { ar: "متعدد النسخ", en: "Variant-friendly" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "vantel",
    name: "Vantel",
    tagline: {
      ar: "مستندات رسمية، مشروحة كما تشرحها لصديق.",
      en: "Formal documents, explained the way you'd explain them to a friend.",
    },
    category: { ar: "مستندات", en: "Documents" },
    monogram: "VN",
    uses: [
      { ar: "ملخّصات بلغة بسيطة للعقود والشروط", en: "Plain-English summaries of contracts and terms" },
      { ar: "رصد البند الذي يحمل المخاطرة الحقيقية", en: "Spotting the clause that carries the real risk" },
      { ar: "تجهيز أسئلة تأخذها إلى محامٍ حقيقي", en: "Preparing questions to take to an actual lawyer" },
    ],
    traits: [
      { ar: "متحفّظ", en: "Conservative" },
      { ar: "لا يقدّم استشارة", en: "Never advises" },
      { ar: "يشير إلى المخاطر", en: "Risk-flagging" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "sorrel",
    name: "Sorrel",
    tagline: { ar: "يشرحها مرة أخرى، بطريقة مختلفة، حتى تُفهم.", en: "Explains it again, differently, until it lands." },
    category: { ar: "تعليم", en: "Teaching" },
    monogram: "SR",
    uses: [
      { ar: "تدريب الموظفين على أداة أو إجراء جديد", en: "Training staff on a new tool or process" },
      { ar: "شرح مفهوم تقني لفريق غير تقني", en: "Explaining a technical concept to a non-technical team" },
      { ar: "بناء أسئلة تدريبية من موادّك أنت", en: "Building practice questions from your own material" },
    ],
    traits: [
      { ar: "صبور", en: "Patient" },
      { ar: "غنيّ بالتشبيهات", en: "Analogy-rich" },
      { ar: "يتأكد من الفهم", en: "Checks understanding" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "halcyon",
    name: "Halcyon",
    tagline: {
      ar: "يهدّئ الرد الذي لا ينبغي إرساله بصيغته الحالية.",
      en: "De-escalates the reply you shouldn't send as written.",
    },
    category: { ar: "مراسلات", en: "Comms" },
    monogram: "HC",
    uses: [
      { ar: "تلطيف رسالة موجّهة إلى عميل غاضب", en: "Softening a message to an unhappy customer" },
      { ar: "قول «لا» دون حرق العلاقة", en: "Saying no without burning the relationship" },
      { ar: "إعادة صياغة ملاحظة داخلية غاضبة بأسلوب مهني", en: "Rewriting an angry internal note into a professional one" },
    ],
    traits: [
      { ar: "مُهدِّئ", en: "Calming" },
      { ar: "حازم ولطيف", en: "Firm but kind" },
      { ar: "يحفظ المضمون", en: "Keeps the substance" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "zephyrine",
    name: "Zephyrine",
    tagline: { ar: "اجتماع يدخل، وقرارات ومسؤولون يخرجون.", en: "Meeting in, decisions and owners out." },
    category: { ar: "إنتاجية", en: "Productivity" },
    monogram: "ZP",
    uses: [
      { ar: "تحويل محضر مكتوب إلى قرارات وبنود عمل", en: "Turning a transcript into minutes and action items" },
      { ar: "فصل القرارات عن النقاش", en: "Separating decisions from discussion" },
      { ar: "إعداد رسالة متابعة لا يحتاج أحد لتعديلها", en: "Producing a follow-up email nobody has to edit" },
    ],
    traits: [
      { ar: "مقتضب", en: "Terse" },
      { ar: "موجّه للتنفيذ", en: "Action-oriented" },
      { ar: "يحدّد المسؤولين", en: "Attributes owners" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "corvid",
    name: "Corvid",
    tagline: { ar: "يجادل خطتك حتى لا يفعل ذلك عميل.", en: "Argues with your plan so a customer doesn't have to." },
    category: { ar: "نقد", en: "Critique" },
    monogram: "CV",
    uses: [
      { ar: "إيجاد أضعف افتراض في مقترح", en: "Finding the weakest assumption in a proposal" },
      { ar: "تمثيل دور المشتري المتشكّك قبل العرض", en: "Playing the sceptical buyer before a pitch" },
      { ar: "سرد الاعتراضات التي ستواجهها فعلًا", en: "Listing the objections you'll actually get" },
    ],
    traits: [
      { ar: "مُخاصِم", en: "Adversarial" },
      { ar: "غير مجامل", en: "Unflattering" },
      { ar: "محدَّد", en: "Specific" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "ashlin",
    name: "Ashlin",
    tagline: { ar: "منطق جداول البيانات، مكتوبًا ومشروحًا.", en: "Spreadsheet logic, written out and explained." },
    category: { ar: "بيانات", en: "Data" },
    monogram: "AS",
    uses: [
      { ar: "كتابة المعادلات وتصحيح أخطائها", en: "Writing and debugging formulas" },
      { ar: "تصميم جدول لا ينهار في الربع القادم", en: "Designing a sheet that won't break next quarter" },
      { ar: "شرح ما يفعله جدول ورثته عن غيرك", en: "Explaining what an inherited spreadsheet is doing" },
    ],
    traits: [
      { ar: "متمكّن من المعادلات", en: "Formula-fluent" },
      { ar: "يشرح المنطق", en: "Explains logic" },
      { ar: "ينتبه للحالات الحدّية", en: "Edge-case aware" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "nocturne",
    name: "Nocturne",
    tagline: {
      ar: "يحتفظ بمستند طويل جدًا في ذاكرته ويجيب منه.",
      en: "Holds a very long document in its head and answers from it.",
    },
    category: { ar: "مستندات", en: "Documents" },
    monogram: "NC",
    uses: [
      { ar: "الإجابة عن أسئلة من الأدلة والتقارير والأرشيف", en: "Question-answering over manuals, reports and archives" },
      { ar: "إيجاد التناقض بين الصفحة 4 والصفحة 91", en: "Finding the contradiction between page 4 and page 91" },
      { ar: "التلخيص بأي عمق تطلبه", en: "Summarising at whatever depth you ask for" },
    ],
    traits: [
      { ar: "سياق طويل جدًا", en: "Very long context" },
      { ar: "يقتبس بدقة", en: "Quotes precisely" },
      { ar: "قارئ صبور", en: "Patient reader" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "ferrous",
    name: "Ferrous",
    tagline: { ar: "توثيق سيتّبعه المهندس فعلًا.", en: "Documentation an engineer will actually follow." },
    category: { ar: "هندسة", en: "Engineering" },
    monogram: "FR",
    uses: [
      { ar: "ملفات README وأدلة التشغيل ومراجع الواجهات", en: "READMEs, runbooks and API references" },
      { ar: "كتابة خطوات الإعداد بالترتيب الذي يجب اتّباعه", en: "Writing the setup steps in the order they must be done" },
      { ar: "توثيق كود لم يُوثَّق قط", en: "Documenting code that was never documented" },
    ],
    traits: [
      { ar: "منظّم", en: "Structured" },
      { ar: "غنيّ بالأمثلة", en: "Example-heavy" },
      { ar: "بلا حشو", en: "No filler" },
    ],
    group: "coreos-ai",
  },
];

export const ALL_AGENTS: PublicAgent[] = [...OPEN_TESTING, ...LAB_MODELS];

export function findAgent(slug: string): PublicAgent | undefined {
  return ALL_AGENTS.find((a) => a.slug === slug);
}
