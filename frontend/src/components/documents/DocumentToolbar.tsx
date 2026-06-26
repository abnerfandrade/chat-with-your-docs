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
    <section className="flex flex-col gap-4 rounded-[24px] border border-white/6 bg-[var(--panel-soft)] px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.16em] text-slate-500">
          Library controls
        </p>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          {resultCount} document{resultCount === 1 ? "" : "s"} shown in the library.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
        <label className="text-sm text-slate-200">
          Search
          <input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by file name..."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1722] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[var(--accent)]"
          />
        </label>

        <label className="text-sm text-slate-200">
          Sort by
          <select
            value={sortValue}
            onChange={(event) =>
              onSortChange(
                event.target.value as "newest" | "oldest" | "filename" | "status",
              )
            }
            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0f1722] px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--accent)]"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="filename">File name</option>
            <option value="status">Status</option>
          </select>
        </label>
      </div>
    </section>
  );
}
