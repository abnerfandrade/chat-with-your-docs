type ChatHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
};

export function ChatHeader({
  title,
  description,
  eyebrow = "Conversation",
}: ChatHeaderProps) {
  return (
    <header className="border-b border-white/6 px-6 py-5 lg:px-8">
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          {description}
        </p>
      ) : null}
    </header>
  );
}
