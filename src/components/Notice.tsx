import type { ReactNode } from "react";

export type NoticeTone = "neutral" | "warning" | "problem";

const TONE_CLASSES: Record<NoticeTone, string> = {
  neutral: "border-stone-300 bg-white",
  warning: "border-amber-400 bg-amber-50",
  problem: "border-red-400 bg-red-50",
};

type NoticeProps = {
  tone: NoticeTone;
  title: string;
  children: ReactNode;
};

export function Notice({ tone, title, children }: NoticeProps) {
  return (
    <section role={tone === "neutral" ? "status" : "alert"} className={`rounded-lg border-l-4 p-4 ${TONE_CLASSES[tone]}`}>
      <h2 className="font-semibold text-stone-900">{title}</h2>
      <div className="mt-1 space-y-2 text-stone-800">{children}</div>
    </section>
  );
}
