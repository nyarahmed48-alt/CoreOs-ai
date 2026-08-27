/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * What the till looks like on first run.
 *
 * A market with an empty product grid is unusable and unconvincing, so a new
 * install opens on a small, real shelf: the goods a corner market in Iraq
 * actually sells, at prices that will not look absurd to the owner. Everything
 * here is editable in the Products tab and can be wiped in Settings.
 */

import type { Category, Product, Settings } from "./types";

export const DEFAULT_SETTINGS: Settings = {
  shopName: "CoreOs Market",
  addressLine: "",
  phone: "",
  receiptFooter: "Thank you — please keep your receipt",
  roundTo: 250,
  lowStockAt: 5,
  nextSaleNo: 1001,
};

export const SEED_CATEGORIES: Category[] = [
  { id: "c-drinks", name: "Drinks" },
  { id: "c-dairy", name: "Dairy & Eggs" },
  { id: "c-bakery", name: "Bakery" },
  { id: "c-snacks", name: "Snacks & Sweets" },
  { id: "c-pantry", name: "Pantry" },
  { id: "c-household", name: "Household" },
];

type Seed = [name: string, barcode: string, price: number, stock: number];

const SHELF: Record<string, Seed[]> = {
  "c-drinks": [
    ["Water 500ml", "6221031492015", 250, 96],
    ["Water 1.5L", "6221031492022", 500, 60],
    ["Pepsi can 330ml", "6281006002517", 750, 72],
    ["7UP can 330ml", "6281006002524", 750, 48],
    ["Orange juice 1L", "6281007312119", 2000, 24],
    ["Energy drink 250ml", "9002490100070", 1500, 36],
  ],
  "c-dairy": [
    ["Fresh milk 1L", "6251009090013", 2000, 30],
    ["Yoghurt 900g", "6251009090020", 2500, 18],
    ["Eggs, tray of 30", "6251009090037", 6000, 12],
    ["Cheese triangles, 8", "3073780969420", 2500, 20],
    ["Butter 200g", "6251009090044", 3500, 14],
  ],
  "c-bakery": [
    ["Samoon, 5 pieces", "", 500, 40],
    ["Toast bread", "6251020030016", 1500, 16],
    ["Croissant", "", 750, 24],
  ],
  "c-snacks": [
    ["Chips, small", "6281019010153", 500, 60],
    ["Chips, family bag", "6281019010160", 1500, 24],
    ["Chocolate bar", "8000500037560", 750, 48],
    ["Biscuits, roll", "6281006002937", 500, 50],
    ["Wafer, 6 pack", "6281006002944", 1750, 20],
    ["Chewing gum", "80042993", 250, 80],
  ],
  "c-pantry": [
    ["Rice 5kg", "6251030050015", 9000, 15],
    ["Sunflower oil 1.8L", "6251030050022", 4000, 18],
    ["Sugar 1kg", "6251030050039", 1500, 30],
    ["Tea 500g", "6251030050046", 4500, 12],
    ["Tomato paste 700g", "6251030050053", 1750, 24],
    ["Pasta 500g", "8076809513722", 1250, 30],
    ["Red lentils 1kg", "6251030050060", 2500, 16],
    ["Salt 1kg", "6251030050077", 500, 20],
  ],
  "c-household": [
    ["Laundry powder 3kg", "6251040070011", 5000, 10],
    ["Dish soap 1L", "6251040070028", 2000, 14],
    ["Tissues, box", "6251040070035", 1000, 26],
    ["Shampoo 400ml", "6251040070042", 5000, 9],
    ["Toothpaste 100ml", "6251040070059", 3000, 12],
    ["Soap bar", "6251040070066", 1000, 24],
    ["AA batteries, 4", "6251040070073", 2000, 8],
    ["Lighter", "", 500, 40],
  ],
};

export function seedProducts(): Product[] {
  const products: Product[] = [];
  for (const [categoryId, items] of Object.entries(SHELF)) {
    for (const [name, barcode, price, stock] of items) {
      products.push({
        id: `p-${products.length + 1}`,
        name,
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
