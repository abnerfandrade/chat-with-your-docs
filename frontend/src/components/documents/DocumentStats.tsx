import type { DocumentResponse } from "@/types/document";

type DocumentStatsProps = {
  documents: DocumentResponse[];
  completedCount: number;
};

function getLastUploadLabel(documents: DocumentResponse[]) {
  if (documents.length === 0) {
    return "No uploads yet.";
  }

  const mostRecent = documents.reduce((latest, doc) => {
    const docDate = new Date(doc.created_at).getTime();
    const latestDate = new Date(latest.created_at).getTime();
    return docDate > latestDate ? doc : latest;
  });

  const diffMs = Date.now() - new Date(mostRecent.created_at).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return "Just now.";
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago.`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago.`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago.`;
}

export function DocumentStats({ documents, completedCount }: DocumentStatsProps) {
  const stats = [
    {
      key: "indexed",
      title: `${completedCount} indexed`,
      description: "Available across all chats.",
    },
    {
      key: "last-upload",
      title: "Last upload",
      description: getLastUploadLabel(documents),
    },
    {
      key: "supported",
      title: "Supported",
      description: "PDF, Markdown, and text files.",
    },
  ];

  return (
    <section
      aria-label="Document statistics"
      className="grid gap-3 grid-cols-1 sm:grid-cols-3"
    >
      {stats.map((stat) => (
        <article
          key={stat.key}
          className="rounded-[16px] border border-[var(--line)] bg-[var(--panel-soft)] px-4 py-[14px]"
        >
          <strong className="block text-[1rem] font-semibold">
            {stat.title}
          </strong>
          <span className="mt-[6px] block text-[0.82rem] text-[var(--muted)]">
            {stat.description}
          </span>
        </article>
      ))}
    </section>
  );
}
