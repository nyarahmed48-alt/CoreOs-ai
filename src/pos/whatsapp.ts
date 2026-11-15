/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Getting a message out of the till and into WhatsApp.
 *
 * There is no WhatsApp API here and there is not going to be one: it costs
 * money per message, needs a business account and a server, and would stop
 * working the moment the shop's internet did. What we do instead is hand the
 * phone a `wa.me` link with the message already written, which opens the app
 * the owner already has, with the chat already chosen. They press send.
 *
 * That one press is deliberate. The owner sees exactly what leaves their
 * shop before it leaves, and nothing is sent by a tablet on its own.
 */

/**
 * `0770 123 4567` as a shopkeeper types it → `+9647701234567`.
 *
 * Iraqi mobile numbers are eleven digits beginning 07. People write them with
 * spaces, dashes, a leading +964, a leading 00964, or Arabic-Indic digits
 * copied out of a contact card — all of which have to end up the same.
 *
 * Returns "" for anything that is not a number we can dial, rather than
 * guessing: a report sent to a wrong number is worse than one not sent.
 */
export function iraqiNumber(typed: string): string {
  /* Arabic-Indic ٠-٩ and the Persian/Kurdish ۰-۹ both appear on these
     keyboards, and both have to become 0-9. */
  const latin = typed.replace(/[٠-٩۰-۹]/g, (digit) =>
    String(
      digit.charCodeAt(0) >= 0x06f0
        ? digit.charCodeAt(0) - 0x06f0
        : digit.charCodeAt(0) - 0x0660,
    ),
  );
  let digits = latin.replace(/\D/g, "");

  if (digits.startsWith("00964")) digits = digits.slice(5);
  else if (digits.startsWith("964")) digits = digits.slice(3);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  /* What is left must be a mobile: 7 then nine more. Landlines cannot receive
     WhatsApp, so a Baghdad 01 number is a refusal, not a conversion. */
  if (!/^7\d{9}$/.test(digits)) return "";
  return `+964${digits}`;
}

/** How the stored number is shown back to the shop: `0770 123 4567`. */
export function showNumber(stored: string): string {
  const digits = stored.replace(/\D/g, "");
  if (!/^9647\d{9}$/.test(digits)) return stored;
  const local = `0${digits.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** The link that opens WhatsApp with the message typed. No number opens the
    chat picker, which is the right fallback when the owner has not set theirs
    or wants it sent to someone else today. */
export function whatsappLink(text: string, to = ""): string {
  const number = to.replace(/\D/g, "");
  const message = `text=${encodeURIComponent(text)}`;
  return number ? `https://wa.me/${number}?${message}` : `https://wa.me/?${message}`;
}

export type SendHow = "whatsapp" | "shared" | "copied" | "failed";

/**
 * Hand the message to the phone.
 *
 * Tried in the order that keeps the fewest steps for the person holding the
 * tablet. `wa.me` first, because it lands in the right chat. Then the share
 * sheet, which some Android builds offer when WhatsApp is installed but the
 * link handler is not — the owner picks WhatsApp from the sheet. Then the
 * clipboard, so the worst case is a long-press and a paste rather than a day
 * that cannot be reported at all.
 */
export async function sendToWhatsapp(text: string, to = ""): Promise<SendHow> {
  try {
    const window_ = window.open(whatsappLink(text, to), "_blank", "noopener");
    if (window_) return "whatsapp";
  } catch {
    // Pop-up blocked or no handler; fall through.
  }

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ text });
      return "shared";
    } catch (error) {
      /* A cancelled share sheet is the owner changing their mind, not a
         failure — don't then shove it on the clipboard behind their back. */
      if (error instanceof Error && error.name === "AbortError") return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
