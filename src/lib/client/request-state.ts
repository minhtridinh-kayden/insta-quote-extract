import type { SubmitOutcome } from "./outcome";

export type RequestState =
  | { phase: "idle" }
  | { phase: "uploading"; fileName: string }
  | { phase: "finished"; fileName: string; outcome: SubmitOutcome };
