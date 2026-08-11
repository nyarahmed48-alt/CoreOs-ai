/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Every visible string on the CoreOs site, in Arabic and English.
 *
 * Arabic is Modern Standard — the register business readers across the region
 * expect, rather than any one dialect. Brand names (CoreOs, CoreOs.ai) and
 * agent codenames stay in Latin script on purpose: they are names, and the
 * codenames are the whole point of the testing programme.
 *
 * Western numerals throughout. They are what regional business writing uses,
 * and they keep the stat blocks legible in both directions.
 *
 * Catalogue copy — agent taglines, uses and traits — lives in catalog.ts
 * alongside the agents themselves.
 */

export interface Copy {
  ar: string;
  en: string;
}

export const COPY = {
  /* ------------------------------------------------------------ chrome */
  "nav.home": { ar: "الرئيسية", en: "CoreOs" },
  "nav.mission": { ar: "رسالتنا", en: "Mission" },
  "nav.testing": { ar: "الاختبار المفتوح", en: "Open testing" },
  "nav.lab": { ar: "CoreOs.ai", en: "CoreOs.ai" },
  "nav.contact": { ar: "تواصل", en: "Contact" },
  "nav.console": { ar: "لوحة العميل", en: "Client console" },
  "nav.talk": { ar: "تحدّث إلينا", en: "Talk to us" },
  "nav.skip": { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },
  "nav.openMenu": { ar: "افتح القائمة", en: "Open menu" },
  "nav.closeMenu": { ar: "أغلق القائمة", en: "Close menu" },
  "nav.homeAria": { ar: "الصفحة الرئيسية لـ CoreOs", en: "CoreOs home" },
  "nav.langAria": { ar: "تغيير اللغة", en: "Change language" },

  "footer.blurb": {
    ar: "تبني CoreOs المواقع والتطبيقات والأنظمة ووكلاء الذكاء الاصطناعي للشركات الصغيرة والمتوسطة — بتكلفة في المتناول، ومصمَّمة لتعمل إلى جانب الموظفين الذين لديك بالفعل.",
    en: "CoreOs builds websites, apps, systems and AI agents for small and mid-sized businesses — affordably, and built to work alongside the people you already employ.",
  },
  "footer.product": { ar: "المنتج", en: "Product" },
  "footer.agents": { ar: "11 وكيلًا في الاختبار المفتوح", en: "11 agents in open testing" },
  "footer.models": { ar: "CoreOs.ai — 20 نموذجًا", en: "CoreOs.ai — 20 models" },
  "footer.mission": { ar: "رسالتنا", en: "Our mission" },
  "footer.contact": { ar: "تواصل", en: "Contact" },
  "footer.brief": { ar: "أرسل لنا طلبك", en: "Send us a brief" },
  "footer.rights": { ar: "جميع الحقوق محفوظة.", en: "All rights reserved." },
  "footer.line": {
    ar: "ذكاء اصطناعي يساعد الناس. لا ذكاء اصطناعي يستبدلهم.",
    en: "AI that assists people. Not AI that replaces them.",
  },

  /* -------------------------------------------------------------- home */
  "home.badge": {
    ar: "31 وكيل ذكاء اصطناعي متاح للاختبار العام",
    en: "31 AI agents open for public testing",
  },
  "home.h1a": { ar: "حيث تلتقي احتياجاتك", en: "Where your needs" },
  "home.h1b": { ar: "بالواقع.", en: "meet reality." },
  "home.lede": {
    ar: "تبني CoreOs ذكاءً اصطناعيًا للأعمال تستطيع الشركات الصغيرة والمتوسطة تحمّل تكلفة تشغيله فعلًا. لا رسوم لكل مستخدم، ولا مشروع تجريبي بستة أرقام. وكيل قابل للتهيئة حول ما تفعله شركتك أصلًا — وتُحتسب تكلفته بما يُستخدم منه بالفعل.",
    en: "CoreOs builds business AI that small and mid-sized companies can actually afford to run. Not a per-seat licence. Not a six-figure pilot. A configurable AI agent shaped around what your business already does — priced by what it actually uses.",
  },
  "home.ctaTest": { ar: "جرّب الوكلاء الأحد عشر", en: "Try the 11 open agents" },
  "home.ctaExplore": { ar: "استكشف", en: "Explore" },
  "home.stat1": { ar: "وكيل في الاختبار", en: "Agents in testing" },
  "home.stat2": { ar: "لغات مدعومة", en: "Languages served" },
  "home.stat3": { ar: "رسوم لكل مستخدم", en: "Per-seat fees" },
  "home.stat4": { ar: "بإشراف بشري", en: "Human-in-the-loop" },

  /* ------------------------------------------------------ what we build */
  "build.eyebrow": { ar: "ما نبنيه", en: "What we build" },
  "build.h2": {
    ar: "من أصغر احتياج تقني إلى أكبر نظام.",
    en: "From the smallest tech need to the biggest system.",
  },
  "build.lede": {
    ar: "معظم عملائنا يأتون من أجل موقع. وكثير منهم يبقى من أجل ما بعده — تطبيق، أو نظام داخلي، أو وكيل يتولّى العمل المتكرر. نبنيها جميعًا، ونبنيها بسرعة.",
    en: "Most of our clients come to us for a website. A lot of them stay for what comes after it — an app, an internal system, an agent that takes the repetitive work. We build all of it, and we build it fast.",
  },
  "build.c1T": { ar: "المواقع الإلكترونية", en: "Websites" },
  "build.c1B": {
    ar: "أكثر ما نبنيه. مواقع تعريفية وصفحات هبوط ومواقع أعمال كاملة — مصمَّمة ومنشورة بسرعة، ضمن جدول زمني نتفق عليه معك مسبقًا.",
    en: "The bulk of what we build. Brochure sites, landing pages and full business sites — designed and deployed quickly, on a timeline we agree with you up front.",
  },
  "build.c2T": { ar: "التطبيقات", en: "Apps" },
  "build.c2B": {
    ar: "تطبيقات تعمل على الهاتف والحاسوب، من أداة داخلية صغيرة إلى منتج كامل يستخدمه عملاؤك يوميًا.",
    en: "Apps that work on a phone and a desktop, from a small internal tool to a full product your customers use daily.",
  },
  "build.c3T": { ar: "الأنظمة والأتمتة", en: "Systems and automation" },
  "build.c3B": {
    ar: "أنظمة تتبّع ولوحات تحكم وأدوات داخلية وسير عمل يزيل الخطوات اليدوية من يومك.",
    en: "Tracking systems, dashboards, internal tools and workflows that take the manual steps out of your day.",
  },
  "build.c4T": { ar: "وكلاء الذكاء الاصطناعي", en: "AI agents" },
  "build.c4B": {
    ar: "الوكلاء الذين يمكنك اختبارهم على هذا الموقع، مهيَّئون حول مستنداتك وسياساتك ونبرتك.",
    en: "The agents you can test on this site, configured around your own documents, policies and tone.",
  },
  "build.cta": { ar: "تحدّث إلينا عن مشروعك", en: "Talk to us about your project" },

  "home.missionEyebrow": { ar: "رسالتنا", en: "Our mission" },
  "home.missionH2": {
    ar: "ذكاء اصطناعي للأعمال، بسعر تستطيع شركة حقيقية أن توافق عليه.",
    en: "B2B AI, priced so a real business can say yes.",
  },
  "home.missionP1": {
    ar: "الذكاء الاصطناعي المؤسسي مُسعَّر للمؤسسات الكبرى. شركة شحن من اثني عشر موظفًا، أو تاجر جملة عائلي، أو عيادة محلية — يُعرض عليها رسم المنصة نفسه المعروض على شركة متعددة الجنسيات، ويُطلب منها ترخيص لكل موظف، ثم التوقيع لسنة كاملة قبل أن يعمل أي شيء.",
    en: "Enterprise AI is priced for enterprises. A twelve-person logistics firm, a family wholesaler, a regional clinic — they get quoted the same platform fee as a multinational, told to buy a seat for every employee, then asked to sign for a year before anything works.",
  },
  "home.missionP2": {
    ar: "وُجدت CoreOs لكسر ذلك. نحتسب الاستخدام، لا عدد الموظفين. وأنت من يضع السقف قبل أن تنفق شيئًا.",
    en: "CoreOs exists to break that. We meter usage, not headcount. You set the ceiling before you spend a thing.",
  },
  "home.missionLink": { ar: "اقرأ رسالتنا كاملة", en: "Read the full mission" },

  "home.pillar1T": { ar: "محسوب بالاستخدام، لا بالتراخيص", en: "Metered, not licensed" },
  "home.pillar1B": {
    ar: "تُحدَّد الحصص لكل عميل بالجُمل والأحرف. تضع سقف الإنفاق قبل أول رسالة، والسقف يصمد.",
    en: "Quotas are set per customer in sentences and characters. You cap the spend before the first message, and the cap holds.",
  },
  "home.pillar2T": { ar: "مُهيَّأ، لا مبني من الصفر", en: "Configured, not custom-built" },
  "home.pillar2B": {
    ar: "يُضبط وكيلك أثناء التشغيل — التعليمات والنبرة والحدود والمتغيّرات. لا ارتباط يمتد ستة أشهر لتغيير جملة واحدة.",
    en: "Your agent is tuned at runtime — instructions, tone, limits, variables. No six-month engagement to change a sentence.",
  },
  "home.pillar3T": { ar: "يخدم عملاءك الحقيقيين", en: "Serves your actual customers" },
  "home.pillar3B": {
    ar: "الإنجليزية والعربية والكردية جاهزة من البداية، بنبرة العلامة نفسها في كل لغة. الأعمال الإقليمية ليست فكرة لاحقة.",
    en: "English, Arabic and Kurdish out of the box, with the same brand voice in each. Regional business is not an afterthought.",
  },
  "home.pillar4T": { ar: "قابل للتبديل من الداخل", en: "Switchable underneath" },
  "home.pillar4B": {
    ar: "النماذج تتغيّر شهريًا. نموذجك يُحدَّث دون مشروع ترحيل، لأن المحرّك مسؤوليتنا لا عبؤك.",
    en: "Models change monthly. Yours updates without a migration project, because the engine is ours to swap, not yours to manage.",
  },

  "home.humanH2": {
    ar: "نبني الذكاء الاصطناعي ليساعد الناس في عملهم — لا ليعمل بدلًا عنهم.",
    en: "We build AI to help people work — not to work instead of them.",
  },
  "home.humanP": {
    ar: "هذه ليست عبارة تسويقية نخفّفها لاحقًا، بل قيد تصميمي. كل وكيل من CoreOs مبني ليتولّى الثلث المتكرر من الوظيفة — الأسئلة العشرون نفسها، والنسخ واللصق، والانتظار بعد ساعات الدوام — ويعيد الحكم إلى الشخص الذي يحمل الردُّ اسمَه.",
    en: "This is not a marketing line we soften later. It is a design constraint. Every CoreOs agent is built to take the repetitive third of a job — the same twenty questions, the copy-paste, the after-hours holding pattern — and hand the judgement back to the person whose name is on the reply.",
  },
  "home.human1T": { ar: "مسودات، لا قرارات", en: "Drafts, not decisions" },
  "home.human1B": {
    ar: "الوكيل يُعدّ الرد. وإنسان يراجعه ويعدّله ويرسله.",
    en: "Agents prepare the reply. A human reviews it, edits it, and sends it.",
  },
  "home.human2T": { ar: "التصعيد هو الأصل", en: "Escalation by default" },
  "home.human2B": {
    ar: "حين لا يكون الوكيل واثقًا، يتوقف ويحوّل الأمر إلى زميل بدل اختلاق إجابة.",
    en: "When an agent is unsure, it stops and routes to a colleague instead of inventing an answer.",
  },
  "home.human3T": { ar: "لا أحد يُقاس ليخسر وظيفته", en: "Nobody is measured out of a job" },
  "home.human3B": {
    ar: "نُبلغ عن الطلبات التي جرى تفاديها والساعات المستردة — لا عن عدد الموظفين الذين يمكن الاستغناء عنهم.",
    en: "We report on tickets deflected and hours returned — never on headcount you could cut.",
  },

  "home.testEyebrow": { ar: "الاختبار المفتوح", en: "Open testing" },
  "home.testH2": {
    ar: "أحد عشر وكيل أعمال. جرّبهم مجانًا، الآن.",
    en: "Eleven business agents. Free to test, right now.",
  },
  "home.testP": {
    ar: "هؤلاء هم الوكلاء الذين تنشرهم CoreOs لعملائها، أتحناهم لك لتطرح عليهم أسئلتك قبل أن تتحدث إلى أحد. بلا تسجيل، وبلا بطاقة، وبلا مكالمة.",
    en: "These are the agents CoreOs deploys for clients, opened up so you can put your own questions to them before you talk to anyone. No signup, no card, no call.",
  },
  "home.testAll": { ar: "شاهد الأحد عشر جميعًا", en: "See all 11" },

  "home.labH2": {
    ar: "عشرون نموذجًا. عشرون اسمًا رمزيًا. ولا شعارات تُحيّز حكمك.",
    en: "Twenty models. Twenty codenames. No badges to bias you.",
  },
  "home.labP": {
    ar: "CoreOs.ai هو مختبرنا المفتوح للنماذج. كل نموذج من النماذج العشرين يُنشر باسم رمزي من CoreOs مع وصف واضح لما يُجيده — لتختار بناءً على النتيجة، لا على الشعار المرفق بها.",
    en: "CoreOs.ai is our open model lab. Each of the 20 models is published under a CoreOs codename with a plain description of what it's good for — so you pick on results, not on whose logo is attached.",
  },
  "home.labCta": { ar: "ادخل مختبر النماذج", en: "Enter the model lab" },

  /* ----------------------------------------------------------- mission */
  "mission.eyebrow": { ar: "رسالتنا", en: "Our mission" },
  "mission.h1a": { ar: "اجعل ذكاء الأعمال الاصطناعي في المتناول — واجعله يعمل", en: "Make business AI affordable — and make it work" },
  "mission.h1with": { ar: "مع", en: "with" },
  "mission.h1b": { ar: "الناس.", en: "people." },
  "mission.lede": {
    ar: "التزامان يقوم عليهما كل ما تبنيه CoreOs. أحدهما عن السعر، والآخر عن الناس. ونرفض مقايضة أحدهما بالآخر.",
    en: "Two commitments hold up everything CoreOs builds. One is about price. The other is about people. We refuse to trade either for the other.",
  },

  "mission.c1label": { ar: "الالتزام 01", en: "Commitment 01" },
  "mission.c1h2": { ar: "تكلفة في متناول قطاع الأعمال", en: "B2B affordability" },
  "mission.c1p1": {
    ar: "قرّرت صناعة الذكاء الاصطناعي بهدوء أن الأدوات الجادة للشركات التي لديها قسم مشتريات. والتسعير يثبت ذلك: رسوم منصة قبل إرسال رسالة واحدة، وتراخيص لكل مستخدم تعاقبك على امتلاك موظفين، والتزامات سنوية تُوقَّع قبل أن يُثبت أحد أن الأمر يعمل على بياناتك، ثم فاتورة تكامل تصل بعد ذلك.",
    en: "The AI industry has quietly decided that serious tooling is for companies with a procurement department. The pricing proves it: platform fees before a single message is sent, seat licences that punish you for having staff, annual commitments signed before anyone has demonstrated the thing works on your data, and an integration bill that arrives afterwards.",
  },
  "mission.c1p2": {
    ar: "شركة شحن من اثني عشر موظفًا لديها المشكلة نفسها التي لدى شركة من اثني عشر ألفًا — الأسئلة المتكررة نفسها، والفجوة نفسها بعد ساعات الدوام، وصندوق الوارد نفسه الذي لا يجد أحد وقتًا له. ما ينقصها هو بند بستة أرقام لحلّها. فتبقى بلا حل، وتتسع كل ربع سنة الفجوة بين الشركات التي تستطيع استخدام الذكاء الاصطناعي وتلك التي لا تستطيع.",
    en: "A twelve-person logistics firm has the same problem a twelve-thousand-person one does — the same repeated customer questions, the same after-hours gap, the same inbox nobody has time for. What it does not have is a six-figure line item to solve it with. So it goes without, and the gap between businesses that can use AI and businesses that cannot gets wider every quarter.",
  },
  "mission.c1p3": {
    ar: "بُنيت CoreOs تحديدًا لسدّ تلك الفجوة. القدرة على تحمّل التكلفة ليست استراتيجية خصم لدينا؛ إنها بنية المنتج ذاتها.",
    en: "CoreOs is built specifically to close that gap. Affordability is not our discount strategy; it is the product architecture.",
  },

  "mission.p1T": { ar: "تدفع مقابل الاستخدام، لا مقابل عدد الموظفين", en: "You pay for usage, never for headcount" },
  "mission.p1B": {
    ar: "تُعرَّف الحصص بالجُمل والأحرف، لكل عميل، مع حدود صارمة تُطبَّق على كل طلب. توظيف موظف عاشر لا يرفع فاتورتك، ولا منح خمسة آخرين حق الوصول.",
    en: "Quotas are defined in sentences and characters, per customer, with hard limits enforced on every request. Hiring a tenth employee does not raise your bill. Neither does giving five more people access.",
  },
  "mission.p2T": { ar: "السقف يُحدَّد قبل أن تنفق", en: "The ceiling is set before you spend" },
  "mission.p2B": {
    ar: "كل حساب يحمل حدًا أقصى صريحًا. وعند بلوغه يتوقف الوكيل ويقول ذلك — لا يواصل الإنفاق ثم يرسل الفاتورة لاحقًا. غياب المفاجآت في الفاتورة هو أكثر ما تطلبه الشركات بهذا الحجم، لذلك جعلناه الوضع الافتراضي.",
    en: "Every account carries an explicit cap. When it is reached, the agent stops and says so — it does not keep spending and invoice you afterwards. No surprise overage is the single most requested feature from businesses of this size, so it is the default.",
  },
  "mission.p3T": { ar: "التهيئة تُغني عن التطوير المخصَّص", en: "Configuration replaces custom development" },
  "mission.p3B": {
    ar: "تعليمات وكيلك ونبرته ولغته ومتغيّراته وحدوده كلها إعدادات وقت تشغيل. تغيير سلوكه تعديل في لوحة تحكم، لا طلب تغيير على عقد عمل.",
    en: "Your agent's instructions, tone, language, variables and limits are all runtime settings. Changing how it behaves is an edit in a console, not a change request against a statement of work.",
  },
  "mission.p4T": { ar: "ترقيات النماذج على عاتقنا", en: "Model upgrades are ours to absorb" },
  "mission.p4B": {
    ar: "المحرّك تحت وكيلك يتحسّن دون مشروع ترحيل من جانبك. ولن تدفع أبدًا رسوم خدمات احترافية للانتقال من جيل نموذج إلى الذي يليه.",
    en: "The engine underneath your agent improves without a migration project on your side. You never pay a professional-services fee to move from one generation of model to the next.",
  },
  "mission.p5T": { ar: "اختبر كل شيء قبل أن تتحدث إلى المبيعات", en: "Test the whole thing before you talk to sales" },
  "mission.p5B": {
    ar: "واحد وثلاثون وكيلًا متاحون للاختبار العام على هذا الموقع. بلا حساب، وبلا بطاقة، وبلا مكالمة استكشافية. وإن لم يجيبوا عن أسئلتك جيدًا، تكون قد خسرت عشر دقائق بدل دورة ميزانية كاملة.",
    en: "Thirty-one agents are open for public testing on this site. No account, no card, no discovery call. If it does not answer your questions well, you have lost ten minutes rather than a budget cycle.",
  },
  "mission.quote": {
    ar: "«في المتناول» لا تعني رخيصًا ومنقوصًا. تعني أن السعر مصمَّم على مقاس الشركة التي تدفعه.",
    en: "Affordable does not mean cheap and stripped down. It means the price is shaped like the business paying it.",
  },

  "mission.c2label": { ar: "الالتزام 02", en: "Commitment 02" },
  "mission.c2h2": {
    ar: "ذكاء اصطناعي يساعد البشر — لا ذكاء اصطناعي يأخذ وظائفهم",
    en: "AI that helps humans — not AI that takes their jobs",
  },
  "mission.c2p1": {
    ar: "يُباع معظم الذكاء الاصطناعي بحجّة عدد الموظفين: انشر هذا، ووظّف عددًا أقل. لن نبيع ذلك، وقد بنينا CoreOs عمدًا لتكون أداة رديئة لمن يحاول ذلك.",
    en: "Most AI is sold on a headcount argument: deploy this, employ fewer people. We will not sell that, and we have deliberately built CoreOs so it is a poor tool for anyone trying to.",
  },
  "mission.c2p2": {
    ar: "العمل الذي يتولّاه وكلاؤنا هو الجزء الذي لا يحميه أحد من الوظيفة: الإجابة عن الأسئلة العشرين نفسها، ونقل رقم طلب بين نظامين، وصياغة رابع رسالة متطابقة في الصباح، وتغطية صندوق الوارد في الحادية عشرة ليلًا. هذا العمل يُنهك الناس، وهو أول ما يسقط حين يكون الفريق مثقلًا. إزالته لا تزيل الشخص — بل تعيد إليه الجزء من الدور الذي احتاج إنسانًا من البداية.",
    en: "The work our agents take on is the part of a job nobody protects: answering the same twenty questions, copying an order number between two systems, drafting the fourth identical email of the morning, covering the inbox at eleven at night. That work exhausts people and it is the first thing that gets dropped when a team is stretched. Removing it does not remove the person — it gives them back the part of the role that needed a human in the first place.",
  },
  "mission.c2p3": { ar: "الحكم يبقى لدى موظفيك. في كل مرة.", en: "Judgement stays with your staff. Every time." },

  "mission.h1T": { ar: "المسودة أولًا بالتصميم", en: "Draft-first by design" },
  "mission.h1B": {
    ar: "الوكلاء الذين يتعاملون مع العملاء يُنتجون مسودات. شخصٌ يراجع ويرسل. النظام مبني حول تلك الخطوة، لا حول إزالتها.",
    en: "Agents that touch customers produce drafts. A person reviews and sends. The system is built around that step, not around removing it.",
  },
  "mission.h2T": { ar: "الشك يُصعَّد", en: "Uncertainty escalates" },
  "mission.h2B": {
    ar: "الوكيل غير الواثق يقول ذلك ويحوّل إلى زميل. الهراء الواثق نتيجة أسوأ من التحويل، لذلك نصمّم ضدّه.",
    en: "An agent that is not confident says so and routes to a colleague. Confident nonsense is a worse outcome than a handover, so we optimise against it.",
  },
  "mission.h3T": { ar: "نطاق محدود", en: "Bounded scope" },
  "mission.h3B": {
    ar: "يجيب الوكلاء من مستنداتك وسياساتك. ولا يُمنحون صلاحية تقديم التزامات أو خصومات أو استثناءات نيابة عنك.",
    en: "Agents answer from your documents and policies. They are not given authority to make commitments, discounts or exceptions on your behalf.",
  },
  "mission.h4T": { ar: "تقارير صادقة", en: "Honest reporting" },
  "mission.h4B": {
    ar: "نُبلغ عن الساعات المستردة والأسئلة التي جرى تفاديها. ولا نُنتج نماذج لتقليص عدد الموظفين، ولن نبني واحدًا عند الطلب.",
    en: "We report hours returned and questions deflected. We do not produce headcount-reduction models, and we will not build one on request.",
  },

  "mission.closeH2": {
    ar: "احكم بنفسك قبل أن تصدّق أيًا من هذا.",
    en: "Judge it yourself before you believe any of this.",
  },
  "mission.closeP": {
    ar: "واحد وثلاثون وكيلًا متاحون الآن. اسألهم شيئًا من عملك أنت وانظر إن كانت الإجابات تصمد.",
    en: "Thirty-one agents are open right now. Ask them something from your own business and see whether the answers hold up.",
  },
  "mission.closeCta": { ar: "اختبر الوكلاء المتاحين", en: "Test the open agents" },

  /* ----------------------------------------------------------- testing */
  "testing.eyebrow": { ar: "برنامج الاختبار المفتوح", en: "Open testing programme" },
  "testing.h1a": { ar: "أحد عشر وكيلًا من CoreOs،", en: "Eleven CoreOs agents," },
  "testing.h1b": { ar: "متاحون لأي شخص ليختبرهم.", en: "open for anyone to test." },
  "testing.lede": {
    ar: "كل واحد منهم وكيل أعمال حقيقي من CoreOs — من النوع نفسه الذي نهيّئه للعملاء الدافعين — يعمل في بيئة اختبار عامة. افتح أحدهم، واسأله شيئًا من عملك، واحكم عليه بالإجابة. لا شيء يتطلب التسجيل.",
    en: "Each one is a real CoreOs business agent — the same kind we configure for paying clients — running in a public sandbox. Open one, ask it something from your own operation, and judge it on the answer. Nothing to sign up for.",
  },
  "testing.n1T": { ar: "لا حاجة لحساب", en: "No account needed" },
  "testing.n1B": { ar: "كل وكيل أدناه يعمل الآن. اضغط «اختبار» وابدأ الكتابة.", en: "Every agent below is live. Click test and start typing." },
  "testing.n2T": { ar: "المحرّكات تبقى مخفية", en: "Engines stay hidden" },
  "testing.n2B": {
    ar: "يُنشر الوكلاء بأسماء رمزية من CoreOs حتى لا تُجمِّل التسمية النتيجة.",
    en: "Agents are published under CoreOs codenames so the label can't flatter the output.",
  },
  "testing.n3T": { ar: "لا شيء يُحفظ", en: "Nothing is stored" },
  "testing.n3B": {
    ar: "محادثات بيئة الاختبار لا تُحفظ. ومع ذلك، لا تلصق أي شيء سرّي.",
    en: "Sandbox conversations aren't saved. Don't paste anything confidential regardless.",
  },
  "testing.footerQ": {
    ar: "تريد واحدًا منهم مصمَّمًا حول سياساتك ومستنداتك ونبرتك؟",
    en: "Want one of these shaped around your own policies, documents and tone?",
  },
  "testing.footerCta": { ar: "أخبرنا بما تحتاجه", en: "Tell us what you need" },

  /* --------------------------------------------------------------- lab */
  "lab.eyebrow": { ar: "مختبر النماذج المفتوح", en: "The open model lab" },
  "lab.h1a": { ar: "عشرون نموذجًا للاختبار.", en: "Twenty models to test." },
  "lab.h1b": { ar: "عشرون اسمًا لم تسمع بها من قبل.", en: "Twenty names you've never heard." },
  "lab.lede": {
    ar: "كل نموذج في هذا المختبر يعمل باسم رمزي من CoreOs. ننشر ما يُجيده كل نموذج بلغة واضحة، ولا ننشر شيئًا عمّا تحته — لأنك لحظة ترى شعارًا مألوفًا تتوقف عن قراءة الإجابة وتبدأ بالثقة في العلامة. اختر بناءً على المُخرَج. هذا هو المقصد كله.",
    en: "Every model in this lab runs under a CoreOs codename. We publish what each one is good at, in plain language, and nothing about what's underneath — because the moment you see a familiar badge you stop reading the answer and start trusting the brand. Pick on output. That's the whole point.",
  },
  "lab.n1T": { ar: "أسماء رمزية، لا شعارات", en: "Codenames, not badges" },
  "lab.n1B": {
    ar: "المحرّك خلف كل اسم محجوب عمدًا ليبقى الاختبار نزيهًا.",
    en: "The engine behind each name is deliberately withheld so testing stays honest.",
  },
  "lab.n2T": { ar: "موصوف بالاستخدام، لا بالمواصفات", en: "Described by use, not by spec" },
  "lab.n2B": {
    ar: "لا أعداد معاملات ولا جداول قياس — فقط ما يُجيده كل نموذج فعلًا.",
    en: "No parameter counts or benchmark tables — just what each model is genuinely good for.",
  },
  "lab.n3T": { ar: "السؤال نفسه، عدة نماذج", en: "Same prompt, several models" },
  "lab.n3B": {
    ar: "مرِّر سؤالًا واحدًا على ثلاثة أسماء رمزية واحتفظ بأفضل إجابة.",
    en: "Run one question through three codenames and keep whichever answers it best.",
  },
  "lab.search": { ar: "ابحث بالاسم أو المهمة…", en: "Search by name or task…" },
  "lab.searchAria": { ar: "ابحث في النماذج", en: "Search models" },
  "lab.all": { ar: "الكل", en: "All" },
  "lab.showing": { ar: "يُعرض {shown} من {total} نموذجًا", en: "Showing {shown} of {total} models" },
  "lab.empty": {
    ar: "لا يوجد نموذج يطابق «{query}». جرّب مهمة بدل اسم — مثل «ترجمة» أو «عقد» أو «جدول بيانات».",
    en: "No model matches “{query}”. Try a task instead of a name — for example “translate”, “contract” or “spreadsheet”.",
  },
  "lab.whyH2": { ar: "لماذا نُخفي هويّة كل نموذج", en: "Why we hide which model is which" },
  "lab.whyP1": {
    ar: "أسماء النماذج تحمل سمعة، والسمعة تُحيّز الحكم. اعرض على صاحب شركة إجابتين متطابقتين وضع على إحداهما شعارًا مشهورًا، وسيفوز الشعار — حتى حين تكون الإجابة الأخرى أفضل لحالته وأسرع وبجزء من التكلفة.",
    en: "Model names carry reputation, and reputation biases judgement. Show a business owner two identical answers and label one with a famous badge, and the badge wins — even when the other answer is better for their use case, faster, and a fraction of the cost.",
  },
  "lab.whyP2": {
    ar: "هذا التحيّز يكلّف عملاءنا مالًا. لذلك يزيل CoreOs.ai التسميات. تختبر Aurelis أمام Nimbex على سؤالك أنت وتختار من أجاب عنه كما ينبغي. ثم نشغّل وكيلك الإنتاجي على ذلك النموذج ونُبقيه محدَّثًا مع تغيّر النماذج — دون أن تعيد تقييم السوق كل ستة أشهر.",
    en: "That bias costs our clients money. So CoreOs.ai strips the labels off. You test Aurelis against Nimbex on your own question and pick the one that answered it properly. We then run your production agent on whatever that was, and keep it current as models change — without you having to re-evaluate the market every six months.",
  },
  "lab.whyP3": {
    ar: "وهذا يعني أيضًا أن الترقية تحت وكيلك حدثٌ غير ملحوظ. الاسم الرمزي يبقى، والمحرّك يتحسّن.",
    en: "It also means an upgrade underneath your agent is a non-event. The codename stays; the engine gets better.",
  },

  /* ------------------------------------------------------ card/console */
  "card.test": { ar: "اختبر", en: "Test" },
  "console.clear": { ar: "امسح المحادثة", en: "Clear conversation" },
  "console.close": { ar: "إغلاق", en: "Close" },
  "console.hidden": {
    ar: "المحرّك مخفي — احكم على الإجابات، لا على التسمية",
    en: "Engine hidden — judge the answers, not the label",
  },
  "console.prompt": {
    ar: "اسأل {name} شيئًا حقيقيًا من عملك. جرّب أحد هذه للبدء:",
    en: "Ask {name} something real from your business. Try one of these to start:",
  },
  "console.thinking": { ar: "{name} يفكّر…", en: "{name} is thinking…" },
  "console.placeholder": { ar: "راسل {name}…", en: "Message {name}…" },
  "console.send": { ar: "أرسل الرسالة", en: "Send message" },
  "console.foot": {
    ar: "اختبار مفتوح · المحادثات لا تُحفَظ",
    en: "Open testing · conversations are not stored",
  },
  "console.errNoSandbox": {
    ar: "بيئة الاختبار المباشرة لا تعمل على هذا النشر. راسلنا على coreosgmail.com@gmail.com وسنجهّز لك واحدة.",
    en: "The live sandbox isn't running on this deployment. Email coreosgmail.com@gmail.com and we'll set one up for you.",
  },
  "console.errSlow": {
    ar: "استغرق {name} وقتًا أطول من اللازم للإجابة. جرّب سؤالًا أقصر، أو راسلنا على coreosgmail.com@gmail.com.",
    en: "{name} took too long to answer. Try a shorter question, or email coreosgmail.com@gmail.com.",
  },
  "console.errGeneric": { ar: "تعذّر الوصول إلى نقطة الاختبار.", en: "Could not reach the testing endpoint." },
  "console.errFailed": { ar: "فشل الطلب", en: "Request failed" },

  /* ----------------------------------------------------------- contact */
  "contact.eyebrow": { ar: "تواصل", en: "Contact" },
  "contact.h1": { ar: "أخبرنا بما تحتاجه شركتك.", en: "Tell us what your business needs." },
  "contact.lede": {
    ar: "عنوان واحد، نقرأه نحن. صِف المهمة التي تريد تسليمها — الأسئلة المتكررة، وصندوق الوارد، والأعمال الورقية — وسنخبرك بصراحة إن كانت CoreOs مناسبة لك وكم ستكلّف.",
    en: "One address, read by us. Describe the job you want handled — the repeated questions, the inbox, the paperwork — and we'll tell you honestly whether CoreOs is the right fit and what it would cost.",
  },
  "contact.emailH2": { ar: "راسل CoreOs", en: "Email CoreOs" },
  "contact.emailB": {
    ar: "أسرع طريق. نجيب على الاستفسارات بأنفسنا — لا يوجد طابور تذاكر بينك وبين من يبنون هذا.",
    en: "The fastest route. We answer enquiries ourselves — there is no ticket queue between you and the people who build this.",
  },
  "contact.copy": { ar: "انسخ العنوان", en: "Copy address" },
  "contact.copied": { ar: "تم نسخ العنوان", en: "Address copied" },
  "contact.note1T": { ar: "ملاحظاتك على الاختبار مُرحَّب بها", en: "Testing feedback is welcome" },
  "contact.note1B": {
    ar: "إن أجاب أحد الوكلاء المتاحين إجابة سيئة، أرسل لنا المحادثة. تذهب تلك الملاحظات مباشرة إلى طريقة تهيئة الوكيل.",
    en: "If one of the open agents answered badly, send us the exchange. That feedback goes straight into how the agent is configured.",
  },
  "contact.note2T": { ar: "الشركات الصغيرة أولًا", en: "Small businesses first" },
  "contact.note2B": {
    ar: "لا تحتاج إلى قسم مشتريات أو قسم تقنية معلومات للعمل معنا. معظم عملائنا لا يملكون أيًّا منهما.",
    en: "You do not need a procurement process or an IT department to work with us. Most of our clients have neither.",
  },
  "contact.briefH2": { ar: "أرسل لنا طلبك", en: "Send us a brief" },
  "contact.briefP1": { ar: "املأ هذا وسيفتح رسالة جاهزة إلى", en: "Fill this in and it opens a pre-written email to" },
  "contact.briefP2": {
    ar: "في تطبيق بريدك. لا شيء يُرسَل إلى خادم، ولا نحفظ شيئًا حتى تضغط إرسال.",
    en: "in your own mail app. Nothing is submitted to a server, and we store nothing until you press send.",
  },
  "contact.name": { ar: "اسمك", en: "Your name" },
  "contact.namePh": { ar: "جين أوكافور", en: "Jane Okafor" },
  "contact.business": { ar: "الشركة", en: "Business" },
  "contact.businessPh": { ar: "أوكافور للخدمات اللوجستية", en: "Okafor Logistics" },
  "contact.phone": { ar: "رقم الهاتف (مطلوب)", en: "Phone number (required)" },
  "contact.phoneHelp": {
    ar: "نتصل بك بدل تبادل الرسائل — أسرع لكلينا.",
    en: "We call rather than trade emails — it is faster for both of us.",
  },
  "contact.topic": { ar: "ما موضوع الطلب؟", en: "What's this about?" },
  "contact.topicBuild": { ar: "موقع أو تطبيق أو نظام", en: "A website, app or system" },
  "contact.topic1": { ar: "إعداد وكيل ذكاء اصطناعي لشركتي", en: "Set up an AI agent for my business" },
  "contact.topic2": { ar: "التسعير والتكلفة", en: "Pricing and affordability" },
  "contact.topic3": { ar: "ملاحظات على وكيل اختبرته", en: "Feedback on an agent I tested" },
  "contact.topic4": { ar: "استفسار شراكة أو إعادة بيع", en: "Partnership or reseller enquiry" },
  "contact.topic5": { ar: "شيء آخر", en: "Something else" },
  "contact.details": { ar: "التفاصيل", en: "Details" },
  "contact.detailsPh": {
    ar: "تصلنا نحو 60 سؤالًا متطابقًا عن التوصيل يوميًا، ويقضي موظفان صباحهما في الرد عليها…",
    en: "We get around 60 of the same delivery questions a day and two people spend their mornings answering them…",
  },
  "contact.send": { ar: "افتح هذا في تطبيق بريدي", en: "Open this in my email app" },
  "contact.needPhone": { ar: "أضف رقم هاتفك للمتابعة", en: "Add your phone number to continue" },
  "contact.noMail": {
    ar: "لا يوجد تطبيق بريد؟ انسخ العنوان أعلاه واكتب لنا مباشرة — وأدرج رقمك لنتمكن من الاتصال بك.",
    en: "No mail app? Copy the address above and write to us directly — include your number so we can call you back.",
  },
  "contact.mailSubject": { ar: "استفسار CoreOs — ", en: "CoreOs enquiry — " },
  "contact.mailName": { ar: "الاسم", en: "Name" },
  "contact.mailBusiness": { ar: "الشركة", en: "Business" },
  "contact.mailPhone": { ar: "الهاتف", en: "Phone" },
  "contact.mailTopic": { ar: "الموضوع", en: "Topic" },
  "contact.mailBody": { ar: "(اكتب ما تحتاجه هنا.)", en: "(Tell us what you need here.)" },
  "contact.mailFrom": { ar: "— أُرسلت من coreos.ai", en: "— Sent from coreos.ai" },

  /* ---------------------------------------------------------- 404/misc */
  "nf.h1": { ar: "لا يوجد شيء على", en: "Nothing lives at" },
  "nf.p": {
    ar: "الصفحة التي طلبتها ليست هنا. أما الوكلاء، فهم موجودون.",
    en: "The page you asked for isn't here. The agents, however, are.",
  },
  "nf.back": { ar: "العودة إلى CoreOs", en: "Back to CoreOs" },
  "nf.lab": { ar: "زُر CoreOs.ai", en: "Visit CoreOs.ai" },
  "misc.loadingConsole": { ar: "جارٍ تحميل لوحة العميل…", en: "Loading the client console…" },
} satisfies Record<string, Copy>;

export type CopyKey = keyof typeof COPY;

/** Fill {placeholders} in a resolved string. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}
