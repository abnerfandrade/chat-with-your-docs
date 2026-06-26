import type { DocumentResponse } from "@/types/document";

type DocumentStatsProps = {
  documents: DocumentResponse[];
};

const statMeta = [
  {
    key: "total",
    label: "Total",
    description: "Files in the shared corpus",
    getValue: (documents: DocumentResponse[]) => documents.length,
  },
  {
    key: "completed",
    label: "Ready",
    description: "Available for retrieval",
    getValue: (documents: DocumentResponse[]) =>
      documents.filter((document) => document.status === "completed").length,
  },
  {
    key: "processing",
    label: "In progress",
    description: "Queued or processing",
    getValue: (documents: DocumentResponse[]) =>
      documents.filter(
        (document) =>
          document.status === "queued" || document.status === "processing",
      ).length,
  },
  {
    key: "failed",
    label: "Failed",
    description: "Need attention",
    getValue: (documents: DocumentResponse[]) =>
      documents.filter((document) => document.status === "failed").length,
  },
] as const;

export function DocumentStats({ documents }: DocumentStatsProps) {
  return (
    <section
      aria-label="Document statistics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {statMeta.map((stat) => (
        <article
          key={stat.key}
          className="rounded-[24px] border border-white/6 bg-[var(--panel-soft)] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">
            {stat.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {stat.getValue(documents)}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}
