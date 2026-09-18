/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The scanner's click.
 *
 * A cashier working a counter watches the goods, not the screen, so a scan has
 * to be audible or it is not confirmed at all. Synthesised rather than played
 * from a file, because the portable build is one file and a shop till may
 * never have seen the internet.
 */
export function beep(tone: "read" | "unknown" = "read") {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    // A read is a short high click; an unknown code is a lower, longer note,
    // so the two are told apart across a noisy shop without looking up.
    oscillator.frequency.value = tone === "read" ? 1180 : 420;
    const length = tone === "read" ? 0.12 : 0.26;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + length);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + length + 0.01);
    oscillator.onended = () => void context.close();
  } catch {
    // A till with no sound card still has to scan.
  }
}
