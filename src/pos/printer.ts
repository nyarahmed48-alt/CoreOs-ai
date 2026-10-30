/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Talking to a roll printer over Bluetooth.
 *
 * One thing to understand before anything else here makes sense: the browser
 * can only reach **Bluetooth Low Energy** printers. Web Bluetooth speaks BLE
 * and nothing else — it has no access to Bluetooth Classic, the older
 * serial-port profile that a great many cheap 58mm pocket printers use and
 * that Android pairs in its own settings screen. A Classic printer will pair
 * with the tablet perfectly, print from its own app perfectly, and never
 * appear in the chooser this file opens. That is not a bug anybody can fix
 * from inside a browser; it is the edge of what a web page is allowed to do.
 *
 * So the printing a shop gets depends on what they bought:
 *
 *  - **BLE printer** — this works. Pair once, print from then on.
 *  - **Classic/SPP printer** — the browser cannot see it. The till falls back
 *    to the browser's own print dialogue, which on Android can go through a
 *    printer's own app or a print service. Reaching it directly needs the
 *    till wrapped as an Android app, which is a decision rather than a patch.
 *  - **No printer at all** — the browser dialogue and the share button, which
 *    is what every shop has been using so far.
 *
 * The till therefore never assumes. It offers Bluetooth, says plainly when
 * the printer cannot be reached and why, and leaves the old route in place.
 */

import type { Sale, Settings } from "./types";
import { receiptJob, type PaperWidth } from "./escpos";
import { scoped } from "./edition";

/**
 * Services worth asking for by name.
 *
 * Chrome will not let a page touch a service it did not declare, and a
 * printer chosen from the all-devices chooser is useless if none of its
 * services were listed. These are the ones the common ESC/POS BLE modules
 * turn up with; the last two are generic serial bridges that a lot of cheap
 * boards are built on.
 */
const SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000ff80-0000-1000-8000-00805f9b34fb",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
];

export type PrintFault =
  /** This browser has no Web Bluetooth at all — every desktop Firefox and
      Safari, and every browser on iOS. */
  | "unsupported"
  /** The page is not in a secure context, so the API is hidden. */
  | "insecure"
  /** The chooser opened and the shop closed it. Not an error to shout about. */
  | "cancelled"
  /** Paired, but nothing on it will accept bytes — almost always a Classic
      printer that got picked out of the list by name. */
  | "noChannel"
  /** It was reachable and then was not: out of range, switched off, battery. */
  | "lost"
  /** The receipt could not be drawn, which means no canvas. */
  | "nocanvas";

export class PrintError extends Error {
  constructor(readonly fault: PrintFault) {
    super(fault);
    this.name = "PrintError";
  }
}

interface Bluetooth {
  requestDevice: (options: {
    filters?: unknown[];
    acceptAllDevices?: boolean;
    optionalServices?: string[];
  }) => Promise<BluetoothDeviceLike>;
  getDevices?: () => Promise<BluetoothDeviceLike[]>;
}

interface BluetoothDeviceLike {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<GattServer>;
    disconnect: () => void;
  };
}

interface GattServer {
  getPrimaryServices: () => Promise<GattService[]>;
}

interface GattService {
  getCharacteristics: () => Promise<GattCharacteristic[]>;
}

interface GattCharacteristic {
  properties: { write: boolean; writeWithoutResponse: boolean };
  writeValue?: (data: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (data: BufferSource) => Promise<void>;
}

function radio(): Bluetooth | null {
  const nav = navigator as unknown as { bluetooth?: Bluetooth };
  return nav.bluetooth ?? null;
}

/** Can this tablet print over Bluetooth at all, and if not, why not. */
export function bluetoothStanding(): "ready" | PrintFault {
  if (typeof window !== "undefined" && !window.isSecureContext) return "insecure";
  return radio() ? "ready" : "unsupported";
}

const REMEMBERED = scoped("coreos.pos.printer.v1");

function remember(id: string, name: string) {
  try {
    localStorage.setItem(REMEMBERED, JSON.stringify({ id, name }));
  } catch {
    // The shop picks it from the list again next time. Survivable.
  }
}

export function rememberedPrinter(): { id: string; name: string } | null {
  try {
    const raw = localStorage.getItem(REMEMBERED);
    return raw ? (JSON.parse(raw) as { id: string; name: string }) : null;
  } catch {
    return null;
  }
}

export function forgetPrinter() {
  try {
    localStorage.removeItem(REMEMBERED);
  } catch {
    // Nothing to forget.
  }
}

/**
 * The printer this till prints to, asking the shop only when it has to.
 *
 * Chrome remembers a device the shop has already allowed, so an ordinary sale
 * does not open a chooser — which matters, because a chooser needs a tap and
 * the cashier's hands are full. A till that has never been paired, or one
 * whose permission the browser has forgotten, asks.
 */
async function findPrinter(ask: boolean): Promise<BluetoothDeviceLike> {
  const bluetooth = radio();
  if (!bluetooth) throw new PrintError(bluetoothStanding() as PrintFault);

  const saved = rememberedPrinter();
  if (saved && bluetooth.getDevices) {
    try {
      const known = await bluetooth.getDevices();
      const match = known.find((device) => device.id === saved.id);
      if (match) return match;
    } catch {
      /* Chrome without the permission, or an older build. Fall through and
         ask, which always works. */
    }
  }

  if (!ask) throw new PrintError("cancelled");

  try {
    const device = await bluetooth.requestDevice({
      /* Printers advertise under a hundred different service UUIDs and half
         of them advertise none at all, so the shop picks from the list by the
         name on the printer's sticker. */
      acceptAllDevices: true,
      optionalServices: SERVICES,
    });
    remember(device.id, device.name ?? "");
    return device;
  } catch (problem) {
    if ((problem as DOMException)?.name === "NotFoundError") {
      throw new PrintError("cancelled");
    }
    throw new PrintError("lost");
  }
}

/** The first characteristic on the device that will take bytes. */
async function channel(device: BluetoothDeviceLike): Promise<{
  write: (data: Uint8Array) => Promise<void>;
  close: () => void;
}> {
  if (!device.gatt) throw new PrintError("noChannel");
  let server: GattServer;
  try {
    server = await device.gatt.connect();
  } catch {
    throw new PrintError("lost");
  }

  let found: GattCharacteristic | null = null;
  try {
    for (const service of await server.getPrimaryServices()) {
      for (const characteristic of await service.getCharacteristics()) {
        const { write, writeWithoutResponse } = characteristic.properties;
        if (writeWithoutResponse || write) {
          found = characteristic;
          /* Without-response is the fast one and what printers expect; keep
             looking only if this one cannot do it. */
          if (writeWithoutResponse) break;
        }
      }
      if (found?.properties.writeWithoutResponse) break;
    }
  } catch {
    throw new PrintError("lost");
  }

  if (!found) {
    device.gatt.disconnect();
    throw new PrintError("noChannel");
  }

  const target = found;
  return {
    write: async (data) => {
      if (target.properties.writeWithoutResponse && target.writeValueWithoutResponse) {
        await target.writeValueWithoutResponse(data);
        return;
      }
      if (target.writeValue) {
        await target.writeValue(data);
        return;
      }
      throw new PrintError("noChannel");
    },
    close: () => device.gatt?.disconnect(),
  };
}

/** How much goes out at once. Twenty bytes is the floor every BLE stack
    manages; printers with a larger MTU simply get more trips than they
    needed, which costs a little speed and never fails. */
const CHUNK = 180;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Prints one receipt.
 *
 * `ask` opens the device chooser when the till has no printer yet; a sale
 * printing in the background passes false, so a till that lost its printer
 * fails quietly to the screen rather than throwing a dialogue at a cashier
 * mid-queue.
 */
export async function printOverBluetooth(
  sale: Sale,
  settings: Settings,
  width: PaperWidth,
  ask = true,
): Promise<void> {
  const job = receiptJob(sale, settings, width);
  if (!job) throw new PrintError("nocanvas");

  const device = await findPrinter(ask);
  const link = await channel(device);
  try {
    for (const command of job) {
      for (let at = 0; at < command.length; at += CHUNK) {
        await link.write(command.subarray(at, at + CHUNK));
        /* A breath between writes. Thermal heads are slower than the radio,
           and a printer handed bytes faster than it can burn them drops them
           silently — the symptom is a receipt with bands missing out of the
           middle, which looks like a broken printer rather than a flooded
           one. */
        await wait(12);
      }
    }
    /* Let the last band reach the head before the link drops. */
    await wait(400);
  } catch (problem) {
    if (problem instanceof PrintError) throw problem;
    throw new PrintError("lost");
  } finally {
    link.close();
  }
}

/** A few lines of nothing, to prove the pairing works without wasting a sale
    on it. */
export async function printTestPage(
  settings: Settings,
  width: PaperWidth,
): Promise<void> {
  const sample: Sale = {
    id: "test",
    no: 0,
    receiptNo: "TEST",
    deviceId: settings.tillId,
    at: new Date().toISOString(),
    lines: [{ id: "l1", productId: "p1", name: settings.shopName, qty: 1, price: 0 }],
    subtotal: 0,
    discount: 0,
    rounding: 0,
    total: 0,
    method: "cash",
    tendered: 0,
    change: 0,
    staffId: "",
    staffName: "",
    shiftId: "",
  };
  await printOverBluetooth(sample, settings, width, true);
}
