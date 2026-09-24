import { isExtraField, type Evidenced, type FieldPath, type LineItem, type Refusal, type Section } from "@/lib/schema";
import { lineLabel } from "../line-label";
import { makeRefusal } from "../refusal";
import type { BodyRow } from "./body";
import { FIELD_READERS, readExtra, type FieldProblem, type LineValues } from "./fields";

export type LineContext = { page: number; section: Section };

export type BuiltLine = { line: LineItem; refusals: Refusal[] };

export function buildLine({ page, section }: LineContext, { row, cells }: BodyRow, lineNo: number): BuiltLine {
  const id = `p${page}-l${lineNo}`;
  const values: LineValues = {};
  const extra: Record<string, Evidenced<string>> = {};
  const problems: { field: FieldPath; problem: FieldProblem }[] = [];

  for (const [column, runs] of cells) {
    const cell = { page, row, runs };
    if (isExtraField(column.field)) {
      const { value, problem } = readExtra(cell);
      if (value) extra[column.heading] = value;
      if (problem) problems.push({ field: column.field, problem });
    } else {
      const { values: read, problem } = FIELD_READERS[column.field](cell);
      Object.assign(values, read);
      if (problem) problems.push({ field: column.field, problem });
    }
  }

  const description = lineLabel(values.description, values.itemNo, lineNo);
  const refusals = problems.map(({ field, problem }) =>
    makeRefusal({
      code: problem.code,
      scope: "field",
      page,
      lineId: id,
      field,
      raw: problem.raw || undefined,
      sourceText: row.text,
      message: { page, description, field, raw: problem.raw },
      technicalDetail: problem.detail,
    }),
  );

  return {
    line: { id, page, section, ...values, extra, refusalIds: refusals.map((r) => r.id) },
    refusals,
  };
}
