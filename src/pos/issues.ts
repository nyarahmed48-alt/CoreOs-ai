/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Every CoreOS issue code, in one place.
 *
 * The point of these is a phone call. A shopkeeper in Karrada reads out
 * "SW-06" and the support desk knows, before asking anything else, that the
 * till would not take a licence code. Without them the call opens with "it is
 * not working" and goes on for ten minutes.
 *
 * So the words here are written for the shop, not for us: no stack traces, no
 * "failed to", no technical nouns, and the same plain sentence in all three
 * languages. The technician note is the other half — English, ours, and never
 * shown on the shop's screen.
 *
 * Codes ending in 09 mean "something else in this family". A few codes cannot
 * be detected by any browser — a jammed printer, a flat power bank, a cashier
 * typing the wrong price — and are marked `manual`: they exist so the owner
 * can still raise the right code from the error-log screen when they ring.
 */

import type { Lang } from "./i18n";

export type Priority = "P1" | "P2" | "P3";
export type Category = "SW" | "DT" | "AC" | "TB";

export type IssueCode =
  | "SW-01" | "SW-02" | "SW-03" | "SW-04" | "SW-05"
  | "SW-06" | "SW-07" | "SW-08" | "SW-09"
  | "DT-01" | "DT-02" | "DT-03" | "DT-04" | "DT-05" | "DT-09"
  | "AC-01" | "AC-02" | "AC-03" | "AC-04" | "AC-05" | "AC-09"
  | "TB-01" | "TB-02" | "TB-03" | "TB-04"
  | "TB-05" | "TB-06" | "TB-07" | "TB-08" | "TB-09";

interface Words {
  title: string;
  body: string;
  /** One to three things the shop can try before ringing. */
  steps: string[];
}

export interface Issue {
  priority: Priority;
  /** English, for the support desk. Never on the shop's screen. */
  note: string;
  /** No browser can detect this; it exists for a call, not for a catch. */
  manual?: boolean;
  text: Record<Lang, Words>;
}

export function categoryOf(code: IssueCode): Category {
  return code.slice(0, 2) as Category;
}

export const ISSUES: Record<IssueCode, Issue> = {
  "SW-01": {
    priority: "P1",
    note: "Uncaught exception, unhandled rejection, or a React render crash. Details carry the message and where it came from.",
    text: {
      en: {
        title: "The till stopped",
        body: "Something went wrong and the till had to stop what it was doing. Your sales and products are safe.",
        steps: ["Close the app and open it again.", "If it keeps happening, call CoreOS and read out this code."],
      },
      ar: {
        title: "توقف الصندوق",
        body: "حدث خلل واضطر الصندوق لإيقاف ما كان يفعله. مبيعاتك وموادك بأمان.",
        steps: ["أغلق البرنامج وافتحه من جديد.", "إذا تكرر، اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "سندوقەکە وەستا",
        body: "کێشەیەک ڕوویدا و سندوقەکە ناچار بوو وازی لەوە بهێنێت کە دەیکرد. فرۆشتن و کاڵاکانت پارێزراون.",
        steps: ["بەرنامەکە دابخە و دووبارە بیکەرەوە.", "ئەگەر دووبارە بووەوە، پەیوەندی بە CoreOs بکە و ئەم کۆدە بخوێنەوە."],
      },
    },
  },
  "SW-02": {
    priority: "P1",
    note: "Sale total did not match the sum of its lines. The sale was blocked, not saved. Details carry both figures.",
    text: {
      en: {
        title: "The total does not add up",
        body: "The till checked the total against the items and they did not match, so the sale was not saved. Nothing has been charged.",
        steps: ["Start the sale again.", "If it happens twice on the same items, call CoreOS and read out this code."],
      },
      ar: {
        title: "المجموع غير صحيح",
        body: "راجع الصندوق المجموع مع المواد فلم يتطابقا، فلم تُحفظ الفاتورة. لم يُحصَّل أي مبلغ.",
        steps: ["أعد الفاتورة من البداية.", "إذا تكرر مع نفس المواد، اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "کۆی گشتی ڕاست نییە",
        body: "سندوقەکە کۆی گشتی لەگەڵ کاڵاکان بەراورد کرد و یەکیان نەگرتەوە، بۆیە فرۆشتنەکە پاشەکەوت نەکرا. هیچ پارەیەک وەرنەگیراوە.",
        steps: ["فرۆشتنەکە لە سەرەتاوە دەستپێبکەرەوە.", "ئەگەر لەگەڵ هەمان کاڵا دوو جار ڕوویدا، پەیوەندی بە CoreOs بکە."],
      },
    },
  },
  "SW-03": {
    priority: "P2",
    note: "A scanned barcode matched no product. Details carry the code only, never a price.",
    text: {
      en: {
        title: "That item is not on the shelf",
        body: "The barcode that was scanned is not on this till yet.",
        steps: ["Add the item in Products, with its barcode.", "Or find it by name and ring it up that way."],
      },
      ar: {
        title: "هذه المادة غير مسجّلة",
        body: "الباركود الذي مُسح غير موجود في هذا الصندوق بعد.",
        steps: ["أضف المادة من «المواد» مع الباركود.", "أو ابحث عنها بالاسم وسجّلها."],
      },
      ckb: {
        title: "ئەم کاڵایە تۆمار نەکراوە",
        body: "ئەو بارکۆدەی سکان کرا هێشتا لەم سندوقەدا نییە.",
        steps: ["کاڵاکە لە «کاڵاکان» زیاد بکە لەگەڵ بارکۆدەکەی.", "یان بە ناو بیدۆزەوە و بیفرۆشە."],
      },
    },
  },
  "SW-04": {
    priority: "P3",
    note: "A translation key was missing and fell back to English. Logged once per key, never shown to the shop.",
    text: {
      en: {
        title: "A word is missing",
        body: "Part of the screen is showing in English because the translation is missing.",
        steps: ["Carry on using the till; nothing is broken.", "Tell CoreOS which screen it was."],
      },
      ar: {
        title: "ترجمة ناقصة",
        body: "جزء من الشاشة يظهر بالإنجليزية لأن الترجمة ناقصة.",
        steps: ["تابع استخدام الصندوق، لا يوجد عطل.", "أخبر CoreOs بأي شاشة كانت."],
      },
      ckb: {
        title: "وەرگێڕان کەمە",
        body: "بەشێک لە شاشەکە بە ئینگلیزی دەردەکەوێت چونکە وەرگێڕانەکەی نییە.",
        steps: ["بەردەوام بە، هیچ تێکنەچووە.", "بە CoreOs بڵێ کام شاشە بوو."],
      },
    },
  },
  "SW-05": {
    priority: "P2",
    note: "The receipt could not be drawn — no canvas, or a zero-size frame. Printing was stopped before anything was sent.",
    text: {
      en: {
        title: "The receipt could not be made",
        body: "The till could not lay the receipt out, so nothing was sent to the printer. The sale is saved.",
        steps: ["Try printing it again from the sale in Sales.", "Use Share to send the receipt instead."],
      },
      ar: {
        title: "تعذّر إعداد الفاتورة",
        body: "لم يستطع الصندوق تجهيز شكل الفاتورة فلم يُرسل شيء للطابعة. الفاتورة محفوظة.",
        steps: ["جرّب الطباعة مرة أخرى من «المبيعات».", "أو استخدم «مشاركة» لإرسال الفاتورة."],
      },
      ckb: {
        title: "نەتوانرا وەسڵەکە ئامادە بکرێت",
        body: "سندوقەکە نەیتوانی شێوەی وەسڵەکە دابنێت، بۆیە هیچ بۆ چاپکەر نەنێردرا. فرۆشتنەکە پاشەکەوت کراوە.",
        steps: ["لە «فرۆشتنەکان» دووبارە چاپی بکەرەوە.", "یان بە «هاوبەشکردن» وەسڵەکە بنێرە."],
      },
    },
  },
  "SW-06": {
    priority: "P1",
    note: "Licence code, cloud sign-in, staff PIN or technician key was refused. Details say which, never the credential.",
    text: {
      en: {
        title: "The code was not accepted",
        body: "The code or password that was entered did not work on this tablet.",
        steps: ["Check it and type it again.", "Ask CoreOS for a new code, reading out this one's number."],
      },
      ar: {
        title: "لم يُقبل الرمز",
        body: "الرمز أو كلمة المرور التي أُدخلت لا تعمل على هذا الجهاز.",
        steps: ["تحقق منها وأدخلها مرة أخرى.", "اطلب من CoreOs رمزاً جديداً واذكر رقم هذا الجهاز."],
      },
      ckb: {
        title: "کۆدەکە وەرنەگیرا",
        body: "ئەو کۆد یان وشە نهێنییەی نووسرا لەسەر ئەم ئامێرە کار ناکات.",
        steps: ["بیپشکنە و دووبارە بینووسە.", "داوای کۆدێکی نوێ لە CoreOs بکە و ژمارەی ئەم ئامێرە بڵێ."],
      },
    },
  },
  "SW-07": {
    priority: "P1",
    note: "A write was refused because the till is read-only: licence lapsed, or stopped from the office.",
    text: {
      en: {
        title: "The till is read-only",
        body: "This tablet cannot take new sales at the moment. Everything you have recorded is still here and can be looked at and saved.",
        steps: ["Look at and export your figures as usual.", "Call CoreOS to start selling again."],
      },
      ar: {
        title: "الصندوق للقراءة فقط",
        body: "لا يستطيع هذا الجهاز تسجيل مبيعات جديدة حالياً. كل ما سجّلته موجود ويمكن الاطلاع عليه وحفظه.",
        steps: ["اطّلع على أرقامك واحفظ نسخة كالمعتاد.", "اتصل بـ CoreOs لإعادة البيع."],
      },
      ckb: {
        title: "سندوقەکە تەنها بۆ خوێندنەوەیە",
        body: "ئێستا ئەم ئامێرە ناتوانێت فرۆشتنی نوێ تۆمار بکات. هەموو ئەوەی تۆمارت کردووە لێرەیە و دەتوانرێت ببینرێت و پاشەکەوت بکرێت.",
        steps: ["وەک هەمیشە ژمارەکانت ببینە و پاشەکەوتیان بکە.", "بۆ گەڕانەوەی فرۆشتن پەیوەندی بە CoreOs بکە."],
      },
    },
  },
  "SW-08": {
    priority: "P2",
    note: "The service worker failed to install or activate a new build. The old one keeps serving.",
    text: {
      en: {
        title: "The update did not finish",
        body: "A new version could not be installed. The till is still working on the version it had.",
        steps: ["Close the app and open it again when the shop is quiet.", "Tell CoreOS if it keeps asking."],
      },
      ar: {
        title: "لم يكتمل التحديث",
        body: "تعذّر تثبيت نسخة جديدة. الصندوق يعمل بالنسخة السابقة.",
        steps: ["أغلق البرنامج وافتحه عندما يهدأ المحل.", "أخبر CoreOs إذا تكرر الطلب."],
      },
      ckb: {
        title: "نوێکردنەوەکە تەواو نەبوو",
        body: "نەتوانرا وەشانێکی نوێ دابمەزرێت. سندوقەکە بە وەشانی پێشوو کاردەکات.",
        steps: ["کاتێک دوکان هێمن بوو بەرنامەکە دابخە و بیکەرەوە.", "ئەگەر بەردەوام داوای کرد بە CoreOs بڵێ."],
      },
    },
  },
  "SW-09": {
    priority: "P2",
    note: "Caught exception with no more specific code. Details carry the message.",
    text: {
      en: {
        title: "Something went wrong",
        body: "The till ran into a problem it could not name. Your sales and products are safe.",
        steps: ["Try what you were doing once more.", "If it happens again, call CoreOS and read out this code."],
      },
      ar: {
        title: "حدث خلل",
        body: "واجه الصندوق مشكلة لم يستطع تحديدها. مبيعاتك وموادك بأمان.",
        steps: ["أعد المحاولة مرة أخرى.", "إذا تكرر، اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "کێشەیەک ڕوویدا",
        body: "سندوقەکە تووشی کێشەیەک بوو کە نەیتوانی ناوی بنێت. فرۆشتن و کاڵاکانت پارێزراون.",
        steps: ["دووبارە هەوڵ بدەرەوە.", "ئەگەر دووبارە بووەوە، پەیوەندی بە CoreOs بکە."],
      },
    },
  },

  "DT-01": {
    priority: "P1",
    note: "Storage read or write failed: IndexedDB would not open, a transaction aborted, localStorage is blocked, or the migration count check failed.",
    text: {
      en: {
        title: "The tablet is not saving",
        body: "The till cannot read or write its records on this tablet, so new sales may not be kept.",
        steps: ["Stop selling on this tablet and call CoreOS now.", "Do not clear the browser or the app's data."],
      },
      ar: {
        title: "الجهاز لا يحفظ",
        body: "لا يستطيع الصندوق قراءة أو كتابة سجلاته على هذا الجهاز، وقد لا تُحفظ المبيعات الجديدة.",
        steps: ["أوقف البيع على هذا الجهاز واتصل بـ CoreOs فوراً.", "لا تمسح بيانات المتصفح أو البرنامج."],
      },
      ckb: {
        title: "ئامێرەکە پاشەکەوت ناکات",
        body: "سندوقەکە ناتوانێت تۆمارەکانی لەسەر ئەم ئامێرە بخوێنێتەوە یان بنووسێت، لەوانەیە فرۆشتنی نوێ پارێزراو نەبێت.",
        steps: ["وازبهێنە لە فرۆشتن لەسەر ئەم ئامێرە و یەکسەر پەیوەندی بە CoreOs بکە.", "داتای وێبگەڕ یان بەرنامەکە مەسڕەوە."],
      },
    },
  },
  "DT-02": {
    priority: "P2",
    note: "Cloud push or standing check failed. Offline is logged but never shown — it is the normal state here.",
    text: {
      en: {
        title: "The day has not reached CoreOS",
        body: "The till could not send its books up. It keeps selling, and will send them when the internet comes back.",
        steps: ["Check the wifi when you get a moment.", "Nothing is lost; the till will catch up by itself."],
      },
      ar: {
        title: "لم تصل مبيعات اليوم إلى CoreOs",
        body: "لم يستطع الصندوق رفع دفاتره. يستمر البيع، وسيرفعها عند عودة الإنترنت.",
        steps: ["تحقق من الواي فاي عندما تستطيع.", "لا شيء يضيع، سيُكمل الصندوق وحده."],
      },
      ckb: {
        title: "ڕۆژەکە نەگەیشتووەتە CoreOs",
        body: "سندوقەکە نەیتوانی دەفتەرەکانی بنێرێت. فرۆشتن بەردەوامە و کاتێک ئینتەرنێت گەڕایەوە دەیاننێرێت.",
        steps: ["کاتێک دەرفەتت هەبوو وایفایەکە بپشکنە.", "هیچ لەدەست ناچێت، سندوقەکە خۆی تەواوی دەکات."],
      },
    },
  },
  "DT-03": {
    priority: "P2",
    note: "Backup could not be written, or a restore file was rejected as not a till backup.",
    text: {
      en: {
        title: "The backup did not work",
        body: "The copy of your records could not be saved or could not be read back.",
        steps: ["Try again from Settings, Backup.", "Make sure there is room on the tablet.", "Call CoreOS if it fails twice."],
      },
      ar: {
        title: "لم تنجح النسخة الاحتياطية",
        body: "تعذّر حفظ نسخة من سجلاتك أو قراءتها.",
        steps: ["أعد المحاولة من «الإعدادات» ثم «النسخة الاحتياطية».", "تأكد من وجود مساحة في الجهاز.", "اتصل بـ CoreOs إذا فشلت مرتين."],
      },
      ckb: {
        title: "پاڵپشتەکە سەرکەوتوو نەبوو",
        body: "نەتوانرا کۆپییەک لە تۆمارەکانت پاشەکەوت بکرێت یان بخوێندرێتەوە.",
        steps: ["لە «ڕێکخستن» و «پاڵپشت» دووبارە هەوڵ بدە.", "دڵنیابە شوێنی بەتاڵ لە ئامێرەکەدا هەیە.", "ئەگەر دوو جار شکستی هێنا پەیوەندی بە CoreOs بکە."],
      },
    },
  },
  "DT-04": {
    priority: "P3",
    manual: true,
    note: "Raised by hand when a cashier entered a wrong price, quantity or name. No browser can see this.",
    text: {
      en: {
        title: "Something was entered wrongly",
        body: "A price, a count or a name was put in wrongly and needs correcting.",
        steps: ["Correct it in Products or void the sale.", "Call CoreOS with this code if you need the records changed."],
      },
      ar: {
        title: "أُدخلت بيانات خاطئة",
        body: "سعر أو عدد أو اسم أُدخل بشكل خاطئ ويحتاج تصحيحاً.",
        steps: ["صحّحه من «المواد» أو ألغِ الفاتورة.", "اتصل بـ CoreOs بهذا الرمز إذا احتجت تعديل السجلات."],
      },
      ckb: {
        title: "زانیاری هەڵە نووسراوە",
        body: "نرخ یان ژمارە یان ناوێک بە هەڵە نووسراوە و پێویستی بە ڕاستکردنەوەیە.",
        steps: ["لە «کاڵاکان» ڕاستی بکەرەوە یان فرۆشتنەکە بسڕەوە.", "ئەگەر پێویستت بە گۆڕینی تۆمارەکانە بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "DT-05": {
    priority: "P3",
    note: "A data export was asked for. Logged whether it worked or not, so a shop asking where its file went can be answered.",
    text: {
      en: {
        title: "Data export",
        body: "A copy of your records was asked for.",
        steps: ["Look in the tablet's Downloads folder.", "Call CoreOS with this code if the file is not there."],
      },
      ar: {
        title: "تصدير البيانات",
        body: "طُلبت نسخة من سجلاتك.",
        steps: ["ابحث في مجلد التنزيلات في الجهاز.", "اتصل بـ CoreOs بهذا الرمز إذا لم يكن الملف موجوداً."],
      },
      ckb: {
        title: "ناردنەدەرەوەی داتا",
        body: "داوای کۆپییەک لە تۆمارەکانت کراوە.",
        steps: ["لە بوخچەی داگرتنەکانی ئامێرەکە بگەڕێ.", "ئەگەر فایلەکە نەبوو بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "DT-09": {
    priority: "P2",
    note: "A data problem with no more specific code.",
    text: {
      en: {
        title: "A problem with the records",
        body: "Something about the saved records is not right.",
        steps: ["Save a backup from Settings now.", "Call CoreOS and read out this code."],
      },
      ar: {
        title: "مشكلة في السجلات",
        body: "هناك خلل في السجلات المحفوظة.",
        steps: ["احفظ نسخة احتياطية من «الإعدادات» الآن.", "اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "کێشە لە تۆمارەکان",
        body: "شتێک لە تۆمارە پاشەکەوتکراوەکان ڕاست نییە.",
        steps: ["ئێستا لە «ڕێکخستن» پاڵپشتێک پاشەکەوت بکە.", "پەیوەندی بە CoreOs بکە و ئەم کۆدە بخوێنەوە."],
      },
    },
  },

  "AC-01": {
    priority: "P2",
    note: "Camera unavailable: no device, permission refused, the getUserMedia watchdog fired, or a photo decoded to nothing.",
    text: {
      en: {
        title: "The scanner is not reading",
        body: "The camera could not be used to read barcodes.",
        steps: ["Use the hand scanner, or type the number.", "Close the app and open it again.", "Call CoreOS with this code if it stays."],
      },
      ar: {
        title: "القارئ لا يقرأ",
        body: "تعذّر استخدام الكاميرا لقراءة الباركود.",
        steps: ["استخدم القارئ اليدوي أو اكتب الرقم.", "أغلق البرنامج وافتحه من جديد.", "اتصل بـ CoreOs بهذا الرمز إذا استمر."],
      },
      ckb: {
        title: "سکانەر ناخوێنێتەوە",
        body: "نەتوانرا کامێرا بۆ خوێندنەوەی بارکۆد بەکاربهێنرێت.",
        steps: ["سکانەری دەستی بەکاربهێنە یان ژمارەکە بنووسە.", "بەرنامەکە دابخە و بیکەرەوە.", "ئەگەر مایەوە بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "AC-02": {
    priority: "P2",
    note: "The printer did not answer: out of range, switched off, or this browser has no Web Bluetooth at all.",
    text: {
      en: {
        title: "The printer is not printing",
        body: "The till could not reach the printer. The sale is saved either way.",
        steps: ["Check the printer is switched on and has paper.", "Print again from Sales.", "Or use Share to send the receipt."],
      },
      ar: {
        title: "الطابعة لا تطبع",
        body: "لم يستطع الصندوق الوصول إلى الطابعة. الفاتورة محفوظة على كل حال.",
        steps: ["تأكد أن الطابعة مشغّلة وفيها ورق.", "أعد الطباعة من «المبيعات».", "أو استخدم «مشاركة» لإرسال الفاتورة."],
      },
      ckb: {
        title: "چاپکەر چاپ ناکات",
        body: "سندوقەکە نەیگەیشتە چاپکەرەکە. فرۆشتنەکە بە هەر حاڵ پاشەکەوت کراوە.",
        steps: ["دڵنیابە چاپکەرەکە کارایە و کاغەزی تێدایە.", "لە «فرۆشتنەکان» دووبارە چاپی بکە.", "یان بە «هاوبەشکردن» بینێرە."],
      },
    },
  },
  "AC-03": {
    priority: "P3",
    manual: true,
    note: "Faded print, or paper jammed. Nothing a browser can see — the printer reports nothing back.",
    text: {
      en: {
        title: "The print is bad",
        body: "The paper is jamming, or the print is too faint to read.",
        steps: ["Open the printer and reseat the roll.", "Try a fresh roll of paper.", "Call CoreOS with this code if it stays faint."],
      },
      ar: {
        title: "الطباعة رديئة",
        body: "الورق يعلق أو الطباعة باهتة لا تُقرأ.",
        steps: ["افتح الطابعة وأعد تركيب الرول.", "جرّب رولاً جديداً.", "اتصل بـ CoreOs بهذا الرمز إذا بقيت باهتة."],
      },
      ckb: {
        title: "چاپەکە خراپە",
        body: "کاغەزەکە دەگیرێت، یان چاپەکە ئەوەندە کاڵە کە ناخوێندرێتەوە.",
        steps: ["چاپکەرەکە بکەرەوە و ڕۆڵەکە دابنێوە.", "ڕۆڵێکی نوێ تاقی بکەرەوە.", "ئەگەر کاڵ مایەوە پەیوەندی بکە."],
      },
    },
  },
  "AC-04": {
    priority: "P2",
    note: "Paired device gone, or a Bluetooth Classic printer that Web Bluetooth cannot reach at all. The second is not a fault — it is the wrong kind of printer.",
    text: {
      en: {
        title: "Bluetooth has been lost",
        body: "The tablet can no longer reach the printer or scanner it was paired with.",
        steps: ["Switch the printer or scanner off and on.", "Pair it again in Settings, Printer.", "Call CoreOS with this code if it will not pair."],
      },
      ar: {
        title: "انقطع البلوتوث",
        body: "لم يعد الجهاز يصل إلى الطابعة أو القارئ المقترن به.",
        steps: ["أطفئ الطابعة أو القارئ وأعد تشغيله.", "أعد الاقتران من «الإعدادات» ثم «الطابعة».", "اتصل بـ CoreOs بهذا الرمز إذا لم يقترن."],
      },
      ckb: {
        title: "بلوتوس پچڕا",
        body: "ئامێرەکە چیتر ناگاتە ئەو چاپکەر یان سکانەرەی پێوەی بەستراوە.",
        steps: ["چاپکەر یان سکانەرەکە بکوژێنەوە و بیکەرەوە.", "لە «ڕێکخستن» و «چاپکەر» دووبارە جووتی بکە.", "ئەگەر جووت نەبوو پەیوەندی بکە."],
      },
    },
  },
  "AC-05": {
    priority: "P3",
    manual: true,
    note: "Power bank or charger fault. Reported by the shop; the tablet cannot see what it is plugged into.",
    text: {
      en: {
        title: "The charger is not working",
        body: "The power bank or charger is not charging the tablet.",
        steps: ["Try a different cable and socket.", "Call CoreOS with this code to arrange a replacement."],
      },
      ar: {
        title: "الشاحن لا يعمل",
        body: "البطارية المحمولة أو الشاحن لا يشحن الجهاز.",
        steps: ["جرّب كابلاً ومقبساً آخر.", "اتصل بـ CoreOs بهذا الرمز لترتيب بديل."],
      },
      ckb: {
        title: "شارژەرەکە کار ناکات",
        body: "پاوەربانک یان شارژەرەکە ئامێرەکە شارژ ناکات.",
        steps: ["کەیبڵ و پریزێکی تر تاقی بکەرەوە.", "بۆ گۆڕینەوە بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "AC-09": {
    priority: "P3",
    manual: true,
    note: "An accessory problem with no more specific code.",
    text: {
      en: {
        title: "A problem with the equipment",
        body: "Something attached to the till is not behaving.",
        steps: ["Switch it off and on.", "Call CoreOS and read out this code."],
      },
      ar: {
        title: "مشكلة في الملحقات",
        body: "أحد الأجهزة الموصولة بالصندوق لا يعمل كما ينبغي.",
        steps: ["أطفئه وأعد تشغيله.", "اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "کێشە لە ئامێرەکان",
        body: "شتێکی بەستراو بە سندوقەکەوە وەک پێویست کار ناکات.",
        steps: ["بیکوژێنەوە و بیکەرەوە.", "پەیوەندی بە CoreOs بکە و ئەم کۆدە بخوێنەوە."],
      },
    },
  },

  "TB-01": {
    priority: "P1",
    manual: true,
    note: "Tablet will not turn on, or switches itself off. Nothing a page can detect — the page is gone with it. Raised by the shop or by Device Check's questions.",
    text: {
      en: {
        title: "The tablet turns itself off",
        body: "This tablet will not turn on, or switches off on its own while it is being used.",
        steps: ["Charge it for an hour with the shop's charger and try again.", "Hold the power button for ten seconds.", "Call CoreOS with this code — the tablet probably needs replacing."],
      },
      ar: {
        title: "الجهاز يطفئ نفسه",
        body: "هذا الجهاز لا يعمل، أو ينطفئ من تلقاء نفسه أثناء الاستخدام.",
        steps: ["اشحنه ساعة بشاحن المحل وأعد المحاولة.", "اضغط زر التشغيل عشر ثوانٍ.", "اتصل بـ CoreOs بهذا الرمز — غالباً يحتاج الجهاز إلى تبديل."],
      },
      ckb: {
        title: "ئامێرەکە خۆی دەکوژێتەوە",
        body: "ئەم ئامێرە ناکرێتەوە، یان لە کاتی بەکارهێناندا خۆی دەکوژێتەوە.",
        steps: ["کاتژمێرێک بە شارژەری دوکانەکە شارژی بکە و دووبارە هەوڵ بدە.", "دوگمەی کارەبا دە چرکە ڕابگرە.", "بە ئەم کۆدە پەیوەندی بکە — لەوانەیە پێویستی بە گۆڕین بێت."],
      },
    },
  },
  "TB-02": {
    priority: "P2",
    note: "Battery below 15% and not charging, read through navigator.getBattery. Absent on many Android browsers.",
    text: {
      en: {
        title: "The battery is low",
        body: "This tablet is running low on charge and is not plugged in.",
        steps: ["Plug the tablet in now.", "Finish the sale you are on first — nothing is lost if it switches off."],
      },
      ar: {
        title: "البطارية منخفضة",
        body: "شحن هذا الجهاز منخفض وهو غير موصول بالكهرباء.",
        steps: ["وصّل الجهاز بالشاحن الآن.", "أكمل الفاتورة الحالية أولاً — لا شيء يضيع إذا انطفأ."],
      },
      ckb: {
        title: "باتری کەمە",
        body: "شارژی ئەم ئامێرە کەمە و بە کارەبا نەبەستراوە.",
        steps: ["ئێستا ئامێرەکە بخەرە سەر شارژ.", "یەکەم ئەم فرۆشتنە تەواو بکە — ئەگەر کوژایەوە هیچ لەدەست ناچێت."],
      },
    },
  },
  "TB-03": {
    priority: "P2",
    note: "Screen cracked, or part of the touch surface is dead. Device Check's touch grid finds dead areas; a crack is reported by eye.",
    text: {
      en: {
        title: "The screen is damaged",
        body: "The screen is cracked, or part of it does not answer when it is touched.",
        steps: ["Try the counter in a part of the screen that still works.", "Call CoreOS with this code to arrange a replacement."],
      },
      ar: {
        title: "الشاشة متضررة",
        body: "الشاشة مكسورة، أو جزء منها لا يستجيب للمس.",
        steps: ["استخدم جزءاً من الشاشة لا يزال يعمل مؤقتاً.", "اتصل بـ CoreOs بهذا الرمز لترتيب التبديل."],
      },
      ckb: {
        title: "شاشەکە زیانی پێگەیشتووە",
        body: "شاشەکە شکاوە، یان بەشێکی وەڵام نادات کاتێک دەستی لێ دەدرێت.",
        steps: ["بۆ کاتێک ئەو بەشەی شاشە بەکاربهێنە کە کار دەکات.", "بۆ گۆڕینەوە بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "TB-04": {
    priority: "P2",
    note: "A sale took longer than a second and a half to commit, measured on the tablet. Raised once per session.",
    text: {
      en: {
        title: "The tablet is slow",
        body: "This tablet is taking longer than it should to save a sale.",
        steps: ["Close other apps on the tablet.", "Close the till and open it again.", "Call CoreOS with this code if it stays slow."],
      },
      ar: {
        title: "الجهاز بطيء",
        body: "هذا الجهاز يستغرق وقتاً أطول مما ينبغي لحفظ الفاتورة.",
        steps: ["أغلق البرامج الأخرى على الجهاز.", "أغلق الصندوق وافتحه من جديد.", "اتصل بـ CoreOs بهذا الرمز إذا بقي بطيئاً."],
      },
      ckb: {
        title: "ئامێرەکە خاوە",
        body: "ئەم ئامێرە کاتێکی زیاتر لە پێویست دەخایەنێت بۆ پاشەکەوتکردنی فرۆشتن.",
        steps: ["بەرنامەکانی تر دابخە.", "سندوقەکە دابخە و بیکەرەوە.", "ئەگەر خاو مایەوە پەیوەندی بکە."],
      },
    },
  },
  "TB-05": {
    priority: "P2",
    note: "The tablet reports itself offline, or Bluetooth is unavailable where it is needed.",
    text: {
      en: {
        title: "There is no connection",
        body: "The tablet is not on the internet. The till keeps selling without it.",
        steps: ["Carry on selling; nothing is lost.", "Check the wifi when the shop is quiet."],
      },
      ar: {
        title: "لا يوجد اتصال",
        body: "الجهاز غير متصل بالإنترنت. يستمر الصندوق بالبيع بدونه.",
        steps: ["تابع البيع، لا شيء يضيع.", "تحقق من الواي فاي عندما يهدأ المحل."],
      },
      ckb: {
        title: "پەیوەندی نییە",
        body: "ئامێرەکە لەسەر ئینتەرنێت نییە. سندوقەکە بەبێ ئەویش بەردەوام دەفرۆشێت.",
        steps: ["بەردەوام بە لە فرۆشتن، هیچ لەدەست ناچێت.", "کاتێک دوکان هێمن بوو وایفایەکە بپشکنە."],
      },
    },
  },
  "TB-06": {
    priority: "P2",
    manual: true,
    note: "Overheating. No browser can read a temperature — this is always the shop's own answer.",
    text: {
      en: {
        title: "The tablet gets very hot",
        body: "This tablet becomes hot enough to be uncomfortable to hold while it is being used.",
        steps: ["Take it out of any case and off direct sun.", "Let it cool before charging it again.", "Call CoreOS with this code."],
      },
      ar: {
        title: "الجهاز يسخن كثيراً",
        body: "يسخن هذا الجهاز أثناء الاستخدام حتى يصعب الإمساك به.",
        steps: ["أخرجه من الغلاف وأبعده عن الشمس.", "دعه يبرد قبل إعادة شحنه.", "اتصل بـ CoreOs بهذا الرمز."],
      },
      ckb: {
        title: "ئامێرەکە زۆر گەرم دەبێت",
        body: "ئەم ئامێرە لە کاتی بەکارهێناندا ئەوەندە گەرم دەبێت کە بە ئەستەم دەگیرێت.",
        steps: ["لە قاپەکەی دەریبهێنە و لە تیشکی خۆر دووری بخەرەوە.", "پێش شارژکردنەوە لێی گەڕێ سارد ببێتەوە.", "بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "TB-07": {
    priority: "P2",
    manual: true,
    note: "Dropped, or got wet. Invisible to any API; it explains faults that otherwise look unrelated, so it is worth asking.",
    text: {
      en: {
        title: "The tablet was dropped or got wet",
        body: "Something happened to this tablet that may be behind the other problems.",
        steps: ["Stop charging it until it is completely dry.", "Save a backup from CoreCashier now.", "Call CoreOS with this code."],
      },
      ar: {
        title: "سقط الجهاز أو ابتلّ",
        body: "حدث شيء لهذا الجهاز قد يكون سبب بقية المشاكل.",
        steps: ["لا تشحنه حتى يجف تماماً.", "احفظ نسخة احتياطية من CoreCashier الآن.", "اتصل بـ CoreOs بهذا الرمز."],
      },
      ckb: {
        title: "ئامێرەکە کەوتووە یان تەڕ بووە",
        body: "شتێک بەسەر ئەم ئامێرەدا هاتووە کە لەوانەیە هۆکاری کێشەکانی تر بێت.",
        steps: ["هەتا بە تەواوی وشک نەبێتەوە شارژی مەکە.", "ئێستا لە CoreCashier پاڵپشتێک پاشەکەوت بکە.", "بە ئەم کۆدە پەیوەندی بکە."],
      },
    },
  },
  "TB-08": {
    priority: "P1",
    manual: true,
    note: "Lost or stolen. Raised by the shop. The till on it should be stopped from the office and its licence not renewed.",
    text: {
      en: {
        title: "The tablet is lost or stolen",
        body: "This tablet is no longer with the shop.",
        steps: ["Call CoreOS with this code straight away so the till on it can be stopped.", "Your records are on that tablet only — tell CoreOS when the last backup was."],
      },
      ar: {
        title: "الجهاز مفقود أو مسروق",
        body: "لم يعد هذا الجهاز لدى المحل.",
        steps: ["اتصل بـ CoreOs بهذا الرمز فوراً لإيقاف الصندوق عليه.", "سجلاتك على ذلك الجهاز وحده — أخبر CoreOs بموعد آخر نسخة احتياطية."],
      },
      ckb: {
        title: "ئامێرەکە ون بووە یان دزراوە",
        body: "ئەم ئامێرە چیتر لای دوکانەکە نییە.",
        steps: ["یەکسەر بە ئەم کۆدە پەیوەندی بکە تا سندوقەکەی لەسەر ڕابگیرێت.", "تۆمارەکانت تەنها لەسەر ئەو ئامێرەن — بە CoreOs بڵێ دوایین پاڵپشت کەی بوو."],
      },
    },
  },
  "TB-09": {
    priority: "P2",
    note: "Low device storage — quota nearly used, or a quota-exceeded write. Details say 'low storage'.",
    text: {
      en: {
        title: "The tablet is nearly full",
        body: "There is very little room left on this tablet, and the till may soon stop saving.",
        steps: ["Save a backup from Settings now.", "Delete photos or other apps' files.", "Call CoreOS and read out this code."],
      },
      ar: {
        title: "الجهاز ممتلئ تقريباً",
        body: "لم تبقَ مساحة تُذكر في هذا الجهاز، وقد يتوقف الصندوق عن الحفظ قريباً.",
        steps: ["احفظ نسخة احتياطية من «الإعدادات» الآن.", "احذف الصور أو ملفات البرامج الأخرى.", "اتصل بـ CoreOs واقرأ هذا الرمز."],
      },
      ckb: {
        title: "ئامێرەکە خەریکە پڕ دەبێت",
        body: "شوێنی بەتاڵی کەم ماوەتەوە، و لەوانەیە بەم زووانە سندوقەکە وازبهێنێت لە پاشەکەوتکردن.",
        steps: ["ئێستا لە «ڕێکخستن» پاڵپشتێک پاشەکەوت بکە.", "وێنە یان فایلی بەرنامەکانی تر بسڕەوە.", "پەیوەندی بە CoreOs بکە و ئەم کۆدە بخوێنەوە."],
      },
    },
  },
};

export const ALL_CODES = Object.keys(ISSUES) as IssueCode[];

export function issueText(code: IssueCode, lang: Lang): Words {
  const issue = ISSUES[code];
  return issue.text[lang] ?? issue.text.en;
}

/** P1 red, P2 orange, P3 grey — the same three everywhere they appear. */
export const PRIORITY_COLOUR: Record<Priority, { border: string; bg: string; text: string }> = {
  P1: { border: "#5d3346", bg: "#180f16", text: "#f0879d" },
  P2: { border: "#4a3a1a", bg: "#1a1208", text: "#f0c078" },
  P3: { border: "#232b40", bg: "#0b1120", text: "#98a0bb" },
};
