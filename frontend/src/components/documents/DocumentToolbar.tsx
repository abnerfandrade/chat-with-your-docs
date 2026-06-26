type DocumentToolbarProps = {
  resultCount: number;
  searchValue: string;
  sortValue: "newest" | "oldest" | "filename" | "status";
  onSearchChange: (value: string) => void;
  onSortChange: (
    value: "newest" | "oldest" | "filename" | "status",
  ) => void;
};

export function DocumentToolbar({
  resultCount,
  searchValue,
  sortValue,
  onSearchChange,
  onSortChange,
}: DocumentToolbarProps) {
  return (
    <section className="flex flex-col gap-4 border-y border-[var(--line)] px-[22px] py-[18px] lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h3 className="m-0 text-[0.96rem] font-semibold">All documents</h3>
        <p className="mt-[6px] text-[0.82rem] text-[var(--muted)]" aria-live="polite">
          Search, scan metadata, and manage the indexed corpus.
          {" "}{resultCount} document{resultCount === 1 ? "" : "s"} shown.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-[10px]">
        <label>
          <span className="sr-only">Search documents</span>
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search documents..."
            className="min-w-[240px] rounded-[14px] border border-[var(--line)] bg-[#1a2432] px-3 py-[10px] text-[0.84rem] text-[var(--muted)] outline-none transition placeholder:text-slate-500 focus:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </label>

        <label>
          <span className="sr-only">Sort by</span>
          <select
            value={sortValue}
            onChange={(event) =>
              onSortChange(
                event.target.value as "newest" | "oldest" | "filename" | "status",
              )
            }
            className="rounded-full border border-[var(--line)] bg-[var(--panel-soft)] px-3 py-[9px] text-[0.78rem] font-semibold text-[var(--muted)] outline-none transition focus:border-[var(--accent)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <option value="newest">Most recent</option>
            <option value="oldest">Oldest first</option>
            <option value="filename">File name</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
    </section>
  );
}
