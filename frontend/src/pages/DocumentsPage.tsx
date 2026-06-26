export function DocumentsPage() {
  return (
    <section className="grid min-h-[calc(100vh-7.5rem)] grid-rows-[auto_auto_1fr]">
      <header className="border-b border-white/6 px-6 py-5 lg:px-8">
        <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
          Documents route
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Documents library
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          This route is ready for the upload zone, corpus stats, and document
          library implementation.
        </p>
      </header>

      <div className="border-b border-white/6 px-6 py-4 lg:px-8">
        <div className="flex flex-wrap gap-3">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            Upload dropzone placeholder
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            Stats placeholder
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200">
            Library toolbar placeholder
          </span>
        </div>
      </div>

      <div className="px-6 py-8 lg:px-8">
        <div className="rounded-[24px] border border-white/6 bg-[var(--panel-soft)] p-5">
          <p className="text-sm leading-7 text-slate-400">
            `F06` will turn this page into the ingestion and document management
            workspace.
          </p>
        </div>
      </div>
    </section>
  );
}
