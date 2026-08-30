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
import { Package, Plus, ScanLine, Search, Tag } from "lucide-react";
import {
  deleteCategory,
  newId,
  receiveStock,
  saveCategory,
  saveProduct,
  setArchived,
  usePos,
} from "./store";
import { amount, money, parseAmount } from "./money";
import { Button, Empty, Field, Modal, Select } from "./ui";
import { CameraScanner } from "./CameraScanner";
import type { Product } from "./types";

type Filter = "all" | "low" | "archived";

export function ProductsView() {
  const data = usePos();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

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
              placeholder="Search products"
              aria-label="Search products"
              className="h-[42px] w-full rounded-xl border border-[#232b40] bg-[#0a0f1c] ps-10 pe-3 text-[15px] text-[#e7eaf6] outline-none placeholder:text-[#5b6480] focus:border-[#6c7bf0]"
            />
          </div>
          <Button onClick={() => setManagingCategories(true)}>
            <Tag size={16} /> Categories
          </Button>
          <Button variant="primary" onClick={() => setEditing(blankProduct())}>
            <Plus size={16} /> Add product
          </Button>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterChip>
          <FilterChip active={filter === "low"} onClick={() => setFilter("low")}>
            Low stock{lowCount ? ` · ${lowCount}` : ""}
          </FilterChip>
          <FilterChip
            active={filter === "archived"}
            onClick={() => setFilter("archived")}
          >
            Archived
          </FilterChip>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#1e2740]">
          {rows.length === 0 ? (
            <Empty>
              {filter === "low"
                ? "Nothing is running low. "
                : "No products here yet. "}
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
                      {money(product.price)}
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
                        {product.stock} in stock
                      </span>
                      {!product.archived ? (
                        <Button
                          variant="quiet"
                          className="min-h-[36px] px-2.5"
                          onClick={() => receiveStock(product.id, 1)}
                          aria-label={`Receive one ${product.name}`}
                        >
                          <Package size={15} /> +1
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        className="min-h-[36px] px-3"
                        onClick={() => setEditing(product)}
                      >
                        Edit
                      </Button>
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

function ProductEditor({
  product,
  categories,
  onClose,
}: {
  product: Product;
  categories: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  function save() {
    if (!draft.name.trim()) {
      setError("A product needs a name.");
      return;
    }
    saveProduct({ ...draft, name: draft.name.trim(), barcode: draft.barcode.trim() });
    onClose();
  }

  return (
    <Modal title={product.name ? "Edit product" : "New product"} onClose={onClose}>
      <div className="space-y-3.5">
        <Field
          label="Name"
          value={draft.name}
          autoFocus
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field
              label="Barcode"
              value={draft.barcode}
              hint="Scan it with a USB scanner, the camera, or type it. Leave empty for loose goods."
              onChange={(event) => setDraft({ ...draft, barcode: event.target.value })}
            />
          </div>
          <Button
            className="mb-6 shrink-0 px-3.5"
            onClick={() => setScanning(true)}
            aria-label="Capture the barcode with the camera"
          >
            <ScanLine size={17} />
          </Button>
        </div>
        <Select
          label="Category"
          value={draft.categoryId}
          onChange={(value) => setDraft({ ...draft, categoryId: value })}
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Price (IQD)"
            inputMode="numeric"
            value={draft.price ? amount(draft.price) : ""}
            onChange={(event) =>
              setDraft({ ...draft, price: parseAmount(event.target.value) })
            }
          />
          <Field
            label="In stock"
            inputMode="numeric"
            value={String(draft.stock)}
            onChange={(event) =>
              setDraft({
                ...draft,
                stock: parseInt(event.target.value.replace(/[^0-9-]/g, ""), 10) || 0,
              })
            }
          />
        </div>
        <Field
          label="Warn at"
          inputMode="numeric"
          value={draft.lowStockAt >= 0 ? String(draft.lowStockAt) : ""}
          placeholder="Use the shop default"
          hint="Colour this product amber once stock drops to this number."
          onChange={(event) => {
            const raw = event.target.value.replace(/[^0-9]/g, "");
            setDraft({ ...draft, lowStockAt: raw === "" ? -1 : parseInt(raw, 10) });
          }}
        />

        {error ? <p className="text-[13px] text-[#f0879d]">{error}</p> : null}

        {scanning ? (
          <CameraScanner
            title="Capture this barcode"
            mode="once"
            onClose={() => setScanning(false)}
            onCode={(code) => {
              setDraft((current) => ({ ...current, barcode: code }));
              return code;
            }}
          />
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button variant="primary" className="flex-1" onClick={save}>
            Save
          </Button>
          {product.name ? (
            <Button
              variant={draft.archived ? "ghost" : "danger"}
              onClick={() => {
                setArchived(product.id, !draft.archived);
                onClose();
              }}
            >
              {draft.archived ? "Restore" : "Archive"}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

function CategoryManager({ onClose }: { onClose: () => void }) {
  const data = usePos();
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title="Categories" onClose={onClose}>
      <ul className="divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
        {data.categories.map((category) => (
          <li key={category.id} className="flex items-center gap-2 bg-[#0b1120] px-3 py-2">
            <input
              value={category.name}
              onChange={(event) =>
                saveCategory({ ...category, name: event.target.value })
              }
              aria-label={`Rename ${category.name}`}
              className="h-[38px] flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[14.5px] text-[#e7eaf6] outline-none hover:border-[#232b40] focus:border-[#6c7bf0]"
            />
            <Button
              variant="quiet"
              className="min-h-[36px] px-2.5 text-[#f0879d]"
              onClick={() => setError(deleteCategory(category.id) ?? "")}
            >
              Remove
            </Button>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-3 text-[13px] text-[#f0879d]">{error}</p> : null}

      <div className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New category"
          aria-label="New category"
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
          Add
        </Button>
      </div>
    </Modal>
  );
}
