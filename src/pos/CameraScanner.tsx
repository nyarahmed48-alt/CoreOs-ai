/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scanning with the camera.
 *
 * A USB scanner is the fast way to work a counter, but most shops have a phone
 * before they have a scanner, so the camera is the one that gets used on day
 * one. This leans on the browser's own BarcodeDetector: it is built into
 * Chrome and Android, it needs no library, and — the part that matters for a
 * till that has to keep working — it runs on the device with nothing sent
 * anywhere.
 *
 * Not every browser has it. Safari and Firefox do not, and the camera is
 * blocked outright in some contexts, so every failure here ends in a sentence
 * telling the cashier what to do instead rather than a dead screen.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { Button, Modal } from "./ui";

/** The symbologies actually printed on shop goods. Narrowing the list makes
    detection faster and cuts false reads off packaging noise. */
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

type Support = "checking" | "ready" | "unsupported";

interface Detector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): Detector;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

/** A short click on every read. A cashier scanning a basket is looking at the
    goods, not the screen, so the confirmation has to be audible. Synthesised
    rather than a sound file, because the portable build is one file. */
function beep() {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return;
    const context = new Ctor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = 1180;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.12);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.13);
    oscillator.onended = () => void context.close();
  } catch {
    // A till with no sound card still has to scan.
  }
}

export function CameraScanner({
  title,
  mode,
  onCode,
  onClose,
}: {
  title: string;
  /** `once` closes on the first read — capturing a barcode onto a product.
      `continuous` keeps the camera open so a whole basket goes through in one
      pass, which is how a shop actually works. */
  mode: "once" | "continuous";
  /** Returns the line to show the cashier — a product name, or a complaint
      that the code is unknown. */
  onCode: (code: string) => string;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const [support, setSupport] = useState<Support>("checking");
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const handle = useCallback(
    (code: string) => {
      const now = Date.now();
      // The same box stays in front of the lens for many frames, and a shopper
      // buying two of something scans it twice on purpose. A second is the gap
      // between those two cases.
      if (lastRef.current.code === code && now - lastRef.current.at < 1000) return;
      lastRef.current = { code, at: now };
      beep();
      const line = onCode(code);
      setLog((current) => [line, ...current].slice(0, 6));
      if (mode === "once") onClose();
    },
    [mode, onCode, onClose],
  );

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    async function start() {
      if (!window.BarcodeDetector) {
        setSupport("unsupported");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          // The back camera on a phone; ignored by a laptop with one webcam.
          video: { facingMode: "environment" },
        });
        if (stopped) {
          for (const track of stream.getTracks()) track.stop();
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setSupport("ready");

        const detector = new window.BarcodeDetector({ formats: FORMATS });
        let busy = false;
        timer = window.setInterval(async () => {
          const video = videoRef.current;
          if (busy || !video || video.readyState < 2) return;
          busy = true;
          try {
            const found = await detector.detect(video);
            if (found[0]?.rawValue) handle(found[0].rawValue);
          } catch {
            // A dropped frame is not worth a message; the next one is 200ms away.
          } finally {
            busy = false;
          }
        }, 200);
      } catch (cause) {
        const name = (cause as DOMException)?.name;
        setSupport("unsupported");
        setError(
          name === "NotAllowedError"
            ? "The camera was blocked. Allow camera access for this page, then try again."
            : name === "NotFoundError"
              ? "No camera on this machine."
              : "The camera could not be started here.",
        );
      }
    }

    void start();

    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
      streamRef.current = null;
    };
  }, [handle]);

  return (
    <Modal title={title} onClose={onClose}>
      <div className="relative overflow-hidden rounded-xl border border-[#232b40] bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="aspect-[4/3] w-full object-cover"
        />
        {support === "ready" ? (
          /* A window to aim through. Detection uses the whole frame — the box
             is there to tell the cashier where to hold the packet. */
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[28%] w-[78%] rounded-lg border-2 border-[#6c7bf0]/80 shadow-[0_0_0_9999px_rgba(5,6,10,0.45)]" />
          </div>
        ) : null}
        {support !== "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <Camera size={22} className="text-[#5b6480]" />
            <p className="text-[13.5px] text-[#98a0bb]">
              {support === "checking"
                ? "Starting the camera…"
                : (error ??
                  "")}
            </p>
            {support === "unsupported" && !error ? (
              <p className="text-[13.5px] text-[#98a0bb]">
                This browser has no built-in barcode reader. Chrome and Android
                do; on Safari or Firefox, use a USB scanner or type the number.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {log.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {log.map((line, index) => (
            <li
              key={`${line}-${index}`}
              className={`flex items-center gap-2 text-[13.5px] ${index === 0 ? "text-[#8ee7bb]" : "text-[#6b7490]"}`}
            >
              <CheckCircle2 size={15} className="shrink-0" />
              {line}
            </li>
          ))}
        </ul>
      ) : support === "ready" ? (
        <p className="mt-3 text-center text-[13px] text-[#7e87a5]">
          Hold the barcode inside the box.
        </p>
      ) : null}

      <Button variant="primary" className="mt-4 h-[48px] w-full" onClick={onClose}>
        {mode === "continuous" && log.length > 0 ? "Done scanning" : "Close"}
      </Button>
    </Modal>
  );
}
