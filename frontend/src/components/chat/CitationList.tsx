import type { CitationResponse } from "@/types/chat";

type CitationListProps = {
  citations: CitationResponse[];
};

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Citations"
      className="mt-3 flex flex-wrap gap-2"
    >
      {citations.map((citation) => (
        <article
          key={`${citation.document_id}-${citation.chunk_id}`}
          className="rounded-full bg-[var(--accent-soft)] px-[10px] py-[7px] text-[0.75rem] font-semibold text-[var(--accent)]"
          title={citation.snippet}
        >
          {citation.source}
          {citation.page !== null ? ` · p.${citation.page}` : ""}
        </article>
      ))}
    </section>
  );
}
