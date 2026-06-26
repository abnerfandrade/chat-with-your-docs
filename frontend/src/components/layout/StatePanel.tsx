import type { ReactNode } from "react";

type StatePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  tone?: "default" | "error";
  align?: "left" | "center";
};

const toneClassName = {
  default: "border-white/6 bg-[var(--panel-soft)]",
  error: "border-rose-400/18 bg-rose-500/8",
} as const;

export function StatePanel({
  eyebrow,
  title,
  description,
  actions,
  tone = "default",
  align = "center",
}: StatePanelProps) {
  return (
    <div
      className={[
        "w-full rounded-[28px] border px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6",
        toneClassName[tone],
        align === "center" ? "text-center" : "text-left",
      ].join(" ")}
    >
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
      {actions ? (
        <div
          className={[
            "mt-5 flex flex-wrap gap-3",
            align === "center" ? "justify-center" : "justify-start",
          ].join(" ")}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}
