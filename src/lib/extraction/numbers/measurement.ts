export type MeasurementBasis = "total" | "unstated";

const MEASUREMENT = /^\d+(?:\.\d+)?\s*(?:kg|g)$/i;
const TOTAL_MEASUREMENT = /^\d+(?:\.\d+)?\s*(?:kg|g)\s+total$/i;

export function measurementBasis(raw: string): MeasurementBasis | null {
  if (TOTAL_MEASUREMENT.test(raw)) return "total";
  if (MEASUREMENT.test(raw)) return "unstated";
  return null;
}
