/**
 * SidebarFooter.tsx
 * ------------------------------------------------------------
 * Нижняя часть иконочной рейки: вспомогательные разделы
 * (Избранное, Подписки, История, Слои карты, Настройки, Профиль).
 * Открытие любого из них НЕ уничтожает состояние текущего
 * основного раздела — это гарантируется в Sidebar.tsx /
 * useSidebarState (activeMainId и secondaryId независимы).
 * ------------------------------------------------------------
 */
import { memo } from "react";
import { SidebarItem } from "./SidebarItem";
import type { SidebarSection } from "./sidebarConfig";
import { useTranslation } from "@/lib/i18n";

interface SidebarFooterProps {
  sections: SidebarSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function SidebarFooterBase({ sections, activeId, onSelect }: SidebarFooterProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("sidebar.secondarySectionsAria")} className="flex flex-col gap-1 px-2.5 pb-3">
      <div className="mx-1 mb-2 h-px bg-[var(--sb-divider)]" />
      {sections.map((section) => (
        <SidebarItem
          key={section.id}
          icon={section.icon}
          label={t(section.titleKey)}
          active={section.id === activeId}
          collapsed
          onClick={() => onSelect(section.id)}
        />
      ))}
    </nav>
  );
}

export const SidebarFooter = memo(SidebarFooterBase);
