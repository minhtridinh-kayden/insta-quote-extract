import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type NoticeTone = "neutral" | "warning" | "problem";

const TONES = {
  neutral: { variant: "default", Icon: Info },
  warning: { variant: "warning", Icon: TriangleAlert },
  problem: { variant: "destructive", Icon: CircleAlert },
} as const;

type NoticeProps = {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
};

export function Notice({ tone, title, children }: NoticeProps) {
  const { variant, Icon } = TONES[tone];
  return (
    <Alert variant={variant} role={tone === "neutral" ? "status" : "alert"} className="p-4">
      <Icon aria-hidden="true" />
      <AlertTitle className="text-base font-semibold">{title}</AlertTitle>
      <AlertDescription className="space-y-2 text-sm text-foreground">{children}</AlertDescription>
    </Alert>
  );
}
