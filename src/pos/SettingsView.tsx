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
import { Download, LifeBuoy, ScanLine, Send, Upload } from "lucide-react";
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
import { useWriteError, saveStaff, setStaffActive, useSession, signOut } from "./store";
import { buildReport, errorCount, whatsappNumber } from "./report";
import { LicencePanel } from "./ActivationGate";
import { ApprovalPrompt } from "./ApprovalPrompt";
import { flushed } from "./store";
import { formatDateTime } from "./i18n";
import type { Staff } from "./types";

export function SettingsView() {
  const data = usePos();
  const { t, lang } = useT();
  const { settings } = data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [wipeWord, setWipeWord] = useState("");
  const [wipeError, setWipeError] = useState("");
  const [wipeStage, setWipeStage] = useState<"ask" | "approve" | "saving">("ask");
  const [lastScan, setLastScan] = useState<{ code: string; info: ScanInfo } | null>(
    null,
  );
  const writeError = useWriteError();
  const [showReport, setShowReport] = useState(false);

  /**
   * One press instead of a phone call.
   *
   * WhatsApp is how a shop in Baghdad actually reaches anyone, so the report
   * goes there when a support number has been set. Where it has not — or where
   * the browser will not open it — the text goes to the clipboard instead, so
   * the button never dead-ends on a counter at closing time.
   */
  async function sendReport() {
    const text = buildReport(data, writeError);
    const number = whatsappNumber(settings.supportPhone);
    if (number) {
      window.open(
        `https://wa.me/${number}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener",
      );
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t("support.noNumber"));
    } catch {
      saveReport();
    }
    setError("");
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(buildReport(data, writeError));
      setNotice(t("support.copied"));
      setError("");
    } catch {
      saveReport();
    }
  }

  function saveReport() {
    const url = URL.createObjectURL(
      new Blob([buildReport(data, writeError)], { type: "text/plain" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `corecashier-${settings.tillId}-report.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(t("support.saved"));
    setError("");
  }

  useWedgeScanner({
    enabled: !resetting,
    onScan: (code, info) => setLastScan({ code, info }),
  });

  async function download() {
    // Wait for anything still being written. A backup taken a millisecond
    // before the last sale reaches the disk is a backup missing a sale.
    await flushed();
    const url = URL.createObjectURL(
      new Blob([exportData()], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `corecashier-backup-${new Date().toISOString().slice(0, 10)}.json`;
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

        <Section title={t("staff.title")} hint={t("staff.hint")}>
          <StaffList />
        </Section>

        <Section title={t("audit.title")} hint="">
          <AuditList />
        </Section>

        <Section title={t("licence.title")} hint={t("licence.hint")}>
          <LicencePanel />
        </Section>

        <Section title={t("support.title")} hint={t("support.hint")}>
          <div className="rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
              {t("support.tillId")}
            </p>
            <p dir="ltr" className="mt-1 font-mono text-[22px] tracking-[0.12em] text-white">
              {settings.tillId}
            </p>
            <p className="mt-1 text-[12.5px] text-[#7e87a5]">{t("support.tillIdHint")}</p>
          </div>

          <Field
            label={t("support.number")}
            value={settings.supportPhone}
            inputMode="tel"
            dir="ltr"
            placeholder="964xxxxxxxxx"
            hint={t("support.numberHint")}
            onChange={(event) => updateSettings({ supportPhone: event.target.value })}
          />

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={sendReport}>
              <Send size={16} /> {t("support.send")}
            </Button>
            <Button onClick={copyReport}>{t("support.copy")}</Button>
            <Button onClick={saveReport}>{t("support.save")}</Button>
          </div>

          <p className="flex items-center gap-2 text-[13px] text-[#7e87a5]">
            <LifeBuoy size={15} className="shrink-0" />
            {errorCount() === 0
              ? t("support.noErrors")
              : t("support.errors", { n: errorCount() })}
          </p>

          <button
            type="button"
            onClick={() => setShowReport((open) => !open)}
            className="text-start text-[13px] font-medium text-[#8b96ff] hover:text-white"
          >
            {t("support.preview")}
          </button>
          {showReport ? (
            <pre
              dir="ltr"
              className="max-h-64 overflow-auto rounded-xl border border-[#1e2740] bg-[#05060a] p-3 text-[11.5px] leading-relaxed text-[#98a0bb]"
            >
              {buildReport(data, writeError)}
            </pre>
          ) : null}
        </Section>

        <Section
          title={t("settings.backup")}
          hint={t("settings.backupHint", {
            products: data.products.length,
            sales: data.sales.length,
          })}
        >
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void download()}>
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
        <Modal
          title={t("settings.wipeTitle")}
          onClose={() => {
            setResetting(false);
            setWipeWord("");
            setWipeError("");
            setWipeStage("ask");
          }}
        >
          <p className="text-[14px] leading-relaxed text-[#c3c9dd]">
            {t("settings.wipeBody")}
          </p>
          <p className="mt-3 rounded-xl border border-[#3a2c12] bg-[#1d1608] px-4 py-2.5 text-[13px] text-[#f0c078]">
            {t("wipe.backupFirst")}
          </p>

          {/* Typed out in full, in capitals. A shop that taps through two
              dialogues by habit cannot type this one by habit. */}
          <div className="mt-4">
            <Field
              label={t("wipe.word")}
              dir="ltr"
              autoCapitalize="characters"
              value={wipeWord}
              onChange={(event) => {
                setWipeWord(event.target.value.toUpperCase());
                setWipeError("");
              }}
            />
          </div>

          {wipeError ? (
            <p className="mt-3 text-[13.5px] text-[#f0879d]">{wipeError}</p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <Button
              variant="danger"
              className="flex-1"
              disabled={wipeStage === "saving"}
              onClick={() => {
                if (wipeWord.trim() !== t("wipe.wordValue")) {
                  setWipeError(t("wipe.wrongWord"));
                  return;
                }
                setWipeStage("approve");
              }}
            >
              {wipeStage === "saving" ? t("wipe.saving") : t("settings.wipeConfirm")}
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setResetting(false);
                setWipeWord("");
                setWipeStage("ask");
              }}
            >
              {t("settings.cancel")}
            </Button>
          </div>

          {wipeStage === "approve" ? (
            <ApprovalPrompt
              title={t("settings.wipeTitle")}
              /* No "why?" here. The word typed out in full is the deliberate
                 act, and a reason would be written into a log this very
                 action is about to erase. */
              needReason={false}
              onClose={() => setWipeStage("ask")}
              onApproved={async () => {
                // The backup is not optional and not last: it is saved, and
                // only then is anything deleted.
                setWipeStage("saving");
                await download();
                resetToSeed();
                setResetting(false);
                setWipeWord("");
                setWipeStage("ask");
                setNotice(t("settings.wiped"));
              }}
            />
          ) : null}
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

/**
 * The people who work the counter.
 *
 * Adding the first person switches the till from "anyone holding it" to "sign
 * in to sell", which is a bigger change than it looks — so the till asks for
 * an owner first: without one, nobody could ever approve a void.
 */
function StaffList() {
  const data = usePos();
  const { t } = useT();
  const { staff: signedIn } = useSession();
  const [editing, setEditing] = useState<Staff | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <>
      <ul className="divide-y divide-[#141b2d] overflow-hidden rounded-xl border border-[#1e2740]">
        {data.staff.length === 0 ? (
          <li className="px-4 py-5 text-center text-[13.5px] text-[#6b7490]">
            {t("lock.noStaff")}
          </li>
        ) : (
          data.staff.map((person) => (
            <li key={person.id} className="flex items-center gap-3 bg-[#0b1120] px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-medium text-[#e7eaf6]">
                  {person.name}
                  {person.active ? "" : ` · ${t("staff.removed")}`}
                </p>
                <p className="mt-0.5 text-[12.5px] text-[#6b7490]">
                  {t(person.role === "owner" ? "staff.owner" : "staff.cashier")}
                </p>
              </div>
              <Button
                variant="ghost"
                className="min-h-[36px] shrink-0 px-3"
                onClick={() => setEditing(person)}
              >
                {t("products.edit")}
              </Button>
              <Button
                variant="quiet"
                className="min-h-[36px] shrink-0 px-2.5"
                onClick={() => setStaffActive(person.id, !person.active)}
              >
                {person.active ? t("staff.remove") : t("staff.restore")}
              </Button>
            </li>
          ))
        )}
      </ul>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setAdding(true)}>
          {t("staff.add")}
        </Button>
        {signedIn ? (
          <Button onClick={signOut}>{t("shift.signOut")}</Button>
        ) : null}
      </div>

      {adding || editing ? (
        <StaffForm
          person={editing}
          mustBeOwner={data.staff.length === 0}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
        />
      ) : null}
    </>
  );
}

function StaffForm({
  person,
  mustBeOwner,
  onClose,
}: {
  person: Staff | null;
  mustBeOwner: boolean;
  onClose: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState(person?.name ?? "");
  const [pin, setPin] = useState("");
  const [role, setRole] = useState<Staff["role"]>(
    person?.role ?? (mustBeOwner ? "owner" : "cashier"),
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name.trim()) {
      setError(t("staff.needsName"));
      return;
    }
    if (!person && pin.length < 4) {
      setError(t("staff.needsPin"));
      return;
    }
    if (mustBeOwner && role !== "owner") {
      setError(t("staff.needsOwner"));
      return;
    }
    setBusy(true);
    await saveStaff({ id: person?.id, name, role, pin: pin || undefined });
    setBusy(false);
    onClose();
  }

  return (
    <Modal title={person ? person.name : t("staff.add")} onClose={onClose}>
      <div className="space-y-3">
        <Field
          label={t("staff.name")}
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
        />
        <Field
          label={t("staff.pin")}
          type="password"
          inputMode="numeric"
          value={pin}
          placeholder={person ? t("staff.pinKeep") : ""}
          onChange={(event) => {
            setPin(event.target.value.replace(/[^0-9]/g, "").slice(0, 8));
            setError("");
          }}
        />
        <div>
          <span className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7e87a5]">
            {t("staff.role")}
          </span>
          <div className="grid gap-2">
            {(["owner", "cashier"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`rounded-xl border px-3 py-2.5 text-start text-[13.5px] transition-colors ${
                  role === option
                    ? "border-[#6c7bf0] bg-[#6c7bf0]/15 text-white"
                    : "border-[#232b40] text-[#98a0bb] hover:border-[#3a4460]"
                }`}
              >
                {t(option === "owner" ? "staff.owner" : "staff.cashier")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error ? <p className="mt-3 text-[13.5px] text-[#f0879d]">{error}</p> : null}

      <Button
        variant="primary"
        className="mt-4 h-[48px] w-full"
        disabled={busy}
        onClick={() => void save()}
      >
        {t("editor.save")}
      </Button>
    </Modal>
  );
}

/** Everything that moved money or stock, newest first. */
function AuditList() {
  const data = usePos();
  const { t } = useT();
  const entries = data.audit.slice(0, 60);

  if (entries.length === 0) {
    return <p className="text-[13.5px] text-[#6b7490]">{t("audit.none")}</p>;
  }

  return (
    <ul className="max-h-80 divide-y divide-[#141b2d] overflow-y-auto rounded-xl border border-[#1e2740]">
      {entries.map((entry) => (
        <li key={entry.id} className="bg-[#0b1120] px-4 py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13.5px] font-medium text-[#e7eaf6]">
              {t(`audit.${entry.action}` as Parameters<typeof t>[0])}
              {entry.staffName ? ` · ${entry.staffName}` : ""}
            </span>
            <span dir="ltr" className="shrink-0 text-[11.5px] text-[#6b7490]">
              {formatDateTime(entry.at)}
            </span>
          </div>
          <p dir="auto" className="mt-0.5 text-[12.5px] text-[#7e87a5]">
            {entry.detail}
            {entry.approvedBy ? ` · ${t("audit.approved", { name: entry.approvedBy })}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
