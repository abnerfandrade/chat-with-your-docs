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
    <nav aria-label="Primary navigation" className="flex flex-col gap-2">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
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
          <strong className="block text-sm font-semibold text-slate-50">
            {item.label}
          </strong>
          <span className="mt-1.5 block text-sm leading-6 text-slate-400">
            {item.description}
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
