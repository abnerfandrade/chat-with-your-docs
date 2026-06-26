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
    <header className="border-b border-[var(--line)] px-[22px] py-[22px]">
      <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-[#7f95b8]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-[1.55rem] font-semibold tracking-[-0.03em] text-white">
        {title}
      </h2>
      {description ? (
        <p className="mt-[10px] max-w-[760px] text-[0.92rem] leading-7 text-[var(--muted)]">
          {description}
        </p>
      ) : null}
    </header>
  );
}
