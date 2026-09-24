import type { FieldPath, Refusal, RefusalCode, RefusalScope } from "@/lib/schema";
import { describeRefusal, type MessageInputs } from "./messages";

export type RefusalSpec<C extends RefusalCode> = {
  code: C;
  scope: RefusalScope;
  page?: number;
  lineId?: string;
  field?: FieldPath;
  key?: string;
  raw?: string;
  sourceText?: string;
  candidates?: Refusal["candidates"];
  message: MessageInputs[C];
  technicalDetail: string;
};

type RefusalLocation = Pick<Refusal, "code" | "page" | "lineId" | "field">;

function refusalId({ code, page, lineId, field }: RefusalLocation, key?: string): string {
  const location = lineId ?? (page ? `p${page}` : "doc");
  return ["r", code, location, field, key].filter(Boolean).join("-");
}

export function makeRefusal<C extends RefusalCode>({ message, key, ...fields }: RefusalSpec<C>): Refusal {
  return { id: refusalId(fields, key), ...fields, ...describeRefusal(fields.code, message) };
}
