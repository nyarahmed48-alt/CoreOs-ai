/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Scanning with the camera.
 *
 * A USB scanner is the fast way to work a counter, but most shops have a phone
 * before they have a scanner, so the camera is the one that gets used on day
 * one.
 *
 * Two readers, in that order. The browser's own BarcodeDetector where it
 * exists — it is the fastest, and on a phone it is the platform's own scanner
 * — and a decoder shipped inside the till where it does not. That fallback is
 * not a nicety: BarcodeDetector is missing from Windows and Linux Chrome,
 * Firefox and Safari, which is most shop counters, and a scanner that only
 * works on some machines is a scanner nobody trusts. Both read on the device
 * with nothing sent anywhere, which is the promise the rest of the till makes.
 *
 * The camera itself can still be refused — no permission, no camera, or a
 * browser that will not hand one to a page opened from a file — so every
 * failure ends in a sentence telling the cashier what to do instead.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2 } from "lucide-react";
import { Button, Modal } from "./ui";

/** The symbologies actually printed on shop goods. Narrowing the list makes
    detection faster and cuts false reads off packaging noise. */
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

type Support = "checking" | "ready" | "unsupported";

interface NativeDetector {
  detect: (source: CanvasImageSource) => Promise<{ rawValue: string }[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): NativeDetector;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

/** A live frame or a photograph — both are just pictures with a barcode
    somewhere in them. */
type Frame = HTMLVideoElement | HTMLImageElement;

function sizeOf(source: Frame): { width: number; height: number } {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

interface Reader {
  /** The code in this picture, or null. Never throws: a frame with nothing in
      it is the normal case, five times a second. */
  read: (source: Frame) => Promise<string | null>;
  stop: () => void;
}

/**
 * The browser's reader if it has one, ours if it does not.
 *
 * Ours is loaded only when the camera is opened, so a cashier who never scans
 * with the camera never pays for the decoder — on the site it is a separate
 * download, and in the portable file it simply sits unused.
 */
async function openReader(): Promise<Reader> {
  if (window.BarcodeDetector) {
    const native = new window.BarcodeDetector({ formats: FORMATS });
    return {
      read: async (source) => (await native.detect(source))[0]?.rawValue ?? null,
      stop: () => undefined,
    };
  }

  const {
    MultiFormatReader,
    BinaryBitmap,
    HybridBinarizer,
    HTMLCanvasElementLuminanceSource,
    BarcodeFormat,
    DecodeHintType,
  } = await import("@zxing/library");

  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.ITF,
  ]);
  // Shop lighting is bad and packets are curved; spend the extra milliseconds.
  hints.set(DecodeHintType.TRY_HARDER, true);

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  // Our own frame buffer. The library's convenience wrappers own a canvas of
  // their own and expect to drive the video themselves; the till already owns
  // both, so it hands over a still frame and nothing else.
  let canvas: HTMLCanvasElement | null = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  return {
    read: async (source) => {
      const { width, height } = sizeOf(source);
      if (!canvas || !context || !width) return null;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.drawImage(source, 0, 0, width, height);
      try {
        const source = new HTMLCanvasElementLuminanceSource(canvas);
        const bitmap = new BinaryBitmap(new HybridBinarizer(source));
        return reader.decode(bitmap).getText();
      } catch {
        // No code in this frame — the normal case, five times a second.
        return null;
      } finally {
        reader.reset();
      }
    },
    stop: () => {
      canvas = null;
    },
  };
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
  /* The till hands this component a fresh onCode on every render — it closes
     over the basket, which changes with each scan. Held as a ref, so the
     scanning loop below never has a reason to tear the camera down and start
     it again: restarting mid-basket costs a second of black screen and drops
     whatever was in front of the lens at the time. */
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<Reader | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  /** Frames in a row with nothing in them — how the till knows the packet has
      been taken away rather than still sitting in front of the lens. */
  const goneRef = useRef(0);
  const [support, setSupport] = useState<Support>("checking");
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [photoNote, setPhotoNote] = useState("");

  const handle = useCallback(
    (code: string) => {
      const now = Date.now();
      /* The same packet stays in front of the lens for as long as the cashier
         holds it there, and a shopper buying two of something scans it twice
         on purpose. Time alone cannot tell those apart — hold a tin still for
         four seconds and a timer rings up four tins. What separates them is
         the packet leaving the view, so a repeat of the same code counts only
         once the camera has seen nothing for a moment.

         A timer as a second escape was tried and removed: it rang up an extra
         tin whenever a cashier held one still while reaching for the next.
         Erring towards missing a duplicate is the right way round — a short
         basket is visible on the screen and fixed with one tap, while an extra
         line quietly overcharges the customer. */
      if (lastRef.current.code === code && goneRef.current < 3) return;
      lastRef.current = { code, at: now };
      goneRef.current = 0;
      beep();
      const line = onCodeRef.current(code);
      setLog((current) => [line, ...current].slice(0, 6));
      if (mode === "once") onCloseRef.current();
    },
    [mode],
  );

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let watchdog: number | undefined;
    let gaveUp = false;
    let reader: Reader | undefined;

    async function start() {
      try {
        reader = await openReader();
        readerRef.current = reader;

        /* A phone asked for the camera by a page it opened from a file often
           answers neither yes nor no: the permission prompt never appears and
           the promise never settles, which left this screen saying "Starting
           the camera…" for as long as anyone was willing to wait. Waiting
           forever is not a state a cashier can act on, so it becomes a
           refusal after seven seconds — and the photo route below still
           works, because that is the phone's own camera app rather than a
           permission this page has to be granted. */
        const asked = navigator.mediaDevices.getUserMedia({
          // The back camera on a phone; ignored by a laptop with one webcam.
          video: { facingMode: "environment" },
        });
        // A permission granted after we stopped waiting still opens a camera.
        // Nobody would be looking at it, so shut it off rather than leave the
        // light on above a counter.
        asked
          .then((late) => {
            if (stopped || gaveUp) {
              for (const track of late.getTracks()) track.stop();
            }
          })
          .catch(() => undefined);

        const stream = await Promise.race([
          asked,
          new Promise<MediaStream>((_, reject) => {
            watchdog = window.setTimeout(
              () => reject(new DOMException("No answer", "TimeoutError")),
              7000,
            );
          }),
        ]);
        window.clearTimeout(watchdog);
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

        let busy = false;
        timer = window.setInterval(async () => {
          const video = videoRef.current;
          if (busy || !video || video.readyState < 2 || !reader) return;
          busy = true;
          try {
            const code = await reader.read(video);
            if (code) handle(code);
            else goneRef.current += 1;
          } catch {
            // A dropped frame is not worth a message; the next one is 200ms away.
          } finally {
            busy = false;
          }
        }, 200);
      } catch (cause) {
        const name = (cause as DOMException)?.name;
        gaveUp = true;
        setSupport("unsupported");
        setError(
          name === "NotFoundError"
            ? "No camera on this machine. Use a USB scanner, or type the number."
            : name === "NotAllowedError"
              ? "The camera was blocked for this page. Take a photo instead — that uses the phone's own camera — or allow camera access and try again."
              : "This browser will not give the page a live camera. It usually will not for a page opened from a file. Take a photo instead — that uses the phone's own camera.",
        );
      }
    }

    void start();

    return () => {
      stopped = true;
      window.clearTimeout(watchdog);
      if (timer) window.clearInterval(timer);
      reader?.stop();
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
      streamRef.current = null;
    };
  }, [handle]);

  /**
   * The way in when the live camera is refused.
   *
   * `capture` hands the job to the phone's own camera app, which needs no
   * permission from this page — so it works from a file, where getUserMedia
   * does not. One photo, one barcode, which is slower than a live scan and
   * still beats typing thirteen digits.
   */
  async function readPhoto(file: File) {
    setPhotoNote("Reading the photo…");
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const reader = readerRef.current ?? (await openReader());
      readerRef.current = reader;
      const code = await reader.read(image);
      if (code) {
        setPhotoNote("");
        handle(code);
      } else {
        setPhotoNote(
          "No barcode found in that photo. Fill the frame with the barcode, hold the phone steady, and try again.",
        );
      }
    } catch {
      setPhotoNote("That photo could not be read. Try again.");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

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
              {support === "checking" ? "Starting the camera…" : error}
            </p>
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

      {/* Always available, not only after a failure: on a counter where the
          live camera is refused every time, this is the scanner. */}
      <input
        ref={photoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void readPhoto(file);
          event.target.value = "";
        }}
      />

      {photoNote ? (
        <p className="mt-3 text-center text-[13px] text-[#f0c078]">{photoNote}</p>
      ) : null}

      <Button
        variant={support === "ready" ? "ghost" : "primary"}
        className="mt-3 h-[48px] w-full"
        onClick={() => photoRef.current?.click()}
      >
        <Camera size={17} /> Take a photo of the barcode
      </Button>

      <Button variant={support === "ready" ? "primary" : "ghost"} className="mt-2 h-[48px] w-full" onClick={onClose}>
        {mode === "continuous" && log.length > 0 ? "Done scanning" : "Close"}
      </Button>
    </Modal>
  );
}
