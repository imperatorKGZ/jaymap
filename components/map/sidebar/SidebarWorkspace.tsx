/**
 * SidebarWorkspace.tsx
 * ------------------------------------------------------------
 * Рабочая область (правая часть раскрытой Sidebar, 288px).
 * Три взаимоисключающих состояния контента:
 *   1. "menu"      — список основных разделов (когда ничего не выбрано)
 *   2. "workspace" — фильтры выбранного основного раздела
 *   3. "secondary" — вспомогательный раздел (оверлей поверх workspace,
 *                    не уничтожает activeMain и его фильтры)
 * Прокручивается только эта область — сама Sidebar не скроллится.
 * ------------------------------------------------------------
 */

import { memo } from "react";

import { SidebarItem } from "./SidebarItem";
import { SidebarHeader } from "./SidebarHeader";
import { WorkspaceRenderer } from "./WorkspaceRenderer";

import type { SidebarSection } from "./sidebarConfig";
import type { SidebarState } from "./useSidebarState";

import { useTranslation } from "@/lib/i18n";

import type {
  FavoriteListing,
} from "@/lib/supabase/api";

interface SidebarWorkspaceProps {
  mainSections: SidebarSection[];
  activeMainSection?: SidebarSection;
  secondarySection?: SidebarSection;

  state: Pick<
    SidebarState,
    | "openMain"
    | "closeMain"
    | "closeSecondary"
    | "getSectionFilters"
    | "setFilter"
  >;

  onApply?: () => void;

  onFavoriteSelect?: (
    favorite: FavoriteListing
  ) => void;
}

function SidebarWorkspaceBase({
  mainSections,
  activeMainSection,
  secondarySection,
  state,
  onApply,
  onFavoriteSelect,
}: SidebarWorkspaceProps) {
  const { t } =
    useTranslation();

  // 3. Вспомогательный раздел поверх всего — activeMain не трогаем.
  if (secondarySection) {
    return (
      <div className="flex h-full flex-col">
        <SidebarHeader
          title={t(
            secondarySection.titleKey
          )}
          backLabel={
            activeMainSection
              ? t(
                  activeMainSection.titleKey
                )
              : undefined
          }
          onBack={
            state.closeSecondary
          }
        />

        <div className="sb-scroll flex-1 overflow-y-auto">
          <WorkspaceRenderer
            workspaceKey={
              secondarySection.workspace
            }
            sectionId={
              secondarySection.id
            }
            getSectionFilters={
              state.getSectionFilters
            }
            setFilter={
              state.setFilter
            }
            onFavoriteSelect={
              onFavoriteSelect
            }
          />
        </div>
      </div>
    );
  }

  // 2. Рабочая область основного раздела.
  if (activeMainSection) {
    return (
      <div className="flex h-full flex-col">
        <SidebarHeader
          title={t(
            activeMainSection.titleKey
          )}
          onBack={
            state.closeMain
          }
        />

        <div className="sb-scroll flex-1 overflow-y-auto">
          <WorkspaceRenderer
            workspaceKey={
              activeMainSection.workspace
            }
            sectionId={
              activeMainSection.id
            }
            getSectionFilters={
              state.getSectionFilters
            }
            setFilter={
              state.setFilter
            }
            onSubmit={
              onApply
            }
            onFavoriteSelect={
              onFavoriteSelect
            }
          />
        </div>
      </div>
    );
  }

  // 1. Главное меню — список основных режимов приложения.
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-2 pt-5">
        <p className="px-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">
          {t(
            "sidebar.mainMenuTitle"
          )}
        </p>
      </div>

      <div className="sb-scroll flex-1 overflow-y-auto px-2.5">
        <div className="flex flex-col gap-1">
          {mainSections.map(
            (
              section
            ) => (
              <SidebarItem
                key={
                  section.id
                }
                icon={
                  section.icon
                }
                label={t(
                  section.titleKey
                )}
                onClick={() =>
                  state.openMain(
                    section.id
                  )
                }
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

export const SidebarWorkspace =
  memo(
    SidebarWorkspaceBase
  );