import type { RefusalCode } from "@/lib/schema";
import { crossCheckMessages } from "./cross-check";
import { documentMessages } from "./document";
import { fieldMessages } from "./field";
import { pageMessages } from "./page";
import type { MessageBuilder, MessageBuilders, MessageInputs, RefusalCopy } from "./types";

const builders: MessageBuilders = {
  ...documentMessages,
  ...pageMessages,
  ...fieldMessages,
  ...crossCheckMessages,
};

export function describeRefusal<C extends RefusalCode>(code: C, input: MessageInputs[C]): RefusalCopy {
  return (builders[code] as MessageBuilder<C>)(input);
}

export type { LineRef, FieldRef, MessageInputs, RefusalCopy } from "./types";
