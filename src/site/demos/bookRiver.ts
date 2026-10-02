/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Copy for the Book River demo.
 *
 * Unlike the three demos in content.ts, Book River is a real bookshop — an
 * Instagram seller (@book.river64) shipping books across Iraq. This page is a
 * pitch: what their site could look like, with RiverAi answering customers.
 *
 * What comes from their profile: the name, the "fair price, all of Iraq"
 * promise, the phone number, the titles they have posted, and the one
 * customer message pinned in their feedback highlight. What does not: the
 * prices. Those are placeholders and the page says so — RiverAi is told the
 * same thing (see `riverai` in lab/agents.ts), so neither quotes a price as if
 * it were real.
 *
 * Book titles and authors stay in Latin script: they are what a customer
 * types into a message to order.
 */

import type { Copy } from "../strings";

export type Genre = "romance" | "thriller" | "fantasy" | "classics";

export interface Book {
  title: string;
  author: string;
  genre: Genre;
  /** Sample price in IQD — not Book River's real price. */
  price: number;
  /** Cover gradient, standing in for the jacket until real photos exist. */
  cover: [string, string];
  /** Colour of the title type on the generated cover. */
  ink: string;
}

/** Display number for the shop's phone, as written in their bio. */
export const BR_PHONE_DISPLAY = "0751 768 3983";
/** wa.me form: Iraqi country code, leading zero dropped. */
const BR_WHATSAPP_DIGITS = "9647517683983";
export const BR_INSTAGRAM = "https://www.instagram.com/book.river64/";

export function brWhatsapp(message = ""): string {
  const base = `https://wa.me/${BR_WHATSAPP_DIGITS}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const GENRES: Array<{ id: Genre | "all"; label: Copy }> = [
  { id: "all", label: { ar: "الكل", ckb: "هەموو", en: "All" } },
  { id: "romance", label: { ar: "رومانسية", ckb: "ڕۆمانسی", en: "Romance" } },
  { id: "thriller", label: { ar: "تشويق وغموض", ckb: "هەیەجان و نهێنی", en: "Thriller" } },
  { id: "fantasy", label: { ar: "خيال ويافعين", ckb: "خەیاڵی و هەرزەکاران", en: "Fantasy & YA" } },
  { id: "classics", label: { ar: "كلاسيكيات وتاريخ", ckb: "کلاسیک و مێژوو", en: "Classics & history" } },
];

/* Titles taken from the shop's own posts. Keep this list and the catalogue in
   the `riverai` brief in lab/agents.ts in step — RiverAi only knows what that
   brief tells it. */
export const BOOKS: Book[] = [
  { title: "God of Ruin", author: "Rina Kent", genre: "romance", price: 16000, cover: ["#2a2a2e", "#0d0d10"], ink: "#d9d4c7" },
  { title: "God of Fury", author: "Rina Kent", genre: "romance", price: 16000, cover: ["#3a2f2a", "#120e0c"], ink: "#e3c9a0" },
  { title: "God of War", author: "Rina Kent", genre: "romance", price: 16000, cover: ["#30343c", "#0f1115"], ink: "#cfd6e0" },
  { title: "The Silent Patient", author: "Alex Michaelides", genre: "thriller", price: 13000, cover: ["#e9e4dc", "#c9c1b4"], ink: "#b3192b" },
  { title: "Yesteryear", author: "Caro Claire Burke", genre: "thriller", price: 15000, cover: ["#f1c34b", "#3f8f8a"], ink: "#a3261c" },
  { title: "Bad Blood", author: "Jennifer Lynn Barnes", genre: "thriller", price: 13000, cover: ["#b3121f", "#3a0509"], ink: "#fbe3d6" },
  { title: "The Final Gambit", author: "Jennifer Lynn Barnes", genre: "fantasy", price: 14000, cover: ["#d9b44a", "#5a1f1a"], ink: "#fff3d6" },
  { title: "Catching Fire", author: "Suzanne Collins", genre: "fantasy", price: 12000, cover: ["#c0392b", "#2b0b08"], ink: "#f6d27a" },
  { title: "Heartless", author: "Marissa Meyer", genre: "fantasy", price: 14000, cover: ["#8e1b2b", "#2a060c"], ink: "#f7e9ea" },
  { title: "Shadow Reaper", author: "Lynette Noni", genre: "fantasy", price: 15000, cover: ["#a51d24", "#1d0507"], ink: "#f3e3c2" },
  { title: "Julius Caesar", author: "Philip Freeman", genre: "classics", price: 14000, cover: ["#d8d6d1", "#9a978f"], ink: "#3a3833" },
  { title: "1984", author: "George Orwell", genre: "classics", price: 10000, cover: ["#1f3b63", "#0a1424"], ink: "#e9eef6" },
];

export const BR = {
  name: { ar: "بوك ريفر", ckb: "بوک ڕیڤەر", en: "Book River" },
  kicker: { ar: "مكتبة إلكترونية · العراق", ckb: "کتێبخانەی ئۆنلاین · عێراق", en: "Online bookshop · Iraq" },
  tagline: {
    ar: "نرسل الكتب إلى جميع أنحاء العراق، بسعر عادل.",
    ckb: "کتێب دەنێرین بۆ هەموو عێراق، بە نرخێکی دادپەروەرانە.",
    en: "We send books to all of Iraq, at a fair price.",
  },
  intro: {
    ar: "روايات، تشويق، خيال وكلاسيكيات — بالإنجليزية، تصل إلى بابك. أرسل لنا اسم الكتاب ونتكفل بالباقي.",
    ckb: "ڕۆمان، هەیەجان، خەیاڵی و کلاسیک — بە ئینگلیزی، دەگاتە بەردەم دەرگاکەت. ناوی کتێبەکەمان بۆ بنێرە و ئەوی تر لای ئێمە.",
    en: "Novels, thrillers, fantasy and classics — in English, delivered to your door. Send us the title and we'll handle the rest.",
  },
  orderCta: { ar: "اطلب على واتساب", ckb: "لە واتساپ داوا بکە", en: "Order on WhatsApp" },
  askCta: { ar: "اسأل RiverAi", ckb: "پرسیار لە RiverAi بکە", en: "Ask RiverAi" },
  orderMsg: {
    ar: "مرحبًا Book River، أريد أن أطلب كتابًا:",
    ckb: "سڵاو Book River، دەمەوێت کتێبێک داوا بکەم:",
    en: "Hi Book River, I'd like to order a book:",
  },
  stats: [
    { value: "8,600+", label: { ar: "قارئ يتابعنا", ckb: "خوێنەر بەدوامانەوەن", en: "readers follow us" } },
    { value: "448", label: { ar: "منشورًا من الرفوف", ckb: "پۆست لە ڕەفەکانەوە", en: "posts from the shelves" } },
    { value: "18", label: { ar: "محافظة نوصل إليها", ckb: "پارێزگا دەیگەینێ", en: "governorates we deliver to" } },
  ],

  stepsTitle: { ar: "كيف تطلب", ckb: "چۆن داوا دەکەیت", en: "How ordering works" },
  steps: [
    {
      title: { ar: "اختر كتابك", ckb: "کتێبەکەت هەڵبژێرە", en: "Pick your book" },
      body: {
        ar: "من الرفوف أدناه، أو اسأل RiverAi أن يقترح عليك شيئًا تحبه.",
        ckb: "لە ڕەفەکانی خوارەوە، یان داوا لە RiverAi بکە شتێکت پێشنیار بکات.",
        en: "From the shelves below — or ask RiverAi to suggest something you'll love.",
      },
    },
    {
      title: { ar: "راسلنا", ckb: "نامەمان بۆ بنێرە", en: "Message us" },
      body: {
        ar: "أرسل اسم الكتاب ومدينتك على واتساب، ونؤكد لك السعر والتوصيل.",
        ckb: "ناوی کتێب و شارەکەت لە واتساپ بنێرە، ئێمە نرخ و گەیاندن دڵنیا دەکەینەوە.",
        en: "Send the title and your city on WhatsApp. We confirm the price and delivery.",
      },
    },
    {
      title: { ar: "يصل إلى بابك", ckb: "دەگاتە بەردەم دەرگاکەت", en: "It arrives at your door" },
      body: {
        ar: "نشحن إلى كل محافظات العراق، من البصرة إلى دهوك.",
        ckb: "بۆ هەموو پارێزگاکانی عێراق دەینێرین، لە بەسراوە تا دهۆک.",
        en: "We ship to every governorate in Iraq, from Basra to Duhok.",
      },
    },
  ],

  shelfTitle: { ar: "على الرفوف", ckb: "لەسەر ڕەفەکان", en: "On the shelves" },
  shelfNote: {
    ar: "الأسعار هنا للعرض فقط — السعر النهائي نؤكده على واتساب.",
    ckb: "نرخەکان لێرە تەنها بۆ نموونەن — نرخی کۆتایی لە واتساپ دڵنیا دەکەینەوە.",
    en: "Prices here are placeholders for the demo — the final price is confirmed on WhatsApp.",
  },
  order: { ar: "اطلب", ckb: "داوا بکە", en: "Order" },
  askAbout: { ar: "اسأل عنه", ckb: "پرسیاری لێ بکە", en: "Ask about it" },
  askAboutMsg: {
    ar: "حدثني عن كتاب {title} — هل يناسبني؟",
    ckb: "دەربارەی کتێبی {title} پێم بڵێ — گونجاوە بۆم؟",
    en: "Tell me about {title} — is it for me?",
  },
  currency: { ar: "د.ع", ckb: "دینار", en: "IQD" },
  notListed: {
    ar: "لم تجد كتابك؟ نجلب الكثير غيره — اسألنا عنه.",
    ckb: "کتێبەکەت نەدۆزیەوە؟ زۆری تر دەهێنین — پرسیارمان لێ بکە.",
    en: "Can't see your book? We bring in plenty more — just ask.",
  },

  aiKicker: { ar: "مساعد المكتبة", ckb: "یاریدەدەری کتێبخانە", en: "Your reading assistant" },
  aiTitle: { ar: "تعرّف على RiverAi", ckb: "RiverAi بناسە", en: "Meet RiverAi" },
  aiBody: {
    ar: "لا تعرف ماذا تقرأ بعد؟ أخبر RiverAi بما أحببته، وسيقترح عليك من رفوفنا، ويشرح لك كيف تطلب. يجيب بالعربية والكردية والإنجليزية، في أي وقت.",
    ckb: "نازانیت دواتر چی بخوێنیتەوە؟ بە RiverAi بڵێ چیت پێ خۆش بوو، لە ڕەفەکانمانەوە پێشنیارت بۆ دەکات و ڕێگای داواکردنت بۆ ڕوون دەکاتەوە. بە عەرەبی، کوردی و ئینگلیزی وەڵام دەداتەوە، لە هەر کاتێکدا.",
    en: "Not sure what to read next? Tell RiverAi what you loved, and it will suggest something from our shelves and explain how to order. It answers in Arabic, Kurdish and English, any time of day.",
  },
  aiNote: {
    ar: "RiverAi يقترح ويجيب — أما الطلب والسعر النهائي فيؤكدهما فريقنا على واتساب.",
    ckb: "RiverAi پێشنیار دەکات و وەڵام دەداتەوە — داواکاری و نرخی کۆتایی تیمەکەمان لە واتساپ دڵنیای دەکاتەوە.",
    en: "RiverAi suggests and answers — your order and final price are confirmed by our team on WhatsApp.",
  },

  /* Shown in the chat before the first message, and as one-tap starters. */
  chatHello: {
    ar: "أهلًا! أنا RiverAi، مساعد Book River. أخبرني ماذا تحب أن تقرأ وسأساعدك في إيجاد كتابك القادم.",
    ckb: "سڵاو! من RiverAi م، یاریدەدەری Book River. پێم بڵێ حەزت لە خوێندنەوەی چییە و یارمەتیت دەدەم کتێبی داهاتووت بدۆزیتەوە.",
    en: "Hi! I'm RiverAi, Book River's assistant. Tell me what you like to read and I'll help you find your next book.",
  },
  chatStarters: [
    { ar: "اقترح عليّ رواية رومانسية مظلمة", ckb: "ڕۆمانێکی ڕۆمانسیی تاریکم بۆ پێشنیار بکە", en: "Recommend me a dark romance" },
    { ar: "أحببت The Silent Patient، ماذا أقرأ بعده؟", ckb: "The Silent Patient م پێ خۆش بوو، دواتر چی بخوێنمەوە؟", en: "I loved The Silent Patient — what next?" },
    { ar: "كيف أطلب، وهل توصلون إلى مدينتي؟", ckb: "چۆن داوا بکەم، و دەگەیەننە شارەکەم؟", en: "How do I order, and do you deliver to my city?" },
  ] as Copy[],
  chatPlaceholder: { ar: "اكتب سؤالك لـ RiverAi…", ckb: "پرسیارەکەت بۆ RiverAi بنووسە…", en: "Ask RiverAi anything…" },
  chatThinking: { ar: "RiverAi يبحث في الرفوف…", ckb: "RiverAi لە ڕەفەکاندا دەگەڕێت…", en: "RiverAi is checking the shelves…" },
  chatOnline: { ar: "متصل · يرد بالعربية والكردية والإنجليزية", ckb: "سەرهێڵ · بە عەرەبی، کوردی و ئینگلیزی", en: "Online · Arabic, Kurdish, English" },
  chatFoot: {
    ar: "مساعد ذكاء اصطناعي — لا تشارك بيانات شخصية. الطلبات تُؤكَّد على واتساب.",
    ckb: "یاریدەدەری زیرەکی دەستکرد — زانیاری کەسی هاوبەش مەکە. داواکارییەکان لە واتساپ دڵنیا دەکرێنەوە.",
    en: "AI assistant — don't share personal details. Orders are confirmed on WhatsApp.",
  },
  chatOpen: { ar: "افتح RiverAi", ckb: "RiverAi بکەرەوە", en: "Open RiverAi" },
  chatClose: { ar: "أغلق", ckb: "داخستن", en: "Close" },
  chatClear: { ar: "محادثة جديدة", ckb: "گفتوگۆی نوێ", en: "New chat" },
  chatSend: { ar: "أرسل", ckb: "ناردن", en: "Send" },

  feedbackTitle: { ar: "من صندوق الرسائل", ckb: "لە سندوقی نامەکانەوە", en: "From our inbox" },
  /* The customer message pinned in the shop's "Fidback" Instagram highlight. */
  feedback: {
    quote: "Just received the order and I love it! Thank you so much — honestly the best customer service I've had in a while. You guys were so helpful, and I will definitely buy more books from you in the future ❤️",
    source: { ar: "رسالة زبون، من قصص Fidback 👌 على إنستغرام", ckb: "نامەی کڕیارێک، لە هایلایتی Fidback 👌 لە ئینستاگرام", en: "A customer message, from our Fidback 👌 highlight on Instagram" },
  },
  moreOnInsta: { ar: "المزيد على إنستغرام", ckb: "زیاتر لە ئینستاگرام", en: "More on Instagram" },

  contactTitle: { ar: "تواصل معنا", ckb: "پەیوەندیمان پێوە بکە", en: "Get in touch" },
  contactBody: {
    ar: "تواصل مع مكتبتنا للحصول على كتابك المفضل.",
    ckb: "پەیوەندی بە کتێبخانەکەمانەوە بکە بۆ بەدەستهێنانی کتێبی دڵخوازت.",
    en: "Get in touch with our bookshop for your favourite book.",
  },
  phoneLabel: { ar: "هاتف وواتساب", ckb: "تەلەفۆن و واتساپ", en: "Phone & WhatsApp" },
  deliveryLabel: { ar: "التوصيل", ckb: "گەیاندن", en: "Delivery" },
  deliveryValue: { ar: "جميع أنحاء العراق", ckb: "هەموو عێراق", en: "All of Iraq" },
};
