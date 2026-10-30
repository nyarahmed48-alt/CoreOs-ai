/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What the till looks like on first run.
 *
 * A market with an empty product grid is unusable and unconvincing, so a new
 * install opens on a small, real shelf: the goods a corner market in Iraq
 * actually sells, at prices that will not look absurd to the owner.
 *
 * The shelf is written in all three languages, so a shop that opens the till
 * in Kurdish does not have to read its own sample stock in English. It follows
 * the language setting until the shop starts selling or edits anything, after
 * which the names are the shop's own and nothing rewrites them.
 */

import type { Category, Product, Settings } from "./types";
import type { Lang } from "./i18n";

type Names = Record<Lang, string>;

const SHOP_NAME: Names = {
  en: "CoreCashier",
  ar: "كور كاشير",
  ckb: "کۆر کاشیر",
};

const FOOTER: Names = {
  en: "Thank you — please keep your receipt",
  ar: "شكراً لزيارتكم — يرجى الاحتفاظ بالوصل",
  ckb: "سوپاس — تکایە وەسڵەکەت لای خۆت بهێڵەوە",
};

/** Short, spoken down a phone line, and hard to mishear: no vowels, no
    look-alike characters. */
function newTillId(): string {
  const alphabet = "ACDEFGHJKLMNPQRTUVWXY349";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += alphabet[Math.floor(Math.random() * alphabet.length)];
    if (i === 2) id += "-";
  }
  return id;
}

export function defaultSettings(lang: Lang): Settings {
  return {
    lang,
    tillId: newTillId(),
    supportPhone: "",
    shopName: SHOP_NAME[lang],
    addressLine: "",
    phone: "",
    receiptFooter: FOOTER[lang],
    roundTo: 250,
    lowStockAt: 5,
    nextSaleNo: 1001,
    tillPrefix: "T1",
    staffLogin: false,
    auditKeep: 500,
    printer: "browser",
    paperWidth: 58,
    sampleShop: true,
  };
}

const CATEGORIES: { id: string; names: Names }[] = [
  { id: "c-drinks", names: { en: "Drinks", ar: "المشروبات", ckb: "خواردنەوەکان" } },
  { id: "c-dairy", names: { en: "Dairy & Eggs", ar: "الألبان والبيض", ckb: "شیرەمەنی و هێلکە" } },
  { id: "c-bakery", names: { en: "Bakery", ar: "المخبوزات", ckb: "نانەواخانە" } },
  { id: "c-snacks", names: { en: "Snacks & Sweets", ar: "الخفيفة والحلويات", ckb: "خۆراکی سووک و شیرینی" } },
  { id: "c-pantry", names: { en: "Pantry", ar: "المواد الغذائية", ckb: "خۆراکی بنەڕەتی" } },
  { id: "c-household", names: { en: "Household", ar: "المواد المنزلية", ckb: "کەلوپەلی ماڵ" } },
];

type Seed = [names: Names, barcode: string, price: number, stock: number];

const SHELF: Record<string, Seed[]> = {
  "c-drinks": [
    [{ en: "Water 500ml", ar: "ماء 500 مل", ckb: "ئاو 500 مل" }, "6221031492013", 250, 96],
    [{ en: "Water 1.5L", ar: "ماء 1.5 لتر", ckb: "ئاو 1.5 لیتر" }, "6221031492020", 500, 60],
    [{ en: "Pepsi can 330ml", ar: "بيبسي علبة 330 مل", ckb: "پێپسی قوتوو 330 مل" }, "6281006002517", 750, 72],
    [{ en: "7UP can 330ml", ar: "سفن أب علبة 330 مل", ckb: "سەڤن ئەپ قوتوو 330 مل" }, "6281006002524", 750, 48],
    [{ en: "Orange juice 1L", ar: "عصير برتقال 1 لتر", ckb: "شەربەتی پرتەقاڵ 1 لیتر" }, "6281007312110", 2000, 24],
    [{ en: "Energy drink 250ml", ar: "مشروب طاقة 250 مل", ckb: "خواردنەوەی وزە 250 مل" }, "9002490100070", 1500, 36],
  ],
  "c-dairy": [
    [{ en: "Fresh milk 1L", ar: "حليب طازج 1 لتر", ckb: "شیری تازە 1 لیتر" }, "6251009090019", 2000, 30],
    [{ en: "Yoghurt 900g", ar: "لبن 900 غم", ckb: "ماست 900 گرام" }, "6251009090026", 2500, 18],
    [{ en: "Eggs, tray of 30", ar: "بيض طبقة 30", ckb: "هێلکە تەختەی 30" }, "6251009090033", 6000, 12],
    [{ en: "Cheese triangles, 8", ar: "جبن مثلثات 8 حبات", ckb: "پەنیری سێگۆشە 8 دانە" }, "3073780969420", 2500, 20],
    [{ en: "Butter 200g", ar: "زبدة 200 غم", ckb: "کەرە 200 گرام" }, "6251009090040", 3500, 14],
  ],
  "c-bakery": [
    [{ en: "Samoon, 5 pieces", ar: "صمون 5 أرغفة", ckb: "سەموون 5 دانە" }, "", 500, 40],
    [{ en: "Toast bread", ar: "خبز توست", ckb: "نانی تۆست" }, "6251020030018", 1500, 16],
    [{ en: "Croissant", ar: "كرواسان", ckb: "کرواسان" }, "", 750, 24],
  ],
  "c-snacks": [
    [{ en: "Chips, small", ar: "چيبس صغير", ckb: "چیپسی بچووک" }, "6281019010158", 500, 60],
    [{ en: "Chips, family bag", ar: "چيبس كيس عائلي", ckb: "چیپسی گەورە" }, "6281019010165", 1500, 24],
    [{ en: "Chocolate bar", ar: "لوح شوكولاتة", ckb: "شۆکولاتە" }, "8000500037560", 750, 48],
    [{ en: "Biscuits, roll", ar: "بسكويت رول", ckb: "بسکویتی ڕۆل" }, "6281006002937", 500, 50],
    [{ en: "Wafer, 6 pack", ar: "ويفر 6 حبات", ckb: "ۆەیفەر 6 دانە" }, "6281006002944", 1750, 20],
    [{ en: "Chewing gum", ar: "علكة", ckb: "بەنیشت" }, "80042990", 250, 80],
  ],
  "c-pantry": [
    [{ en: "Rice 5kg", ar: "رز 5 كغم", ckb: "برنج 5 کیلۆ" }, "6251030050013", 9000, 15],
    [{ en: "Sunflower oil 1.8L", ar: "زيت دوار الشمس 1.8 لتر", ckb: "ڕۆنی گوڵەبەڕۆژە 1.8 لیتر" }, "6251030050020", 4000, 18],
    [{ en: "Sugar 1kg", ar: "سكر 1 كغم", ckb: "شەکر 1 کیلۆ" }, "6251030050037", 1500, 30],
    [{ en: "Tea 500g", ar: "شاي 500 غم", ckb: "چا 500 گرام" }, "6251030050044", 4500, 12],
    [{ en: "Tomato paste 700g", ar: "معجون طماطم 700 غم", ckb: "دۆشاوی تەماتە 700 گرام" }, "6251030050051", 1750, 24],
    [{ en: "Pasta 500g", ar: "معكرونة 500 غم", ckb: "مەکەرۆنە 500 گرام" }, "8076809513722", 1250, 30],
    [{ en: "Red lentils 1kg", ar: "عدس أحمر 1 كغم", ckb: "نیسکی سوور 1 کیلۆ" }, "6251030050068", 2500, 16],
    [{ en: "Salt 1kg", ar: "ملح 1 كغم", ckb: "خوێ 1 کیلۆ" }, "6251030050075", 500, 20],
  ],
  "c-household": [
    [{ en: "Laundry powder 3kg", ar: "مسحوق غسيل 3 كغم", ckb: "تۆزی جلشۆر 3 کیلۆ" }, "6251040070018", 5000, 10],
    [{ en: "Dish soap 1L", ar: "سائل جلي 1 لتر", ckb: "ساپۆنی قاپشۆر 1 لیتر" }, "6251040070025", 2000, 14],
    [{ en: "Tissues, box", ar: "مناديل علبة", ckb: "دەستەسڕ قوتوو" }, "6251040070032", 1000, 26],
    [{ en: "Shampoo 400ml", ar: "شامبو 400 مل", ckb: "شامپۆ 400 مل" }, "6251040070049", 5000, 9],
    [{ en: "Toothpaste 100ml", ar: "معجون أسنان 100 مل", ckb: "خەمیری ددان 100 مل" }, "6251040070056", 3000, 12],
    [{ en: "Soap bar", ar: "صابون قطعة", ckb: "ساپۆن" }, "6251040070063", 1000, 24],
    [{ en: "AA batteries, 4", ar: "بطاريات AA عدد 4", ckb: "باتری AA 4 دانە" }, "6251040070070", 2000, 8],
    [{ en: "Lighter", ar: "قداحة", ckb: "داگیرسێنەر" }, "", 500, 40],
  ],
};

export function seedCategories(lang: Lang): Category[] {
  return CATEGORIES.map((category) => ({
    id: category.id,
    name: category.names[lang],
  }));
}

export function seedProducts(lang: Lang): Product[] {
  const products: Product[] = [];
  for (const [categoryId, items] of Object.entries(SHELF)) {
    for (const [names, barcode, price, stock] of items) {
      products.push({
        id: `p-${products.length + 1}`,
        name: names[lang],
        barcode,
        categoryId,
        price,
        stock,
        lowStockAt: -1,
        archived: false,
      });
    }
  }
  return products;
}

/** The shop name and receipt footer belong to the sample shop too: a till
    still showing its sample data should show it in the chosen language. */
export function seedShopText(lang: Lang): Pick<Settings, "shopName" | "receiptFooter"> {
  return { shopName: SHOP_NAME[lang], receiptFooter: FOOTER[lang] };
}
