/**
 * LOCAL PERSISTENCE
 *
 * Saves are versioned JSON in localStorage. Loading validates the shape; a
 * corrupt or outdated save is moved aside to a backup key (never silently
 * deleted) and the player is offered a fresh mission.
 */
import { SAVE_VERSION } from "./config";
import { SCENARIOS } from "./scenarios";
import { FACILITY_IDS, RESOURCE_IDS, type GameState } from "./types";

export const SAVE_KEY = "lunar-command:save";
export const BACKUP_KEY = "lunar-command:save-backup";
export const SETTINGS_KEY = "lunar-command:settings";

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | { status: "empty" }
  | { status: "ok"; state: GameState }
  | { status: "corrupt"; reason: string }
  | { status: "outdated"; reason: string };

function store(): KeyValueStore | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);

export function validateState(v: unknown): { ok: boolean; state?: GameState; reason?: string } {
  if (!v || typeof v !== "object") return { ok: false, reason: "Save is not an object." };
  const s = v as Partial<GameState>;
  if (s.version !== SAVE_VERSION) return { ok: false, reason: `Save version ${String(s.version)} does not match ${SAVE_VERSION}.` };
  if (!SCENARIOS.some((x) => x.id === s.scenarioId)) return { ok: false, reason: "Unknown scenario." };
  if (!isNum(s.hour) || (s.hour as number) < 0) return { ok: false, reason: "Invalid mission time." };
  if (!s.resources || !RESOURCE_IDS.every((r) => isNum(s.resources![r]))) return { ok: false, reason: "Invalid resources." };
  if (!s.facilities || !FACILITY_IDS.every((f) => s.facilities![f] && isNum(s.facilities![f].condition))) return { ok: false, reason: "Invalid facilities." };
  if (!Array.isArray(s.crew) || s.crew.length === 0) return { ok: false, reason: "Invalid crew." };
  if (!s.habitat || !isNum(s.habitat.pressure) || !isNum(s.habitat.co2) || !isNum(s.habitat.temperature)) return { ok: false, reason: "Invalid habitat." };
  if (!Array.isArray(s.timeline) || !Array.isArray(s.history) || !Array.isArray(s.jobs) || !Array.isArray(s.modifiers)) return { ok: false, reason: "Invalid logs." };
  if (!Array.isArray(s.priorities) || s.priorities.length !== 5) return { ok: false, reason: "Invalid power priorities." };
  return { ok: true, state: s as GameState };
}

export function saveGame(state: GameState, kv: KeyValueStore | null = store()): boolean {
  if (!kv) return false;
  try {
    kv.setItem(SAVE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), state }));
    return true;
  } catch {
    return false;
  }
}

export function loadGame(kv: KeyValueStore | null = store()): LoadResult {
  if (!kv) return { status: "empty" };
  let raw: string | null;
  try {
    raw = kv.getItem(SAVE_KEY);
  } catch {
    return { status: "empty" };
  }
  if (!raw) return { status: "empty" };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    moveAside(kv, raw);
    return { status: "corrupt", reason: "The saved mission could not be read (invalid JSON)." };
  }
  const state = (parsed as { state?: unknown })?.state;
  const v = validateState(state);
  if (!v.ok || !v.state) {
    moveAside(kv, raw);
    const reason = v.reason ?? "Invalid save.";
    const outdated = (state as { version?: unknown })?.version !== SAVE_VERSION;
    return outdated ? { status: "outdated", reason } : { status: "corrupt", reason };
  }
  return { status: "ok", state: v.state };
}

function moveAside(kv: KeyValueStore, raw: string) {
  try {
    kv.setItem(BACKUP_KEY, raw);
    kv.removeItem(SAVE_KEY);
  } catch {
    /* storage full or blocked — nothing more we can do */
  }
}

export function clearSave(kv: KeyValueStore | null = store()) {
  try {
    kv?.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

export interface Settings {
  autoPauseOnEvents: boolean;
  speed: 1 | 2 | 4;
  onboardingDone: boolean;
}

export const DEFAULT_SETTINGS: Settings = { autoPauseOnEvents: true, speed: 1, onboardingDone: false };

export function loadSettings(kv: KeyValueStore | null = store()): Settings {
  try {
    const raw = kv?.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const p = JSON.parse(raw) as Partial<Settings>;
    return {
      autoPauseOnEvents: typeof p.autoPauseOnEvents === "boolean" ? p.autoPauseOnEvents : DEFAULT_SETTINGS.autoPauseOnEvents,
      speed: p.speed === 2 || p.speed === 4 ? p.speed : 1,
      onboardingDone: !!p.onboardingDone,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, kv: KeyValueStore | null = store()) {
  try {
    kv?.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) {
    return this.data.has(k) ? this.data.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
}
