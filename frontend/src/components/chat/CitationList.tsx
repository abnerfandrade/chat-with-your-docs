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
      className="mt-4 rounded-[20px] border border-white/8 bg-black/12 px-4 py-4"
    >
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-slate-500">
        Sources
      </p>
      <div className="mt-3 flex flex-col gap-3">
        {citations.map((citation) => (
          <article
            key={`${citation.document_id}-${citation.chunk_id}`}
            className="rounded-[18px] border border-white/8 bg-white/5 px-3 py-3"
          >
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <strong className="text-slate-100">{citation.source}</strong>
              {citation.page !== null ? (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                  Page {citation.page}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {citation.snippet}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
