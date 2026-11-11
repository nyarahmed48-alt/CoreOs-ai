/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Device Check's own words.
 *
 * Its own dictionary rather than eighty more keys in the till's: this is a
 * separate app that a shop may never open, and CoreCashier should not carry
 * its strings on every tablet. The shape is the same, so a missing
 * translation is still a build error rather than a surprise in Baghdad.
 *
 * It borrows `Lang` and the direction rules from the till, so the two always
 * agree about what "ckb" is and which way it runs.
 */

import { dirOf, type Lang } from "../pos/i18n";

export { dirOf };
export type { Lang };

type Vars = Record<string, string | number>;

const EN = {
  "app.title": "Device check",
  "app.what": "Tests this tablet and tells you the CoreOS code for anything wrong. Nothing leaves the tablet unless you tap Share.",
  "app.start": "Start check",
  "app.running": "Checking the tablet…",
  "app.again": "Check again",
  "app.guided": "Now a few tests that need you",
  "app.skipAll": "Skip the rest",

  "check.battery": "Battery",
  "check.network": "Internet",
  "check.bluetooth": "Bluetooth",
  "check.storage": "Room on the tablet",
  "check.hardware": "Memory and processor",
  "check.speed": "Speed",
  "check.device": "This tablet",

  "v.pass": "Fine",
  "v.warn": "Warning",
  "v.fail": "Problem",
  "v.untested": "Could not test",

  "why.noApi": "This tablet's browser cannot test this.",
  "why.refused": "The tablet would not answer.",
  "why.fromFile": "Open the installed app to test this properly.",
  "why.skipped": "Skipped.",

  "guided.skip": "Skip this",
  "guided.yes": "Yes",
  "guided.no": "No",
  "guided.next": "Next",

  "touch.title": "Touch test",
  "touch.hint": "Tap every square until they all turn green. Any square you cannot turn green is a dead part of the screen.",
  "touch.left": "{n} left",

  "colour.title": "Screen test",
  "colour.hint": "The screen will fill with one colour at a time. Look for spots, lines or patches.",
  "colour.start": "Show the colours",
  "colour.tap": "Tap for the next colour",
  "colour.ask": "Did you see any spots or lines?",

  "charge.title": "Charger test",
  "charge.hint": "Plug the charger in now. This watches for the tablet to start charging.",
  "charge.waiting": "Waiting… {n} seconds",
  "charge.start": "I have plugged it in",
  "charge.ok": "It is charging.",
  "charge.none": "It did not start charging.",
  "charge.other": "Does the same charger work on another device?",

  "scan.title": "Barcode scanner test",
  "scan.hint": "Scan any product with the hand scanner. You do not need to tap the box first.",
  "scan.ok": "Read: {code}",
  "scan.none": "Nothing was scanned.",
  "scan.waiting": "Waiting for a scan… {n} seconds",

  "print.title": "Printer test",
  "print.hint": "This sends a short test receipt to the Bluetooth printer.",
  "print.send": "Print a test",
  "print.ask": "How did it come out?",
  "print.clear": "Clear",
  "print.faded": "Faded or jammed",
  "print.nothing": "Nothing printed",

  "sound.title": "Speaker test",
  "sound.hint": "The till beeps on every scan. This plays that beep.",
  "sound.play": "Play the beep",
  "sound.ask": "Did you hear it?",

  "ask.title": "A few questions",
  "ask.hot": "Does this tablet get very hot?",
  "ask.dropped": "Has it been dropped, or did it get wet?",
  "ask.offs": "Does it turn itself off?",

  "result.title": "Result",
  "result.main": "Put this code on the ticket",
  "result.allWell": "Nothing wrong was found",
  "result.allWellBody": "Every test this tablet could run came back fine.",
  "result.whatNow": "What to do now",
  "result.share": "Share the report",
  "result.shared": "Copied — paste it into WhatsApp.",
  "result.history": "Earlier checks",
  "result.noHistory": "This is the first check on this tablet.",
  "result.tillId": "Till",
  "result.shop": "Shop",
  "result.alsoFound": "Also found",
  "result.notTested": "Could not be tested on this tablet",

  "insp.title": "Used tablet inspection",
  "insp.locked": "This needs a CoreOS technician key. Open CoreCashier, go to Settings and scan the key there.",
  "insp.hint": "For a tablet being bought second hand. Runs the checks above, then asks what only a person can see.",
  "insp.run": "Start the inspection",
  "insp.q.cracks": "Any cracks in the screen or the glass?",
  "insp.q.dents": "Any dents, or is the back swollen?",
  "insp.q.battery": "Does the battery last a full working day?",
  "insp.q.reset": "Has it been factory reset, with no account lock?",
  "insp.q.proof": "Can the seller prove they own it?",
  "insp.meets": "Meets the CoreOS standard",
  "insp.fails": "Does not meet the CoreOS standard",
  "insp.failed": "Why it does not meet it",
  "insp.standard": "CoreOS hardware standard {ref}",
};

export type Key = keyof typeof EN;

const AR: Record<Key, string> = {
  "app.title": "فحص الجهاز",
  "app.what": "يفحص هذا الجهاز ويعطيك رمز CoreOs لأي خلل. لا يخرج شيء من الجهاز إلا إذا ضغطت «مشاركة».",
  "app.start": "ابدأ الفحص",
  "app.running": "جارٍ فحص الجهاز…",
  "app.again": "افحص مرة أخرى",
  "app.guided": "الآن بعض الفحوصات التي تحتاجك",
  "app.skipAll": "تخطي الباقي",

  "check.battery": "البطارية",
  "check.network": "الإنترنت",
  "check.bluetooth": "البلوتوث",
  "check.storage": "المساحة في الجهاز",
  "check.hardware": "الذاكرة والمعالج",
  "check.speed": "السرعة",
  "check.device": "هذا الجهاز",

  "v.pass": "سليم",
  "v.warn": "تنبيه",
  "v.fail": "خلل",
  "v.untested": "تعذّر الفحص",

  "why.noApi": "متصفح هذا الجهاز لا يستطيع فحص هذا.",
  "why.refused": "لم يستجب الجهاز.",
  "why.fromFile": "افتح التطبيق المثبّت لفحص هذا بشكل صحيح.",
  "why.skipped": "تم التخطي.",

  "guided.skip": "تخطي",
  "guided.yes": "نعم",
  "guided.no": "لا",
  "guided.next": "التالي",

  "touch.title": "فحص اللمس",
  "touch.hint": "المس كل مربع حتى تتحول كلها إلى الأخضر. أي مربع لا يتحول هو جزء ميت من الشاشة.",
  "touch.left": "باقي {n}",

  "colour.title": "فحص الشاشة",
  "colour.hint": "ستمتلئ الشاشة بلون واحد في كل مرة. ابحث عن بقع أو خطوط.",
  "colour.start": "اعرض الألوان",
  "colour.tap": "المس للون التالي",
  "colour.ask": "هل رأيت أي بقع أو خطوط؟",

  "charge.title": "فحص الشاحن",
  "charge.hint": "وصّل الشاحن الآن. سيراقب الجهاز بدء الشحن.",
  "charge.waiting": "بالانتظار… {n} ثانية",
  "charge.start": "وصّلته",
  "charge.ok": "الجهاز يشحن.",
  "charge.none": "لم يبدأ الشحن.",
  "charge.other": "هل يعمل نفس الشاحن مع جهاز آخر؟",

  "scan.title": "فحص قارئ الباركود",
  "scan.hint": "امسح أي مادة بالقارئ اليدوي. لا حاجة للمس الحقل أولاً.",
  "scan.ok": "قُرئ: {code}",
  "scan.none": "لم يُمسح أي شيء.",
  "scan.waiting": "بانتظار المسح… {n} ثانية",

  "print.title": "فحص الطابعة",
  "print.hint": "يرسل فاتورة تجريبية قصيرة إلى طابعة البلوتوث.",
  "print.send": "اطبع تجربة",
  "print.ask": "كيف خرجت الطباعة؟",
  "print.clear": "واضحة",
  "print.faded": "باهتة أو الورق علق",
  "print.nothing": "لم تطبع شيئاً",

  "sound.title": "فحص السماعة",
  "sound.hint": "الصندوق يصدر صفيراً مع كل مسح. هذا يشغّل ذلك الصفير.",
  "sound.play": "شغّل الصفير",
  "sound.ask": "هل سمعته؟",

  "ask.title": "بعض الأسئلة",
  "ask.hot": "هل يسخن هذا الجهاز كثيراً؟",
  "ask.dropped": "هل سقط أو ابتلّ؟",
  "ask.offs": "هل يطفئ نفسه؟",

  "result.title": "النتيجة",
  "result.main": "ضع هذا الرمز في البلاغ",
  "result.allWell": "لم يُعثر على خلل",
  "result.allWellBody": "كل فحص استطاع هذا الجهاز إجراءه جاء سليماً.",
  "result.whatNow": "ما العمل الآن",
  "result.share": "مشاركة التقرير",
  "result.shared": "تم النسخ — الصقه في واتساب.",
  "result.history": "فحوصات سابقة",
  "result.noHistory": "هذا أول فحص على هذا الجهاز.",
  "result.tillId": "الصندوق",
  "result.shop": "المحل",
  "result.alsoFound": "وُجد أيضاً",
  "result.notTested": "تعذّر فحصها على هذا الجهاز",

  "insp.title": "فحص جهاز مستعمل",
  "insp.locked": "يحتاج مفتاح فني من CoreOs. افتح CoreCashier ثم «الإعدادات» وامسح المفتاح هناك.",
  "insp.hint": "لجهاز يُشترى مستعملاً. يجري الفحوصات أعلاه ثم يسأل عما يراه الإنسان فقط.",
  "insp.run": "ابدأ الفحص",
  "insp.q.cracks": "هل في الشاشة أو الزجاج أي كسر؟",
  "insp.q.dents": "هل فيه انبعاج، أو الظهر منتفخ؟",
  "insp.q.battery": "هل تكفي البطارية يوم عمل كامل؟",
  "insp.q.reset": "هل أُعيد ضبط المصنع بلا قفل حساب؟",
  "insp.q.proof": "هل يستطيع البائع إثبات ملكيته؟",
  "insp.meets": "مطابق لمعيار CoreOs",
  "insp.fails": "غير مطابق لمعيار CoreOs",
  "insp.failed": "سبب عدم المطابقة",
  "insp.standard": "معيار CoreOs للأجهزة {ref}",
};

const CKB: Record<Key, string> = {
  "app.title": "پشکنینی ئامێر",
  "app.what": "ئەم ئامێرە تاقی دەکاتەوە و کۆدی CoreOs بۆ هەر کێشەیەک پێت دەڵێت. هیچ شتێک لە ئامێرەکە دەرناچێت مەگەر «هاوبەشکردن» بکەیت.",
  "app.start": "دەستپێکردنی پشکنین",
  "app.running": "پشکنینی ئامێرەکە…",
  "app.again": "دووبارە پشکنین",
  "app.guided": "ئێستا چەند تاقیکردنەوەیەک کە پێویستیان بە تۆیە",
  "app.skipAll": "بەجێهێشتنی ئەوانی تر",

  "check.battery": "باتری",
  "check.network": "ئینتەرنێت",
  "check.bluetooth": "بلوتوس",
  "check.storage": "شوێن لە ئامێرەکە",
  "check.hardware": "بیرگە و پرۆسێسەر",
  "check.speed": "خێرایی",
  "check.device": "ئەم ئامێرە",

  "v.pass": "باشە",
  "v.warn": "ئاگادارکردنەوە",
  "v.fail": "کێشە",
  "v.untested": "نەتوانرا تاقی بکرێتەوە",

  "why.noApi": "وێبگەڕی ئەم ئامێرە ناتوانێت ئەمە تاقی بکاتەوە.",
  "why.refused": "ئامێرەکە وەڵامی نەدایەوە.",
  "why.fromFile": "بۆ تاقیکردنەوەی دروست، بەرنامە دامەزراوەکە بکەرەوە.",
  "why.skipped": "بەجێهێڵدرا.",

  "guided.skip": "بەجێیبهێڵە",
  "guided.yes": "بەڵێ",
  "guided.no": "نەخێر",
  "guided.next": "دواتر",

  "touch.title": "تاقیکردنەوەی دەستلێدان",
  "touch.hint": "دەست لە هەموو چوارگۆشەیەک بدە تا هەموویان سەوز دەبن. هەر چوارگۆشەیەک سەوز نەبێت بەشێکی مردووی شاشەیە.",
  "touch.left": "{n} ماوە",

  "colour.title": "تاقیکردنەوەی شاشە",
  "colour.hint": "شاشەکە بە یەک ڕەنگ پڕ دەبێت. بگەڕێ بەدوای خاڵ یان هێڵ.",
  "colour.start": "ڕەنگەکان پیشان بدە",
  "colour.tap": "بۆ ڕەنگی دواتر دەست لێبدە",
  "colour.ask": "هیچ خاڵ یان هێڵێکت بینی؟",

  "charge.title": "تاقیکردنەوەی شارژەر",
  "charge.hint": "ئێستا شارژەرەکە ببەستە. چاوەڕێی دەستپێکردنی شارژ دەکات.",
  "charge.waiting": "چاوەڕوانی… {n} چرکە",
  "charge.start": "بەستمەوە",
  "charge.ok": "شارژ دەبێت.",
  "charge.none": "دەستی بە شارژ نەکرد.",
  "charge.other": "هەمان شارژەر لەسەر ئامێرێکی تر کار دەکات؟",

  "scan.title": "تاقیکردنەوەی سکانەری بارکۆد",
  "scan.hint": "بە سکانەری دەستی هەر کاڵایەک سکان بکە. پێویست ناکات سەرەتا دەست لە خانەکە بدەیت.",
  "scan.ok": "خوێندرایەوە: {code}",
  "scan.none": "هیچ سکان نەکرا.",
  "scan.waiting": "چاوەڕێی سکان… {n} چرکە",

  "print.title": "تاقیکردنەوەی چاپکەر",
  "print.hint": "وەسڵێکی کورتی تاقیکردنەوە بۆ چاپکەری بلوتوس دەنێرێت.",
  "print.send": "چاپی تاقیکردنەوە",
  "print.ask": "چۆن دەرچوو؟",
  "print.clear": "ڕوون",
  "print.faded": "کاڵ یان کاغەز گیرا",
  "print.nothing": "هیچی چاپ نەکرد",

  "sound.title": "تاقیکردنەوەی بڵندگۆ",
  "sound.hint": "سندوقەکە لەگەڵ هەر سکانێک دەنگ دەکات. ئەمە ئەو دەنگە لێ دەدات.",
  "sound.play": "دەنگەکە لێبدە",
  "sound.ask": "گوێت لێبوو؟",

  "ask.title": "چەند پرسیارێک",
  "ask.hot": "ئەم ئامێرە زۆر گەرم دەبێت؟",
  "ask.dropped": "کەوتووە یان تەڕ بووە؟",
  "ask.offs": "خۆی دەکوژێتەوە؟",

  "result.title": "ئەنجام",
  "result.main": "ئەم کۆدە بخەرە سەر داواکارییەکە",
  "result.allWell": "هیچ کێشەیەک نەدۆزرایەوە",
  "result.allWellBody": "هەموو ئەو تاقیکردنەوانەی ئەم ئامێرە توانی بیکات باش بوون.",
  "result.whatNow": "ئێستا چی بکەیت",
  "result.share": "هاوبەشکردنی ڕاپۆرت",
  "result.shared": "کۆپی کرا — بیلکێنە لە واتساپ.",
  "result.history": "پشکنینە پێشووەکان",
  "result.noHistory": "ئەمە یەکەم پشکنینە لەسەر ئەم ئامێرە.",
  "result.tillId": "سندوق",
  "result.shop": "دوکان",
  "result.alsoFound": "هەروەها دۆزرایەوە",
  "result.notTested": "نەتوانرا لەسەر ئەم ئامێرە تاقی بکرێنەوە",

  "insp.title": "پشکنینی ئامێری بەکارهاتوو",
  "insp.locked": "پێویستی بە کلیلی تەکنیسیەنی CoreOs هەیە. CoreCashier بکەرەوە، بڕۆ بۆ «ڕێکخستن» و لەوێ کلیلەکە سکان بکە.",
  "insp.hint": "بۆ ئامێرێک کە بە کارهاتوو دەکڕدرێت. تاقیکردنەوەکانی سەرەوە دەکات، پاشان ئەوە دەپرسێت کە تەنها مرۆڤ دەیبینێت.",
  "insp.run": "دەستپێکردنی پشکنین",
  "insp.q.cracks": "هیچ شکانێک لە شاشە یان شووشەکەدا هەیە؟",
  "insp.q.dents": "هیچ چەقاندنێک هەیە، یان پشتەوەی ئاوساوە؟",
  "insp.q.battery": "باتری ڕۆژێکی تەواوی کار دەخایەنێت؟",
  "insp.q.reset": "ڕێکخستنی کارگە کراوەتەوە بەبێ قوفڵی هەژمار؟",
  "insp.q.proof": "فرۆشیار دەتوانێت خاوەندارێتی بسەلمێنێت؟",
  "insp.meets": "لەگەڵ ستانداردی CoreOs دەگونجێت",
  "insp.fails": "لەگەڵ ستانداردی CoreOs ناگونجێت",
  "insp.failed": "بۆچی ناگونجێت",
  "insp.standard": "ستانداردی ئامێری CoreOs {ref}",
};

const DICTS: Record<Lang, Record<Key, string>> = { en: EN, ar: AR, ckb: CKB };

export function say(lang: Lang, key: Key, vars?: Vars): string {
  const text = DICTS[lang]?.[key] ?? EN[key] ?? key;
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}
