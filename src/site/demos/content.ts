/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Copy for the three demo sites.
 *
 * These are fictional businesses, built to show the range of work rather than
 * to be real clients: a barbershop at small scope, a nail studio at medium, a
 * restaurant at large. The section count and the depth of content are the
 * point — a visitor should be able to see the difference in scale by
 * scrolling, without anyone explaining it.
 *
 * Kept out of strings.ts so that file stays a reviewable list of site copy.
 * Arabic, Sorani Kurdish and English, same as everywhere else — and these
 * three are set in Erbil, where Kurdish is the language a walk-in reads first.
 */

import type { Copy } from "../strings";

export interface PricedItem {
  name: Copy;
  detail?: Copy;
  price: Copy;
}

export interface Review {
  quote: Copy;
  author: Copy;
}

/**
 * A photograph on a demo page.
 *
 * Every slot below is optional. A demo with no photos renders gradient
 * placeholders and looks exactly as it did before, so photographs can be added
 * one at a time rather than all at once — see public/demos/README.md.
 *
 * Alt text is required and carries all three languages, because on these pages
 * the photographs are the content. "A photo of the shop" helps nobody; say
 * what is actually in the frame.
 */
export interface Photo {
  /** Path under public/, e.g. "/demos/barber/shopfront.jpg". */
  src: string;
  alt: Copy;
}

/* ========================================================== barbershop === */

export const BARBER = {
  name: { ar: "حلاقة الأصيل", ckb: "سەرتاشخانەی ئەسیل", en: "Aseel Barbershop" },
  tagline: {
    ar: "حلاقة نظيفة، بلا انتظار، في قلب المدينة.",
    ckb: "قژبڕینێکی پاک، بێ چاوەڕوانی، لە ناوەڕاستی شاردا.",
    en: "A clean cut, no waiting, in the middle of town.",
  },
  intro: {
    ar: "محل حلاقة صغير يديره ثلاثة حلاقين. نأخذ بالحجز وبالدور، ونفتح ستة أيام في الأسبوع.",
    ckb: "دوکانێکی بچووکە کە سێ سەرتاش بەڕێوەی دەبەن. حجز و هاتنی ڕاستەوخۆ وەردەگرین، و شەش ڕۆژ لە هەفتەدا کراوەین.",
    en: "A small shop run by three barbers. We take bookings and walk-ins, and we're open six days a week.",
  },
  servicesTitle: { ar: "الخدمات والأسعار", ckb: "خزمەتگوزاری و نرخ", en: "Services and prices" },
  services: [
    { name: { ar: "قص شعر", ckb: "قژبڕین", en: "Haircut" }, price: { ar: "10,000 د.ع", ckb: "10,000 دینار", en: "10,000 IQD" } },
    { name: { ar: "قص وتهذيب لحية", ckb: "قژبڕین و ڕێکخستنی ڕیش", en: "Cut and beard trim" }, price: { ar: "15,000 د.ع", ckb: "15,000 دینار", en: "15,000 IQD" } },
    { name: { ar: "حلاقة بالموس", ckb: "تاشین بە گوێزان", en: "Straight-razor shave" }, price: { ar: "8,000 د.ع", ckb: "8,000 دینار", en: "8,000 IQD" } },
    { name: { ar: "قص للأطفال", ckb: "قژبڕینی منداڵان", en: "Kids' cut" }, price: { ar: "7,000 د.ع", ckb: "7,000 دینار", en: "7,000 IQD" } },
    { name: { ar: "غسل وتصفيف", ckb: "شوشتن و ڕێکخستن", en: "Wash and style" }, price: { ar: "5,000 د.ع", ckb: "5,000 دینار", en: "5,000 IQD" } },
  ] as PricedItem[],
  hoursTitle: { ar: "أوقات العمل", ckb: "کاتی کارکردن", en: "Opening hours" },
  hours: [
    { day: { ar: "السبت – الخميس", ckb: "شەممە – پێنجشەممە", en: "Saturday – Thursday" }, time: { ar: "9:00 ص – 9:00 م", ckb: "9:00 – 21:00", en: "9:00 – 21:00" } },
    { day: { ar: "الجمعة", ckb: "هەینی", en: "Friday" }, time: { ar: "مغلق", ckb: "داخراو", en: "Closed" } },
  ],
  whereTitle: { ar: "أين نحن", ckb: "لە کوێین", en: "Where we are" },
  address: {
    ar: "شارع الجامعة، قرب دوار الساعة\nأربيل",
    ckb: "شەقامی زانکۆ، نزیک قوللەی کاتژمێر\nهەولێر",
    en: "University Street, near the clock tower\nErbil",
  },
  bookCta: { ar: "احجز دورك على واتساب", ckb: "لە واتساپ حجز بکە", en: "Book on WhatsApp" },
  walkIn: { ar: "أو تعال مباشرة — الدور عادةً أقل من عشرين دقيقة.", ckb: "یان ڕاستەوخۆ وەرە — چاوەڕوانییەکە زۆرجار لە بیست خولەک کەمترە.", en: "Or just walk in — the wait is usually under twenty minutes." },
  /* Photographs. Empty renders the gradient placeholder — see
     public/demos/README.md for what to drop in and where. */
  heroPhoto: undefined as Photo | undefined,
};

/* ========================================================= nail studio === */

export const NAILS = {
  name: { ar: "استوديو لؤلؤة", ckb: "ستودیۆی نینۆکی لولوە", en: "Lulua Nail Studio" },
  kicker: { ar: "بموعد مسبق", ckb: "بە کاتی پێشوەخت", en: "By appointment" },
  tagline: {
    ar: "أظافر تدوم، في مكان هادئ تحبين الجلوس فيه.",
    ckb: "نینۆکێک کە دەمێنێتەوە، لە ژوورێکدا کە بەڕاستی حەز دەکەیت تێیدا دابنیشیت.",
    en: "Nails that last, in a room you'll actually enjoy sitting in.",
  },
  intro: {
    ar: "استوديو صغير بموعد مسبق. جلسة واحدة في كل مرة، أدوات معقّمة لكل زبونة، وبلا استعجال.",
    ckb: "ستودیۆیەکی بچووکە بە کاتی پێشوەخت. یەک کڕیار لە هەر کاتێکدا، ئامرازی دژەمیکرۆب بۆ هەر دانیشتنێک، و کەس پەلەت لێ ناکات.",
    en: "A small by-appointment studio. One client at a time, sterilised tools for every session, and nobody rushing you out.",
  },
  servicesTitle: { ar: "قائمة الخدمات", ckb: "لیستی خزمەتگوزاری", en: "Service menu" },
  services: [
    { name: { ar: "مانيكير كلاسيكي", ckb: "مانیکیری کلاسیک", en: "Classic manicure" }, detail: { ar: "45 دقيقة", ckb: "45 خولەک", en: "45 min" }, price: { ar: "15,000 د.ع", ckb: "15,000 دینار", en: "15,000 IQD" } },
    { name: { ar: "بديكير سبا", ckb: "پێدیکێری سپا", en: "Spa pedicure" }, detail: { ar: "60 دقيقة", ckb: "60 خولەک", en: "60 min" }, price: { ar: "20,000 د.ع", ckb: "20,000 دینار", en: "20,000 IQD" } },
    { name: { ar: "تركيب جل", ckb: "دانانی جێل", en: "Gel application" }, detail: { ar: "75 دقيقة", ckb: "75 خولەک", en: "75 min" }, price: { ar: "30,000 د.ع", ckb: "30,000 دینار", en: "30,000 IQD" } },
    { name: { ar: "أظافر أكريليك", ckb: "درێژکردنەوەی ئەکرلیک", en: "Acrylic extensions" }, detail: { ar: "90 دقيقة", ckb: "90 خولەک", en: "90 min" }, price: { ar: "40,000 د.ع", ckb: "40,000 دینار", en: "40,000 IQD" } },
    { name: { ar: "رسم وتصميم", ckb: "نەخشی نینۆک", en: "Nail art" }, detail: { ar: "لكل ظفر", ckb: "بۆ هەر نینۆکێک", en: "per nail" }, price: { ar: "2,500 د.ع", ckb: "2,500 دینار", en: "2,500 IQD" } },
    { name: { ar: "إزالة وترميم", ckb: "لابردن و چاککردنەوە", en: "Removal and repair" }, detail: { ar: "30 دقيقة", ckb: "30 خولەک", en: "30 min" }, price: { ar: "8,000 د.ع", ckb: "8,000 دینار", en: "8,000 IQD" } },
  ] as PricedItem[],
  galleryTitle: { ar: "من أعمالنا", ckb: "کارە نوێیەکان", en: "Recent work" },
  galleryNote: { ar: "أحدث الجلسات في الاستوديو.", ckb: "دوایین دانیشتنەکانی ستودیۆ.", en: "The most recent sessions in the studio." },
  reviewsTitle: { ar: "آراء الزبونات", ckb: "کڕیارەکان چی دەڵێن", en: "What clients say" },
  reviews: [
    {
      quote: { ar: "أفضل جل عملته في أربيل. بقي ثلاثة أسابيع بلا أي كسر.", ckb: "باشترین جێل کە لە هەولێر کردوومە. سێ هەفتە و تەنانەت یەک شکانێکیش نەبوو.", en: "Best gel I've had in Erbil. Three weeks and not a single chip." },
      author: { ar: "شنە م.", ckb: "شنە م.", en: "Shene M." },
    },
    {
      quote: { ar: "المكان نظيف جدًا والأدوات تُعقَّم أمامك. هذا وحده يستحق.", ckb: "زۆر پاکە، و ئامرازەکان لەبەردەمتدا دژەمیکرۆب دەکەن. تەنها ئەوەش بەنرخە.", en: "Spotless, and they sterilise the tools in front of you. That alone is worth it." },
      author: { ar: "ريم ع.", ckb: "ڕیم ع.", en: "Reem A." },
    },
    {
      quote: { ar: "أخذت وقتها معي ولم تستعجل أبدًا. سأعود بالتأكيد.", ckb: "کاتی خۆی برد و هەرگیز پەلەی لێ نەکردم. بێگومان دەگەڕێمەوە.", en: "She took her time and never rushed me. I'll definitely be back." },
      author: { ar: "دنيا ك.", ckb: "دنیا ک.", en: "Dunya K." },
    },
  ] as Review[],
  bookTitle: { ar: "احجزي موعدك", ckb: "کاتەکەت حجز بکە", en: "Book your appointment" },
  bookBody: {
    ar: "المواعيد تُحجز مسبقًا فقط. راسلينا على واتساب وسنؤكد لك خلال ساعة.",
    ckb: "تەنها بە کاتی پێشوەخت. لە واتساپ نامەمان بۆ بنێرە و لە ماوەی کاتژمێرێکدا دڵنیات دەکەینەوە.",
    en: "Appointments only. Message us on WhatsApp and we'll confirm within the hour.",
  },
  bookCta: { ar: "احجزي على واتساب", ckb: "لە واتساپ حجز بکە", en: "Book on WhatsApp" },
  hoursTitle: { ar: "أوقات العمل", ckb: "کاتی کارکردن", en: "Opening hours" },
  hours: [
    { day: { ar: "السبت – الأربعاء", ckb: "شەممە – چوارشەممە", en: "Saturday – Wednesday" }, time: { ar: "10:00 ص – 8:00 م", ckb: "10:00 – 20:00", en: "10:00 – 20:00" } },
    { day: { ar: "الخميس", ckb: "پێنجشەممە", en: "Thursday" }, time: { ar: "10:00 ص – 6:00 م", ckb: "10:00 – 18:00", en: "10:00 – 18:00" } },
    { day: { ar: "الجمعة", ckb: "هەینی", en: "Friday" }, time: { ar: "مغلق", ckb: "داخراو", en: "Closed" } },
  ],
  address: { ar: "شارع 60 المتري، بناية النور، الطابق الأول\nأربيل", ckb: "شەقامی 60 مەتری، باڵەخانەی نوور، نهۆمی یەکەم\nهەولێر", en: "60m Street, Al-Noor building, first floor\nErbil" },
  /* Photographs. The gallery is this business's strongest sales tool, so it
     is the first place worth spending real pictures on. Any number from zero
     to six; the rest of the grid stays gradient. */
  heroPhoto: undefined as Photo | undefined,
  gallery: [] as Photo[],
};

/* ========================================================== restaurant === */

export const REST = {
  name: { ar: "مطعم زێرین", ckb: "زێرین", en: "Zerin" },
  tagline: {
    ar: "مطبخ كردي، على نار هادئة، منذ 1998.",
    ckb: "چێشتی کوردی، بە هێواشی، لە 1998ـەوە.",
    en: "Kurdish cooking, slow, since 1998.",
  },
  heroCta: { ar: "احجز طاولة", ckb: "مێزێک حجز بکە", en: "Reserve a table" },
  heroAlt: { ar: "شاهد القائمة", ckb: "لیستی خواردن ببینە", en: "See the menu" },
  storyTitle: { ar: "قصة المكان", ckb: "چیرۆکی شوێنەکە", en: "The story" },
  story: [
    {
      ar: "بدأ زێرین بستّ طاولات وفرن طيني واحد. فتحته جدّتنا عام 1998 لأن حيّها لم يكن فيه مكان يقدّم الطعام الذي كانت تطبخه في بيتها.",
      ckb: "زێرین بە شەش مێز و یەک تەنووری قوڕ دەستی پێکرد. داپیرەمان لە 1998دا کردییەوە چونکە لە گەڕەکەکەیدا هیچ شوێنێک نەبوو ئەو خواردنە پێشکەش بکات کە لە ماڵەوە لێی دەنا.",
      en: "Zerin started with six tables and one clay oven. Our grandmother opened it in 1998 because her neighbourhood had nowhere serving the food she cooked at home.",
    },
    {
      ar: "ما زلنا نستخدم وصفاتها. تغيّر المطبخ وكبر المكان، لكن الدولمة تُحضَّر في الصباح كما كانت، واللحم يُطهى ببطء كما كان.",
      ckb: "هێشتا ڕێسا خواردنەکانی ئەو بەکاردەهێنین. چێشتخانەکە گەورەتر بووە و ژوورەکە فراوانتر، بەڵام دۆڵمە هێشتا بەیانییان ئامادە دەکرێت و گۆشتەکەش هێشتا بە هێواشی دەکوڵێت.",
      en: "We still use her recipes. The kitchen has grown and the room is bigger, but the dolma is still prepared in the morning and the meat still cooks slowly.",
    },
  ],
  menuTitle: { ar: "القائمة", ckb: "لیستی خواردن", en: "The menu" },
  menuNote: { ar: "تتغيّر أطباق اليوم حسب الموسم. اسأل النادل.", ckb: "خواردنی تایبەتی ڕۆژانە بەپێی وەرزەکە دەگۆڕێت — لە خزمەتکارەکە بپرسە.", en: "The daily specials change with the season — ask your server." },
  menu: [
    {
      category: { ar: "المقبلات", ckb: "پێشخواردن", en: "To start" },
      items: [
        { name: { ar: "متبل باذنجان", ckb: "بادەمجانی دووکەڵدراو", en: "Smoked aubergine" }, detail: { ar: "مع زيت زيتون ورمان", ckb: "زەیتی زەیتوون، هەنار", en: "olive oil, pomegranate" }, price: { ar: "6,000", ckb: "6,000", en: "6,000" } },
        { name: { ar: "شوربة عدس", ckb: "شۆربەی نیسک", en: "Lentil soup" }, detail: { ar: "مع ليمون وخبز محمّص", ckb: "لیمۆ، نانی برژاو", en: "lemon, toasted bread" }, price: { ar: "5,000", ckb: "5,000", en: "5,000" } },
        { name: { ar: "سلطة زێرین", ckb: "زەڵاتەی زێرین", en: "Zerin salad" }, detail: { ar: "جوز، نعناع، دبس رمان", ckb: "گوێز، پونگ، دۆشاوی هەنار", en: "walnut, mint, pomegranate molasses" }, price: { ar: "7,000", ckb: "7,000", en: "7,000" } },
      ],
    },
    {
      category: { ar: "الأطباق الرئيسية", ckb: "خواردنی سەرەکی", en: "Mains" },
      items: [
        { name: { ar: "دولمة", ckb: "دۆڵمە", en: "Dolma" }, detail: { ar: "تُحضَّر كل صباح — تنفد عادةً بعد الثامنة", ckb: "هەموو بەیانییەک دروست دەکرێت، زۆرجار دوای هەشت تەواو دەبێت", en: "made each morning, usually gone after eight" }, price: { ar: "14,000", ckb: "14,000", en: "14,000" } },
        { name: { ar: "قوزي لحم", ckb: "گۆشتی بەرخی هێواش لێنراو", en: "Slow-cooked lamb" }, detail: { ar: "أربع ساعات على نار هادئة، مع رز بالزعفران", ckb: "چوار کاتژمێر، برنجی زەعفەران", en: "four hours, saffron rice" }, price: { ar: "22,000", ckb: "22,000", en: "22,000" } },
        { name: { ar: "كباب زێرین", ckb: "کەبابی زێرین", en: "Zerin kebab" }, detail: { ar: "لحم مفروم يدويًا، على الفحم", ckb: "بە دەست وردکراو، لەسەر خەڵووز", en: "hand-minced, over charcoal" }, price: { ar: "16,000", ckb: "16,000", en: "16,000" } },
        { name: { ar: "برياني دجاج", ckb: "بریانیی مریشک", en: "Chicken biryani" }, detail: { ar: "مع لوز وزبيب", ckb: "بادەم، مێوژ", en: "almond, raisin" }, price: { ar: "15,000", ckb: "15,000", en: "15,000" } },
        { name: { ar: "سمك مسكوف", ckb: "ماسیی مەسگووف", en: "Masgouf fish" }, detail: { ar: "يحتاج 40 دقيقة", ckb: "40 خولەکی دەوێت", en: "takes 40 minutes" }, price: { ar: "28,000", ckb: "28,000", en: "28,000" } },
      ],
    },
    {
      category: { ar: "الحلويات", ckb: "شیرینی", en: "Sweets" },
      items: [
        { name: { ar: "كنافة", ckb: "کونافە", en: "Kunafa" }, detail: { ar: "تُخبز عند الطلب", ckb: "بە داواکاری دەبرژێنرێت", en: "baked to order" }, price: { ar: "7,000", ckb: "7,000", en: "7,000" } },
        { name: { ar: "رز بالحليب", ckb: "شلەی برنج", en: "Rice pudding" }, detail: { ar: "مع فستق", ckb: "فستق", en: "pistachio" }, price: { ar: "5,000", ckb: "5,000", en: "5,000" } },
      ],
    },
    {
      category: { ar: "المشروبات", ckb: "خواردنەوە", en: "Drinks" },
      items: [
        { name: { ar: "شاي أسود", ckb: "چایی ڕەش", en: "Black tea" }, price: { ar: "2,000", ckb: "2,000", en: "2,000" } },
        { name: { ar: "قهوة عربية", ckb: "قاوەی عەرەبی", en: "Arabic coffee" }, price: { ar: "3,000", ckb: "3,000", en: "3,000" } },
        { name: { ar: "عصير رمان طازج", ckb: "شەربەتی هەناری تازە", en: "Fresh pomegranate juice" }, price: { ar: "6,000", ckb: "6,000", en: "6,000" } },
      ],
    },
  ],
  currencyNote: { ar: "جميع الأسعار بالدينار العراقي، شاملة الخدمة.", ckb: "هەموو نرخەکان بە دیناری عێراقین، خزمەتگوزاری تێیدایە.", en: "All prices in Iraqi dinar, service included." },
  galleryTitle: { ar: "من المطعم", ckb: "لە ناو زێریندا", en: "Inside Zerin" },
  reserveTitle: { ar: "الحجوزات", ckb: "حجزکردن", en: "Reservations" },
  reserveBody: {
    ar: "نأخذ الحجوزات للمجموعات من أربعة أشخاص فأكثر. للمجموعات الكبيرة أو المناسبات، راسلنا قبل يومين على الأقل.",
    ckb: "بۆ گرووپی چوار کەس یان زیاتر حجز وەردەگرین. بۆ گرووپی گەورە یان بۆنەی تایبەت، لانیکەم دوو ڕۆژ پێشتر نامەمان بۆ بنێرە.",
    en: "We take reservations for parties of four or more. For large groups or private events, message us at least two days ahead.",
  },
  reserveCta: { ar: "احجز على واتساب", ckb: "لە واتساپ حجز بکە", en: "Reserve on WhatsApp" },
  deliveryTitle: { ar: "التوصيل", ckb: "گەیاندن", en: "Delivery" },
  deliveryBody: {
    ar: "نوصّل داخل المدينة عبر تطبيقات التوصيل، أو اطلب منّا مباشرة.",
    ckb: "بەناو شاردا دەگەیەنین لە ڕێگەی ئەپە باوەکانەوە، یان ڕاستەوخۆ لە ئێمە داوا بکە.",
    en: "We deliver across the city through the usual apps, or order from us directly.",
  },
  eventsTitle: { ar: "المناسبات والولائم", ckb: "بۆنە تایبەتەکان", en: "Private events" },
  eventsBody: {
    ar: "نستضيف المناسبات في القاعة العلوية للفرع الرئيسي — تتّسع لأربعين شخصًا، بقائمة ثابتة تتفق عليها معنا مسبقًا.",
    ckb: "بۆنەکان لە ژووری سەرەوەی لقی سەرەکیدا بەڕێوە دەبەین — چل کەس هەڵدەگرێت، بە لیستێکی دیاریکراو کە پێشوەخت لەگەڵت ڕێک دەکەوین.",
    en: "We host events in the upstairs room at the main branch — it seats forty, with a set menu agreed with you in advance.",
  },
  events: [
    {
      name: { ar: "غداء عائلي", ckb: "نانی نیوەڕۆی خێزانی", en: "Family lunch" },
      detail: { ar: "حتى 15 شخصًا، ثلاثة أطباق", ckb: "تا 15 میوان، سێ خواردن", en: "up to 15 guests, three courses" },
      price: { ar: "من 20,000 للشخص", ckb: "لە 20,000ـەوە بۆ هەر کەسێک", en: "from 20,000 per head" },
    },
    {
      name: { ar: "مناسبة خاصة", ckb: "بۆنەی تایبەت", en: "Private function" },
      detail: { ar: "حتى 40 شخصًا، القاعة كاملة", ckb: "تا 40 میوان، هەموو ژوورەکە", en: "up to 40 guests, whole room" },
      price: { ar: "من 28,000 للشخص", ckb: "لە 28,000ـەوە بۆ هەر کەسێک", en: "from 28,000 per head" },
    },
    {
      name: { ar: "ولائم خارجية", ckb: "خواردن گەیاندن بۆ دەرەوە", en: "Off-site catering" },
      detail: { ar: "داخل المدينة، بحجز مسبق", ckb: "لە ناو شاردا، بە حجزی پێشوەخت", en: "in the city, booked ahead" },
      price: { ar: "حسب الطلب", ckb: "بە داواکاری", en: "on request" },
    },
  ] as PricedItem[],
  branchesTitle: { ar: "الفروع", ckb: "لقەکان", en: "Branches" },
  branches: [
    {
      name: { ar: "الفرع الرئيسي — عنكاوا", ckb: "لقی سەرەکی — عەنکاوە", en: "Main branch — Ainkawa" },
      address: { ar: "شارع الكنيسة، مقابل الحديقة", ckb: "شەقامی کڵێسا، بەرامبەر پارکەکە", en: "Church Street, opposite the park" },
      hours: { ar: "يوميًا 12:00 ظهرًا – 12:00 منتصف الليل", ckb: "ڕۆژانە 12:00 – 00:00", en: "Daily 12:00 – 00:00" },
    },
    {
      name: { ar: "فرع المدينة", ckb: "لقی شار", en: "City branch" },
      address: { ar: "شارع 100 المتري، قرب المجمع التجاري", ckb: "شەقامی 100 مەتری، نزیک مۆڵەکە", en: "100m Street, near the mall" },
      hours: { ar: "يوميًا 1:00 ظهرًا – 11:00 مساءً", ckb: "ڕۆژانە 13:00 – 23:00", en: "Daily 13:00 – 23:00" },
    },
  ],
  /* Photographs. Food carries a restaurant page further than anything else on
     it, so the gallery is worth doing properly. Up to six. */
  storyPhoto: undefined as Photo | undefined,
  eventsPhoto: undefined as Photo | undefined,
  gallery: [] as Photo[],
};

/* ======================================================= bead jewellery === */

/**
 * Lana's Beadery — the one demo here built for a real business, a handmade
 * bead shop that sells through Instagram. The copy follows her profile: made
 * by hand in Iraq, ordered by DM, delivered anywhere in the country. Product
 * names and prices are placeholders until she sends her own.
 */

export interface BeadProduct {
  name: Copy;
  detail: Copy;
  price: Copy;
  /** Bead colours around the strand, repeated in order. */
  beads: string[];
  /** The focal bead at the bottom of the strand. */
  charm: "strawberry" | "lemon" | "heart" | "name" | "flower" | "none";
}

export const BEADERY = {
  name: { ar: "Lana's Beadery", ckb: "Lana's Beadery", en: "Lana's Beadery" },
  kicker: { ar: "إكسسوارات مصنوعة يدويًا", ckb: "خشڵی دەستکرد", en: "Handmade accessories" },
  tagline: {
    ar: "أساور وقلائد من الخرز، تُصنع باليد حبّةً حبّة.",
    ckb: "بازن و ملوانکەی مووروو، بە دەست دروست دەکرێن، یەک یەک.",
    en: "Bead bracelets and necklaces, strung by hand one bead at a time.",
  },
  intro: {
    ar: "كل قطعة تُصنع بعد طلبك، بالألوان التي تختارها. صُنع في العراق، والتوصيل لكل المحافظات.",
    ckb: "هەر پارچەیەک دوای داواکارییەکەت دروست دەکرێت، بەو ڕەنگانەی خۆت هەڵیاندەبژێریت. دروستکراوی عێراق، گەیاندن بۆ هەموو پارێزگاکان.",
    en: "Every piece is made after you order, in the colours you choose. Made in Iraq, delivered to every province.",
  },
  orderCta: { ar: "اطلب عبر إنستغرام", ckb: "لە ئینستاگرام داوا بکە", en: "Order on Instagram" },
  browseCta: { ar: "شاهد القطع", ckb: "پارچەکان ببینە", en: "See the pieces" },
  badges: [
    { ar: "صنع يدوي", ckb: "کاری دەستی", en: "Handmade" },
    { ar: "صُنع في العراق", ckb: "دروستکراوی عێراق", en: "Made in Iraq" },
    { ar: "توصيل لكل العراق", ckb: "گەیاندن بۆ هەموو عێراق", en: "Delivery to all Iraq" },
  ] as Copy[],

  shopTitle: { ar: "القطع المفضّلة", ckb: "پارچە دڵخوازەکان", en: "Favourite pieces" },
  shopNote: {
    ar: "كل قطعة يمكن تغيير ألوانها ومقاسها عند الطلب.",
    ckb: "ڕەنگ و قەبارەی هەر پارچەیەک دەتوانرێت لە کاتی داواکردندا بگۆڕدرێت.",
    en: "Colours and size can be changed on any piece when you order.",
  },
  products: [
    {
      name: { ar: "سوار اللؤلؤ والفراولة", ckb: "بازنی مرواری و فەراولە", en: "Pearl & strawberry" },
      detail: { ar: "لؤلؤ أبيض مع حبة فراولة", ckb: "مرواریی سپی لەگەڵ فەراولەیەک", en: "White pearls, one strawberry bead" },
      price: { ar: "6,000 د.ع", ckb: "6,000 دینار", en: "6,000 IQD" },
      beads: ["#fbf8f1", "#f3ede0"],
      charm: "strawberry",
    },
    {
      name: { ar: "سوار الحمضيات", ckb: "بازنی لیمۆ", en: "Citrus bracelet" },
      detail: { ar: "خرز أصفر وبرتقالي مع شريحة ليمون", ckb: "موورووی زەرد و پرتەقاڵی لەگەڵ پارچە لیمۆیەک", en: "Yellow and orange seed beads, lemon slice" },
      price: { ar: "5,000 د.ع", ckb: "5,000 دینار", en: "5,000 IQD" },
      beads: ["#f7d21e", "#f7d21e", "#f58a1f", "#f58a1f", "#ffffff"],
      charm: "lemon",
    },
    {
      name: { ar: "سوار القلب الوردي", ckb: "بازنی دڵی پەمەیی", en: "Pink heart" },
      detail: { ar: "خرز وردي وأبيض مع قلب", ckb: "موورووی پەمەیی و سپی لەگەڵ دڵێک", en: "Pink and white beads, heart charm" },
      price: { ar: "5,000 د.ع", ckb: "5,000 دینار", en: "5,000 IQD" },
      beads: ["#f5b3c0", "#ffffff", "#f5b3c0", "#fbd9e0"],
      charm: "heart",
    },
    {
      name: { ar: "سوار الاسم", ckb: "بازنی ناو", en: "Name bracelet" },
      detail: { ar: "بالاسم أو الحروف التي تريدها", ckb: "بە ناو یان ئەو پیتانەی دەتەوێت", en: "Any name or initials you like" },
      price: { ar: "7,000 د.ع", ckb: "7,000 دینار", en: "7,000 IQD" },
      beads: ["#b9d38f", "#ffffff", "#f5b3c0", "#ffffff"],
      charm: "name",
    },
    {
      name: { ar: "سوار الزهرة", ckb: "بازنی گوڵ", en: "Daisy bracelet" },
      detail: { ar: "خرز أخضر فاتح مع زهرة", ckb: "موورووی سەوزی کاڵ لەگەڵ گوڵێک", en: "Sage beads, daisy charm" },
      price: { ar: "5,000 د.ع", ckb: "5,000 دینار", en: "5,000 IQD" },
      beads: ["#a9c77a", "#cfe1b0", "#a9c77a", "#ffffff"],
      charm: "flower",
    },
    {
      name: { ar: "سوار قوس قزح", ckb: "بازنی پەلکەزێڕینە", en: "Rainbow bracelet" },
      detail: { ar: "كل الألوان في سوار واحد", ckb: "هەموو ڕەنگەکان لە یەک بازندا", en: "Every colour on one strand" },
      price: { ar: "5,000 د.ع", ckb: "5,000 دینار", en: "5,000 IQD" },
      beads: ["#f28b8b", "#f7b267", "#f7d21e", "#a9c77a", "#7fb8e0", "#b79ce0"],
      charm: "none",
    },
  ] as BeadProduct[],

  customTitle: { ar: "صمّم قطعتك", ckb: "پارچەکەی خۆت دیزاین بکە", en: "Design your own" },
  customBody: {
    ar: "اختر الألوان، أضف اسمك أو حرفًا، واطلب سوارًا مطابقًا لصديقتك. أرسل لنا الفكرة ونحن نصنعها.",
    ckb: "ڕەنگەکان هەڵبژێرە، ناوەکەت یان پیتێک زیاد بکە، و بازنێکی هاوشێوە بۆ هاوڕێکەت داوا بکە. بیرۆکەکەمان بۆ بنێرە و ئێمە دروستی دەکەین.",
    en: "Pick the colours, add your name or an initial, order a matching one for a friend. Send us the idea and we'll make it.",
  },
  customIdeas: [
    { ar: "أساور متطابقة للصديقات", ckb: "بازنی هاوشێوە بۆ هاوڕێیان", en: "Matching friendship sets" },
    { ar: "هدايا أعياد الميلاد", ckb: "دیاریی ڕۆژی لەدایکبوون", en: "Birthday gifts" },
    { ar: "ألوان فريقك أو مدرستك", ckb: "ڕەنگی تیپ یان قوتابخانەکەت", en: "Your team or school colours" },
  ] as Copy[],

  howTitle: { ar: "كيف تطلب", ckb: "چۆن داوا بکەیت", en: "How to order" },
  steps: [
    {
      title: { ar: "راسلنا", ckb: "نامەمان بۆ بنێرە", en: "Send a DM" },
      body: { ar: "أرسل صورة القطعة أو فكرتك على إنستغرام.", ckb: "وێنەی پارچەکە یان بیرۆکەکەت لە ئینستاگرام بنێرە.", en: "Send a photo of the piece, or your idea, on Instagram." },
    },
    {
      title: { ar: "نؤكد التفاصيل", ckb: "وردەکارییەکان دڵنیا دەکەینەوە", en: "We confirm it" },
      body: { ar: "نتفق على الألوان والمقاس والسعر.", ckb: "لەسەر ڕەنگ و قەبارە و نرخ ڕێک دەکەوین.", en: "We agree the colours, the size and the price." },
    },
    {
      title: { ar: "يصلك إلى الباب", ckb: "دەگاتە بەردەم دەرگاکەت", en: "It comes to your door" },
      body: { ar: "التوصيل لكل محافظات العراق، والدفع عند الاستلام.", ckb: "گەیاندن بۆ هەموو پارێزگاکانی عێراق، پارەدان لە کاتی وەرگرتن.", en: "Delivered to every province in Iraq, pay on delivery." },
    },
  ],

  footerLine: {
    ar: "إكسسوارات مصنوعة يدويًا · صُنع في العراق",
    ckb: "خشڵی دەستکرد · دروستکراوی عێراق",
    en: "Handmade accessories · Made in Iraq",
  },
  instagram: "https://www.instagram.com/lanas_beadery/",
  handle: "@lanas_beadery",

  /* The assistant is a mock-up: a scripted opening and a fixed reply, so a
     prospect can see where it would sit without anything being wired up. */
  chat: {
    title: { ar: "مساعد لانا", ckb: "یاریدەدەری لانا", en: "Lana's assistant" },
    status: { ar: "نسخة تجريبية", ckb: "وەشانی نموونە", en: "Demo preview" },
    open: { ar: "افتح المساعد", ckb: "یاریدەدەر بکەرەوە", en: "Open the assistant" },
    close: { ar: "أغلق", ckb: "دایبخە", en: "Close" },
    greeting: {
      ar: "أهلًا! أنا مساعد Lana's Beadery. أقدر أساعدك في الأسعار والألوان والتوصيل.",
      ckb: "سڵاو! من یاریدەدەری Lana's Beadery ـم. دەتوانم لە نرخ و ڕەنگ و گەیاندندا یارمەتیت بدەم.",
      en: "Hi! I'm the Lana's Beadery assistant. I can help with prices, colours and delivery.",
    },
    sampleQ: { ar: "هل توصلون إلى البصرة؟", ckb: "بۆ بەسرە دەگەیەنن؟", en: "Do you deliver to Basra?" },
    sampleA: {
      ar: "نعم، نوصل لكل محافظات العراق خلال ٢–٤ أيام، والدفع عند الاستلام.",
      ckb: "بەڵێ، بۆ هەموو پارێزگاکانی عێراق لە ماوەی ٢–٤ ڕۆژدا دەگەیەنین، پارەدان لە کاتی وەرگرتن.",
      en: "Yes — we deliver to every province in Iraq in 2–4 days, and you pay on delivery.",
    },
    suggestions: [
      { ar: "كم سعر سوار الاسم؟", ckb: "بازنی ناو بە چەندە؟", en: "How much is a name bracelet?" },
      { ar: "هل يمكن تغيير الألوان؟", ckb: "دەتوانرێت ڕەنگەکان بگۆڕدرێن؟", en: "Can I change the colours?" },
    ] as Copy[],
    placeholder: { ar: "اكتب رسالتك…", ckb: "نامەکەت بنووسە…", en: "Type a message…" },
    send: { ar: "إرسال", ckb: "ناردن", en: "Send" },
    demoReply: {
      ar: "هذه نسخة تجريبية، والمساعد غير مفعّل بعد. للطلب الآن راسلنا على إنستغرام.",
      ckb: "ئەمە وەشانێکی نموونەیە و یاریدەدەرەکە هێشتا چالاک نەکراوە. بۆ داواکردن ئێستا لە ئینستاگرام نامەمان بۆ بنێرە.",
      en: "This is a demo preview — the assistant isn't switched on yet. To order now, DM us on Instagram.",
    },
  },
};
