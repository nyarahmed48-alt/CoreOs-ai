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
import { Camera, CheckCircle2, Zap, ZapOff } from "lucide-react";
import { Button, Modal } from "./ui";
import { beep } from "./beep";
import { useT } from "./useT";
import { translate } from "./i18n";

/** The symbologies actually printed on shop goods.
 *
 * Every format on this list is one the decoder tries on every frame, so the
 * list is the scanner's speed. Code 39 and ITF came off it: ITF in
 * particular is a plain run of bars that packaging noise imitates, and the
 * goods on these shelves carry EAN or UPC. If a shop turns up with cartons
 * marked in ITF-14, adding it back is this line. */
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"];

/** What the camera is being pointed at. Goods carry the barcodes above; a
    licence arrives as a QR code on the owner's screen, which is a different
    decoder and worth asking for on its own — looking for both at once is
    slower and reads packaging noise as licences. */
export type Symbols = "goods" | "qr";

/** How long the same code is ignored for after it has been rung up — on top
    of having to leave the box. See `handle` below. */
const SAME_CODE_MS = 1500;

type Support = "checking" | "ready" | "unsupported";

/** The torch is still not in the standard track types, though every Android
    Chrome has had it for years. Narrow and declared here rather than cast at
    the call site. */
interface TorchTrack {
  getCapabilities?: () => MediaTrackCapabilities & { torch?: boolean };
  applyConstraints: (constraints: {
    advanced?: { torch?: boolean }[];
  }) => Promise<void>;
}

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

/**
 * The slice of the picture worth looking at, as fractions of the whole.
 *
 * Decoding the whole frame means decoding the shelf behind the packet, the
 * cashier's sleeve and the counter — several times a second, on a tablet with
 * no power to spare. A barcode held where the guide box tells the cashier to
 * hold it lands in a fifth of the frame, so that is the fifth that gets
 * decoded. It is the single biggest thing that makes this faster, and it only
 * works because the box on screen and the rectangle below are the same
 * rectangle.
 */
export const BOX: Record<Symbols, { width: number; height: number }> = {
  goods: { width: 0.86, height: 0.36 },
  qr: { width: 0.72, height: 0.54 },
};

function cropOf(source: Frame, symbols: Symbols) {
  const { width, height } = sizeOf(source);
  const box = BOX[symbols];
  const w = Math.round(width * box.width);
  const h = Math.round(height * box.height);
  return {
    sx: Math.round((width - w) / 2),
    sy: Math.round((height - h) / 2),
    sw: w,
    sh: h,
  };
}

function sizeOf(source: Frame): { width: number; height: number } {
  return source instanceof HTMLVideoElement
    ? { width: source.videoWidth, height: source.videoHeight }
    : { width: source.naturalWidth, height: source.naturalHeight };
}

interface Reader {
  /** The code in this picture, or null. Never throws: a frame with nothing in
      it is the normal case, several times a second.

      `symbols` picks the crop; pass null to read the whole picture, which is
      what the photo route does — a photograph was aimed by a person and has
      no guide box to have been held inside. */
  read: (source: Frame, symbols: Symbols | null) => Promise<string | null>;
  stop: () => void;
}

/**
 * The browser's reader if it has one, ours if it does not.
 *
 * Ours is loaded only when the camera is opened, so a cashier who never scans
 * with the camera never pays for the decoder — on the site it is a separate
 * download, and in the portable file it simply sits unused.
 */
async function openReader(symbols: Symbols): Promise<Reader> {
  /* One canvas, reused. Both decoders read from it, so the crop is done once
     per frame instead of once per decoder, and nothing allocates in the loop. */
  let canvas: HTMLCanvasElement | null = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  /** The picture, cropped to the guide box, ready to decode. */
  function framed(source: Frame, within: Symbols | null): HTMLCanvasElement | null {
    if (!canvas || !context) return null;
    const whole = sizeOf(source);
    if (!whole.width) return null;
    const { sx, sy, sw, sh } = within
      ? cropOf(source, within)
      : { sx: 0, sy: 0, sw: whole.width, sh: whole.height };
    if (canvas.width !== sw || canvas.height !== sh) {
      canvas.width = sw;
      canvas.height = sh;
    }
    context.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas;
  }

  if (window.BarcodeDetector) {
    const native = new window.BarcodeDetector({
      formats: symbols === "qr" ? ["qr_code"] : FORMATS,
    });
    return {
      read: async (source, within) => {
        const picture = framed(source, within);
        if (!picture) return null;
        return (await native.detect(picture))[0]?.rawValue ?? null;
      },
      stop: () => {
        canvas = null;
      },
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
  hints.set(
    DecodeHintType.POSSIBLE_FORMATS,
    symbols === "qr"
      ? [BarcodeFormat.QR_CODE]
      : [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ],
  );
  // Shop lighting is bad and packets are curved; spend the extra milliseconds.
  hints.set(DecodeHintType.TRY_HARDER, true);

  const reader = new MultiFormatReader();
  reader.setHints(hints);

  // The library's convenience wrappers own a canvas of their own and expect
  // to drive the video themselves; the till already owns both, so it hands
  // over one cropped still and nothing else.
  return {
    read: async (source, within) => {
      const picture = framed(source, within);
      if (!picture) return null;
      try {
        const luminance = new HTMLCanvasElementLuminanceSource(picture);
        const bitmap = new BinaryBitmap(new HybridBinarizer(luminance));
        return reader.decode(bitmap).getText();
      } catch {
        // No code in this frame — the normal case, several times a second.
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

export function CameraScanner({
  title,
  mode,
  symbols = "goods",
  onCode,
  onClose,
}: {
  title: string;
  /** Goods by default; `qr` to read a licence off the owner's screen. */
  symbols?: Symbols;
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
  const { t, lang } = useT();
  const langRef = useRef(lang);
  langRef.current = lang;
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const readerRef = useRef<Reader | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const lastRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  /** Frames in a row with nothing in them — how the till knows the packet has
      been taken away rather than still sitting in front of the lens. */
  const goneRef = useRef(0);
  const [support, setSupport] = useState<Support>("checking");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [error, setError] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [photoNote, setPhotoNote] = useState("");

  const handle = useCallback(
    (code: string) => {
      const now = Date.now();
      /* The same packet stays in front of the lens for as long as the cashier
         holds it there, and a shopper buying two of something scans it twice
         on purpose. The two look identical to the decoder, so a repeat of the
         same code has to clear *both* of these:

           - it has to have left the box, and
           - a second and a half has to have passed.

         Either on its own has a hole. A timer alone was tried and taken out:
         hold a tin still for four seconds and it rings up four tins. Leaving
         the box alone lets a packet that wobbles out of frame and back in
         count twice. Together neither happens, and the cost is that a cashier
         deliberately scanning two identical tins waits a moment between them
         — which they spend moving the first one anyway.

         Erring towards missing a duplicate is the right way round: a short
         basket is on screen and fixed with one tap, while an extra line
         quietly overcharges the customer. */
      const sameAsLast = lastRef.current.code === code;
      if (sameAsLast && (goneRef.current < 3 || now - lastRef.current.at < SAME_CODE_MS)) {
        return;
      }
      lastRef.current = { code, at: now };
      goneRef.current = 0;
      beep();
      /* A counter in a market is loud enough to lose a beep in. The buzz is
         the confirmation that gets through, and a tablet without a motor
         simply ignores it. */
      try {
        navigator.vibrate?.(40);
      } catch {
        // Some browsers throw rather than return false. Not worth a word.
      }
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
        reader = await openReader(symbols);
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
          video: {
            // The back camera on a phone; ignored by a laptop with one webcam.
            facingMode: { ideal: "environment" },
            /* 720p, asked for rather than demanded. Enough detail to read a
               barcode off a curved packet, and small enough that a 4GB
               tablet can decode it several times a second — the camera's own
               maximum is often 4K, which looks no better here and costs
               every frame. `ideal` so a webcam that cannot do it gives what
               it has instead of refusing outright. */
            width: { ideal: 1280 },
            height: { ideal: 720 },
            /* Shop goods arrive at arm's length and then at the counter, so
               the lens has to keep hunting rather than lock once. Ignored by
               anything that cannot do it. */
            focusMode: { ideal: "continuous" },
          } as MediaTrackConstraints,
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

        /* A torch is a camera capability, not a browser one: most Android
           phones have it, most laptops do not, and asking a track that has
           none throws. So the button only appears once the camera itself
           says it has a light. */
        const track = stream.getVideoTracks()[0];
        trackRef.current = track ?? null;
        const able = (track as unknown as TorchTrack | undefined)?.getCapabilities?.();
        if (!stopped && able?.torch) setHasTorch(true);

        let busy = false;
        timer = window.setInterval(async () => {
          const video = videoRef.current;
          if (busy || !video || video.readyState < 2 || !reader) return;
          busy = true;
          try {
            const code = await reader.read(video, symbols);
            if (code) handle(code);
            else goneRef.current += 1;
          } catch {
            // A dropped frame is not worth a message; the next one is 200ms away.
          } finally {
            busy = false;
          }
        }, 120);
      } catch (cause) {
        const name = (cause as DOMException)?.name;
        gaveUp = true;
        setSupport("unsupported");
        /* Read through the ref: this runs inside an effect that must not be
           torn down and restarted every time the language object changes, or
           opening the camera would restart it mid-scan. */
        setError(
          translate(
            langRef.current,
            name === "NotFoundError"
              ? "camera.noCamera"
              : name === "NotAllowedError"
                ? "camera.blocked"
                : "camera.noLive",
          ),
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
  }, [handle, symbols]);

  /**
   * The shop light.
   *
   * Half these counters are lit by one bulb at the back, and a barcode in
   * shadow is a barcode that does not read however long it is held there.
   * The camera's own lamp fixes it outright.
   */
  async function toggleTorch() {
    const track = trackRef.current as unknown as TorchTrack | null;
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setTorchOn(next);
    } catch {
      /* Some cameras advertise a torch and then refuse it while streaming.
         Nothing to say about it: the scan still works, just darker. */
      setHasTorch(false);
    }
  }

  /**
   * The way in when the live camera is refused.
   *
   * `capture` hands the job to the phone's own camera app, which needs no
   * permission from this page — so it works from a file, where getUserMedia
   * does not. One photo, one barcode, which is slower than a live scan and
   * still beats typing thirteen digits.
   */
  async function readPhoto(file: File) {
    setPhotoNote(t("camera.reading"));
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const reader = readerRef.current ?? (await openReader(symbols));
      readerRef.current = reader;
      /* The whole photograph: a person aimed it, and there was no guide box
         on screen for them to have held the packet inside. */
      const code = await reader.read(image, null);
      if (code) {
        setPhotoNote("");
        handle(code);
      } else {
        setPhotoNote(t("camera.noBarcode"));
      }
    } catch {
      setPhotoNote(t("camera.photoFailed"));
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
          /* This is the part of the picture that actually gets decoded, to
             the pixel — so "hold it in the box" is true rather than advice.
             The darkening outside it is the whole point: it tells a cashier
             where to aim without a word in any language. */
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              style={{
                width: `${BOX[symbols].width * 100}%`,
                height: `${BOX[symbols].height * 100}%`,
              }}
              className="rounded-lg border-2 border-[#6c7bf0]/80 shadow-[0_0_0_9999px_rgba(5,6,10,0.55)]"
            />
          </div>
        ) : null}
        {support === "ready" && hasTorch ? (
          <button
            type="button"
            onClick={() => void toggleTorch()}
            aria-pressed={torchOn}
            aria-label={t("camera.light")}
            className={`absolute bottom-3 end-3 flex h-[46px] w-[46px] items-center justify-center rounded-full border transition-colors ${
              torchOn
                ? "border-[#f0c078] bg-[#f0c078] text-[#05060a]"
                : "border-[#ffffff33] bg-[#05060acc] text-white"
            }`}
          >
            {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
          </button>
        ) : null}

        {support !== "ready" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <Camera size={22} className="text-[#5b6480]" />
            <p className="text-[13.5px] text-[#98a0bb]">
              {support === "checking" ? t("camera.starting") : error}
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
          {t("camera.hold")}
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
        <Camera size={17} /> {t("camera.takePhoto")}
      </Button>

      <Button variant={support === "ready" ? "primary" : "ghost"} className="mt-2 h-[48px] w-full" onClick={onClose}>
        {mode === "continuous" && log.length > 0 ? t("camera.done") : t("camera.close")}
      </Button>
    </Modal>
  );
}
