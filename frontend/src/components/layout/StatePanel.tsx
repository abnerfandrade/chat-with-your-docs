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
  default: "border-[var(--line)] bg-[var(--panel-soft)]",
  error: "border-rose-400/20 bg-[rgba(127,29,29,0.22)]",
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
        "w-full rounded-[18px] border px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] sm:px-6",
        toneClassName[tone],
        align === "center" ? "text-center" : "text-left",
      ].join(" ")}
    >
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#8ba2c6]">
        {eyebrow}
      </p>
      <h3 className="mt-3 text-[1rem] font-semibold text-white">{title}</h3>
      <p className="mt-3 text-[0.84rem] leading-7 text-[var(--muted)]">{description}</p>
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
