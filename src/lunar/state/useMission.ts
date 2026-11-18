/**
 * React binding for the simulation engine: holds the GameState, applies
 * actions through the pure engine, runs the real-time clock and persists to
 * localStorage. All simulation logic stays in src/lunar/engine.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { applyAction, type Action } from "../engine/actions";
import { createMission } from "../engine/init";
import {
  clearSave,
  loadGame,
  loadSettings,
  saveGame,
  saveSettings,
  type LoadResult,
  type Settings,
} from "../engine/persistence";
import { randomSeed } from "../engine/rng";
import type { GameState } from "../engine/types";

/** Real milliseconds per simulated hour at 1× speed. */
export const MS_PER_HOUR = 2000;

export interface Toast {
  id: number;
  tone: "info" | "error";
  text: string;
}

export function useMission() {
  const [initial] = useState<LoadResult>(() => loadGame());
  const [state, setState] = useState<GameState | null>(initial.status === "ok" ? initial.state : null);
  const [loadIssue, setLoadIssue] = useState<string | null>(
    initial.status === "corrupt" || initial.status === "outdated" ? initial.reason : null,
  );
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings());
  const [running, setRunning] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const toast = useCallback((text: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.filter((x) => x.text !== text).slice(-2), { id, tone, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const dispatch = useCallback(
    (action: Action) => {
      const cur = stateRef.current;
      if (!cur) return undefined;
      const r = applyAction(cur, action);
      if (r.error) toast(r.error, "error");
      if (r.state !== cur) {
        stateRef.current = r.state;
        setState(r.state);
      }
      if (r.stoppedBecause === "event" && action.type === "advance" && action.hours > 1) {
        toast(`Paused after ${r.hoursAdvanced} h — a decision is required.`);
      }
      return r;
    },
    [toast],
  );

  // Persist on every state change (cheap: a few hundred KB at most).
  useEffect(() => {
    if (!state) return;
    if (saveGame(state)) setSavedAt(Date.now());
  }, [state]);

  useEffect(() => saveSettings(settings), [settings]);

  const blocked = !!state?.pendingEvent && settings.autoPauseOnEvents;
  const ended = state?.status === "ended";

  // The real-time clock: one simulated hour per tick.
  useEffect(() => {
    if (!running || !state || blocked || ended) return;
    const id = window.setInterval(() => {
      dispatch({ type: "advance", hours: 1, stopOnEvent: settings.autoPauseOnEvents });
    }, MS_PER_HOUR / settings.speed);
    return () => window.clearInterval(id);
  }, [running, blocked, ended, settings.speed, settings.autoPauseOnEvents, dispatch, state === null]);

  useEffect(() => {
    if (ended) setRunning(false);
  }, [ended]);

  const startMission = useCallback((scenarioId: string) => {
    const s = createMission(scenarioId, randomSeed());
    stateRef.current = s;
    setState(s);
    setRunning(false);
    setLoadIssue(null);
  }, []);

  const abandonMission = useCallback(() => {
    clearSave();
    stateRef.current = null;
    setState(null);
    setRunning(false);
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => setSettingsState((s) => ({ ...s, ...patch })), []);

  return {
    state,
    dispatch,
    running,
    setRunning,
    blocked,
    settings,
    setSettings,
    startMission,
    abandonMission,
    loadIssue,
    dismissLoadIssue: () => setLoadIssue(null),
    toasts,
    toast,
    savedAt,
  };
}

export type MissionApi = ReturnType<typeof useMission>;
