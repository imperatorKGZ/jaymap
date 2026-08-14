/**
 * SidebarNavigation.tsx
 * ------------------------------------------------------------
 * Иконочная "рейка" — присутствует и в свёрнутом (72px), и в
 * раскрытом состоянии. Отвечает только за быстрые переключения
 * между ОСНОВНЫМИ разделами. Полностью строится из конфигурации,
 * ни одного захардкоженного пункта.
 * ------------------------------------------------------------
 */
import { memo } from "react";
import { SidebarItem } from "./SidebarItem";
import type { SidebarSection } from "./sidebarConfig";
import { useTranslation } from "@/lib/i18n";

interface SidebarNavigationProps {
  sections: SidebarSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

function SidebarNavigationBase({ sections, activeId, onSelect }: SidebarNavigationProps) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t("sidebar.mainSectionsAria")} className="flex flex-col gap-1 px-2.5">
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

export const SidebarNavigation = memo(SidebarNavigationBase);
