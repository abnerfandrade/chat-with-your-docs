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
          className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-[14px]"
        >
          <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#8ba2c6]">
            {stat.label}
          </p>
          <p className="mt-3 text-[1.8rem] font-semibold text-white">
            {stat.getValue(documents)}
          </p>
          <p className="mt-2 text-[0.82rem] leading-6 text-[var(--muted)]">
            {stat.description}
          </p>
        </article>
      ))}
    </section>
  );
}
