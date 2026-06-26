import type { DocumentStatus } from "@/types/document";

type StatusBadgeProps = {
  status: DocumentStatus;
};

const statusMeta: Record<
  DocumentStatus,
  { label: string; className: string; dotClassName: string }
> = {
  queued: {
    label: "Queued",
    className: "border-amber-400/25 bg-amber-500/10 text-amber-100",
    dotClassName: "bg-amber-300",
  },
  processing: {
    label: "Processing",
    className: "border-sky-400/25 bg-sky-500/10 text-sky-100",
    dotClassName: "bg-sky-300",
  },
  completed: {
    label: "Completed",
    className: "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
    dotClassName: "bg-emerald-300",
  },
  failed: {
    label: "Failed",
    className: "border-rose-400/25 bg-rose-500/10 text-rose-100",
    dotClassName: "bg-rose-300",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = statusMeta[status];

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
        meta.className,
      ].join(" ")}
    >
      <span className={["h-2 w-2 rounded-full", meta.dotClassName].join(" ")} />
      {meta.label}
    </span>
  );
}
