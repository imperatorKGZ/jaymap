/**
 * sidebarConfig.tsx
 * ------------------------------------------------------------
 * Единственное место, где перечислены разделы Sidebar.
 * Ни один компонент Sidebar не содержит if/switch по названиям
 * разделов — вся логика отображения строится по этому массиву.
 *
 * Добавить новый раздел = добавить новый объект сюда
 * и (если нужна рабочая область) зарегистрировать её
 * в WorkspaceRenderer.tsx.
 *
 * Локализация: захардкоженный "title" заменён на "titleKey" — ключ
 * словаря переводов (lib/i18n). Сам текст берётся через t(titleKey)
 * в компонентах, которые его отображают (SidebarNavigation,
 * SidebarFooter, SidebarWorkspace, SidebarHeader).
 * ------------------------------------------------------------
 */
import {
  RentalIcon,
  CommercialIcon,
  LandIcon,
  DailyIcon,
  AgenciesIcon,
  FavoritesIcon,
  SubscriptionsIcon,
  HistoryIcon,
  MapToolsIcon,
  SettingsIcon,
  ProfileIcon,
} from "./icons";
import type { IconSource } from "./IconRenderer";
import type { TranslationKey } from "@/lib/i18n";

export type SidebarSectionType = "main" | "secondary";

export interface SidebarPermissions {
  /** Например: гостям видно, но недоступно; ролям агентства и т.д. */
  requiresAuth?: boolean;
  roles?: string[];
}

export interface SidebarSection {
  id: string;
  titleKey: TranslationKey;
  icon: IconSource;
  type: SidebarSectionType;
  /** Ключ компонента рабочей области, см. WorkspaceRenderer.tsx */
  workspace: string;
  permissions?: SidebarPermissions;
}

export const SIDEBAR_SECTIONS: SidebarSection[] = [
  // ---------- Основные режимы приложения ----------
  { id: "rental", titleKey: "sidebar.sections.rental", icon: RentalIcon, type: "main", workspace: "rental" },
  { id: "commercial", titleKey: "sidebar.sections.commercial", icon: CommercialIcon, type: "main", workspace: "commercial" },
  { id: "land", titleKey: "sidebar.sections.land", icon: LandIcon, type: "main", workspace: "land" },
  { id: "daily", titleKey: "sidebar.sections.daily", icon: DailyIcon, type: "main", workspace: "daily" },
  {
    id: "agencies",
    titleKey: "sidebar.sections.agencies",
    icon: AgenciesIcon,
    type: "main",
    workspace: "agencies",
  },

  // ---------- Вспомогательные разделы ----------
  {
    id: "favorites",
    titleKey: "sidebar.sections.favorites",
    icon: FavoritesIcon,
    type: "secondary",
    workspace: "favorites",
    permissions: { requiresAuth: true },
  },
  {
    id: "subscriptions",
    titleKey: "sidebar.sections.subscriptions",
    icon: SubscriptionsIcon,
    type: "secondary",
    workspace: "subscriptions",
    permissions: { requiresAuth: true },
  },
  { id: "history", titleKey: "sidebar.sections.history", icon: HistoryIcon, type: "secondary", workspace: "history" },
  { id: "layers", titleKey: "sidebar.sections.layers", icon: MapToolsIcon, type: "secondary", workspace: "layers" },
  { id: "settings", titleKey: "sidebar.sections.settings", icon: SettingsIcon, type: "secondary", workspace: "settings" },
  {
    id: "profile",
    titleKey: "sidebar.sections.profile",
    icon: ProfileIcon,
    type: "secondary",
    workspace: "profile",
    permissions: { requiresAuth: true },
  },
];

export const mainSections = SIDEBAR_SECTIONS.filter((s) => s.type === "main");
export const secondarySections = SIDEBAR_SECTIONS.filter((s) => s.type === "secondary");

export function getSectionById(id: string | null): SidebarSection | undefined {
  if (!id) return undefined;
  return SIDEBAR_SECTIONS.find((s) => s.id === id);
}
