/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The day, in a message the owner reads on their phone.
 *
 * The preview is not decoration. The message carries takings, debts and
 * customer names, and it is about to leave the shop — so the person pressing
 * the button sees exactly what goes, word for word, before it goes. Nothing
 * is sent by the tablet on its own: WhatsApp opens with the text typed and
 * the owner presses send.
 *
 * Works with the internet out. The figures come off the tablet, the message
 * is built on the tablet, and it is saved on the tablet. Only the last step
 * needs a connection, and when there is none the report is still there to
 * send later.
 */

import { useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { CalendarDays, Copy, MessageCircle, Send } from "lucide-react";
import { buildDayReport } from "./dayReport";
import {
  madeReports,
  markSent,
  rememberReport,
  subscribeReports,
} from "./dayReportLog";
import { dayOfAt, today, usePos } from "./store";
import { sendToWhatsapp, showNumber } from "./whatsapp";
import { reportError } from "./reportIssue";
import { dirOf, type Lang } from "./i18n";
import { Button, Modal, Select } from "./ui";
import { useT } from "./useT";

/**
 * The till's own day boundary, handed to the pure builder.
 *
 * Passed as a function rather than read inside it so the same builder can run
 * on a server one day, where there is no store to ask.
 */
const belongsTo = (iso: string) => dayOfAt(iso);

export function EndOfDayModal({
  day: asked,
  onClose,
}: {
  day?: string;
  onClose: () => void;
}) {
  const data = usePos();
  const { t, m, lang: tillLang } = useT();
  const history = useSyncExternalStore(subscribeReports, madeReports);

  const [day, setDay] = useState(asked ?? today());
  const [notice, setNotice] = useState("");
  const [sending, setSending] = useState(false);

  /** "same" means whatever the counter is worked in — one less setting for a
      shop where the owner and the cashier read the same language. */
  const lang: Lang =
    data.settings.reportLang === "same" ? tillLang : data.settings.reportLang;

  const { summary, text } = useMemo(
    () => buildDayReport(data, day, belongsTo, lang),
    [data, day, lang],
  );

  const to = data.settings.ownerWhatsApp;

  /** The days there is anything to report on, newest first, plus today even
      when it is empty — a shop that sold nothing still closes. */
  const days = useMemo(() => {
    const seen = new Set<string>([today()]);
    for (const sale of data.sales) seen.add(belongsTo(sale.at));
    for (const close of data.closes) seen.add(close.day);
    return [...seen].sort().reverse().slice(0, 30);
  }, [data.sales, data.closes]);

  async function send() {
    setSending(true);
    setNotice("");
    /* Written down before it is sent, not after. If WhatsApp swallows the
       tab or the tablet is pulled out of its cradle mid-send, the shop still
       has the report. */
    rememberReport({
      day,
      at: new Date().toISOString(),
      lang,
      text,
      takings: summary.takings,
      sales: summary.sales,
      sent: "not-sent",
    });

    const how = await sendToWhatsapp(text, to);
    markSent(day, how === "whatsapp" ? "opened" : how);
    setSending(false);

    if (how === "whatsapp") setNotice(t("day.opened"));
    else if (how === "shared") setNotice(t("day.shared"));
    else if (how === "copied") setNotice(t("day.copied"));
    else {
      setNotice(t("day.failed"));
      /* P2: the report exists and is saved, so this is not a lost day — but
         a shop whose WhatsApp never opens needs someone to look at it. */
      reportError("DT-09", "end-of-day report could not reach WhatsApp", {
        quiet: true,
      });
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setNotice(t("day.copied"));
    } catch {
      setNotice(t("day.failed"));
    }
  }

  return (
    <Modal title={t("day.title")} onClose={onClose} wide>
      <p className="text-[13px] leading-relaxed text-[#7e87a5]">{t("day.hint")}</p>

      {days.length > 1 ? (
        <div className="mt-3">
          <Select label={t("day.pick")} value={day} onChange={setDay}>
            {days.map((one) => (
              <option key={one} value={one}>
                {one}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      {/* The message as it will arrive, line by line.
          Each line carries its own `dir="auto"`, which is what WhatsApp does
          too: a block of mixed Arabic and Latin takes its direction from the
          first strong letter in the whole block, so "Al-Noor Market" at the
          top would drag every Arabic line below it to the left and move the
          colons to the wrong end. Per line, each one reads the way it will
          on the owner's phone — which is the point of showing it at all. */}
      {/* The block takes the report language's direction so every line hangs
          off the same edge, the way the bubble will on the phone; the lines
          inside still order themselves. */}
      <div
        dir={dirOf(lang)}
        className="mt-3 max-h-[46dvh] overflow-y-auto rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-4 py-3 text-[14px] leading-relaxed text-[#e7eaf6]"
      >
        {text.split("\n").map((row, at) => (
          <p key={at} dir="auto" className="min-h-[1.2em] whitespace-pre-wrap">
            {row}
          </p>
        ))}
      </div>

      <p className="mt-2 text-[12.5px] text-[#7e87a5]">
        {to ? t("day.toNumber", { number: showNumber(to) }) : t("day.noNumber")}
      </p>
      {!navigator.onLine ? (
        <p className="mt-2 rounded-xl border border-[#3a3320] bg-[#1b1708] px-3 py-2 text-[12.5px] text-[#f0c078]">
          {t("day.offline")}
        </p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          variant="primary"
          className="h-[50px] flex-1"
          disabled={sending}
          onClick={() => void send()}
        >
          <Send size={16} /> {t("day.send")}
        </Button>
        <Button className="h-[50px]" onClick={() => void copy()}>
          <Copy size={16} /> {t("day.copy")}
        </Button>
      </div>

      {notice ? (
        <p className="mt-3 text-center text-[13.5px] text-[#8ee7bb]">{notice}</p>
      ) : null}

      <section className="mt-5 border-t border-[#1b2337] pt-4">
        <h3 className="font-display text-[14px] font-semibold text-white">
          {t("day.history")}
        </h3>
        {history.length === 0 ? (
          <p className="mt-2 text-[13px] text-[#6b7490]">{t("day.historyNone")}</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {history.slice(0, 12).map((one) => (
              <li key={one.day}>
                <button
                  type="button"
                  onClick={() => {
                    setDay(one.day);
                    setNotice("");
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#1e2740] bg-[#0a0f1c] px-3 py-2 text-start hover:border-[#2c3550]"
                >
                  <span className="flex items-center gap-2 text-[13px] text-[#98a0bb]">
                    <CalendarDays size={14} /> {one.day}
                    {/* A report that never reached WhatsApp is the one a shop
                        needs to find again, so it is marked rather than
                        looking like every other line. */}
                    {one.sent === "failed" || one.sent === "not-sent" ? (
                      <span className="text-[#f0c078]">·</span>
                    ) : null}
                  </span>
                  <span className="text-[13px] font-semibold text-[#e7eaf6]">
                    {m(one.takings)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Modal>
  );
}

/** The button on the till's own screen. Separate so the close-the-day flow
    can offer the same thing without duplicating the wiring. */
export function EndOfDayButton({
  day,
  className = "",
  children,
}: {
  /** The day being looked at, so a report can be made for last Tuesday as
      well as for tonight. */
  day?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className={className} onClick={() => setOpen(true)}>
        <MessageCircle size={16} /> {children ?? t("day.title")}
      </Button>
      {open ? <EndOfDayModal day={day} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
