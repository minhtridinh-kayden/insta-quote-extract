import { readFileSync } from "node:fs";
import path from "node:path";

export type ExpectedLine = Record<string, string | Record<string, string>>;

export type ExpectedFixture = {
  status: string;
  pageCount: number;
  lineCount: number;
  lines?: ExpectedLine[];
  mustNotHaveFields?: string[];
  refusals: { code: string; scope: string; page?: number; lineId?: string; field?: string }[];
};

const expected = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/expected.json"), "utf8"),
) as Record<string, ExpectedFixture>;

export function expectedFor(name: string): ExpectedFixture {
  return expected[name];
}
