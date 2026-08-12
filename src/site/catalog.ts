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
 * Copy carries all three languages inline rather than sitting in parallel
 * translation files, so adding an agent is one edit in one place and the
 * languages cannot drift apart. Codenames and monograms are names: they stay
 * in Latin script.
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
      ckb: "ئەو دەسکە پشتگیرییەی هەرگیز کەس لە چاوەڕوانیدا ناهێڵێتەوە.",
      en: "The front-line support desk that never puts anyone on hold.",
    },
    category: { ar: "دعم", ckb: "پشتگیری", en: "Support" },
    monogram: "VR",
    uses: [
      { ar: "الإجابة عن أسئلة العملاء المتكررة من سياساتك أنت", ckb: "وەڵامدانەوەی پرسیارە دووبارەبووەکانی کڕیاران لە سیاسەتەکانی خۆتەوە", en: "Answering repeat customer questions from your own policies" },
      { ar: "الفرز الأولي قبل أن يستلم موظف التذكرة", ckb: "پۆلێنکردنی یەکەم وەڵام پێش ئەوەی مرۆڤێک تیکێتەکە هەڵبگرێت", en: "First-response triage before a human picks the ticket up" },
      { ar: "تغطية ما بعد الدوام للفرق الصغيرة", ckb: "داپۆشینی دوای کاتی کار بۆ تیمە بچووکەکان", en: "Out-of-hours cover for small teams" },
    ],
    traits: [
      { ar: "نبرة ودودة", ckb: "شێوازێکی گەرم", en: "Warm tone" },
      { ar: "يُصعّد مبكرًا", ckb: "زوو دەگوازێتەوە", en: "Escalates early" },
      { ar: "ملتزم بالسياسات", ckb: "پابەند بە سیاسەت", en: "Policy-bound" },
    ],
    group: "coreos",
  },
  {
    slug: "kestrel",
    name: "Kestrel",
    tagline: {
      ar: "يفرز العملاء المحتملين قبل أن يصلوا إلى جدولك.",
      ckb: "کڕیارە ئەگەرییەکان پۆلێن دەکات پێش ئەوەی بگەنە ڕۆژژمێرەکەت.",
      en: "Qualifies inbound leads before they reach your calendar.",
    },
    category: { ar: "مبيعات", ckb: "فرۆشتن", en: "Sales" },
    monogram: "KS",
    uses: [
      { ar: "طرح الأسئلة الخمسة التي يطرحها فريق مبيعاتك دائمًا", ckb: "پرسینی ئەو پێنج پرسیارەی تیمی فرۆشتنت هەمیشە دەیانپرسێت", en: "Asking the five questions your sales team always asks" },
      { ar: "تقييم الاستفسارات حسب الميزانية والتوقيت ومدى الملاءمة", ckb: "هەڵسەنگاندنی داواکارییەکان بەپێی بودجە و کات و گونجاوی", en: "Scoring enquiries by budget, timeline and fit" },
      { ar: "تسليم العملاء الجاهزين إلى موظف مع ملخّص مكتوب", ckb: "ڕادەستکردنی کڕیارە ئامادەکان بە مرۆڤێک لەگەڵ کورتەیەکی نووسراو", en: "Handing warm leads to a human with a written summary" },
    ],
    traits: [
      { ar: "مباشر", ckb: "ڕاستەوخۆ", en: "Direct" },
      { ar: "مُخرَج منظّم", ckb: "بەرهەمی ڕێکخراو", en: "Structured output" },
      { ar: "لا يبالغ في البيع", ckb: "هەرگیز زیادەڕۆیی لە فرۆشتندا ناکات", en: "Never oversells" },
    ],
    group: "coreos",
  },
  {
    slug: "marlowe",
    name: "Marlowe",
    tagline: {
      ar: "يقرأ المستند الطويل ليقرأ موظفوك الملخّص.",
      ckb: "بەڵگەنامە درێژەکە دەخوێنێتەوە تا کارمەندەکانت کورتەکە بخوێننەوە.",
      en: "Reads the long document so your staff can read the summary.",
    },
    category: { ar: "مستندات", ckb: "بەڵگەنامەکان", en: "Documents" },
    monogram: "MW",
    uses: [
      { ar: "استخراج الالتزامات والتواريخ من عقود المورّدين", ckb: "دەرهێنانی ئەرک و بەروارەکان لە گرێبەستی دابینکەرانەوە", en: "Pulling obligations and dates out of supplier contracts" },
      { ar: "تحويل سياسة من أربعين صفحة إلى موجز من صفحة واحدة", ckb: "گۆڕینی سیاسەتێکی چل پەڕەیی بۆ کورتەیەکی یەک پەڕەیی", en: "Turning a forty-page policy into a one-page brief" },
      { ar: "الإشارة إلى البنود التي تحتاج عين محامٍ", ckb: "دیاریکردنی ئەو بڕگانەی پێویستیان بە چاوی پارێزەرێکی مرۆڤ هەیە", en: "Flagging clauses that need a human lawyer's eyes" },
    ],
    traits: [
      { ar: "متحفّظ", ckb: "وریا", en: "Cautious" },
      { ar: "يقتبس المصدر", ckb: "سەرچاوەکە دەهێنێتەوە", en: "Quotes the source" },
      { ar: "سياق طويل", ckb: "چوارچێوەی درێژ", en: "Long context" },
    ],
    group: "coreos",
  },
  {
    slug: "sable",
    name: "Sable",
    tagline: {
      ar: "أسئلة الفواتير تُجاب دون فتح بريد المحاسبة.",
      ckb: "پرسیاری پسوولە وەڵام دەدرێنەوە بەبێ کردنەوەی سندووقی نامەی دارایی.",
      en: "Billing questions answered without opening the finance inbox.",
    },
    category: { ar: "عمليات مالية", ckb: "کاری دارایی", en: "Finance ops" },
    monogram: "SB",
    uses: [
      { ar: "شرح بند في فاتورة بلغة واضحة", ckb: "ڕوونکردنەوەی بڕگەیەکی پسوولە بە زمانێکی سادە", en: "Explaining a line item on an invoice in plain language" },
      { ar: "متابعة المدفوعات المتأخرة بلباقة وفي موعدها", ckb: "بەدواداچوونی پارەدانە دواکەوتووەکان بە ڕێزەوە و لە کاتی خۆیدا", en: "Chasing overdue payments politely and on schedule" },
      { ar: "مطابقة ما يقول العميل إنه دفعه بما سجّلته أنت", ckb: "بەراوردکردنی ئەوەی کڕیار دەڵێت داویەتی لەگەڵ ئەوەی تۆ تۆمارت کردووە", en: "Reconciling what a customer says they paid against what you logged" },
    ],
    traits: [
      { ar: "دقيق", ckb: "ورد", en: "Precise" },
      { ar: "قوي في الأرقام", ckb: "شارەزا لە ژمارە", en: "Numerate" },
      { ar: "قابل للتدقيق", ckb: "گونجاو بۆ پشکنین", en: "Audit-friendly" },
    ],
    group: "coreos",
  },
  {
    slug: "onyxa",
    name: "Onyxa",
    tagline: {
      ar: "مكتب استقبال واحد، وثلاث لغات، وبلا موظفين إضافيين.",
      ckb: "یەک دەسکی پێشەوە، سێ زمان، بەبێ کارمەندی زیادە.",
      en: "One front desk, three languages, no extra headcount.",
    },
    category: { ar: "متعدد اللغات", ckb: "فرەزمان", en: "Multilingual" },
    monogram: "ON",
    uses: [
      { ar: "خدمة العملاء بالإنجليزية والعربية والكردية من صندوق وارد واحد", ckb: "خزمەتکردنی کڕیارە ئینگلیزی و عەرەبی و کوردەکان لە یەک سندووقی نامەوە", en: "Serving English, Arabic and Kurdish customers from one inbox" },
      { ar: "الحفاظ على نبرة العلامة نفسها عبر اللغات", ckb: "پاراستنی یەکسانیی شێوازی براند بەسەر زمانەکاندا", en: "Keeping brand tone consistent across languages" },
      { ar: "ترجمة رد داخلي إلى لغة العميل", ckb: "وەرگێڕانی وەڵامێکی ناوخۆیی بۆ زمانی کڕیار", en: "Translating an internal reply into the customer's language" },
    ],
    traits: [
      { ar: "English / العربية / کوردی", ckb: "English / العربية / کوردی", en: "English / العربية / کوردی" },
      { ar: "نبرة ثابتة", ckb: "شێوازی جێگیر", en: "Tone-stable" },
      { ar: "يراعي الحروف", ckb: "ئاگادار لە ڕەسمەخەت", en: "Script-aware" },
    ],
    group: "coreos",
  },
  {
    slug: "piper",
    name: "Piper",
    tagline: {
      ar: "يحجز المواعيد ويغيّرها ويؤكّدها في جملة واحدة.",
      ckb: "کاتەکان بە یەک ڕستە حجز و گواستنەوە و دڵنیا دەکاتەوە.",
      en: "Books, moves and confirms appointments in a sentence.",
    },
    category: { ar: "جدولة", ckb: "خشتەبەندی", en: "Scheduling" },
    monogram: "PP",
    uses: [
      { ar: "استقبال طلبات الحجز من الدردشة أو البريد", ckb: "وەرگرتنی داواکاریی حجزکردن لە چات یان ئیمەیلەوە", en: "Taking booking requests from chat or email" },
      { ar: "عرض المواعيد الثلاثة الواقعية التالية بدل جدول فارغ", ckb: "پێشکەشکردنی سێ کاتی واقیعیی داهاتوو لە جیاتی ڕۆژژمێرێکی بەتاڵ", en: "Offering the next three realistic slots instead of a blank calendar" },
      { ar: "إرسال التذكيرات ومعالجة إعادة الجدولة", ckb: "ناردنی بیرخەرەوە و مامەڵەکردن لەگەڵ گۆڕینی کات", en: "Sending reminders and handling reschedules" },
    ],
    traits: [
      { ar: "سريع", ckb: "خێرا", en: "Fast" },
      { ar: "يؤكّد مرتين", ckb: "دووجار دڵنیا دەکاتەوە", en: "Confirms twice" },
      { ar: "يراعي المناطق الزمنية", ckb: "سەلامەت لەگەڵ ناوچەی کات", en: "Timezone-safe" },
    ],
    group: "coreos",
  },
  {
    slug: "halden",
    name: "Halden",
    tagline: { ar: "دليلك الداخلي، لكنه يردّ عليك.", ckb: "ڕێبەری ناوخۆییەکەت، بەڵام ئەمە وەڵامت دەداتەوە.", en: "Your internal handbook, but it answers back." },
    category: { ar: "معرفة", ckb: "زانیاری", en: "Knowledge" },
    monogram: "HD",
    uses: [
      { ar: "الإجابة عن أسئلة الموظفين من إجراءاتك المعتمدة", ckb: "وەڵامدانەوەی پرسیاری کارمەندان لە ڕێنماییە ناوخۆییەکانی خۆتەوە", en: "Answering staff questions from your own SOPs" },
      { ar: "تهيئة الموظفين الجدد دون شغل زميل خبير", ckb: "فێرکردنی کارمەندە نوێیەکان بەبێ سەرقاڵکردنی هاوکارێکی بەئەزموون", en: "Onboarding new hires without tying up a senior colleague" },
      { ar: "إيجاد الفقرة الوحيدة التي تنطبق فعلًا", ckb: "دۆزینەوەی ئەو بڕگە تاکەی کە بەڕاستی پەیوەندیدارە", en: "Finding the one paragraph that actually applies" },
    ],
    traits: [
      { ar: "يستشهد بالمستند", ckb: "بەڵگەنامەکە دەهێنێتەوە", en: "Cites the doc" },
      { ar: "يقول «لا أعرف»", ckb: "دەڵێت «نازانم»", en: "Says 'I don't know'" },
      { ar: "للاستخدام الداخلي", ckb: "تەنها بۆ ناوخۆ", en: "Internal-only" },
    ],
    group: "coreos",
  },
  {
    slug: "cirro",
    name: "Cirro",
    tagline: {
      ar: "«أين طلبي؟» تُجاب قبل أن يضطر أحد للسؤال مرتين.",
      ckb: "داواکارییەکەم لە کوێیە — وەڵام دەدرێتەوە پێش ئەوەی کەس دووجار بپرسێت.",
      en: "Where is my order, answered before anyone has to ask twice.",
    },
    category: { ar: "لوجستيات", ckb: "گواستنەوە", en: "Logistics" },
    monogram: "CR",
    uses: [
      { ar: "الاستعلام عن حالة الطلب والتوصيل", ckb: "پشکنینی دۆخی داواکاری و گەیاندن", en: "Order and delivery status lookups" },
      { ar: "شرح التأخير بصدق مع اقتراح الخطوة التالية", ckb: "ڕوونکردنەوەی دواکەوتنێک بە ڕاستگۆیی و پێشکەشکردنی هەنگاوی داهاتوو", en: "Explaining a delay honestly and offering the next step" },
      { ar: "أسئلة المخزون والتوفّر عند نقطة البيع", ckb: "پرسیاری کۆگا و بەردەستبوون لەسەر تەزگە", en: "Stock and availability questions at the counter" },
    ],
    traits: [
      { ar: "حرفي", ckb: "وشە بە وشە", en: "Literal" },
      { ar: "بلا وعود كاذبة", ckb: "بەڵێنی درۆ نادات", en: "No false promises" },
      { ar: "حجم كبير", ckb: "قەبارەی بەرز", en: "High volume" },
    ],
    group: "coreos",
  },
  {
    slug: "wren",
    name: "Wren",
    tagline: { ar: "يصوغ الرد؛ والإنسان هو من يضغط إرسال.", ckb: "ڕەشنووسی وەڵامەکە دەنووسێت؛ مرۆڤ هێشتا کلیکی ناردن دەکات.", en: "Drafts the reply; a human still presses send." },
    category: { ar: "مراسلات", ckb: "پەیوەندییەکان", en: "Comms" },
    monogram: "WR",
    uses: [
      { ar: "تحويل نقاط سريعة إلى رسالة عميل مكتملة", ckb: "گۆڕینی خاڵەکان بۆ ئیمەیلێکی تەواوی کڕیار", en: "Turning bullet points into a finished customer email" },
      { ar: "إعادة صياغة رد فظّ إلى شيء توقّع عليه باسمك", ckb: "نووسینەوەی وەڵامێکی ڕەق بۆ شتێک کە واژووی بکەیت", en: "Rewriting a blunt reply into something you would sign" },
      { ar: "إبقاء ثلاث قنوات على نبرة العلامة نفسها", ckb: "ڕاگرتنی سێ کەناڵ لەسەر هەمان دەنگی براند", en: "Keeping three channels on the same brand voice" },
    ],
    traits: [
      { ar: "المسودة أولًا", ckb: "ڕەشنووس یەکەم", en: "Draft-first" },
      { ar: "بإشراف بشري", ckb: "مرۆڤ لە ناوەڕاستدا", en: "Human in the loop" },
      { ar: "مطابق للنبرة", ckb: "لەگەڵ دەنگەکە گونجاو", en: "Voice-matched" },
    ],
    group: "coreos",
  },
  {
    slug: "tamsin",
    name: "Tamsin",
    tagline: { ar: "يرافق الموظف الجديد في أسبوعه الأول، بصبر.", ckb: "بە ئارامییەوە کارمەندە نوێیەکان بەناو یەکەم هەفتەدا دەبات.", en: "Walks new joiners through week one, patiently." },
    category: { ar: "شؤون الموظفين", ckb: "کاری مرۆیی", en: "People ops" },
    monogram: "TM",
    uses: [
      { ar: "الإجابة عن أسئلة التهيئة العشرين نفسها", ckb: "وەڵامدانەوەی هەمان بیست پرسیاری دەستپێکردن", en: "Answering the same twenty onboarding questions" },
      { ar: "التأكد من إنجاز الأوراق وخطوات التدريب", ckb: "دڵنیابوون لەوەی کاغەزبازی و هەنگاوەکانی ڕاهێنان تەواو بوون", en: "Checking that paperwork and training steps are done" },
      { ar: "توجيه الناس إلى الزميل الصحيح، لا إلى المستند الصحيح فقط", ckb: "ئاڕاستەکردنی خەڵک بۆ هاوکاری دروست، نەک تەنها بۆ بەڵگەنامەی دروست", en: "Pointing people at the right colleague, not just the right document" },
    ],
    traits: [
      { ar: "صبور", ckb: "ئارام", en: "Patient" },
      { ar: "يعمل بقوائم تحقق", ckb: "بەپێی لیستی پشکنین", en: "Checklist-driven" },
      { ar: "لا ينفد صبره", ckb: "هەرگیز بێتاقەت نابێت", en: "Never impatient" },
    ],
    group: "coreos",
  },
  {
    slug: "bramble",
    name: "Bramble",
    tagline: {
      ar: "يرتّب كومة الملاحظات إلى أمور يمكنك التصرّف بها.",
      ckb: "کۆمەڵە تێبینییەکان پۆلێن دەکات بۆ شتێک کە بتوانیت کاری لەسەر بکەیت.",
      en: "Sorts the feedback pile into things you can act on.",
    },
    category: { ar: "رؤى", ckb: "تێڕوانین", en: "Insight" },
    monogram: "BR",
    uses: [
      { ar: "تجميع المراجعات وردود الاستبيانات في محاور", ckb: "پۆلێنکردنی ڕا و وەڵامی ڕاپرسییەکان بۆ بابەت", en: "Grouping reviews and survey replies into themes" },
      { ar: "تمييز الشكوى العاجلة عن التذمّر البسيط", ckb: "جیاکردنەوەی سکاڵایەکی بەپەلە لە گلەییەکی سووک", en: "Separating an urgent complaint from a mild grumble" },
      { ar: "إعداد ملخّص أسبوعي لما تغيّر يقرأه المالك", ckb: "بەرهەمهێنانی کورتەیەکی هەفتانەی گۆڕانکارییەکان بۆ خاوەنەکە", en: "Producing a weekly what-changed summary for the owner" },
    ],
    traits: [
      { ar: "تحليلي", ckb: "شیکارانە", en: "Analytical" },
      { ar: "مُخرَج مرتَّب بالأولوية", ckb: "بەرهەمی ڕیزکراو", en: "Ranked output" },
      { ar: "صريح عند اللزوم", ckb: "ڕاشکاوانە کاتێک پێویست بێت", en: "Blunt when needed" },
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
    tagline: { ar: "يتمهّل ويفكّر في المسألة كاملة.", ckb: "کاتی خۆی دەبات و بە تەواوی لە کێشەکە دەڕوانێت.", en: "Takes its time and thinks the whole problem through." },
    category: { ar: "استدلال", ckb: "لێکدانەوە", en: "Reasoning" },
    monogram: "AU",
    uses: [
      { ar: "المسائل متعددة الخطوات التي تكون فيها الإجابة الأولى خاطئة عادة", ckb: "کێشەی فرەهەنگاو کە یەکەم وەڵام زۆرجار هەڵەیە", en: "Multi-step problems where the first answer is usually wrong" },
      { ar: "الموازنة بين البدائل مع إظهار الاستدلال", ckb: "هەڵسەنگاندنی ئاڵوگۆڕەکان بە پیشاندانی لێکدانەوەکە", en: "Weighing trade-offs with the reasoning shown" },
      { ar: "معرفة سبب اختلاف مصدرين", ckb: "دۆزینەوەی ئەوەی بۆچی دوو سەرچاوە ناکۆکن", en: "Working out why two sources disagree" },
    ],
    traits: [
      { ar: "متأنٍّ", ckb: "بەئەنقەست", en: "Deliberate" },
      { ar: "يُظهر خطواته", ckb: "هەنگاوەکان پیشان دەدات", en: "Shows working" },
      { ar: "إجابات طويلة", ckb: "وەڵامی درێژ", en: "Long answers" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "nimbex",
    name: "Nimbex",
    tagline: {
      ar: "إجابات يومية تصل قبل أن تُنهي قراءة السؤال.",
      ckb: "وەڵامی ڕۆژانە، پێش ئەوەی خوێندنەوەی پرسیارەکە تەواو بکەیت.",
      en: "Everyday answers, back before you finish reading the question.",
    },
    category: { ar: "عام", ckb: "گشتی", en: "General" },
    monogram: "NX",
    uses: [
      { ar: "أسئلة سريعة وإعادة صياغة قصيرة", ckb: "پرسیاری خێرای ڕاستەقینە و نووسینەوەی کورت", en: "Quick factual questions and short rewrites" },
      { ar: "الدردشة كثيفة الحجم حيث السرعة أهم من العمق", ckb: "چاتی قەبارە بەرز کە خێرایی گرنگترە لە قووڵی", en: "High-volume chat where latency matters more than depth" },
      { ar: "محاولة أولى يمكنك تصعيدها إن لم تكفِ", ckb: "یەکەم هەوڵ کە دەتوانیت بیگوازیتەوە ئەگەر بەس نەبوو", en: "A first pass you can escalate if it isn't enough" },
    ],
    traits: [
      { ar: "سريع جدًا", ckb: "زۆر خێرا", en: "Very fast" },
      { ar: "موجز", ckb: "کورت و پوخت", en: "Concise" },
      { ar: "تكلفة منخفضة", ckb: "نرخی نزم", en: "Low cost" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "solvane",
    name: "Solvane",
    tagline: { ar: "أرقام، ومعها الحساب الذي يدعمها.", ckb: "ژمارەکان، و ئەو ژمێریارییەی پشتیوانییان دەکات.", en: "Numbers, and the arithmetic to back them up." },
    category: { ar: "تحليل", ckb: "شیکاری", en: "Analysis" },
    monogram: "SV",
    uses: [
      { ar: "النِّسب والهوامش واقتصاديات الوحدة وفحص التسعير", ckb: "ڕێژە و قازانج و ئابووریی یەکە و پشکنینی نرخ", en: "Percentages, margins, unit economics and pricing checks" },
      { ar: "التحقق من رقم وضعه أحدهم في عرض تقديمي", ckb: "پشکنینی ژمارەیەک کە کەسێک خستوویەتییە ناو پێشکەشکردنێک", en: "Sanity-checking a figure someone put in a deck" },
      { ar: "حسابات خطوة بخطوة يمكنك تدقيقها", ckb: "ژمێریاریی هەنگاو بە هەنگاو کە دەتوانیت بیپشکنیت", en: "Step-by-step calculations you can audit" },
    ],
    traits: [
      { ar: "قوي في الأرقام", ckb: "شارەزا لە ژمارە", en: "Numerate" },
      { ar: "خطوة بخطوة", ckb: "هەنگاو بە هەنگاو", en: "Step-by-step" },
      { ar: "يوضّح الافتراضات", ckb: "گریمانەکان دیاری دەکات", en: "Flags assumptions" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "quillex",
    name: "Quillex",
    tagline: { ar: "تحرير يشدّ النص دون أن يطمس صوت كاتبه.", ckb: "دەستکارییەک کە دەقەکە توندتر دەکات بەبێ کوشتنی دەنگەکە.", en: "Editing that tightens the text without flattening the voice." },
    category: { ar: "كتابة", ckb: "نووسین", en: "Writing" },
    monogram: "QX",
    uses: [
      { ar: "اختصار فقرة مسهبة إلى نصفها", ckb: "کورتکردنەوەی بڕگەیەکی درێژ بۆ نیوەی", en: "Cutting a rambling paragraph in half" },
      { ar: "تصحيح القواعد مع الحفاظ على أسلوب الكاتب", ckb: "چاککردنی ڕێزمان لەگەڵ پاراستنی شێوازی نووسەرەکە", en: "Fixing grammar while keeping the writer's register" },
      { ar: "تكييف نص واحد لثلاثة جماهير", ckb: "گونجاندنی یەک دەق بۆ سێ جۆر خوێنەر", en: "Adapting one piece of copy for three audiences" },
    ],
    traits: [
      { ar: "لمسة خفيفة", ckb: "دەستێکی سووک", en: "Light touch" },
      { ar: "يحفظ الأسلوب", ckb: "پارێزەری دەنگ", en: "Voice-preserving" },
      { ar: "يشرح تعديلاته", ckb: "دەستکارییەکان ڕوون دەکاتەوە", en: "Explains edits" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "tessara",
    name: "Tessara",
    tagline: { ar: "يكتب كودًا يعمل من أول مرة في الغالب.", ckb: "کۆد دەنووسێت کە زۆرتر لە جاری یەکەمدا کار دەکات.", en: "Writes code that runs the first time more often than not." },
    category: { ar: "هندسة", ckb: "ئەندازیاری", en: "Engineering" },
    monogram: "TS",
    uses: [
      { ar: "سكربتات ودوال وأكواد ربط صغيرة", ckb: "سکریپتی بچووک و فەنکشن و کۆدی بەستەر", en: "Small scripts, functions and glue code" },
      { ar: "تحويل مواصفة إلى نقطة انطلاق تعمل", ckb: "گۆڕینی پێوەرێک بۆ خاڵێکی دەستپێکی کارا", en: "Converting a spec into a working starting point" },
      { ar: "إضافة اختبارات لكود لم يكن لديه أي اختبارات", ckb: "زیادکردنی تاقیکردنەوە بۆ کۆدێک کە هەرگیز نەیبووە", en: "Adding tests to code that never had any" },
    ],
    traits: [
      { ar: "أسلوب سليم", ckb: "بەپێی نەریتی زمانەکە", en: "Idiomatic" },
      { ar: "تعليقات مقتصدة", ckb: "کەم لێدوان دەنووسێت", en: "Comments sparingly" },
      { ar: "مُخرَج قابل للتشغيل", ckb: "بەرهەمی کارا", en: "Runnable output" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "verith",
    name: "Verith",
    tagline: { ar: "يتحقق من الادّعاء بدل الموافقة عليه.", ckb: "بانگەشەکە دەپشکنێت لە جیاتی ڕازیبوون پێی.", en: "Checks the claim instead of agreeing with it." },
    category: { ar: "بحث", ckb: "توێژینەوە", en: "Research" },
    monogram: "VT",
    uses: [
      { ar: "اختبار عبارة قبل نشرها للعلن", ckb: "تاقیکردنەوەی توندی وتەیەک پێش ئەوەی بڵاو بێتەوە", en: "Pressure-testing a statement before it goes public" },
      { ar: "تمييز ما هو ثابت عمّا هو مُدّعى", ckb: "جیاکردنەوەی ئەوەی سەلمێنراوە لە ئەوەی تەنها بانگەشەیە", en: "Separating what is established from what is asserted" },
      { ar: "تلخيص البحث دون تمييع التحفّظات", ckb: "کورتکردنەوەی توێژینەوە بەبێ سڕینەوەی مەرجەکان", en: "Summarising research without smoothing over the caveats" },
    ],
    traits: [
      { ar: "متشكّك", ckb: "گومانخواز", en: "Sceptical" },
      { ar: "يوضّح عدم اليقين", ckb: "دڵنیانەبوون دیاری دەکات", en: "Flags uncertainty" },
      { ar: "يرفض التخمين", ckb: "ڕەت دەکاتەوە کە پێشبینی بکات", en: "Refuses to guess" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "lumora",
    name: "Lumora",
    tagline: {
      ar: "عشرون فكرة، ثم مساعدة في اختيار الثلاث التي تستحق.",
      ckb: "بیست بیرۆکە، پاشان یارمەتی لە هەڵبژاردنی ئەو سێیەی دەشێت بمێننەوە.",
      en: "Twenty ideas, then help picking the three worth keeping.",
    },
    category: { ar: "إبداع", ckb: "داهێنەرانە", en: "Creative" },
    monogram: "LM",
    uses: [
      { ar: "التسمية وزوايا الحملات ومفاهيم المنتجات", ckb: "ناونان و ڕوانگەی کەمپین و چەمکی بەرهەم", en: "Naming, campaign angles and product concepts" },
      { ar: "إخراج الفريق من الإجابة البديهية", ckb: "دەرهێنانی تیمێک لە وەڵامە ئاشکراکە", en: "Breaking a team out of the obvious answer" },
      { ar: "قوائم متشعّبة يمكنكم تضييقها معًا", ckb: "لیستی فراوان کە پێکەوە دەتوانن کورتی بکەنەوە", en: "Divergent lists you can narrow down together" },
    ],
    traits: [
      { ar: "تنوّع عالٍ", ckb: "جیاوازیی بەرز", en: "High variance" },
      { ar: "مرِح", ckb: "یاریخواز", en: "Playful" },
      { ar: "الكمّ أولًا", ckb: "قەبارە یەکەم", en: "Volume-first" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "draven",
    name: "Draven",
    tagline: { ar: "يقرأ أثر الخطأ ويخبرك بما تعطّل فعلًا.", ckb: "شوێنپێی هەڵەکە دەخوێنێتەوە و پێت دەڵێت بەڕاستی چی تێکچووە.", en: "Reads the stack trace and tells you what actually broke." },
    category: { ar: "هندسة", ckb: "ئەندازیاری", en: "Engineering" },
    monogram: "DV",
    uses: [
      { ar: "شرح رسالة خطأ بلغة واضحة", ckb: "ڕوونکردنەوەی نامەی هەڵە بە زمانێکی سادە", en: "Explaining an error message in plain language" },
      { ar: "حصر العلّة في السطر المرجَّح", ckb: "کورتکردنەوەی هەڵەیەک بۆ ئەگەرترین دێڕ", en: "Narrowing a bug to the likely line" },
      { ar: "اقتراح أصغر إصلاح بدل إعادة كتابة", ckb: "پێشنیارکردنی بچووکترین چارەسەر لە جیاتی نووسینەوەی سەرلەنوێ", en: "Suggesting the smallest fix rather than a rewrite" },
    ],
    traits: [
      { ar: "تشخيصي", ckb: "دەستنیشانکەر", en: "Diagnostic" },
      { ar: "إصلاحات صغرى", ckb: "کەمترین چارەسەر", en: "Minimal fixes" },
      { ar: "يطلب السياق", ckb: "داوای زانیاریی زیاتر دەکات", en: "Asks for context" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "calyx",
    name: "Calyx",
    tagline: { ar: "يحوّل النص الفوضوي إلى صفوف وحقول نظيفة.", ckb: "دەقی تێکەڵ دەگۆڕێت بۆ ڕیز و خانەی ڕێکخراو.", en: "Turns messy text into clean rows and fields." },
    category: { ar: "بيانات", ckb: "داتا", en: "Data" },
    monogram: "CX",
    uses: [
      { ar: "استخراج الأسماء والتواريخ والمجاميع من نص حر", ckb: "دەرهێنانی ناو و بەروار و کۆی گشتی لە دەقی ئازادەوە", en: "Pulling names, dates and totals out of free text" },
      { ar: "توحيد سجلات غير متسقة في مخطط واحد", ckb: "ڕێکخستنی تۆمارە ناهاوتاکان بۆ یەک پێکهاتە", en: "Normalising inconsistent records into one schema" },
      { ar: "إنتاج JSON أو CSV يستطيع نظام آخر استيعابه", ckb: "بەرهەمهێنانی JSON یان CSV کە سیستەمێکی تر بتوانێت وەریبگرێت", en: "Producing JSON or CSV another system can ingest" },
    ],
    traits: [
      { ar: "مُخرَج منظّم", ckb: "بەرهەمی ڕێکخراو", en: "Structured output" },
      { ar: "ملتزم بالمخطط", ckb: "پابەند بە پێکهاتە", en: "Schema-strict" },
      { ar: "بلا زخرفة", ckb: "بەبێ ڕازاندنەوە", en: "No embellishment" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "orbion",
    name: "Orbion",
    tagline: { ar: "ترجمة تصمد بعد عبورها إلى اللغة الأخرى.", ckb: "وەرگێڕانێک کە گەشتەکە بۆ زمانی تر بە ساغی تێدەپەڕێنێت.", en: "Translation that survives the trip to the other language." },
    category: { ar: "لغات", ckb: "زمان", en: "Language" },
    monogram: "OB",
    uses: [
      { ar: "المراسلات التجارية بالإنجليزية والعربية والكردية", ckb: "نامەی بازرگانیی ئینگلیزی و عەرەبی و کوردی", en: "English, Arabic and Kurdish business correspondence" },
      { ar: "توطين النصوص التسويقية بدل نقلها حرفيًا", ckb: "ناوخۆییکردنی دەقی بازاڕکردن لە جیاتی تەنها گواستنەوەی پیتەکان", en: "Localising marketing copy rather than transliterating it" },
      { ar: "التحقق مما إذا كانت العبارة المترجمة ما زالت تؤدي المعنى", ckb: "پشکنینی ئەوەی ئایا دەستەواژەی وەرگێڕدراو هێشتا کاریگەرە", en: "Checking whether a translated phrase still lands" },
    ],
    traits: [
      { ar: "أسلوب سليم", ckb: "بەپێی نەریتی زمانەکە", en: "Idiomatic" },
      { ar: "يراعي الحروف", ckb: "ئاگادار لە ڕەسمەخەت", en: "Script-aware" },
      { ar: "مطابق للمستوى اللغوي", ckb: "لەگەڵ شێوازەکە گونجاو", en: "Register-matched" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "meridia",
    name: "Meridia",
    tagline: {
      ar: "يحوّل طموحًا غامضًا إلى خطوات تبدأ بها يوم الاثنين.",
      ckb: "ئارەزوویەکی ناڕوون دەگۆڕێت بۆ ڕیزبەندییەک کە دووشەممە دەست پێدەکەیت.",
      en: "Turns a vague ambition into a sequence you can start on Monday.",
    },
    category: { ar: "استراتيجية", ckb: "ستراتیژی", en: "Strategy" },
    monogram: "MD",
    uses: [
      { ar: "تقسيم هدف إلى مراحل بمسؤولين ونقاط مراجعة", ckb: "دابەشکردنی ئامانجێک بۆ قۆناغ لەگەڵ بەرپرس و خاڵی پشکنین", en: "Breaking a goal into phases with owners and checkpoints" },
      { ar: "اختبار خطة بحثًا عن الخطوة التي نسيها الجميع", ckb: "تاقیکردنەوەی پلانێک بۆ ئەو هەنگاوەی هەموو کەس لەبیری کردووە", en: "Stress-testing a plan for the step everyone forgot" },
      { ar: "تحديد ما لا ينبغي فعله هذا الربع", ckb: "بڕیاردان لەسەر ئەوەی لەم چارەکەدا چی نەکرێت", en: "Deciding what not to do this quarter" },
    ],
    traits: [
      { ar: "متسلسل", ckb: "ڕیزکراو", en: "Sequenced" },
      { ar: "له رأي", ckb: "خاوەن ڕا", en: "Opinionated" },
      { ar: "يسمّي المقايضات", ckb: "ئاڵوگۆڕەکان ناو دەبات", en: "Names trade-offs" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "pyrrha",
    name: "Pyrrha",
    tagline: { ar: "نصوص مكتوبة ليُختار المنتج، لا لتُقرأ فحسب.", ckb: "دەقێک کە نووسراوە بۆ ئەوەی هەڵبژێردرێت، نەک تەنها بخوێندرێتەوە.", en: "Copy written to be chosen, not merely read." },
    category: { ar: "تسويق", ckb: "بازاڕکردن", en: "Marketing" },
    monogram: "PY",
    uses: [
      { ar: "عناوين صفحات الهبوط وعروض القيمة", ckb: "سەردێڕی پەڕەی داگرتن و پێشکەشکردنی بەها", en: "Landing page headlines and value propositions" },
      { ar: "نسخ إعلانية متعددة لاختبار A/B", ckb: "جۆرەکانی ڕیکلام بۆ تاقیکردنەوەی A/B", en: "Ad variants for A/B testing" },
      { ar: "تحويل قوائم الميزات إلى منافع للعميل", ckb: "نووسینەوەی لیستی تایبەتمەندییەکان وەک سوودی کڕیار", en: "Rewriting feature lists as customer benefits" },
    ],
    traits: [
      { ar: "مؤثّر", ckb: "کاریگەر", en: "Punchy" },
      { ar: "يقود بالمنفعة", ckb: "لەسەر بنەمای سوود", en: "Benefit-led" },
      { ar: "متعدد النسخ", ckb: "گونجاو بۆ چەند جۆرێک", en: "Variant-friendly" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "vantel",
    name: "Vantel",
    tagline: {
      ar: "مستندات رسمية، مشروحة كما تشرحها لصديق.",
      ckb: "بەڵگەنامەی فەرمی، ڕوونکراوە بەو شێوەیەی بۆ هاوڕێیەکی ڕوون دەکەیتەوە.",
      en: "Formal documents, explained the way you'd explain them to a friend.",
    },
    category: { ar: "مستندات", ckb: "بەڵگەنامەکان", en: "Documents" },
    monogram: "VN",
    uses: [
      { ar: "ملخّصات بلغة بسيطة للعقود والشروط", ckb: "کورتەی سادەی گرێبەست و مەرجەکان", en: "Plain-English summaries of contracts and terms" },
      { ar: "رصد البند الذي يحمل المخاطرة الحقيقية", ckb: "دۆزینەوەی ئەو بڕگەیەی مەترسیی ڕاستەقینەی تێدایە", en: "Spotting the clause that carries the real risk" },
      { ar: "تجهيز أسئلة تأخذها إلى محامٍ حقيقي", ckb: "ئامادەکردنی پرسیار بۆ بردنی بۆ پارێزەرێکی ڕاستەقینە", en: "Preparing questions to take to an actual lawyer" },
    ],
    traits: [
      { ar: "متحفّظ", ckb: "وریا و پارێزکار", en: "Conservative" },
      { ar: "لا يقدّم استشارة", ckb: "هەرگیز ڕاوێژ نادات", en: "Never advises" },
      { ar: "يشير إلى المخاطر", ckb: "دیاریکەری مەترسی", en: "Risk-flagging" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "sorrel",
    name: "Sorrel",
    tagline: { ar: "يشرحها مرة أخرى، بطريقة مختلفة، حتى تُفهم.", ckb: "دووبارە بە شێوەیەکی تر ڕوونی دەکاتەوە، تا تێدەگەیت.", en: "Explains it again, differently, until it lands." },
    category: { ar: "تعليم", ckb: "فێرکردن", en: "Teaching" },
    monogram: "SR",
    uses: [
      { ar: "تدريب الموظفين على أداة أو إجراء جديد", ckb: "ڕاهێنانی کارمەندان لەسەر ئامراز یان پرۆسەیەکی نوێ", en: "Training staff on a new tool or process" },
      { ar: "شرح مفهوم تقني لفريق غير تقني", ckb: "ڕوونکردنەوەی چەمکێکی تەکنیکی بۆ تیمێکی ناتەکنیکی", en: "Explaining a technical concept to a non-technical team" },
      { ar: "بناء أسئلة تدريبية من موادّك أنت", ckb: "دروستکردنی پرسیاری مەشق لە کەرەستەی خۆتەوە", en: "Building practice questions from your own material" },
    ],
    traits: [
      { ar: "صبور", ckb: "ئارام", en: "Patient" },
      { ar: "غنيّ بالتشبيهات", ckb: "پڕ لە نموونە", en: "Analogy-rich" },
      { ar: "يتأكد من الفهم", ckb: "تێگەیشتن دەپشکنێت", en: "Checks understanding" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "halcyon",
    name: "Halcyon",
    tagline: {
      ar: "يهدّئ الرد الذي لا ينبغي إرساله بصيغته الحالية.",
      ckb: "ئەو وەڵامە هێور دەکاتەوە کە نابێت وەک خۆی بینێریت.",
      en: "De-escalates the reply you shouldn't send as written.",
    },
    category: { ar: "مراسلات", ckb: "پەیوەندییەکان", en: "Comms" },
    monogram: "HC",
    uses: [
      { ar: "تلطيف رسالة موجّهة إلى عميل غاضب", ckb: "نەرمکردنی نامەیەک بۆ کڕیارێکی نائاسوودە", en: "Softening a message to an unhappy customer" },
      { ar: "قول «لا» دون حرق العلاقة", ckb: "وتنی نەخێر بەبێ سووتاندنی پەیوەندییەکە", en: "Saying no without burning the relationship" },
      { ar: "إعادة صياغة ملاحظة داخلية غاضبة بأسلوب مهني", ckb: "نووسینەوەی تێبینییەکی ناوخۆیی توڕە بۆ یەکێکی پیشەیی", en: "Rewriting an angry internal note into a professional one" },
    ],
    traits: [
      { ar: "مُهدِّئ", ckb: "هێورکەرەوە", en: "Calming" },
      { ar: "حازم ولطيف", ckb: "بەهێز بەڵام بەڕەحم", en: "Firm but kind" },
      { ar: "يحفظ المضمون", ckb: "ناوەڕۆکەکە دەپارێزێت", en: "Keeps the substance" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "zephyrine",
    name: "Zephyrine",
    tagline: { ar: "اجتماع يدخل، وقرارات ومسؤولون يخرجون.", ckb: "کۆبوونەوە بخە ژوورەوە، بڕیار و بەرپرس دەربهێنە.", en: "Meeting in, decisions and owners out." },
    category: { ar: "إنتاجية", ckb: "بەرهەمداری", en: "Productivity" },
    monogram: "ZP",
    uses: [
      { ar: "تحويل محضر مكتوب إلى قرارات وبنود عمل", ckb: "گۆڕینی تۆمارێک بۆ پرۆتۆکۆل و ئەرکەکان", en: "Turning a transcript into minutes and action items" },
      { ar: "فصل القرارات عن النقاش", ckb: "جیاکردنەوەی بڕیار لە گفتوگۆ", en: "Separating decisions from discussion" },
      { ar: "إعداد رسالة متابعة لا يحتاج أحد لتعديلها", ckb: "بەرهەمهێنانی ئیمەیلێکی بەدواداچوون کە کەس پێویست ناکات دەستکاری بکات", en: "Producing a follow-up email nobody has to edit" },
    ],
    traits: [
      { ar: "مقتضب", ckb: "کورت", en: "Terse" },
      { ar: "موجّه للتنفيذ", ckb: "ئاڕاستەی کردار", en: "Action-oriented" },
      { ar: "يحدّد المسؤولين", ckb: "بەرپرسان دیاری دەکات", en: "Attributes owners" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "corvid",
    name: "Corvid",
    tagline: { ar: "يجادل خطتك حتى لا يفعل ذلك عميل.", ckb: "دەمەقاڵێ لەگەڵ پلانەکەت دەکات تا کڕیارێک پێویست نەکات بیکات.", en: "Argues with your plan so a customer doesn't have to." },
    category: { ar: "نقد", ckb: "ڕەخنە", en: "Critique" },
    monogram: "CV",
    uses: [
      { ar: "إيجاد أضعف افتراض في مقترح", ckb: "دۆزینەوەی لاوازترین گریمانە لە پێشنیارێکدا", en: "Finding the weakest assumption in a proposal" },
      { ar: "تمثيل دور المشتري المتشكّك قبل العرض", ckb: "یاریکردنی ڕۆڵی کڕیاری گومانخواز پێش پێشکەشکردن", en: "Playing the sceptical buyer before a pitch" },
      { ar: "سرد الاعتراضات التي ستواجهها فعلًا", ckb: "لیستکردنی ئەو ڕەخنانەی بەڕاستی پێت دەگەن", en: "Listing the objections you'll actually get" },
    ],
    traits: [
      { ar: "مُخاصِم", ckb: "بەرهەڵستکار", en: "Adversarial" },
      { ar: "غير مجامل", ckb: "بێ لاسایی", en: "Unflattering" },
      { ar: "محدَّد", ckb: "دیاریکراو", en: "Specific" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "ashlin",
    name: "Ashlin",
    tagline: { ar: "منطق جداول البيانات، مكتوبًا ومشروحًا.", ckb: "لۆژیکی خشتەی داتا، نووسراو و ڕوونکراوە.", en: "Spreadsheet logic, written out and explained." },
    category: { ar: "بيانات", ckb: "داتا", en: "Data" },
    monogram: "AS",
    uses: [
      { ar: "كتابة المعادلات وتصحيح أخطائها", ckb: "نووسین و چاککردنی فۆرمولەکان", en: "Writing and debugging formulas" },
      { ar: "تصميم جدول لا ينهار في الربع القادم", ckb: "دیزاینی خشتەیەک کە چارەکی داهاتوو تێک ناچێت", en: "Designing a sheet that won't break next quarter" },
      { ar: "شرح ما يفعله جدول ورثته عن غيرك", ckb: "ڕوونکردنەوەی ئەوەی خشتەیەکی بەمیراتگیراو چی دەکات", en: "Explaining what an inherited spreadsheet is doing" },
    ],
    traits: [
      { ar: "متمكّن من المعادلات", ckb: "شارەزا لە فۆرمول", en: "Formula-fluent" },
      { ar: "يشرح المنطق", ckb: "لۆژیکەکە ڕوون دەکاتەوە", en: "Explains logic" },
      { ar: "ينتبه للحالات الحدّية", ckb: "ئاگادار لە حاڵەتە دەگمەنەکان", en: "Edge-case aware" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "nocturne",
    name: "Nocturne",
    tagline: {
      ar: "يحتفظ بمستند طويل جدًا في ذاكرته ويجيب منه.",
      ckb: "بەڵگەنامەیەکی زۆر درێژ لە بیری خۆیدا ڕادەگرێت و لێیەوە وەڵام دەداتەوە.",
      en: "Holds a very long document in its head and answers from it.",
    },
    category: { ar: "مستندات", ckb: "بەڵگەنامەکان", en: "Documents" },
    monogram: "NC",
    uses: [
      { ar: "الإجابة عن أسئلة من الأدلة والتقارير والأرشيف", ckb: "وەڵامدانەوەی پرسیار لەسەر ڕێبەر و ڕاپۆرت و ئەرشیف", en: "Question-answering over manuals, reports and archives" },
      { ar: "إيجاد التناقض بين الصفحة 4 والصفحة 91", ckb: "دۆزینەوەی ناکۆکی لە نێوان پەڕەی 4 و پەڕەی 91", en: "Finding the contradiction between page 4 and page 91" },
      { ar: "التلخيص بأي عمق تطلبه", ckb: "کورتکردنەوە بە هەر قووڵییەک کە داوای دەکەیت", en: "Summarising at whatever depth you ask for" },
    ],
    traits: [
      { ar: "سياق طويل جدًا", ckb: "چوارچێوەی زۆر درێژ", en: "Very long context" },
      { ar: "يقتبس بدقة", ckb: "بە وردی دەیهێنێتەوە", en: "Quotes precisely" },
      { ar: "قارئ صبور", ckb: "خوێنەرێکی ئارام", en: "Patient reader" },
    ],
    group: "coreos-ai",
  },
  {
    slug: "ferrous",
    name: "Ferrous",
    tagline: { ar: "توثيق سيتّبعه المهندس فعلًا.", ckb: "بەڵگەنامەیەک کە ئەندازیارێک بەڕاستی پەیڕەوی دەکات.", en: "Documentation an engineer will actually follow." },
    category: { ar: "هندسة", ckb: "ئەندازیاری", en: "Engineering" },
    monogram: "FR",
    uses: [
      { ar: "ملفات README وأدلة التشغيل ومراجع الواجهات", ckb: "READMEـەکان و ڕێبەری کارپێکردن و سەرچاوەی API", en: "READMEs, runbooks and API references" },
      { ar: "كتابة خطوات الإعداد بالترتيب الذي يجب اتّباعه", ckb: "نووسینی هەنگاوەکانی دامەزراندن بەو ڕیزبەندییەی دەبێت بکرێن", en: "Writing the setup steps in the order they must be done" },
      { ar: "توثيق كود لم يُوثَّق قط", ckb: "بەڵگەنامەکردنی کۆدێک کە هەرگیز بەڵگەنامەی نەبووە", en: "Documenting code that was never documented" },
    ],
    traits: [
      { ar: "منظّم", ckb: "ڕێکخراو", en: "Structured" },
      { ar: "غنيّ بالأمثلة", ckb: "پڕ لە نموونە", en: "Example-heavy" },
      { ar: "بلا حشو", ckb: "بێ قسەی زیادە", en: "No filler" },
    ],
    group: "coreos-ai",
  },
];

export const ALL_AGENTS: PublicAgent[] = [...OPEN_TESTING, ...LAB_MODELS];

export function findAgent(slug: string): PublicAgent | undefined {
  return ALL_AGENTS.find((a) => a.slug === slug);
}
