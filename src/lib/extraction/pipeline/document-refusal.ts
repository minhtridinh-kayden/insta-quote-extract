import type { Refusal } from "@/lib/schema";
import type { DocumentFailure } from "../pdf";
import { makeRefusal } from "../refusal";

export function documentRefusal(failure: DocumentFailure, fileName: string): Refusal {
  const base = { scope: "document" as const, technicalDetail: failure.detail };
  switch (failure.code) {
    case "NOT_A_PDF":
      return makeRefusal({ ...base, code: failure.code, message: { fileName } });
    case "ENCRYPTED":
    case "EMPTY_DOCUMENT":
      return makeRefusal({ ...base, code: failure.code, message: {} });
  }
}
