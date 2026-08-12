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
    ckb: "شەقامی زانکۆ، نزیک قوللەی کاتژمێر\\nهەولێر",
    en: "University Street, near the clock tower\nErbil",
  },
  bookCta: { ar: "احجز دورك على واتساب", ckb: "لە واتساپ حجز بکە", en: "Book on WhatsApp" },
  walkIn: { ar: "أو تعال مباشرة — الدور عادةً أقل من عشرين دقيقة.", ckb: "یان ڕاستەوخۆ وەرە — چاوەڕوانییەکە زۆرجار لە بیست خولەک کەمترە.", en: "Or just walk in — the wait is usually under twenty minutes." },
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
  address: { ar: "شارع 60 المتري، بناية النور، الطابق الأول\nأربيل", ckb: "شەقامی 60 مەتری، باڵەخانەی نوور، نهۆمی یەکەم\\nهەولێر", en: "60m Street, Al-Noor building, first floor\nErbil" },
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
};
