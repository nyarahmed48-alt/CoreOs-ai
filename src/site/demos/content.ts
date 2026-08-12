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
  name: { ar: "حلاقة الأصيل", en: "Aseel Barbershop" },
  tagline: {
    ar: "حلاقة نظيفة، بلا انتظار، في قلب المدينة.",
    en: "A clean cut, no waiting, in the middle of town.",
  },
  intro: {
    ar: "محل حلاقة صغير يديره ثلاثة حلاقين. نأخذ بالحجز وبالدور، ونفتح ستة أيام في الأسبوع.",
    en: "A small shop run by three barbers. We take bookings and walk-ins, and we're open six days a week.",
  },
  servicesTitle: { ar: "الخدمات والأسعار", en: "Services and prices" },
  services: [
    { name: { ar: "قص شعر", en: "Haircut" }, price: { ar: "10,000 د.ع", en: "10,000 IQD" } },
    { name: { ar: "قص وتهذيب لحية", en: "Cut and beard trim" }, price: { ar: "15,000 د.ع", en: "15,000 IQD" } },
    { name: { ar: "حلاقة بالموس", en: "Straight-razor shave" }, price: { ar: "8,000 د.ع", en: "8,000 IQD" } },
    { name: { ar: "قص للأطفال", en: "Kids' cut" }, price: { ar: "7,000 د.ع", en: "7,000 IQD" } },
    { name: { ar: "غسل وتصفيف", en: "Wash and style" }, price: { ar: "5,000 د.ع", en: "5,000 IQD" } },
  ] as PricedItem[],
  hoursTitle: { ar: "أوقات العمل", en: "Opening hours" },
  hours: [
    { day: { ar: "السبت – الخميس", en: "Saturday – Thursday" }, time: { ar: "9:00 ص – 9:00 م", en: "9:00 – 21:00" } },
    { day: { ar: "الجمعة", en: "Friday" }, time: { ar: "مغلق", en: "Closed" } },
  ],
  whereTitle: { ar: "أين نحن", en: "Where we are" },
  address: {
    ar: "شارع الجامعة، قرب دوار الساعة\nأربيل",
    en: "University Street, near the clock tower\nErbil",
  },
  bookCta: { ar: "احجز دورك على واتساب", en: "Book on WhatsApp" },
  walkIn: { ar: "أو تعال مباشرة — الدور عادةً أقل من عشرين دقيقة.", en: "Or just walk in — the wait is usually under twenty minutes." },
};

/* ========================================================= nail studio === */

export const NAILS = {
  name: { ar: "استوديو لؤلؤة", en: "Lulua Nail Studio" },
  kicker: { ar: "بموعد مسبق", en: "By appointment" },
  tagline: {
    ar: "أظافر تدوم، في مكان هادئ تحبين الجلوس فيه.",
    en: "Nails that last, in a room you'll actually enjoy sitting in.",
  },
  intro: {
    ar: "استوديو صغير بموعد مسبق. جلسة واحدة في كل مرة، أدوات معقّمة لكل زبونة، وبلا استعجال.",
    en: "A small by-appointment studio. One client at a time, sterilised tools for every session, and nobody rushing you out.",
  },
  servicesTitle: { ar: "قائمة الخدمات", en: "Service menu" },
  services: [
    { name: { ar: "مانيكير كلاسيكي", en: "Classic manicure" }, detail: { ar: "45 دقيقة", en: "45 min" }, price: { ar: "15,000 د.ع", en: "15,000 IQD" } },
    { name: { ar: "بديكير سبا", en: "Spa pedicure" }, detail: { ar: "60 دقيقة", en: "60 min" }, price: { ar: "20,000 د.ع", en: "20,000 IQD" } },
    { name: { ar: "تركيب جل", en: "Gel application" }, detail: { ar: "75 دقيقة", en: "75 min" }, price: { ar: "30,000 د.ع", en: "30,000 IQD" } },
    { name: { ar: "أظافر أكريليك", en: "Acrylic extensions" }, detail: { ar: "90 دقيقة", en: "90 min" }, price: { ar: "40,000 د.ع", en: "40,000 IQD" } },
    { name: { ar: "رسم وتصميم", en: "Nail art" }, detail: { ar: "لكل ظفر", en: "per nail" }, price: { ar: "2,500 د.ع", en: "2,500 IQD" } },
    { name: { ar: "إزالة وترميم", en: "Removal and repair" }, detail: { ar: "30 دقيقة", en: "30 min" }, price: { ar: "8,000 د.ع", en: "8,000 IQD" } },
  ] as PricedItem[],
  galleryTitle: { ar: "من أعمالنا", en: "Recent work" },
  galleryNote: { ar: "أحدث الجلسات في الاستوديو.", en: "The most recent sessions in the studio." },
  reviewsTitle: { ar: "آراء الزبونات", en: "What clients say" },
  reviews: [
    {
      quote: { ar: "أفضل جل عملته في أربيل. بقي ثلاثة أسابيع بلا أي كسر.", en: "Best gel I've had in Erbil. Three weeks and not a single chip." },
      author: { ar: "شنە م.", en: "Shene M." },
    },
    {
      quote: { ar: "المكان نظيف جدًا والأدوات تُعقَّم أمامك. هذا وحده يستحق.", en: "Spotless, and they sterilise the tools in front of you. That alone is worth it." },
      author: { ar: "ريم ع.", en: "Reem A." },
    },
    {
      quote: { ar: "أخذت وقتها معي ولم تستعجل أبدًا. سأعود بالتأكيد.", en: "She took her time and never rushed me. I'll definitely be back." },
      author: { ar: "دنيا ك.", en: "Dunya K." },
    },
  ] as Review[],
  bookTitle: { ar: "احجزي موعدك", en: "Book your appointment" },
  bookBody: {
    ar: "المواعيد تُحجز مسبقًا فقط. راسلينا على واتساب وسنؤكد لك خلال ساعة.",
    en: "Appointments only. Message us on WhatsApp and we'll confirm within the hour.",
  },
  bookCta: { ar: "احجزي على واتساب", en: "Book on WhatsApp" },
  hoursTitle: { ar: "أوقات العمل", en: "Opening hours" },
  hours: [
    { day: { ar: "السبت – الأربعاء", en: "Saturday – Wednesday" }, time: { ar: "10:00 ص – 8:00 م", en: "10:00 – 20:00" } },
    { day: { ar: "الخميس", en: "Thursday" }, time: { ar: "10:00 ص – 6:00 م", en: "10:00 – 18:00" } },
    { day: { ar: "الجمعة", en: "Friday" }, time: { ar: "مغلق", en: "Closed" } },
  ],
  address: { ar: "شارع 60 المتري، بناية النور، الطابق الأول\nأربيل", en: "60m Street, Al-Noor building, first floor\nErbil" },
};

/* ========================================================== restaurant === */

export const REST = {
  name: { ar: "مطعم زێرین", en: "Zerin" },
  tagline: {
    ar: "مطبخ كردي، على نار هادئة، منذ 1998.",
    en: "Kurdish cooking, slow, since 1998.",
  },
  heroCta: { ar: "احجز طاولة", en: "Reserve a table" },
  heroAlt: { ar: "شاهد القائمة", en: "See the menu" },
  storyTitle: { ar: "قصة المكان", en: "The story" },
  story: [
    {
      ar: "بدأ زێرین بستّ طاولات وفرن طيني واحد. فتحته جدّتنا عام 1998 لأن حيّها لم يكن فيه مكان يقدّم الطعام الذي كانت تطبخه في بيتها.",
      en: "Zerin started with six tables and one clay oven. Our grandmother opened it in 1998 because her neighbourhood had nowhere serving the food she cooked at home.",
    },
    {
      ar: "ما زلنا نستخدم وصفاتها. تغيّر المطبخ وكبر المكان، لكن الدولمة تُحضَّر في الصباح كما كانت، واللحم يُطهى ببطء كما كان.",
      en: "We still use her recipes. The kitchen has grown and the room is bigger, but the dolma is still prepared in the morning and the meat still cooks slowly.",
    },
  ],
  menuTitle: { ar: "القائمة", en: "The menu" },
  menuNote: { ar: "تتغيّر أطباق اليوم حسب الموسم. اسأل النادل.", en: "The daily specials change with the season — ask your server." },
  menu: [
    {
      category: { ar: "المقبلات", en: "To start" },
      items: [
        { name: { ar: "متبل باذنجان", en: "Smoked aubergine" }, detail: { ar: "مع زيت زيتون ورمان", en: "olive oil, pomegranate" }, price: { ar: "6,000", en: "6,000" } },
        { name: { ar: "شوربة عدس", en: "Lentil soup" }, detail: { ar: "مع ليمون وخبز محمّص", en: "lemon, toasted bread" }, price: { ar: "5,000", en: "5,000" } },
        { name: { ar: "سلطة زێرین", en: "Zerin salad" }, detail: { ar: "جوز، نعناع، دبس رمان", en: "walnut, mint, pomegranate molasses" }, price: { ar: "7,000", en: "7,000" } },
      ],
    },
    {
      category: { ar: "الأطباق الرئيسية", en: "Mains" },
      items: [
        { name: { ar: "دولمة", en: "Dolma" }, detail: { ar: "تُحضَّر كل صباح — تنفد عادةً بعد الثامنة", en: "made each morning, usually gone after eight" }, price: { ar: "14,000", en: "14,000" } },
        { name: { ar: "قوزي لحم", en: "Slow-cooked lamb" }, detail: { ar: "أربع ساعات على نار هادئة، مع رز بالزعفران", en: "four hours, saffron rice" }, price: { ar: "22,000", en: "22,000" } },
        { name: { ar: "كباب زێرین", en: "Zerin kebab" }, detail: { ar: "لحم مفروم يدويًا، على الفحم", en: "hand-minced, over charcoal" }, price: { ar: "16,000", en: "16,000" } },
        { name: { ar: "برياني دجاج", en: "Chicken biryani" }, detail: { ar: "مع لوز وزبيب", en: "almond, raisin" }, price: { ar: "15,000", en: "15,000" } },
        { name: { ar: "سمك مسكوف", en: "Masgouf fish" }, detail: { ar: "يحتاج 40 دقيقة", en: "takes 40 minutes" }, price: { ar: "28,000", en: "28,000" } },
      ],
    },
    {
      category: { ar: "الحلويات", en: "Sweets" },
      items: [
        { name: { ar: "كنافة", en: "Kunafa" }, detail: { ar: "تُخبز عند الطلب", en: "baked to order" }, price: { ar: "7,000", en: "7,000" } },
        { name: { ar: "رز بالحليب", en: "Rice pudding" }, detail: { ar: "مع فستق", en: "pistachio" }, price: { ar: "5,000", en: "5,000" } },
      ],
    },
    {
      category: { ar: "المشروبات", en: "Drinks" },
      items: [
        { name: { ar: "شاي أسود", en: "Black tea" }, price: { ar: "2,000", en: "2,000" } },
        { name: { ar: "قهوة عربية", en: "Arabic coffee" }, price: { ar: "3,000", en: "3,000" } },
        { name: { ar: "عصير رمان طازج", en: "Fresh pomegranate juice" }, price: { ar: "6,000", en: "6,000" } },
      ],
    },
  ],
  currencyNote: { ar: "جميع الأسعار بالدينار العراقي، شاملة الخدمة.", en: "All prices in Iraqi dinar, service included." },
  galleryTitle: { ar: "من المطعم", en: "Inside Zerin" },
  reserveTitle: { ar: "الحجوزات", en: "Reservations" },
  reserveBody: {
    ar: "نأخذ الحجوزات للمجموعات من أربعة أشخاص فأكثر. للمجموعات الكبيرة أو المناسبات، راسلنا قبل يومين على الأقل.",
    en: "We take reservations for parties of four or more. For large groups or private events, message us at least two days ahead.",
  },
  reserveCta: { ar: "احجز على واتساب", en: "Reserve on WhatsApp" },
  deliveryTitle: { ar: "التوصيل", en: "Delivery" },
  deliveryBody: {
    ar: "نوصّل داخل المدينة عبر تطبيقات التوصيل، أو اطلب منّا مباشرة.",
    en: "We deliver across the city through the usual apps, or order from us directly.",
  },
  eventsTitle: { ar: "المناسبات والولائم", en: "Private events" },
  eventsBody: {
    ar: "نستضيف المناسبات في القاعة العلوية للفرع الرئيسي — تتّسع لأربعين شخصًا، بقائمة ثابتة تتفق عليها معنا مسبقًا.",
    en: "We host events in the upstairs room at the main branch — it seats forty, with a set menu agreed with you in advance.",
  },
  events: [
    {
      name: { ar: "غداء عائلي", en: "Family lunch" },
      detail: { ar: "حتى 15 شخصًا، ثلاثة أطباق", en: "up to 15 guests, three courses" },
      price: { ar: "من 20,000 للشخص", en: "from 20,000 per head" },
    },
    {
      name: { ar: "مناسبة خاصة", en: "Private function" },
      detail: { ar: "حتى 40 شخصًا، القاعة كاملة", en: "up to 40 guests, whole room" },
      price: { ar: "من 28,000 للشخص", en: "from 28,000 per head" },
    },
    {
      name: { ar: "ولائم خارجية", en: "Off-site catering" },
      detail: { ar: "داخل المدينة، بحجز مسبق", en: "in the city, booked ahead" },
      price: { ar: "حسب الطلب", en: "on request" },
    },
  ] as PricedItem[],
  branchesTitle: { ar: "الفروع", en: "Branches" },
  branches: [
    {
      name: { ar: "الفرع الرئيسي — عنكاوا", en: "Main branch — Ainkawa" },
      address: { ar: "شارع الكنيسة، مقابل الحديقة", en: "Church Street, opposite the park" },
      hours: { ar: "يوميًا 12:00 ظهرًا – 12:00 منتصف الليل", en: "Daily 12:00 – 00:00" },
    },
    {
      name: { ar: "فرع المدينة", en: "City branch" },
      address: { ar: "شارع 100 المتري، قرب المجمع التجاري", en: "100m Street, near the mall" },
      hours: { ar: "يوميًا 1:00 ظهرًا – 11:00 مساءً", en: "Daily 13:00 – 23:00" },
    },
  ],
};
