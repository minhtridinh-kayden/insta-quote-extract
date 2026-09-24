import { readFileSync } from "node:fs";
import path from "node:path";

export type ExpectedLine = Record<string, string | Record<string, string>>;

export type ExpectedRefusal = {
  code: string;
  scope: string;
  page?: number;
  lineId?: string;
  field?: string;
  candidateRaws?: string[];
};

export type ExpectedFixture = {
  httpStatus: number;
  status: string;
  pageCount: number;
  lineCount: number;
  lines?: ExpectedLine[];
  mustNotHaveFields?: string[];
  documentTotals: string[];
  linesBySection?: Record<string, number>;
  linesByPage?: Record<string, number>;
  pageStatus?: Record<string, string>;
  refusals: ExpectedRefusal[];
  forbiddenInOutput: string[];
};

const expected = JSON.parse(
  readFileSync(path.resolve(__dirname, "../../fixtures/expected.json"), "utf8"),
) as Record<string, ExpectedFixture>;

export function expectedFor(name: string): ExpectedFixture {
  return expected[name];
}

export const EXPECTED_FIXTURES = Object.keys(expected).filter((name) => name.endsWith(".pdf"));
