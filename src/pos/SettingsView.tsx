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
import { Download, ScanLine, Upload } from "lucide-react";
import {
  exportData,
  importData,
  resetToSeed,
  setLanguage,
  updateSettings,
  usePos,
} from "./store";
import { useT } from "./useT";
import { LANGS } from "./i18n";
import { Button, Field, Modal } from "./ui";
import { useWedgeScanner, type ScanInfo } from "./wedge";

export function SettingsView() {
  const data = usePos();
  const { t, lang } = useT();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [lastScan, setLastScan] = useState<{ code: string; info: ScanInfo } | null>(
    null,
  );

  useWedgeScanner({
    enabled: !resetting,
    onScan: (code, info) => setLastScan({ code, info }),
  });

  function download() {
    const url = URL.createObjectURL(
      new Blob([exportData()], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(t("settings.downloaded"));
    setError("");
  }

  async function upload(file: File) {
    const problem = importData(await file.text());
    if (problem) {
      setError(problem);
      setNotice("");
      return;
    }
    setNotice(t("settings.restored"));
    setError("");
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-5 px-3 py-4 sm:px-5">
        <Section title={t("settings.language")} hint={t("settings.languageHint")}>
          <div className="grid grid-cols-3 gap-2">
            {LANGS.map((option) => (
              <button
                key={option.id}
                type="button"
                lang={option.id}
                dir={option.dir}
                onClick={() => setLanguage(option.id)}
                aria-pressed={lang === option.id}
                className={`flex h-[52px] items-center justify-center rounded-xl border text-[15px] font-semibold transition-colors ${
                  lang === option.id
                    ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                    : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460] hover:text-white"
                }`}
              >
                {option.name}
              </button>
            ))}
          </div>
          {settings.sampleShop ? (
            <p className="text-[13px] leading-relaxed text-[#7e87a5]">
              {t("settings.languageSample")}
            </p>
          ) : null}
        </Section>

        <Section
          title={t("settings.shop")}
          hint={t("settings.shopHint")}
        >
          <Field
            label={t("settings.shopName")}
            value={settings.shopName}
            onChange={(event) => updateSettings({ shopName: event.target.value })}
          />
          <Field
            label={t("settings.address")}
            value={settings.addressLine}
            placeholder={t("settings.optional")}
            onChange={(event) => updateSettings({ addressLine: event.target.value })}
          />
          <Field
            label={t("settings.phone")}
            value={settings.phone}
            placeholder={t("settings.optional")}
            onChange={(event) => updateSettings({ phone: event.target.value })}
          />
          <Field
            label={t("settings.footer")}
            value={settings.receiptFooter}
            onChange={(event) =>
              updateSettings({ receiptFooter: event.target.value })
            }
          />
        </Section>

        <Section
          title={t("settings.till")}
          hint={t("settings.tillHint")}
        >
          <Field
            label={t("settings.roundTo")}
            inputMode="numeric"
            value={String(settings.roundTo)}
            hint={t("settings.roundHint")}
            onChange={(event) =>
              updateSettings({
                roundTo: parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 0,
              })
            }
          />
          <Field
            label={t("settings.lowStock")}
            inputMode="numeric"
            value={String(settings.lowStockAt)}
            hint={t("settings.lowStockHint")}
            onChange={(event) =>
              updateSettings({
                lowStockAt:
                  parseInt(event.target.value.replace(/[^0-9]/g, ""), 10) || 0,
              })
            }
          />
          <Field
            label={t("settings.nextReceipt")}
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
          title={t("settings.scanner")}
          hint={t("settings.scannerHint")}
        >
          {lastScan ? (
            <div className="rounded-xl border border-[#1f4034] bg-[#0d2119] px-4 py-3">
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#78c9a3]">
                {t("settings.scannerWorking")}
              </p>
              <p className="mt-1 break-all font-mono text-[17px] tracking-[0.06em] text-white">
                {lastScan.code}
              </p>
              <p className="mt-2 text-[13px] text-[#8fb9a8]">
                {t("settings.scannerSpeed", {
                  keys: lastScan.info.keys,
                  ms: lastScan.info.ms,
                })}
                {" · "}
                {lastScan.info.suffix === "none"
                  ? t("settings.scannerNoSuffix")
                  : t("settings.scannerSuffix", {
                      key: lastScan.info.suffix === "tab" ? "Tab" : "Enter",
                    })}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#232b40] px-4 py-5 text-[#7e87a5]">
              <ScanLine size={18} className="shrink-0" />
              <p className="text-[13.5px]">{t("settings.scannerWaiting")}</p>
            </div>
          )}
          <p className="text-[13px] leading-relaxed text-[#7e87a5]">
            {t("settings.scannerHelp")}
          </p>
        </Section>

        <Section
          title={t("settings.backup")}
          hint={t("settings.backupHint", {
            products: data.products.length,
            sales: data.sales.length,
          })}
        >
          <div className="flex flex-wrap gap-2">
            <Button onClick={download}>
              <Download size={16} /> {t("settings.export")}
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <Upload size={16} /> {t("settings.restore")}
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
            {t("settings.wipe")}
          </Button>
        </Section>
      </div>

      {resetting ? (
        <Modal title={t("settings.wipeTitle")} onClose={() => setResetting(false)}>
          <p className="text-[14px] leading-relaxed text-[#c3c9dd]">
            {t("settings.wipeBody")}
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                resetToSeed();
                setResetting(false);
                setNotice(t("settings.wiped"));
              }}
            >
              {t("settings.wipeConfirm")}
            </Button>
            <Button variant="quiet" onClick={() => setResetting(false)}>
              {t("settings.cancel")}
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
