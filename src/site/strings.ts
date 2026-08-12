/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Every visible string on the CoreOs site, in Arabic, Sorani Kurdish and
 * English.
 *
 * Arabic is Modern Standard — the register business readers across the region
 * expect, rather than any one dialect. The Kurdish is Sorani in the Arabic
 * script, which is what Erbil reads. Brand names (CoreOs, CoreOs.ai) and agent
 * codenames stay in Latin script on purpose: they are names, and the codenames
 * are the whole point of the testing programme.
 *
 * Western numerals throughout. They are what regional business writing uses,
 * and they keep the stat blocks legible in both directions.
 *
 * All three languages live in one file, one entry per string, so a reviewer
 * can read a line and see straight away whether the three say the same thing.
 * `ckb` is required rather than optional for the same reason — a missing
 * Kurdish string is a type error, not a silent fall back to English.
 *
 * Catalogue copy — agent taglines, uses and traits — lives in catalog.ts
 * alongside the agents themselves.
 */

export interface Copy {
  ar: string;
  /** Sorani (Central) Kurdish — BCP 47 `ckb`. */
  ckb: string;
  en: string;
}

export const COPY = {
  /* ------------------------------------------------------------ chrome */
  "nav.home": { ar: "الرئيسية", ckb: "سەرەتا", en: "CoreOs" },
  "nav.mission": { ar: "رسالتنا", ckb: "ئامانجمان", en: "Mission" },
  "nav.testing": { ar: "الاختبار المفتوح", ckb: "تاقیکردنەوەی کراوە", en: "Open testing" },
  "nav.lab": { ar: "CoreOs.ai", ckb: "CoreOs.ai", en: "CoreOs.ai" },
  "nav.contact": { ar: "تواصل", ckb: "پەیوەندی", en: "Contact" },
  "nav.console": { ar: "لوحة العميل", ckb: "پانێڵی کڕیار", en: "Client console" },
  "nav.talk": { ar: "تحدّث إلينا", ckb: "قسەمان لەگەڵ بکە", en: "Talk to us" },
  "nav.skip": { ar: "تخطَّ إلى المحتوى", ckb: "بازبدە بۆ ناوەڕۆک", en: "Skip to content" },
  "nav.openMenu": { ar: "افتح القائمة", ckb: "لیستە بکەرەوە", en: "Open menu" },
  "nav.closeMenu": { ar: "أغلق القائمة", ckb: "لیستە دابخە", en: "Close menu" },
  "nav.homeAria": { ar: "الصفحة الرئيسية لـ CoreOs", ckb: "پەڕەی سەرەکیی CoreOs", en: "CoreOs home" },
  "nav.langAria": { ar: "تغيير اللغة", ckb: "گۆڕینی زمان", en: "Change language" },

  "footer.blurb": {
    ar: "تبني CoreOs المواقع والتطبيقات والأنظمة ووكلاء الذكاء الاصطناعي للشركات الصغيرة والمتوسطة — بتكلفة في المتناول، ومصمَّمة لتعمل إلى جانب الموظفين الذين لديك بالفعل.",
    ckb: "CoreOs ماڵپەڕ و ئەپ و سیستەم و بریکاری زیرەک بۆ کۆمپانیا بچووک و مامناوەندەکان دروست دەکات — بە نرخێکی گونجاو، و دروستکراو بۆ ئەوەی لەگەڵ ئەو کەسانەدا کار بکات کە ئێستا لات دامەزراون.",
    en: "CoreOs builds websites, apps, systems and AI agents for small and mid-sized businesses — affordably, and built to work alongside the people you already employ.",
  },
  "footer.product": { ar: "المنتج", ckb: "بەرهەم", en: "Product" },
  "footer.agents": {
    ar: "11 وكيلًا في الاختبار المفتوح",
    ckb: "11 بریکار لە تاقیکردنەوەی کراوەدا",
    en: "11 agents in open testing",
  },
  "footer.models": { ar: "CoreOs.ai — 20 نموذجًا", ckb: "CoreOs.ai — 20 مۆدێل", en: "CoreOs.ai — 20 models" },
  "footer.mission": { ar: "رسالتنا", ckb: "ئامانجمان", en: "Our mission" },
  "footer.contact": { ar: "تواصل", ckb: "پەیوەندی", en: "Contact" },
  "footer.brief": { ar: "أرسل لنا طلبك", ckb: "داواکارییەکەت بۆمان بنێرە", en: "Send us a brief" },
  "footer.rights": { ar: "جميع الحقوق محفوظة.", ckb: "هەموو مافەکان پارێزراون.", en: "All rights reserved." },
  "footer.line": {
    ar: "ذكاء اصطناعي يساعد الناس. لا ذكاء اصطناعي يستبدلهم.",
    ckb: "زیرەکییەکی دەستکرد کە یارمەتی خەڵک دەدات. نەک زیرەکییەک کە جێگایان دەگرێتەوە.",
    en: "AI that assists people. Not AI that replaces them.",
  },

  /* -------------------------------------------------------------- home */
  "home.badge": {
    ar: "31 وكيل ذكاء اصطناعي متاح للاختبار العام",
    ckb: "31 بریکاری زیرەک کراوەن بۆ تاقیکردنەوەی گشتی",
    en: "31 AI agents open for public testing",
  },
  "home.h1a": { ar: "حيث تلتقي احتياجاتك", ckb: "لەوێ کە پێویستییەکانت", en: "Where your needs" },
  "home.h1b": { ar: "بالواقع.", ckb: "دەگەنە واقیع.", en: "meet reality." },
  "home.lede": {
    ar: "تبني CoreOs ذكاءً اصطناعيًا للأعمال تستطيع الشركات الصغيرة والمتوسطة تحمّل تكلفة تشغيله فعلًا. لا رسوم لكل مستخدم، ولا مشروع تجريبي بستة أرقام. وكيل قابل للتهيئة حول ما تفعله شركتك أصلًا — وتُحتسب تكلفته بما يُستخدم منه بالفعل.",
    ckb: "CoreOs زیرەکیی دەستکردی بازرگانی دروست دەکات کە کۆمپانیا بچووک و مامناوەندەکان بەڕاستی توانای بەڕێوەبردنی هەیە. نە کرێی هەر بەکارهێنەرێک، نە پڕۆژەیەکی تاقیکردنەوەی شەش ڕەقەمی. بریکارێکی ڕێکخراو لەسەر بنەمای ئەوەی کۆمپانیاکەت ئێستا دەیکات — و نرخەکەی بەپێی ئەوە دادەنرێت کە چەندی بەکاردێت.",
    en: "CoreOs builds business AI that small and mid-sized companies can actually afford to run. Not a per-seat licence. Not a six-figure pilot. A configurable AI agent shaped around what your business already does — priced by what it actually uses.",
  },
  "home.ctaTest": {
    ar: "جرّب الوكلاء الأحد عشر",
    ckb: "11 بریکارە کراوەکە تاقی بکەرەوە",
    en: "Try the 11 open agents",
  },
  "home.ctaExplore": { ar: "استكشف", ckb: "بگەڕێ", en: "Explore" },
  "home.stat1": { ar: "وكيل في الاختبار", ckb: "بریکار لە تاقیکردنەوەدا", en: "Agents in testing" },
  "home.stat2": { ar: "لغات مدعومة", ckb: "زمان کە خزمەتیان دەکەین", en: "Languages served" },
  "home.stat3": { ar: "رسوم لكل مستخدم", ckb: "کرێی هەر بەکارهێنەرێک", en: "Per-seat fees" },
  "home.stat4": { ar: "بإشراف بشري", ckb: "بە سەرپەرشتیی مرۆڤ", en: "Human-in-the-loop" },

  /* ------------------------------------------------------ what we build */
  "build.eyebrow": { ar: "ما نبنيه", ckb: "ئەوەی دروستی دەکەین", en: "What we build" },
  "build.h2": {
    ar: "من أصغر احتياج تقني إلى أكبر نظام.",
    ckb: "لە بچووکترین پێداویستیی تەکنەلۆژیاوە تا گەورەترین سیستەم.",
    en: "From the smallest tech need to the biggest system.",
  },
  "build.lede": {
    ar: "معظم عملائنا يأتون من أجل موقع. وكثير منهم يبقى من أجل ما بعده — تطبيق، أو نظام داخلي، أو وكيل يتولّى العمل المتكرر. نبنيها جميعًا، ونبنيها بسرعة.",
    ckb: "زۆربەی کڕیارەکانمان بۆ ماڵپەڕێک دێن. زۆرێکیشیان بۆ ئەوەی دوای دێت دەمێننەوە — ئەپێک، یان سیستەمێکی ناوخۆیی، یان بریکارێک کە کارە دووبارەبووەکان لە ئەستۆ دەگرێت. هەموویان دروست دەکەین، و بە خێراییش دروستیان دەکەین.",
    en: "Most of our clients come to us for a website. A lot of them stay for what comes after it — an app, an internal system, an agent that takes the repetitive work. We build all of it, and we build it fast.",
  },
  "build.c1T": { ar: "المواقع الإلكترونية", ckb: "ماڵپەڕەکان", en: "Websites" },
  "build.c1B": {
    ar: "أكثر ما نبنيه. مواقع تعريفية وصفحات هبوط ومواقع أعمال كاملة — مصمَّمة ومنشورة بسرعة، ضمن جدول زمني نتفق عليه معك مسبقًا.",
    ckb: "زۆرترین ئەوەی دروستی دەکەین. ماڵپەڕی ناساندن و پەڕەی داگرتن و ماڵپەڕی تەواوی بازرگانی — بە خێرایی دیزاین و بڵاو دەکرێنەوە، لە ماوەیەکدا کە پێشوەخت لەگەڵت ڕێک دەکەوین.",
    en: "The bulk of what we build. Brochure sites, landing pages and full business sites — designed and deployed quickly, on a timeline we agree with you up front.",
  },
  "build.c2T": { ar: "التطبيقات", ckb: "ئەپەکان", en: "Apps" },
  "build.c2B": {
    ar: "تطبيقات تعمل على الهاتف والحاسوب، من أداة داخلية صغيرة إلى منتج كامل يستخدمه عملاؤك يوميًا.",
    ckb: "ئەپ کە لەسەر مۆبایل و کۆمپیوتەر کار دەکەن، لە ئامرازێکی ناوخۆیی بچووکەوە تا بەرهەمێکی تەواو کە کڕیارەکانت ڕۆژانە بەکاری دەهێنن.",
    en: "Apps that work on a phone and a desktop, from a small internal tool to a full product your customers use daily.",
  },
  "build.c3T": { ar: "الأنظمة والأتمتة", ckb: "سیستەم و ئۆتۆماتیککردن", en: "Systems and automation" },
  "build.c3B": {
    ar: "أنظمة تتبّع ولوحات تحكم وأدوات داخلية وسير عمل يزيل الخطوات اليدوية من يومك.",
    ckb: "سیستەمی بەدواداچوون و داشبۆرد و ئامرازی ناوخۆیی و ڕێڕەوی کار کە هەنگاوە دەستییەکان لە ڕۆژەکەت لادەبەن.",
    en: "Tracking systems, dashboards, internal tools and workflows that take the manual steps out of your day.",
  },
  "build.c4T": { ar: "وكلاء الذكاء الاصطناعي", ckb: "بریکارە زیرەکەکان", en: "AI agents" },
  "build.c4B": {
    ar: "الوكلاء الذين يمكنك اختبارهم على هذا الموقع، مهيَّئون حول مستنداتك وسياساتك ونبرتك.",
    ckb: "ئەو بریکارانەی لەم ماڵپەڕەدا دەتوانیت تاقییان بکەیتەوە، ڕێکخراو لەسەر بەڵگەنامە و سیاسەت و شێوازی قسەکردنی خۆت.",
    en: "The agents you can test on this site, configured around your own documents, policies and tone.",
  },
  "build.cta": {
    ar: "تحدّث إلينا عن مشروعك",
    ckb: "دەربارەی پڕۆژەکەت قسەمان لەگەڵ بکە",
    en: "Talk to us about your project",
  },
  "build.priceT": { ar: "التسعير", ckb: "نرخ", en: "Pricing" },
  "build.priceB": {
    ar: "يُسعَّر كل مشروع بحسب ما يحتاجه فعلًا — موقع من صفحة واحدة ونظام حجوزات كامل ليسا العمل نفسه، ولا ندّعي غير ذلك. أخبرنا بما تريده ونعطيك سعرًا عادلًا في مكالمة واحدة، دون أن ندفعك نحو ما هو أكبر من حاجتك.",
    ckb: "نرخی هەر پڕۆژەیەک بەپێی ئەوە دادەنرێت کە بەڕاستی چی پێویستە. ماڵپەڕێکی یەک پەڕەیی و سیستەمێکی تەواوی حجزکردن هەمان کار نین، و ئێمەش وا ناڵێین. پێمان بڵێ چیت دەوێت و لە یەک پەیوەندیدا نرخێکی دادپەروەرانەت پێدەدەین — بەبێ ئەوەی پاڵت پێوە بنێین بۆ شتێک کە لە پێویستیت گەورەترە.",
    en: "Every project is priced on what it actually needs. A one-page site and a full booking system are not the same job, and we don't pretend otherwise. Tell us what you're after and we'll price it fairly on a call — without pushing you toward something bigger than you need.",
  },

  /* ------------------------------------------------------------- demos */
  "demos.eyebrow": { ar: "أعمال نموذجية", ckb: "نموونەی کار", en: "Demo work" },
  "demos.h2": {
    ar: "شاهد المستوى قبل أن تسأل عن السعر.",
    ckb: "پێش ئەوەی نرخ بپرسیت، ئاستەکە ببینە.",
    en: "See the standard before you ask the price.",
  },
  "demos.lede": {
    ar: "ثلاثة مواقع نموذجية بنيناها لتوضيح النطاق — من صفحة واحدة بسيطة إلى موقع مطعم كامل. كلها قابلة للتصفّح، وكلها من صنعنا.",
    ckb: "سێ ماڵپەڕی نموونە کە دروستمان کردوون بۆ نیشاندانی مەودای کارەکە — لە پەڕەیەکی سادەوە تا ماڵپەڕێکی تەواوی چێشتخانە. هەموویان دەکرێنەوە، و هەموویان کاری ئێمەن.",
    en: "Three demo sites we built to show the range — from a simple one-pager to a full restaurant site. All of them are browsable, and all of them are ours.",
  },
  "demos.scaleS": { ar: "نطاق صغير", ckb: "ئاستی بچووک", en: "Small" },
  "demos.scaleM": { ar: "نطاق متوسط", ckb: "ئاستی مامناوەند", en: "Medium" },
  "demos.scaleL": { ar: "نطاق كبير", ckb: "ئاستی گەورە", en: "Large" },
  "demos.view": { ar: "افتح النموذج", ckb: "نموونەکە بکەرەوە", en: "Open the demo" },
  "demos.barberT": { ar: "صالون حلاقة", ckb: "دوکانی سەرتاش", en: "Barbershop" },
  "demos.barberB": {
    ar: "صفحة واحدة: الخدمات والأسعار وأوقات العمل وزر حجز عبر واتساب. ما يحتاجه محل صغير، دون زيادة.",
    ckb: "یەک پەڕە: خزمەتگوزاری و نرخ و کاتی کارکردن و دوگمەیەکی حجزکردن بە واتساپ. ئەوەی دوکانێکی بچووک پێویستیەتی، نە زیاتر.",
    en: "A single page: services, prices, hours and a WhatsApp booking button. What a small shop needs, and nothing it doesn't.",
  },
  "demos.nailsT": { ar: "صالون أظافر", ckb: "سالۆنی نینۆک", en: "Nail salon" },
  "demos.nailsB": {
    ar: "قائمة خدمات مفصّلة، ومعرض أعمال، وآراء العميلات، ونموذج حجز — لنشاط يعيش على المظهر والحجوزات.",
    ckb: "لیستێکی وردی خزمەتگوزاری، و گەلەریی کار، و ڕای کڕیارەکان، و فۆڕمی حجزکردن — بۆ کارێک کە بە دیمەن و بە پڕیی دەفتەری کاتەکانەوە دەژی.",
    en: "A detailed service menu, a gallery, client reviews and a booking form — for a business that lives on how it looks and how full the diary is.",
  },
  "demos.restT": { ar: "مطعم", ckb: "چێشتخانە", en: "Restaurant" },
  "demos.restB": {
    ar: "قائمة طعام كاملة بأقسام، ومعرض، وقصة المكان، وحجز الطاولات، وروابط التوصيل، والفروع وأوقاتها.",
    ckb: "لیستی خواردنی تەواو بە بەشەکانەوە، و گەلەری، و چیرۆکی شوێنەکە، و حجزکردنی مێز، و بەستەری گەیاندن، و لقەکان و کاتەکانیان.",
    en: "A full menu by category, a gallery, the story of the place, table reservations, delivery links, and branches with their hours.",
  },
  "demos.badge": { ar: "نموذج من CoreOs", ckb: "نموونەیەکی CoreOs", en: "A CoreOs demo" },
  "demos.badgeCta": { ar: "اطلب واحدًا مثله", ckb: "یەکێکی وەک ئەمە داوا بکە", en: "Get one like this" },
  "demos.back": { ar: "العودة إلى CoreOs", ckb: "گەڕانەوە بۆ CoreOs", en: "Back to CoreOs" },

  /* ---------------------------------------------------------- whatsapp */
  "contact.waH2": { ar: "واتساب", ckb: "واتساپ", en: "WhatsApp" },
  "contact.waB": {
    ar: "أسرع طريقة للوصول إلينا. اكتب لنا وسنرد، وغالبًا نتصل بك مباشرة لنفهم ما تحتاجه في دقيقتين بدل عشر رسائل.",
    ckb: "خێراترین ڕێگا بۆ گەیشتن بە ئێمە. نامەمان بۆ بنێرە و وەڵامت دەدەینەوە — زۆرجار بە پەیوەندییەکەوە، تا لە دوو خولەکدا تێبگەین چیت دەوێت لە جیاتی دە ئیمەیل.",
    en: "The quickest way to reach us. Message us and we'll reply — usually with a call, so we can understand what you need in two minutes instead of ten emails.",
  },
  "contact.waCta": {
    ar: "راسلنا على واتساب",
    ckb: "لە واتساپ نامەمان بۆ بنێرە",
    en: "Message us on WhatsApp",
  },
  "contact.waPrefill": {
    ar: "مرحبًا CoreOs، أود التحدث عن مشروع.",
    ckb: "سڵاو CoreOs، دەمەوێت دەربارەی پڕۆژەیەک قسە بکەم.",
    en: "Hi CoreOs, I'd like to talk about a project.",
  },
  "footer.whatsapp": { ar: "واتساب", ckb: "واتساپ", en: "WhatsApp" },

  "home.missionEyebrow": { ar: "رسالتنا", ckb: "ئامانجمان", en: "Our mission" },
  "home.missionH2": {
    ar: "ذكاء اصطناعي للأعمال، بسعر تستطيع شركة حقيقية أن توافق عليه.",
    ckb: "زیرەکیی دەستکردی بازرگانی، بە نرخێک کە کۆمپانیایەکی ڕاستەقینە بتوانێت بەڵێی پێ بڵێت.",
    en: "B2B AI, priced so a real business can say yes.",
  },
  "home.missionP1": {
    ar: "الذكاء الاصطناعي المؤسسي مُسعَّر للمؤسسات الكبرى. شركة شحن من اثني عشر موظفًا، أو تاجر جملة عائلي، أو عيادة محلية — يُعرض عليها رسم المنصة نفسه المعروض على شركة متعددة الجنسيات، ويُطلب منها ترخيص لكل موظف، ثم التوقيع لسنة كاملة قبل أن يعمل أي شيء.",
    ckb: "زیرەکیی دەستکردی ئینتەرپرایز نرخەکەی بۆ ئینتەرپرایزەکان دانراوە. کۆمپانیایەکی گواستنەوە بە دوانزە کارمەند، یان فرۆشیارێکی کۆیی خێزانی، یان نەخۆشخانەیەکی ناوچەیی — هەمان کرێی پلاتفۆرمیان بۆ دادەنرێت کە بۆ کۆمپانیایەکی نێودەوڵەتی دادەنرێت، پێیان دەوترێت بۆ هەر کارمەندێک مۆڵەتێک بکڕن، پاشان داوایان لێدەکرێت بۆ ساڵێک واژوو بکەن پێش ئەوەی هیچ شتێک کار بکات.",
    en: "Enterprise AI is priced for enterprises. A twelve-person logistics firm, a family wholesaler, a regional clinic — they get quoted the same platform fee as a multinational, told to buy a seat for every employee, then asked to sign for a year before anything works.",
  },
  "home.missionP2": {
    ar: "وُجدت CoreOs لكسر ذلك. نحتسب الاستخدام، لا عدد الموظفين. وأنت من يضع السقف قبل أن تنفق شيئًا.",
    ckb: "CoreOs بۆ شکاندنی ئەوە هەیە. ئێمە بەکارهێنان دەپێوین، نەک ژمارەی کارمەند. تۆ سنوورەکە دادەنێیت پێش ئەوەی هیچ خەرج بکەیت.",
    en: "CoreOs exists to break that. We meter usage, not headcount. You set the ceiling before you spend a thing.",
  },
  "home.missionLink": {
    ar: "اقرأ رسالتنا كاملة",
    ckb: "ئامانجی تەواومان بخوێنەوە",
    en: "Read the full mission",
  },

  "home.pillar1T": {
    ar: "محسوب بالاستخدام، لا بالتراخيص",
    ckb: "بەپێی بەکارهێنان، نەک بەپێی مۆڵەت",
    en: "Metered, not licensed",
  },
  "home.pillar1B": {
    ar: "تُحدَّد الحصص لكل عميل بالجُمل والأحرف. تضع سقف الإنفاق قبل أول رسالة، والسقف يصمد.",
    ckb: "کۆتاکان بۆ هەر کڕیارێک بە ڕستە و پیت دیاری دەکرێن. سنووری خەرجکردن پێش یەکەم نامە دادەنێیت، و سنوورەکەش دەمێنێتەوە.",
    en: "Quotas are set per customer in sentences and characters. You cap the spend before the first message, and the cap holds.",
  },
  "home.pillar2T": {
    ar: "مُهيَّأ، لا مبني من الصفر",
    ckb: "ڕێکخراو، نەک لە سفرەوە دروستکراو",
    en: "Configured, not custom-built",
  },
  "home.pillar2B": {
    ar: "يُضبط وكيلك أثناء التشغيل — التعليمات والنبرة والحدود والمتغيّرات. لا ارتباط يمتد ستة أشهر لتغيير جملة واحدة.",
    ckb: "بریکارەکەت لە کاتی کارکردندا ڕێک دەخرێت — ڕێنمایی و شێواز و سنوور و گۆڕاوەکان. پێویست ناکات شەش مانگ چاوەڕێ بکەیت بۆ گۆڕینی یەک ڕستە.",
    en: "Your agent is tuned at runtime — instructions, tone, limits, variables. No six-month engagement to change a sentence.",
  },
  "home.pillar3T": {
    ar: "يخدم عملاءك الحقيقيين",
    ckb: "خزمەتی کڕیارە ڕاستەقینەکانت دەکات",
    en: "Serves your actual customers",
  },
  "home.pillar3B": {
    ar: "الإنجليزية والعربية والكردية جاهزة من البداية، بنبرة العلامة نفسها في كل لغة. الأعمال الإقليمية ليست فكرة لاحقة.",
    ckb: "ئینگلیزی و عەرەبی و کوردی لە سەرەتاوە ئامادەن، بە هەمان دەنگی براند لە هەر زمانێکدا. بازرگانیی ناوچەیی بیرۆکەیەکی دواتر نییە.",
    en: "English, Arabic and Kurdish out of the box, with the same brand voice in each. Regional business is not an afterthought.",
  },
  "home.pillar4T": { ar: "قابل للتبديل من الداخل", ckb: "لە ژێرەوە گۆڕانپەزیر", en: "Switchable underneath" },
  "home.pillar4B": {
    ar: "النماذج تتغيّر شهريًا. نموذجك يُحدَّث دون مشروع ترحيل، لأن المحرّك مسؤوليتنا لا عبؤك.",
    ckb: "مۆدێلەکان مانگانە دەگۆڕێن. هی تۆ بەبێ پڕۆژەیەکی گواستنەوە نوێ دەکرێتەوە، چونکە بزوێنەرەکە بەرپرسیارێتیی ئێمەیە نەک بارگرانیی تۆ.",
    en: "Models change monthly. Yours updates without a migration project, because the engine is ours to swap, not yours to manage.",
  },

  "home.humanH2": {
    ar: "نبني الذكاء الاصطناعي ليساعد الناس في عملهم — لا ليعمل بدلًا عنهم.",
    ckb: "زیرەکیی دەستکرد دروست دەکەین بۆ ئەوەی یارمەتیی خەڵک بدات لە کارەکەیاندا — نەک بۆ ئەوەی لە جیاتییان کار بکات.",
    en: "We build AI to help people work — not to work instead of them.",
  },
  "home.humanP": {
    ar: "هذه ليست عبارة تسويقية نخفّفها لاحقًا، بل قيد تصميمي. كل وكيل من CoreOs مبني ليتولّى الثلث المتكرر من الوظيفة — الأسئلة العشرون نفسها، والنسخ واللصق، والانتظار بعد ساعات الدوام — ويعيد الحكم إلى الشخص الذي يحمل الردُّ اسمَه.",
    ckb: "ئەمە دروشمێکی بازرگانی نییە کە دواتر لاوازی بکەینەوە، بەڵکو مەرجێکی دیزاینە. هەر بریکارێکی CoreOs دروستکراوە بۆ ئەوەی ئەو سێیەکە دووبارەبووەی کارەکە بگرێتە ئەستۆ — هەمان بیست پرسیار، و کۆپی و لکاندن، و چاوەڕوانیی دوای کاتی کار — و بڕیارەکە بگەڕێنێتەوە بۆ ئەو کەسەی ناوی لەسەر وەڵامەکەیە.",
    en: "This is not a marketing line we soften later. It is a design constraint. Every CoreOs agent is built to take the repetitive third of a job — the same twenty questions, the copy-paste, the after-hours holding pattern — and hand the judgement back to the person whose name is on the reply.",
  },
  "home.human1T": { ar: "مسودات، لا قرارات", ckb: "ڕەشنووس، نەک بڕیار", en: "Drafts, not decisions" },
  "home.human1B": {
    ar: "الوكيل يُعدّ الرد. وإنسان يراجعه ويعدّله ويرسله.",
    ckb: "بریکارەکە وەڵامەکە ئامادە دەکات. مرۆڤێک پێداچوونەوەی بۆ دەکات و دەستکاریی دەکات و دەینێرێت.",
    en: "Agents prepare the reply. A human reviews it, edits it, and sends it.",
  },
  "home.human2T": { ar: "التصعيد هو الأصل", ckb: "گواستنەوە بنەڕەتە", en: "Escalation by default" },
  "home.human2B": {
    ar: "حين لا يكون الوكيل واثقًا، يتوقف ويحوّل الأمر إلى زميل بدل اختلاق إجابة.",
    ckb: "کاتێک بریکارەکە دڵنیا نییە، دەوەستێت و کارەکە دەدات بە هاوکارێک لە جیاتی هەڵبەستنی وەڵامێک.",
    en: "When an agent is unsure, it stops and routes to a colleague instead of inventing an answer.",
  },
  "home.human3T": {
    ar: "لا أحد يُقاس ليخسر وظيفته",
    ckb: "هیچ کەسێک نایپێورێت تا کارەکەی لەدەست بدات",
    en: "Nobody is measured out of a job",
  },
  "home.human3B": {
    ar: "نُبلغ عن الطلبات التي جرى تفاديها والساعات المستردة — لا عن عدد الموظفين الذين يمكن الاستغناء عنهم.",
    ckb: "ڕاپۆرت لەسەر ئەو داواکارییانە دەدەین کە پێشیان گیراوە و ئەو کاتژمێرانەی گەڕێنراونەتەوە — نەک لەسەر ئەو ژمارە کارمەندەی دەتوانیت کەمی بکەیتەوە.",
    en: "We report on tickets deflected and hours returned — never on headcount you could cut.",
  },

  "home.testEyebrow": { ar: "الاختبار المفتوح", ckb: "تاقیکردنەوەی کراوە", en: "Open testing" },
  "home.testH2": {
    ar: "أحد عشر وكيل أعمال. جرّبهم مجانًا، الآن.",
    ckb: "یازدە بریکاری بازرگانی. بەخۆڕایی تاقییان بکەرەوە، ئێستا.",
    en: "Eleven business agents. Free to test, right now.",
  },
  "home.testP": {
    ar: "هؤلاء هم الوكلاء الذين تنشرهم CoreOs لعملائها، أتحناهم لك لتطرح عليهم أسئلتك قبل أن تتحدث إلى أحد. بلا تسجيل، وبلا بطاقة، وبلا مكالمة.",
    ckb: "ئەمانە ئەو بریکارانەن کە CoreOs بۆ کڕیارەکانی بڵاویان دەکاتەوە، کراونەتەوە تا پێش ئەوەی لەگەڵ کەس قسە بکەیت پرسیارەکانی خۆتیان لێ بکەیت. بەبێ تۆمارکردن، بەبێ کارت، بەبێ پەیوەندی.",
    en: "These are the agents CoreOs deploys for clients, opened up so you can put your own questions to them before you talk to anyone. No signup, no card, no call.",
  },
  "home.testAll": { ar: "شاهد الأحد عشر جميعًا", ckb: "هەر یازدەکە ببینە", en: "See all 11" },

  "home.labH2": {
    ar: "عشرون نموذجًا. عشرون اسمًا رمزيًا. ولا شعارات تُحيّز حكمك.",
    ckb: "بیست مۆدێل. بیست ناوی نهێنی. هیچ نیشانەیەک نییە کە بڕیارەکەت لار بکاتەوە.",
    en: "Twenty models. Twenty codenames. No badges to bias you.",
  },
  "home.labP": {
    ar: "CoreOs.ai هو مختبرنا المفتوح للنماذج. كل نموذج من النماذج العشرين يُنشر باسم رمزي من CoreOs مع وصف واضح لما يُجيده — لتختار بناءً على النتيجة، لا على الشعار المرفق بها.",
    ckb: "CoreOs.ai تاقیگەی کراوەی مۆدێلەکانمانە. هەر یەکێک لە 20 مۆدێلەکە بە ناوێکی نهێنیی CoreOs بڵاو دەکرێتەوە لەگەڵ وەسفێکی ڕوون لەوەی باشە بۆ چی — تا لەسەر ئەنجام هەڵبژێریت، نەک لەسەر ئەو لۆگۆیەی پێوەی نووساوە.",
    en: "CoreOs.ai is our open model lab. Each of the 20 models is published under a CoreOs codename with a plain description of what it's good for — so you pick on results, not on whose logo is attached.",
  },
  "home.labCta": { ar: "ادخل مختبر النماذج", ckb: "بچۆرە ناو تاقیگەی مۆدێلەکان", en: "Enter the model lab" },

  /* ----------------------------------------------------------- mission */
  "mission.eyebrow": { ar: "رسالتنا", ckb: "ئامانجمان", en: "Our mission" },
  "mission.h1a": {
    ar: "اجعل ذكاء الأعمال الاصطناعي في المتناول — واجعله يعمل",
    ckb: "زیرەکیی دەستکردی بازرگانی بکە بە شتێکی گونجاو — و وای لێ بکە کار بکات",
    en: "Make business AI affordable — and make it work",
  },
  "mission.h1with": { ar: "مع", ckb: "لەگەڵ", en: "with" },
  "mission.h1b": { ar: "الناس.", ckb: "خەڵکدا.", en: "people." },
  "mission.lede": {
    ar: "التزامان يقوم عليهما كل ما تبنيه CoreOs. أحدهما عن السعر، والآخر عن الناس. ونرفض مقايضة أحدهما بالآخر.",
    ckb: "دوو بەڵێن هەموو ئەوە ڕادەگرن کە CoreOs دروستی دەکات. یەکێکیان دەربارەی نرخە. ئەوی تر دەربارەی خەڵکە. ڕەتیش دەکەینەوە کە یەکێکیان بە ئەوی تر بگۆڕینەوە.",
    en: "Two commitments hold up everything CoreOs builds. One is about price. The other is about people. We refuse to trade either for the other.",
  },

  "mission.c1label": { ar: "الالتزام 01", ckb: "بەڵێنی 01", en: "Commitment 01" },
  "mission.c1h2": {
    ar: "تكلفة في متناول قطاع الأعمال",
    ckb: "نرخێکی گونجاو بۆ بازرگانی",
    en: "B2B affordability",
  },
  "mission.c1p1": {
    ar: "قرّرت صناعة الذكاء الاصطناعي بهدوء أن الأدوات الجادة للشركات التي لديها قسم مشتريات. والتسعير يثبت ذلك: رسوم منصة قبل إرسال رسالة واحدة، وتراخيص لكل مستخدم تعاقبك على امتلاك موظفين، والتزامات سنوية تُوقَّع قبل أن يُثبت أحد أن الأمر يعمل على بياناتك، ثم فاتورة تكامل تصل بعد ذلك.",
    ckb: "پیشەسازیی زیرەکیی دەستکرد بێدەنگانە بڕیاری داوە کە ئامرازی جددی بۆ ئەو کۆمپانیایانەیە کە بەشی کڕینیان هەیە. نرخەکان ئەوە دەسەلمێنن: کرێی پلاتفۆرم پێش ئەوەی یەک نامە بنێردرێت، و مۆڵەتی هەر کارمەندێک کە سزات دەدات لەبەر ئەوەی کارمەندت هەیە، و بەڵێنی ساڵانە کە واژوو دەکرێت پێش ئەوەی کەس بسەلمێنێت شتەکە لەسەر داتاکانی تۆ کار دەکات، و پاشان پسوولەی یەکخستن کە دواتر دێت.",
    en: "The AI industry has quietly decided that serious tooling is for companies with a procurement department. The pricing proves it: platform fees before a single message is sent, seat licences that punish you for having staff, annual commitments signed before anyone has demonstrated the thing works on your data, and an integration bill that arrives afterwards.",
  },
  "mission.c1p2": {
    ar: "شركة شحن من اثني عشر موظفًا لديها المشكلة نفسها التي لدى شركة من اثني عشر ألفًا — الأسئلة المتكررة نفسها، والفجوة نفسها بعد ساعات الدوام، وصندوق الوارد نفسه الذي لا يجد أحد وقتًا له. ما ينقصها هو بند بستة أرقام لحلّها. فتبقى بلا حل، وتتسع كل ربع سنة الفجوة بين الشركات التي تستطيع استخدام الذكاء الاصطناعي وتلك التي لا تستطيع.",
    ckb: "کۆمپانیایەکی گواستنەوە بە دوانزە کارمەند هەمان ئەو کێشەی هەیە کە کۆمپانیایەکی دوانزە هەزار کەسی هەیەتی — هەمان پرسیارە دووبارەبووەکانی کڕیاران، هەمان بۆشاییی دوای کاتی کار، هەمان سندووقی نامە کە کەس کاتی بۆ نییە. ئەوەی نییەتی بڕە پارەیەکی شەش ڕەقەمییە بۆ چارەسەرکردنی. بۆیە بەبێ چارەسەر دەمێنێتەوە، و هەر چارەکێک ئەو بۆشاییە فراوانتر دەبێت لە نێوان ئەو کۆمپانیایانەی دەتوانن زیرەکیی دەستکرد بەکاربهێنن و ئەوانەی ناتوانن.",
    en: "A twelve-person logistics firm has the same problem a twelve-thousand-person one does — the same repeated customer questions, the same after-hours gap, the same inbox nobody has time for. What it does not have is a six-figure line item to solve it with. So it goes without, and the gap between businesses that can use AI and businesses that cannot gets wider every quarter.",
  },
  "mission.c1p3": {
    ar: "بُنيت CoreOs تحديدًا لسدّ تلك الفجوة. القدرة على تحمّل التكلفة ليست استراتيجية خصم لدينا؛ إنها بنية المنتج ذاتها.",
    ckb: "CoreOs بە تایبەتی بۆ داخستنی ئەو بۆشاییە دروستکراوە. گونجاویی نرخ ستراتیژیی داشکاندنی ئێمە نییە؛ بنیاتی بەرهەمەکەیە.",
    en: "CoreOs is built specifically to close that gap. Affordability is not our discount strategy; it is the product architecture.",
  },

  "mission.p1T": {
    ar: "تدفع مقابل الاستخدام، لا مقابل عدد الموظفين",
    ckb: "پارە بۆ بەکارهێنان دەدەیت، هەرگیز بۆ ژمارەی کارمەند نا",
    en: "You pay for usage, never for headcount",
  },
  "mission.p1B": {
    ar: "تُعرَّف الحصص بالجُمل والأحرف، لكل عميل، مع حدود صارمة تُطبَّق على كل طلب. توظيف موظف عاشر لا يرفع فاتورتك، ولا منح خمسة آخرين حق الوصول.",
    ckb: "کۆتاکان بە ڕستە و پیت پێناسە دەکرێن، بۆ هەر کڕیارێک، بە سنوورێکی توند کە لەسەر هەر داواکارییەک جێبەجێ دەکرێت. دامەزراندنی کارمەندی دەیەم پسوولەکەت زیاد ناکات. دانی دەستگەیشتن بە پێنج کەسی تریش هەروەها.",
    en: "Quotas are defined in sentences and characters, per customer, with hard limits enforced on every request. Hiring a tenth employee does not raise your bill. Neither does giving five more people access.",
  },
  "mission.p2T": {
    ar: "السقف يُحدَّد قبل أن تنفق",
    ckb: "سنوورەکە پێش خەرجکردن دادەنرێت",
    en: "The ceiling is set before you spend",
  },
  "mission.p2B": {
    ar: "كل حساب يحمل حدًا أقصى صريحًا. وعند بلوغه يتوقف الوكيل ويقول ذلك — لا يواصل الإنفاق ثم يرسل الفاتورة لاحقًا. غياب المفاجآت في الفاتورة هو أكثر ما تطلبه الشركات بهذا الحجم، لذلك جعلناه الوضع الافتراضي.",
    ckb: "هەر هەژمارێک سنوورێکی ڕوونی هەیە. کاتێک دەگاتە ئەوێ، بریکارەکە دەوەستێت و دەیڵێت — بەردەوام نابێت لە خەرجکردن و دواتر پسوولەت بۆ بنێرێت. نەبوونی سەرسوڕمان لە پسوولەدا زۆرترین داواکارییە لەلایەن کۆمپانیای ئەم قەبارەیەوە، بۆیە کردوومانە بە بنەڕەت.",
    en: "Every account carries an explicit cap. When it is reached, the agent stops and says so — it does not keep spending and invoice you afterwards. No surprise overage is the single most requested feature from businesses of this size, so it is the default.",
  },
  "mission.p3T": {
    ar: "التهيئة تُغني عن التطوير المخصَّص",
    ckb: "ڕێکخستن جێی گەشەپێدانی تایبەت دەگرێتەوە",
    en: "Configuration replaces custom development",
  },
  "mission.p3B": {
    ar: "تعليمات وكيلك ونبرته ولغته ومتغيّراته وحدوده كلها إعدادات وقت تشغيل. تغيير سلوكه تعديل في لوحة تحكم، لا طلب تغيير على عقد عمل.",
    ckb: "ڕێنمایی و شێواز و زمان و گۆڕاو و سنوورەکانی بریکارەکەت هەموویان ڕێکخستنی کاتی کارکردنن. گۆڕینی ڕەفتاری دەستکارییەکە لە پانێڵێکدا، نەک داواکاریی گۆڕان لەسەر گرێبەستێک.",
    en: "Your agent's instructions, tone, language, variables and limits are all runtime settings. Changing how it behaves is an edit in a console, not a change request against a statement of work.",
  },
  "mission.p4T": {
    ar: "ترقيات النماذج على عاتقنا",
    ckb: "بەرزکردنەوەی مۆدێلەکان لە ئەستۆی ئێمەیە",
    en: "Model upgrades are ours to absorb",
  },
  "mission.p4B": {
    ar: "المحرّك تحت وكيلك يتحسّن دون مشروع ترحيل من جانبك. ولن تدفع أبدًا رسوم خدمات احترافية للانتقال من جيل نموذج إلى الذي يليه.",
    ckb: "ئەو بزوێنەرەی لە ژێر بریکارەکەتدایە بەبێ پڕۆژەیەکی گواستنەوە لەلایەن تۆوە باشتر دەبێت. هەرگیز کرێی خزمەتگوزاریی پیشەیی نادەیت بۆ گواستنەوە لە نەوەیەکی مۆدێلەوە بۆ ئەوەی دواتر.",
    en: "The engine underneath your agent improves without a migration project on your side. You never pay a professional-services fee to move from one generation of model to the next.",
  },
  "mission.p5T": {
    ar: "اختبر كل شيء قبل أن تتحدث إلى المبيعات",
    ckb: "پێش ئەوەی لەگەڵ فرۆشتن قسە بکەیت هەموو شتێک تاقی بکەرەوە",
    en: "Test the whole thing before you talk to sales",
  },
  "mission.p5B": {
    ar: "واحد وثلاثون وكيلًا متاحون للاختبار العام على هذا الموقع. بلا حساب، وبلا بطاقة، وبلا مكالمة استكشافية. وإن لم يجيبوا عن أسئلتك جيدًا، تكون قد خسرت عشر دقائق بدل دورة ميزانية كاملة.",
    ckb: "سی و یەک بریکار لەم ماڵپەڕەدا کراوەن بۆ تاقیکردنەوەی گشتی. بەبێ هەژمار، بەبێ کارت، بەبێ پەیوەندیی ناسیاری. ئەگەر وەڵامی پرسیارەکانی تۆی باش نەدایەوە، دە خولەکت لەدەست داوە نەک خولێکی بودجە.",
    en: "Thirty-one agents are open for public testing on this site. No account, no card, no discovery call. If it does not answer your questions well, you have lost ten minutes rather than a budget cycle.",
  },
  "mission.quote": {
    ar: "«في المتناول» لا تعني رخيصًا ومنقوصًا. تعني أن السعر مصمَّم على مقاس الشركة التي تدفعه.",
    ckb: "«گونجاو» واتای هەرزان و کەمتەرخەم نییە. واتای ئەوەیە کە نرخەکە بەپێی قەبارەی ئەو کۆمپانیایە دروستکراوە کە دەیدات.",
    en: "Affordable does not mean cheap and stripped down. It means the price is shaped like the business paying it.",
  },

  "mission.c2label": { ar: "الالتزام 02", ckb: "بەڵێنی 02", en: "Commitment 02" },
  "mission.c2h2": {
    ar: "ذكاء اصطناعي يساعد البشر — لا ذكاء اصطناعي يأخذ وظائفهم",
    ckb: "زیرەکییەک کە یارمەتیی مرۆڤ دەدات — نەک زیرەکییەک کە کارەکەیان لێ دەستێنێت",
    en: "AI that helps humans — not AI that takes their jobs",
  },
  "mission.c2p1": {
    ar: "يُباع معظم الذكاء الاصطناعي بحجّة عدد الموظفين: انشر هذا، ووظّف عددًا أقل. لن نبيع ذلك، وقد بنينا CoreOs عمدًا لتكون أداة رديئة لمن يحاول ذلك.",
    ckb: "زۆربەی زیرەکیی دەستکرد بە بەڵگەی کەمکردنەوەی کارمەند دەفرۆشرێت: ئەمە بڵاو بکەرەوە، و کەمتر کارمەند دابمەزرێنە. ئێمە ئەوە نافرۆشین، و بە ئەنقەست CoreOsمان وا دروستکردووە کە ئامرازێکی خراپ بێت بۆ هەر کەسێک هەوڵی ئەوە بدات.",
    en: "Most AI is sold on a headcount argument: deploy this, employ fewer people. We will not sell that, and we have deliberately built CoreOs so it is a poor tool for anyone trying to.",
  },
  "mission.c2p2": {
    ar: "العمل الذي يتولّاه وكلاؤنا هو الجزء الذي لا يحميه أحد من الوظيفة: الإجابة عن الأسئلة العشرين نفسها، ونقل رقم طلب بين نظامين، وصياغة رابع رسالة متطابقة في الصباح، وتغطية صندوق الوارد في الحادية عشرة ليلًا. هذا العمل يُنهك الناس، وهو أول ما يسقط حين يكون الفريق مثقلًا. إزالته لا تزيل الشخص — بل تعيد إليه الجزء من الدور الذي احتاج إنسانًا من البداية.",
    ckb: "ئەو کارەی بریکارەکانمان دەیگرنە ئەستۆ ئەو بەشەی کارەکەیە کە کەس نایپارێزێت: وەڵامدانەوەی هەمان بیست پرسیار، گواستنەوەی ژمارەی داواکارییەک لە نێوان دوو سیستەم، نووسینی چوارەمین ئیمەیلی وەک یەک لە بەیانیدا، پاراستنی سندووقی نامە لە کاتژمێر یازدەی شەودا. ئەو کارە خەڵک ماندوو دەکات و یەکەم شتە کە فڕێ دەدرێت کاتێک تیمێک قورسبار دەبێت. لابردنی کەسەکە لا نابات — بەڵکو ئەو بەشەی ڕۆڵەکەی دەگەڕێنێتەوە کە لە سەرەتاوە پێویستیی بە مرۆڤ بوو.",
    en: "The work our agents take on is the part of a job nobody protects: answering the same twenty questions, copying an order number between two systems, drafting the fourth identical email of the morning, covering the inbox at eleven at night. That work exhausts people and it is the first thing that gets dropped when a team is stretched. Removing it does not remove the person — it gives them back the part of the role that needed a human in the first place.",
  },
  "mission.c2p3": {
    ar: "الحكم يبقى لدى موظفيك. في كل مرة.",
    ckb: "بڕیار لای کارمەندەکانت دەمێنێتەوە. هەموو جارێک.",
    en: "Judgement stays with your staff. Every time.",
  },

  "mission.h1T": {
    ar: "المسودة أولًا بالتصميم",
    ckb: "ڕەشنووس یەکەم، بە دیزاین",
    en: "Draft-first by design",
  },
  "mission.h1B": {
    ar: "الوكلاء الذين يتعاملون مع العملاء يُنتجون مسودات. شخصٌ يراجع ويرسل. النظام مبني حول تلك الخطوة، لا حول إزالتها.",
    ckb: "ئەو بریکارانەی دەست لە کڕیار دەدەن ڕەشنووس بەرهەم دەهێنن. کەسێک پێداچوونەوەی بۆ دەکات و دەینێرێت. سیستەمەکە لە دەوری ئەو هەنگاوە دروستکراوە، نەک لە دەوری لابردنی.",
    en: "Agents that touch customers produce drafts. A person reviews and sends. The system is built around that step, not around removing it.",
  },
  "mission.h2T": { ar: "الشك يُصعَّد", ckb: "دڵنیانەبوون دەگوازرێتەوە", en: "Uncertainty escalates" },
  "mission.h2B": {
    ar: "الوكيل غير الواثق يقول ذلك ويحوّل إلى زميل. الهراء الواثق نتيجة أسوأ من التحويل، لذلك نصمّم ضدّه.",
    ckb: "بریکارێک کە دڵنیا نییە ئەوە دەڵێت و کارەکە دەدات بە هاوکارێک. قسەی بێبنەمای بە متمانەوە ئەنجامێکی خراپترە لە گواستنەوە، بۆیە دژی ئەوە دیزاین دەکەین.",
    en: "An agent that is not confident says so and routes to a colleague. Confident nonsense is a worse outcome than a handover, so we optimise against it.",
  },
  "mission.h3T": { ar: "نطاق محدود", ckb: "چوارچێوەی دیاریکراو", en: "Bounded scope" },
  "mission.h3B": {
    ar: "يجيب الوكلاء من مستنداتك وسياساتك. ولا يُمنحون صلاحية تقديم التزامات أو خصومات أو استثناءات نيابة عنك.",
    ckb: "بریکارەکان لە بەڵگەنامە و سیاسەتەکانی تۆوە وەڵام دەدەنەوە. دەسەڵاتیان پێنادرێت کە بەڵێن یان داشکاندن یان لێبووردن لە جیاتی تۆ بدەن.",
    en: "Agents answer from your documents and policies. They are not given authority to make commitments, discounts or exceptions on your behalf.",
  },
  "mission.h4T": { ar: "تقارير صادقة", ckb: "ڕاپۆرتی ڕاستگۆیانە", en: "Honest reporting" },
  "mission.h4B": {
    ar: "نُبلغ عن الساعات المستردة والأسئلة التي جرى تفاديها. ولا نُنتج نماذج لتقليص عدد الموظفين، ولن نبني واحدًا عند الطلب.",
    ckb: "ڕاپۆرت لەسەر ئەو کاتژمێرانە دەدەین کە گەڕێنراونەتەوە و ئەو پرسیارانەی پێشیان گیراوە. مۆدێلی کەمکردنەوەی کارمەند بەرهەم ناهێنین، و بە داواکاریش دروستی ناکەین.",
    en: "We report hours returned and questions deflected. We do not produce headcount-reduction models, and we will not build one on request.",
  },

  "mission.closeH2": {
    ar: "احكم بنفسك قبل أن تصدّق أيًا من هذا.",
    ckb: "پێش ئەوەی باوەڕ بە هیچ لەمانە بکەیت، خۆت بڕیاری لەسەر بدە.",
    en: "Judge it yourself before you believe any of this.",
  },
  "mission.closeP": {
    ar: "واحد وثلاثون وكيلًا متاحون الآن. اسألهم شيئًا من عملك أنت وانظر إن كانت الإجابات تصمد.",
    ckb: "سی و یەک بریکار ئێستا کراوەن. شتێکیان لێ بپرسە لە کاری خۆتەوە و ببینە ئایا وەڵامەکان دەوەستن.",
    en: "Thirty-one agents are open right now. Ask them something from your own business and see whether the answers hold up.",
  },
  "mission.closeCta": {
    ar: "اختبر الوكلاء المتاحين",
    ckb: "بریکارە کراوەکان تاقی بکەرەوە",
    en: "Test the open agents",
  },

  /* ----------------------------------------------------------- testing */
  "testing.eyebrow": {
    ar: "برنامج الاختبار المفتوح",
    ckb: "پڕۆگرامی تاقیکردنەوەی کراوە",
    en: "Open testing programme",
  },
  "testing.h1a": {
    ar: "أحد عشر وكيلًا من CoreOs،",
    ckb: "یازدە بریکاری CoreOs،",
    en: "Eleven CoreOs agents,",
  },
  "testing.h1b": {
    ar: "متاحون لأي شخص ليختبرهم.",
    ckb: "کراوەن بۆ هەر کەسێک تاقییان بکاتەوە.",
    en: "open for anyone to test.",
  },
  "testing.lede": {
    ar: "كل واحد منهم وكيل أعمال حقيقي من CoreOs — من النوع نفسه الذي نهيّئه للعملاء الدافعين — يعمل في بيئة اختبار عامة. افتح أحدهم، واسأله شيئًا من عملك، واحكم عليه بالإجابة. لا شيء يتطلب التسجيل.",
    ckb: "هەر یەکێکیان بریکارێکی بازرگانیی ڕاستەقینەی CoreOsە — هەمان ئەو جۆرەی بۆ کڕیارە پارەدەرەکان ڕێکی دەخەین — کە لە ژینگەیەکی تاقیکردنەوەی گشتیدا کار دەکات. یەکێکیان بکەرەوە، شتێکی لێ بپرسە لە کارەکەی خۆتەوە، و بەپێی وەڵامەکە بڕیاری لەسەر بدە. هیچ شتێک پێویستیی بە تۆمارکردن نییە.",
    en: "Each one is a real CoreOs business agent — the same kind we configure for paying clients — running in a public sandbox. Open one, ask it something from your own operation, and judge it on the answer. Nothing to sign up for.",
  },
  "testing.n1T": { ar: "لا حاجة لحساب", ckb: "پێویستی بە هەژمار نییە", en: "No account needed" },
  "testing.n1B": {
    ar: "كل وكيل أدناه يعمل الآن. اضغط «اختبار» وابدأ الكتابة.",
    ckb: "هەموو بریکارێکی خوارەوە ئێستا کار دەکات. کلیکی «تاقیکردنەوە» بکە و دەست بە نووسین بکە.",
    en: "Every agent below is live. Click test and start typing.",
  },
  "testing.n2T": {
    ar: "المحرّكات تبقى مخفية",
    ckb: "بزوێنەرەکان شاراوە دەمێننەوە",
    en: "Engines stay hidden",
  },
  "testing.n2B": {
    ar: "يُنشر الوكلاء بأسماء رمزية من CoreOs حتى لا تُجمِّل التسمية النتيجة.",
    ckb: "بریکارەکان بە ناوی نهێنیی CoreOs بڵاو دەکرێنەوە تا ناوەکە ئەنجامەکە جوان نەکات.",
    en: "Agents are published under CoreOs codenames so the label can't flatter the output.",
  },
  "testing.n3T": { ar: "لا شيء يُحفظ", ckb: "هیچ شتێک هەڵناگیرێت", en: "Nothing is stored" },
  "testing.n3B": {
    ar: "محادثات بيئة الاختبار لا تُحفظ. ومع ذلك، لا تلصق أي شيء سرّي.",
    ckb: "گفتوگۆکانی ژینگەی تاقیکردنەوە هەڵناگیرێن. لەگەڵ ئەوەشدا، هیچ شتێکی نهێنی مەلکێنە.",
    en: "Sandbox conversations aren't saved. Don't paste anything confidential regardless.",
  },
  "testing.footerQ": {
    ar: "تريد واحدًا منهم مصمَّمًا حول سياساتك ومستنداتك ونبرتك؟",
    ckb: "دەتەوێت یەکێک لەمانە بەپێی سیاسەت و بەڵگەنامە و شێوازی قسەکردنی خۆت دروست بکرێت؟",
    en: "Want one of these shaped around your own policies, documents and tone?",
  },
  "testing.footerCta": { ar: "أخبرنا بما تحتاجه", ckb: "پێمان بڵێ چیت پێویستە", en: "Tell us what you need" },

  /* --------------------------------------------------------------- lab */
  "lab.eyebrow": { ar: "مختبر النماذج المفتوح", ckb: "تاقیگەی کراوەی مۆدێلەکان", en: "The open model lab" },
  "lab.h1a": {
    ar: "عشرون نموذجًا للاختبار.",
    ckb: "بیست مۆدێل بۆ تاقیکردنەوە.",
    en: "Twenty models to test.",
  },
  "lab.h1b": {
    ar: "عشرون اسمًا لم تسمع بها من قبل.",
    ckb: "بیست ناو کە هەرگیز نەتبیستوون.",
    en: "Twenty names you've never heard.",
  },
  "lab.lede": {
    ar: "كل نموذج في هذا المختبر يعمل باسم رمزي من CoreOs. ننشر ما يُجيده كل نموذج بلغة واضحة، ولا ننشر شيئًا عمّا تحته — لأنك لحظة ترى شعارًا مألوفًا تتوقف عن قراءة الإجابة وتبدأ بالثقة في العلامة. اختر بناءً على المُخرَج. هذا هو المقصد كله.",
    ckb: "هەر مۆدێلێک لەم تاقیگەیەدا بە ناوێکی نهێنیی CoreOs کار دەکات. بە زمانێکی ڕوون بڵاو دەکەینەوە کە هەر یەکێکیان باشە بۆ چی، و هیچ لەسەر ئەوەی لە ژێرەوەیە بڵاو ناکەینەوە — چونکە ئەو ساتەی نیشانەیەکی ئاشنا دەبینیت وازدەهێنیت لە خوێندنەوەی وەڵامەکە و دەست دەکەیت بە متمانەکردن بە براندەکە. لەسەر بەرهەم هەڵبژێرە. تەواوی مەبەستەکە ئەوەیە.",
    en: "Every model in this lab runs under a CoreOs codename. We publish what each one is good at, in plain language, and nothing about what's underneath — because the moment you see a familiar badge you stop reading the answer and start trusting the brand. Pick on output. That's the whole point.",
  },
  "lab.n1T": { ar: "أسماء رمزية، لا شعارات", ckb: "ناوی نهێنی، نەک نیشانە", en: "Codenames, not badges" },
  "lab.n1B": {
    ar: "المحرّك خلف كل اسم محجوب عمدًا ليبقى الاختبار نزيهًا.",
    ckb: "ئەو بزوێنەرەی لە پشت هەر ناوێکەوەیە بە ئەنقەست شاردراوەتەوە تا تاقیکردنەوەکە ڕاستگۆ بمێنێتەوە.",
    en: "The engine behind each name is deliberately withheld so testing stays honest.",
  },
  "lab.n2T": {
    ar: "موصوف بالاستخدام، لا بالمواصفات",
    ckb: "بە بەکارهێنان وەسف دەکرێت، نەک بە تایبەتمەندی",
    en: "Described by use, not by spec",
  },
  "lab.n2B": {
    ar: "لا أعداد معاملات ولا جداول قياس — فقط ما يُجيده كل نموذج فعلًا.",
    ckb: "نە ژمارەی پارامیتەر و نە خشتەی پێوانە — تەنها ئەوەی هەر مۆدێلێک بەڕاستی باشە بۆی.",
    en: "No parameter counts or benchmark tables — just what each model is genuinely good for.",
  },
  "lab.n3T": {
    ar: "السؤال نفسه، عدة نماذج",
    ckb: "هەمان پرسیار، چەند مۆدێلێک",
    en: "Same prompt, several models",
  },
  "lab.n3B": {
    ar: "مرِّر سؤالًا واحدًا على ثلاثة أسماء رمزية واحتفظ بأفضل إجابة.",
    ckb: "یەک پرسیار بەسەر سێ ناوی نهێنیدا تێپەڕێنە و ئەوەی باشترین وەڵام دەداتەوە هەڵیبگرە.",
    en: "Run one question through three codenames and keep whichever answers it best.",
  },
  "lab.search": {
    ar: "ابحث بالاسم أو المهمة…",
    ckb: "بە ناو یان بە ئەرک بگەڕێ…",
    en: "Search by name or task…",
  },
  "lab.searchAria": { ar: "ابحث في النماذج", ckb: "گەڕان لە مۆدێلەکاندا", en: "Search models" },
  "lab.all": { ar: "الكل", ckb: "هەموو", en: "All" },
  "lab.showing": {
    ar: "يُعرض {shown} من {total} نموذجًا",
    ckb: "{shown} لە {total} مۆدێل نیشان دەدرێت",
    en: "Showing {shown} of {total} models",
  },
  "lab.empty": {
    ar: "لا يوجد نموذج يطابق «{query}». جرّب مهمة بدل اسم — مثل «ترجمة» أو «عقد» أو «جدول بيانات».",
    ckb: "هیچ مۆدێلێک لەگەڵ «{query}» ناگونجێت. لە جیاتی ناو ئەرکێک تاقی بکەرەوە — بۆ نموونە «وەرگێڕان» یان «گرێبەست» یان «خشتەی داتا».",
    en: "No model matches “{query}”. Try a task instead of a name — for example “translate”, “contract” or “spreadsheet”.",
  },
  "lab.whyH2": {
    ar: "لماذا نُخفي هويّة كل نموذج",
    ckb: "بۆچی دەشارینەوە کە کام مۆدێل کامەیە",
    en: "Why we hide which model is which",
  },
  "lab.whyP1": {
    ar: "أسماء النماذج تحمل سمعة، والسمعة تُحيّز الحكم. اعرض على صاحب شركة إجابتين متطابقتين وضع على إحداهما شعارًا مشهورًا، وسيفوز الشعار — حتى حين تكون الإجابة الأخرى أفضل لحالته وأسرع وبجزء من التكلفة.",
    ckb: "ناوی مۆدێلەکان ناوبانگیان پێوەیە، و ناوبانگیش بڕیار لار دەکاتەوە. دوو وەڵامی وەک یەک پیشانی خاوەن کۆمپانیایەک بدە و نیشانەیەکی بەناوبانگ لەسەر یەکێکیان دابنێ، نیشانەکە دەباتەوە — تەنانەت کاتێک وەڵامەکەی تر باشترە بۆ حاڵەتەکەی، و خێراترە، و بە بەشێکی بچووکی نرخەکە.",
    en: "Model names carry reputation, and reputation biases judgement. Show a business owner two identical answers and label one with a famous badge, and the badge wins — even when the other answer is better for their use case, faster, and a fraction of the cost.",
  },
  "lab.whyP2": {
    ar: "هذا التحيّز يكلّف عملاءنا مالًا. لذلك يزيل CoreOs.ai التسميات. تختبر Aurelis أمام Nimbex على سؤالك أنت وتختار من أجاب عنه كما ينبغي. ثم نشغّل وكيلك الإنتاجي على ذلك النموذج ونُبقيه محدَّثًا مع تغيّر النماذج — دون أن تعيد تقييم السوق كل ستة أشهر.",
    ckb: "ئەو لارییە پارە لە کڕیارەکانمان دەبات. بۆیە CoreOs.ai ناوەکان لادەبات. تۆ Aurelis بەرامبەر Nimbex لەسەر پرسیاری خۆت تاقی دەکەیتەوە و ئەوە هەڵدەبژێریت کە وەک پێویست وەڵامی داوەتەوە. پاشان بریکارە بەرهەمهێنەرەکەت لەسەر هەرچی بوو کار پێدەکەین و بە گۆڕانی مۆدێلەکان نوێی دەکەینەوە — بەبێ ئەوەی تۆ هەر شەش مانگ جارێک بازاڕەکە هەڵبسەنگێنیتەوە.",
    en: "That bias costs our clients money. So CoreOs.ai strips the labels off. You test Aurelis against Nimbex on your own question and pick the one that answered it properly. We then run your production agent on whatever that was, and keep it current as models change — without you having to re-evaluate the market every six months.",
  },
  "lab.whyP3": {
    ar: "وهذا يعني أيضًا أن الترقية تحت وكيلك حدثٌ غير ملحوظ. الاسم الرمزي يبقى، والمحرّك يتحسّن.",
    ckb: "هەروەها واتای ئەوەشە کە بەرزکردنەوە لە ژێر بریکارەکەتدا ڕووداوێکی بەرچاو نییە. ناوە نهێنییەکە دەمێنێتەوە؛ بزوێنەرەکە باشتر دەبێت.",
    en: "It also means an upgrade underneath your agent is a non-event. The codename stays; the engine gets better.",
  },

  /* ------------------------------------------------------ card/console */
  "card.test": { ar: "اختبر", ckb: "تاقی بکەرەوە", en: "Test" },
  "console.clear": { ar: "امسح المحادثة", ckb: "گفتوگۆکە پاک بکەرەوە", en: "Clear conversation" },
  "console.close": { ar: "إغلاق", ckb: "داخستن", en: "Close" },
  "console.hidden": {
    ar: "المحرّك مخفي — احكم على الإجابات، لا على التسمية",
    ckb: "بزوێنەرەکە شاراوەیە — بڕیار لەسەر وەڵامەکان بدە، نەک لەسەر ناوەکە",
    en: "Engine hidden — judge the answers, not the label",
  },
  "console.prompt": {
    ar: "اسأل {name} شيئًا حقيقيًا من عملك. جرّب أحد هذه للبدء:",
    ckb: "شتێکی ڕاستەقینە لە کارەکەتەوە لە {name} بپرسە. یەکێک لەمانە تاقی بکەرەوە بۆ دەستپێک:",
    en: "Ask {name} something real from your business. Try one of these to start:",
  },
  "console.thinking": { ar: "{name} يفكّر…", ckb: "{name} بیر دەکاتەوە…", en: "{name} is thinking…" },
  "console.placeholder": { ar: "راسل {name}…", ckb: "نامە بۆ {name}…", en: "Message {name}…" },
  "console.send": { ar: "أرسل الرسالة", ckb: "نامەکە بنێرە", en: "Send message" },
  "console.foot": {
    ar: "اختبار مفتوح · المحادثات لا تُحفَظ",
    ckb: "تاقیکردنەوەی کراوە · گفتوگۆکان هەڵناگیرێن",
    en: "Open testing · conversations are not stored",
  },
  "console.errNoSandbox": {
    ar: "بيئة الاختبار المباشرة لا تعمل على هذا النشر. راسلنا على coreosgmail.com@gmail.com وسنجهّز لك واحدة.",
    ckb: "ژینگەی تاقیکردنەوەی ڕاستەوخۆ لەسەر ئەم بڵاوکردنەوەیە کار ناکات. لە coreosgmail.com@gmail.com نامەمان بۆ بنێرە و یەکێکت بۆ ئامادە دەکەین.",
    en: "The live sandbox isn't running on this deployment. Email coreosgmail.com@gmail.com and we'll set one up for you.",
  },
  "console.errSlow": {
    ar: "استغرق {name} وقتًا أطول من اللازم للإجابة. جرّب سؤالًا أقصر، أو راسلنا على coreosgmail.com@gmail.com.",
    ckb: "{name} زیاتر لە پێویست خایاند بۆ وەڵامدانەوە. پرسیارێکی کورتتر تاقی بکەرەوە، یان لە coreosgmail.com@gmail.com نامەمان بۆ بنێرە.",
    en: "{name} took too long to answer. Try a shorter question, or email coreosgmail.com@gmail.com.",
  },
  "console.errGeneric": {
    ar: "تعذّر الوصول إلى نقطة الاختبار.",
    ckb: "نەتوانرا بگەیت بە خاڵی تاقیکردنەوە.",
    en: "Could not reach the testing endpoint.",
  },
  "console.errFailed": { ar: "فشل الطلب", ckb: "داواکارییەکە سەرکەوتوو نەبوو", en: "Request failed" },

  /* ----------------------------------------------------------- contact */
  "contact.eyebrow": { ar: "تواصل", ckb: "پەیوەندی", en: "Contact" },
  "contact.h1": {
    ar: "أخبرنا بما تحتاجه شركتك.",
    ckb: "پێمان بڵێ کۆمپانیاکەت چی پێویستە.",
    en: "Tell us what your business needs.",
  },
  "contact.lede": {
    ar: "عنوان واحد، نقرأه نحن. صِف المهمة التي تريد تسليمها — الأسئلة المتكررة، وصندوق الوارد، والأعمال الورقية — وسنخبرك بصراحة إن كانت CoreOs مناسبة لك وكم ستكلّف.",
    ckb: "یەک ناونیشان، خۆمان دەیخوێنینەوە. ئەو کارە باس بکە کە دەتەوێت بیسپێریت — پرسیارە دووبارەبووەکان، سندووقی نامە، کاغەزبازی — و بە ڕاستگۆیی پێت دەڵێین ئایا CoreOs گونجاوە بۆت و چەندی تێدەچێت.",
    en: "One address, read by us. Describe the job you want handled — the repeated questions, the inbox, the paperwork — and we'll tell you honestly whether CoreOs is the right fit and what it would cost.",
  },
  "contact.emailH2": { ar: "راسل CoreOs", ckb: "ئیمەیل بۆ CoreOs", en: "Email CoreOs" },
  "contact.emailB": {
    ar: "أسرع طريق. نجيب على الاستفسارات بأنفسنا — لا يوجد طابور تذاكر بينك وبين من يبنون هذا.",
    ckb: "خێراترین ڕێگا. خۆمان وەڵامی پرسیارەکان دەدەینەوە — هیچ ڕیزێکی تیکێت لە نێوان تۆ و ئەو کەسانەدا نییە کە ئەمە دروست دەکەن.",
    en: "The fastest route. We answer enquiries ourselves — there is no ticket queue between you and the people who build this.",
  },
  "contact.copy": { ar: "انسخ العنوان", ckb: "ناونیشانەکە کۆپی بکە", en: "Copy address" },
  "contact.copied": { ar: "تم نسخ العنوان", ckb: "ناونیشانەکە کۆپی کرا", en: "Address copied" },
  "contact.note1T": {
    ar: "ملاحظاتك على الاختبار مُرحَّب بها",
    ckb: "تێبینیت لەسەر تاقیکردنەوە بەخێربێت",
    en: "Testing feedback is welcome",
  },
  "contact.note1B": {
    ar: "إن أجاب أحد الوكلاء المتاحين إجابة سيئة، أرسل لنا المحادثة. تذهب تلك الملاحظات مباشرة إلى طريقة تهيئة الوكيل.",
    ckb: "ئەگەر یەکێک لە بریکارە کراوەکان وەڵامێکی خراپی دایەوە، گفتوگۆکەمان بۆ بنێرە. ئەو تێبینییە ڕاستەوخۆ دەچێتە ناو ئەوەی چۆن بریکارەکە ڕێک دەخرێت.",
    en: "If one of the open agents answered badly, send us the exchange. That feedback goes straight into how the agent is configured.",
  },
  "contact.note2T": {
    ar: "الشركات الصغيرة أولًا",
    ckb: "کۆمپانیا بچووکەکان لە پێشەوە",
    en: "Small businesses first",
  },
  "contact.note2B": {
    ar: "لا تحتاج إلى قسم مشتريات أو قسم تقنية معلومات للعمل معنا. معظم عملائنا لا يملكون أيًّا منهما.",
    ckb: "پێویست ناکات پرۆسەی کڕین یان بەشی تەکنەلۆژیای زانیاریت هەبێت تا لەگەڵمان کار بکەیت. زۆربەی کڕیارەکانمان هیچیان لەمانە نییە.",
    en: "You do not need a procurement process or an IT department to work with us. Most of our clients have neither.",
  },
  "contact.briefH2": { ar: "أرسل لنا طلبك", ckb: "داواکارییەکەت بۆمان بنێرە", en: "Send us a brief" },
  "contact.briefP1": {
    ar: "املأ هذا وسيفتح رسالة جاهزة إلى",
    ckb: "ئەمە پڕ بکەرەوە و ئیمەیلێکی پێشنووسراو دەکاتەوە بۆ",
    en: "Fill this in and it opens a pre-written email to",
  },
  "contact.briefP2": {
    ar: "في تطبيق بريدك. لا شيء يُرسَل إلى خادم، ولا نحفظ شيئًا حتى تضغط إرسال.",
    ckb: "لە ئەپی ئیمەیلی خۆتدا. هیچ شتێک بۆ سێرڤەر نانێردرێت، و هیچ هەڵناگرین تا کلیکی ناردن دەکەیت.",
    en: "in your own mail app. Nothing is submitted to a server, and we store nothing until you press send.",
  },
  "contact.name": { ar: "اسمك", ckb: "ناوت", en: "Your name" },
  "contact.namePh": { ar: "جين أوكافور", ckb: "جین ئۆکافۆر", en: "Jane Okafor" },
  "contact.business": { ar: "الشركة", ckb: "کۆمپانیا", en: "Business" },
  "contact.businessPh": { ar: "أوكافور للخدمات اللوجستية", ckb: "ئۆکافۆر لۆجستیکس", en: "Okafor Logistics" },
  "contact.phone": {
    ar: "رقم الهاتف (مطلوب)",
    ckb: "ژمارەی مۆبایل (پێویستە)",
    en: "Phone number (required)",
  },
  "contact.phoneHelp": {
    ar: "نتصل بك بدل تبادل الرسائل — أسرع لكلينا.",
    ckb: "پەیوەندیت پێوە دەکەین لە جیاتی ئاڵوگۆڕی ئیمەیل — بۆ هەردووکمان خێراترە.",
    en: "We call rather than trade emails — it is faster for both of us.",
  },
  "contact.topic": { ar: "ما موضوع الطلب؟", ckb: "ئەمە دەربارەی چییە؟", en: "What's this about?" },
  "contact.topicBuild": {
    ar: "موقع أو تطبيق أو نظام",
    ckb: "ماڵپەڕ یان ئەپ یان سیستەم",
    en: "A website, app or system",
  },
  "contact.topic1": {
    ar: "إعداد وكيل ذكاء اصطناعي لشركتي",
    ckb: "دانانی بریکارێکی زیرەک بۆ کۆمپانیاکەم",
    en: "Set up an AI agent for my business",
  },
  "contact.topic2": { ar: "التسعير والتكلفة", ckb: "نرخ و توانای خەرجکردن", en: "Pricing and affordability" },
  "contact.topic3": {
    ar: "ملاحظات على وكيل اختبرته",
    ckb: "تێبینی لەسەر بریکارێک کە تاقیم کردەوە",
    en: "Feedback on an agent I tested",
  },
  "contact.topic4": {
    ar: "استفسار شراكة أو إعادة بيع",
    ckb: "پرسیاری هاوبەشی یان فرۆشتنەوە",
    en: "Partnership or reseller enquiry",
  },
  "contact.topic5": { ar: "شيء آخر", ckb: "شتێکی تر", en: "Something else" },
  "contact.details": { ar: "التفاصيل", ckb: "وردەکارییەکان", en: "Details" },
  "contact.detailsPh": {
    ar: "تصلنا نحو 60 سؤالًا متطابقًا عن التوصيل يوميًا، ويقضي موظفان صباحهما في الرد عليها…",
    ckb: "ڕۆژانە نزیکەی 60 پرسیاری وەک یەک دەربارەی گەیاندن پێمان دەگات و دوو کەس بەیانییەکانیان بە وەڵامدانەوەیان دەبەن…",
    en: "We get around 60 of the same delivery questions a day and two people spend their mornings answering them…",
  },
  "contact.send": {
    ar: "افتح هذا في تطبيق بريدي",
    ckb: "ئەمە لە ئەپی ئیمەیلەکەمدا بکەرەوە",
    en: "Open this in my email app",
  },
  "contact.needPhone": {
    ar: "أضف رقم هاتفك للمتابعة",
    ckb: "ژمارەی مۆبایلەکەت زیاد بکە بۆ بەردەوامبوون",
    en: "Add your phone number to continue",
  },
  "contact.noMail": {
    ar: "لا يوجد تطبيق بريد؟ انسخ العنوان أعلاه واكتب لنا مباشرة — وأدرج رقمك لنتمكن من الاتصال بك.",
    ckb: "ئەپی ئیمەیلت نییە؟ ناونیشانەکەی سەرەوە کۆپی بکە و ڕاستەوخۆ بۆمان بنووسە — ژمارەکەشت لەگەڵدا بنێ تا بتوانین پەیوەندیت پێوە بکەین.",
    en: "No mail app? Copy the address above and write to us directly — include your number so we can call you back.",
  },
  "contact.mailSubject": { ar: "استفسار CoreOs — ", ckb: "پرسیاری CoreOs — ", en: "CoreOs enquiry — " },
  "contact.mailName": { ar: "الاسم", ckb: "ناو", en: "Name" },
  "contact.mailBusiness": { ar: "الشركة", ckb: "کۆمپانیا", en: "Business" },
  "contact.mailPhone": { ar: "الهاتف", ckb: "مۆبایل", en: "Phone" },
  "contact.mailTopic": { ar: "الموضوع", ckb: "بابەت", en: "Topic" },
  "contact.mailBody": {
    ar: "(اكتب ما تحتاجه هنا.)",
    ckb: "(لێرەدا پێمان بڵێ چیت پێویستە.)",
    en: "(Tell us what you need here.)",
  },
  "contact.mailFrom": {
    ar: "— أُرسلت من coreos.ai",
    ckb: "— لە coreos.ai نێردراوە",
    en: "— Sent from coreos.ai",
  },

  /* ---------------------------------------------------------- 404/misc */
  "nf.h1": { ar: "لا يوجد شيء على", ckb: "هیچ شتێک نییە لە", en: "Nothing lives at" },
  "nf.p": {
    ar: "الصفحة التي طلبتها ليست هنا. أما الوكلاء، فهم موجودون.",
    ckb: "ئەو پەڕەیەی داوات کرد لێرە نییە. بەڵام بریکارەکان هەن.",
    en: "The page you asked for isn't here. The agents, however, are.",
  },
  "nf.back": { ar: "العودة إلى CoreOs", ckb: "گەڕانەوە بۆ CoreOs", en: "Back to CoreOs" },
  "nf.lab": { ar: "زُر CoreOs.ai", ckb: "سەردانی CoreOs.ai بکە", en: "Visit CoreOs.ai" },
  "misc.loadingConsole": {
    ar: "جارٍ تحميل لوحة العميل…",
    ckb: "پانێڵی کڕیار بار دەکرێت…",
    en: "Loading the client console…",
  },
} satisfies Record<string, Copy>;

export type CopyKey = keyof typeof COPY;

/** Fill {placeholders} in a resolved string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}
