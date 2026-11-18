import type { FacilityId, GameState } from "../../engine/types";
import type { MissionApi } from "../../state/useMission";

export type ViewId =
  | "dashboard"
  | "base"
  | "resources"
  | "lifesupport"
  | "power"
  | "foodwater"
  | "crew"
  | "events"
  | "objectives"
  | "timeline"
  | "science"
  | "report";

export interface ViewProps {
  s: GameState;
  api: MissionApi;
  go: (v: ViewId, facility?: FacilityId) => void;
}
