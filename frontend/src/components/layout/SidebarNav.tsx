import { NavLink } from "react-router-dom";

type SidebarNavProps = {
  onNavigate?: () => void;
};

const navItems = [
  {
    to: "/chat",
    label: "Chats",
    description: "Open the assistant workspace and start a new thread.",
  },
  {
    to: "/documents",
    label: "Documents",
    description: "Upload files and manage the shared retrieval library.",
  },
];

export function SidebarNav({ onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Primary navigation" className="flex flex-col gap-[6px]">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              "rounded-[12px] border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]",
              isActive
                ? "border-white/8 bg-white/10 shadow-[inset_3px_0_0_rgba(124,199,192,0.55)]"
                : "border-transparent hover:bg-white/6",
            ].join(" ")
          }
        >
          <strong className="block text-[0.9rem] font-semibold text-slate-50">
            {item.label}
          </strong>
          <span className="mt-[5px] block text-[0.78rem] leading-7 text-[rgba(243,243,241,0.52)]">
            {item.description}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
