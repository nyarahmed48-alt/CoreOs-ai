/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Adding and correcting a product.
 *
 * Opened from the Products tab, and from the till itself when a scan finds
 * nothing: a new line arriving from the supplier is discovered at the counter,
 * mid-queue, and the cashier needs to name it and sell it without leaving the
 * sale.
 */

import { useState } from "react";
import { ScanLine } from "lucide-react";
import { saveProduct, setArchived } from "./store";
import { amount, parseAmount } from "./money";
import { Button, Field, Modal, Select } from "./ui";
import { CameraScanner } from "./CameraScanner";
import { useWedgeScanner } from "./wedge";
import { beep } from "./beep";
import type { Product } from "./types";

export function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product;
  categories: { id: string; name: string }[];
  onClose: () => void;
  /** The till uses this to drop a just-created product straight into the
      basket: the cashier scanned something unknown mid-sale, and the point of
      naming it there and then is to sell it. */
  onSaved?: (product: Product) => void;
}) {
  const [draft, setDraft] = useState<Product>(product);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);

  /* Open the product, point the scanner at the packet, done. Without this a
     scan would land in whichever box was last touched, which for a form full
     of boxes is a coin toss. */
  useWedgeScanner({
    enabled: !scanning,
    onScan: (code) => {
      setDraft((current) => ({ ...current, barcode: code }));
      beep("read");
    },
  });

  function save() {
    if (!draft.name.trim()) {
      setError("A product needs a name.");
      return;
    }
    const saved = { ...draft, name: draft.name.trim(), barcode: draft.barcode.trim() };
    saveProduct(saved);
    onSaved?.(saved);
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
              data-scan-through=""
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
