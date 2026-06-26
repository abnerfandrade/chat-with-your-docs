import { NavLink } from "react-router-dom";

type SidebarChatListProps = {
  onNavigate?: () => void;
};

const sampleChats = [
  {
    id: "onboarding-brief",
    title: "Onboarding brief",
    description: "Policies, roles, and first-week expectations.",
  },
  {
    id: "quarterly-plan",
    title: "Quarterly plan",
    description: "Goals, budget notes, and upcoming milestones.",
  },
  {
    id: "support-playbook",
    title: "Support playbook",
    description: "Escalation paths, SLA details, and troubleshooting steps.",
  },
];

export function SidebarChatList({ onNavigate }: SidebarChatListProps) {
  return (
    <section aria-labelledby="recent-chats-heading" className="min-h-0">
      <div className="px-2">
        <h2
          id="recent-chats-heading"
          className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-slate-500"
        >
          Recent chats
        </h2>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {sampleChats.map((chat) => (
          <NavLink
            key={chat.id}
            to={`/chat/${chat.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "rounded-2xl border px-3 py-3 text-left transition",
                isActive
                  ? "border-white/10 bg-white/10 shadow-[inset_3px_0_0_rgba(124,199,192,0.55)]"
                  : "border-transparent hover:bg-white/6",
              ].join(" ")
            }
          >
            <strong className="block truncate text-sm font-semibold text-slate-100">
              {chat.title}
            </strong>
            <span className="mt-1.5 block line-clamp-2 text-sm leading-6 text-slate-400">
              {chat.description}
            </span>
          </NavLink>
        ))}
      </div>
    </section>
  );
}
