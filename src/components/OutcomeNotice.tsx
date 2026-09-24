import { invalidResponseMessage, NETWORK_MESSAGE, type SubmitOutcome } from "@/lib/client";
import { describeRefusal } from "@/lib/extraction/messages";
import { Notice } from "./Notice";
import { Reference } from "./Reference";

type FailedOutcome = Exclude<SubmitOutcome, { kind: "result" }>;

export function OutcomeNotice({ outcome }: { outcome: FailedOutcome }) {
  switch (outcome.kind) {
    case "rejected":
      return (
        <Notice tone="warning" title="We couldn't read this file">
          <p>{outcome.refusal.userMessage}</p>
          {outcome.refusal.suggestedAction && <p className="font-medium">{outcome.refusal.suggestedAction}</p>}
          <Reference requestId={outcome.requestId} />
        </Notice>
      );
    case "tooLarge": {
      const { userMessage, suggestedAction } = describeRefusal("FILE_TOO_LARGE", { maxMb: outcome.maxMb });
      return (
        <Notice tone="warning" title="This file is too big">
          <p>{userMessage}</p>
          <p className="font-medium">{suggestedAction}</p>
        </Notice>
      );
    }
    case "badRequest":
      return (
        <Notice tone="warning" title="No file received">
          <p>{outcome.message}</p>
          <Reference requestId={outcome.requestId} />
        </Notice>
      );
    case "serverError":
      return (
        <Notice tone="problem" title="A problem on our side">
          <p>{outcome.message}</p>
          <Reference requestId={outcome.requestId} />
        </Notice>
      );
    case "networkError":
      return (
        <Notice tone="problem" title="Couldn't reach the server">
          <p>{NETWORK_MESSAGE}</p>
        </Notice>
      );
    case "invalidResponse":
      return (
        <Notice tone="problem" title="Unexpected response">
          <p>{invalidResponseMessage(outcome.requestId)}</p>
        </Notice>
      );
  }
}
