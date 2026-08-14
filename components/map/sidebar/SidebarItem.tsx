/**
 * SidebarItem.tsx — один пункт навигации (иконка + подпись).
 * Отвечает только за собственное отображение и hover/active состояния.
 */
import { memo } from "react";
import { IconRenderer } from "./IconRenderer";
import type { IconSource } from "./IconRenderer";

interface SidebarItemProps {
  icon: IconSource;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

function SidebarItemBase({ icon, label, active, collapsed, onClick }: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={[
        "group relative flex min-h-[44px] w-full items-center gap-3 rounded-[16px] px-3.5 transition-colors duration-150 ease-out",
        active ? "bg-[var(--sb-active-bg)]" : "hover:bg-[var(--sb-hover-bg)]",
        collapsed ? "justify-center px-0" : "justify-start",
      ].join(" ")}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--sb-accent)]"
        />
      )}
      <IconRenderer
        icon={icon}
        size={20}
        className={[
          "shrink-0 transition-colors duration-150",
          active
            ? "text-[var(--sb-accent)]"
            : "text-[var(--sb-icon-idle)] group-hover:text-[var(--sb-icon-hover)]",
        ].join(" ")}
      />
      <span
        className={[
          "overflow-hidden whitespace-nowrap text-[13.5px] font-medium transition-[opacity] duration-150 ease-out",
          collapsed ? "w-0 opacity-0" : "w-auto opacity-100",
          active ? "text-[var(--sb-text-strong)]" : "text-[var(--sb-text)]",
        ].join(" ")}
      >
        {label}
      </span>
    </button>
  );
}

export const SidebarItem = memo(SidebarItemBase);
