type ChatHeaderProps = {
  title: string;
  description?: string;
};

export function ChatHeader({
  title,
  description,
}: ChatHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--panel)] px-[22px] py-[18px]">
      <div>
        <h1 className="m-0 text-[1rem] font-semibold">{title}</h1>
        {description ? (
          <p className="mt-[6px] text-[0.88rem] text-[var(--muted)]">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
