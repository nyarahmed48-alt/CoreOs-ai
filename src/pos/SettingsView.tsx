/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Shop details, till behaviour, and the backup.
 *
 * The backup is the important half of this screen. Everything lives in this
 * browser: clear the browsing data and the shop's history goes with it, so
 * exporting a file is not a power-user feature here, it is the only copy.
 */

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  exportData,
  importData,
  resetToSeed,
  updateSettings,
  usePos,
} from "./store";
import { Button, Field, Modal } from "./ui";

export function SettingsView() {
  const data = usePos();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);

  function download() {
    const url = URL.createObjectURL(
      new Blob([exportData()], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Backup downloaded.");
    setError("");
  }

  async function upload(file: File) {
    const problem = importData(await file.text());
    if (problem) {
      setError(problem);
      setNotice("");
      return;
    }
    setNotice("Backup restored.");
    setError("");
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-3 py-4 sm:px-5">
        <Section
          title="Shop"
          hint="This is what prints at the top of every receipt."
        >
          <Field
            label="Shop name"
            value={settings.shopName}
            onChange={(event) => updateSettings({ shopName: event.target.value })}
          />
          <Field
            label="Address"
            value={settings.addressLine}
            placeholder="Optional"
            onChange={(event) => updateSettings({ addressLine: event.target.value })}
          />
          <Field
            label="Phone"
            value={settings.phone}
            placeholder="Optional"
            onChange={(event) => updateSettings({ phone: event.target.value })}
          />
          <Field
            label="Receipt footer"
            value={settings.receiptFooter}
            onChange={(event) =>
              updateSettings({ receiptFooter: event.target.value })
            }
          />
        </Section>

        <Section
          title="Till"
          hint="Prices are whole dinars throughout — there are no decimals anywhere in the system."
        >
          <Field
            label="Round totals to"
            inputMode="numeric"
            value={String(settings.roundTo)}
            hint="250 is the smallest note in ordinary use. Set 0 to switch rounding off."
            onChange={(event) =>
              updateSettings({
                roundTo: parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 0,
              })
            }
          />
          <Field
            label="Warn on low stock at"
            inputMode="numeric"
            value={String(settings.lowStockAt)}
            hint="Used by every product that does not set its own threshold."
            onChange={(event) =>
              updateSettings({
                lowStockAt:
                  parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 0,
              })
            }
          />
          <Field
            label="Next receipt number"
            inputMode="numeric"
            value={String(settings.nextSaleNo)}
            onChange={(event) =>
              updateSettings({
                nextSaleNo:
                  parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 1,
              })
            }
          />
        </Section>

        <Section
          title="Backup"
          hint={`${data.products.length} products and ${data.sales.length} sales are stored in this browser, on this device only.`}
        >
          <div className="flex flex-wrap gap-2">
            <Button onClick={download}>
              <Download size={16} /> Export a backup
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> Restore from a file
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
          </div>
          {notice ? <p className="text-[13px] text-[#8ee7bb]">{notice}</p> : null}
          {error ? <p className="text-[13px] text-[#f0879d]">{error}</p> : null}
          <Button variant="danger" onClick={() => setResetting(true)}>
            Wipe and start over
          </Button>
        </Section>
      </div>

      {resetting ? (
        <Modal title="Wipe this till?" onClose={() => setResetting(false)}>
          <p className="text-[14px] leading-relaxed text-[#c3c9dd]">
            Every product, sale and setting on this device is deleted and replaced
            with the sample shop. Export a backup first if there is anything here
            you want to keep.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                resetToSeed();
                setResetting(false);
                setNotice("Till reset to the sample shop.");
              }}
            >
              Wipe everything
            </Button>
            <Button variant="quiet" onClick={() => setResetting(false)}>
              Cancel
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1e2740] bg-[#0b1120] px-4 py-4 sm:px-5">
      <h2 className="font-display text-[15.5px] font-semibold text-white">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[#7e87a5]">{hint}</p>
      <div className="mt-4 space-y-3.5">{children}</div>
    </section>
  );
}
