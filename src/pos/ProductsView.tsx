/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The shelf, as the owner sees it.
 *
 * Products, prices, barcodes and stock are all edited here — never in code —
 * because the person who changes the price of bread is not going to open a
 * text editor. Deleting is deliberately absent: a product that has been sold
 * is part of past receipts, so the strongest action is to archive it, which
 * takes it off the till grid and leaves the history intact.
 */

import { useMemo, useState } from "react";
import { Package, Plus, Search, Tag } from "lucide-react";
import {
  deleteCategory,
  newId,
  receiveStock,
  saveCategory,
  usePos,
  useReadOnly,
} from "./store";
import { useT } from "./useT";
import { Button, Empty, Modal } from "./ui";
import { ProductEditor } from "./ProductEditor";
import { useWedgeScanner } from "./wedge";
import type { Product } from "./types";

type Filter = "all" | "low" | "archived";

export function ProductsView() {
  const data = usePos();
  const { t, m } = useT();
  const readOnly = useReadOnly();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  /* A scan here is a question — "what is this, and how many are left?" — so it
     searches rather than sells. The editor runs its own scanner, so this one
     stands down while it is open. */
  useWedgeScanner({
    enabled: !editing && !managingCategories,
    onScan: (code) => {
      setQuery(code);
      setFilter("all");
    },
    onType: (text) => setQuery((current) => current + text),
  });

  const lowStockAt = (product: Product) =>
    product.lowStockAt >= 0 ? product.lowStockAt : data.settings.lowStockAt;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.products
      .filter((product) => {
        if (filter === "archived") return product.archived;
        if (product.archived) return false;
        if (filter === "low") return product.stock <= lowStockAt(product);
        return true;
      })
      .filter(
        (product) =>
          !needle ||
          product.name.toLowerCase().includes(needle) ||
          product.barcode.includes(needle),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, data.settings.lowStockAt, query, filter]);

  const lowCount = data.products.filter(
    (p) => !p.archived && p.stock <= lowStockAt(p),
  ).length;

  const categoryName = (id: string) =>
    data.categories.find((c) => c.id === id)?.name ?? "—";

  function blankProduct(): Product {
    return {
      id: newId("p"),
      name: "",
      barcode: "",
      categoryId: data.categories[0]?.id ?? "",
      price: 0,
      stock: 0,
      lowStockAt: -1,
      archived: false,
    };
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-5xl px-3 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-[#5b6480]"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("products.search")}
              aria-label={t("products.search")}
              className="h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] ps-10 pe-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
            />
          </div>
          {readOnly ? null : (
            <>
              <Button onClick={() => setManagingCategories(true)}>
                <Tag size={16} /> {t("products.categories")}
              </Button>
              <Button variant="primary" onClick={() => setEditing(blankProduct())}>
                <Plus size={16} /> {t("products.add")}
              </Button>
            </>
          )}
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            {t("products.all")}
          </FilterChip>
          <FilterChip active={filter === "low"} onClick={() => setFilter("low")}>
            {lowCount ? t("products.lowCount", { n: lowCount }) : t("products.low")}
          </FilterChip>
          <FilterChip
            active={filter === "archived"}
            onClick={() => setFilter("archived")}
          >
            {t("products.archived")}
          </FilterChip>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#1e2740]">
          {rows.length === 0 ? (
            <Empty>
              {filter === "low" ? t("products.nothingLow") : t("products.noneYet")}
            </Empty>
          ) : (
            <ul className="divide-y divide-[#141b2d]">
              {rows.map((product) => {
                const low = product.stock <= lowStockAt(product);
                return (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center gap-3 bg-[#0b1120] px-4 py-3"
                  >
                    <div className="min-w-[150px] flex-1">
                      <p className="text-[14.5px] font-medium text-[#e7eaf6]">
                        {product.name}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-[#6b7490]">
                        {categoryName(product.categoryId)}
                        {product.barcode ? ` · ${product.barcode}` : ""}
                      </p>
                    </div>

                    <p className="w-[92px] text-end font-display text-[14.5px] font-semibold text-white">
                      {m(product.price)}
                    </p>

                    <div className="flex items-center gap-2">
                      <span
                        className={`w-[74px] text-end text-[13.5px] font-semibold ${
                          product.stock <= 0
                            ? "text-[#f0879d]"
                            : low
                              ? "text-[#f0c078]"
                              : "text-[#98a0bb]"
                        }`}
                      >
                        {t("products.inStock", { n: product.stock })}
                      </span>
                      {!product.archived && !readOnly ? (
                        <Button
                          variant="quiet"
                          className="min-h-[36px] px-2.5"
                          onClick={() => receiveStock(product.id, 1)}
                          aria-label={t("products.receiveOne", { name: product.name })}
                        >
                          <Package size={15} /> +1
                        </Button>
                      ) : null}
                      {readOnly ? null : (
                        <Button
                          variant="ghost"
                          className="min-h-[36px] px-3"
                          onClick={() => setEditing(product)}
                        >
                          {t("products.edit")}
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {editing ? (
        <ProductEditor
          product={editing}
          categories={data.categories}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {managingCategories ? (
        <CategoryManager onClose={() => setManagingCategories(false)} />
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
        active
          ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-[#c6ccff]"
          : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryManager({ onClose }: { onClose: () => void }) {
  const data = usePos();
  const { t, m } = useT();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title={t("products.categories")} onClose={onClose}>
      <ul className="divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
        {data.categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 bg-[#0b1120] px-3 py-2">
            <input
              value={category.name}
              onChange={(event) =>
                saveCategory({ ...category, name: event.target.value })
              }
              aria-label={t("products.rename", { name: category.name })}
              className="h-[38px] flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14.5px] text-[#e7eaf6] outline-none hover:border-[#232b40] focus:border-[#6c7bf0]"
            />
            <Button
              variant="quiet"
              className="min-h-[36px] px-2.5 text-[#f0879d]"
              onClick={() => setError(deleteCategory(category.id) ?? "")}
            >
              {t("products.remove")}
            </Button>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-3 text-[13px] text-[#f0879d]">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("products.newCategory")}
          aria-label={t("products.newCategory")}
          className="h-[42px] flex-1 rounded-xl border border-[#232b40] bg-[#0a0f1c] px-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
        />
        <Button
          variant="primary"
          disabled={!name.trim()}
          onClick={() => {
            saveCategory({ id: newId("c"), name: name.trim() });
            setName("");
            setError("");
          }}
        >
          {t("products.addCategory")}
        </Button>
      </div>
    </Modal>
  );
}
