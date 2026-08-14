/**
 * WorkspaceRenderer.tsx
 * ------------------------------------------------------------
 * Рендерит рабочую область текущего раздела по ключу из конфигурации.
 * Никаких if/switch по названиям разделов — просто реестр (map)
 * "ключ -> lazy-компонент". Добавление раздела = одна строка здесь.
 * ------------------------------------------------------------
 */
import { lazy, memo, Suspense } from "react";
import type { WorkspaceProps } from "./workspaces/types";
import { WORKSPACE_DEFAULTS } from "./workspaces/defaults";
import { useTranslation } from "@/lib/i18n";

// Примечание для дальнейшего развития: чтобы получить честный код-сплиттинг,
// вынесите *_DEFAULTS в отдельные .ts-файлы без React-кода — сейчас они
// соседствуют с компонентом в одном файле ради простоты примера.
const WORKSPACE_REGISTRY: Record<string, ReturnType<typeof lazy>> = {
  rental: lazy(() => import("./workspaces/RentalWorkspace")),
  commercial: lazy(() => import("./workspaces/CommercialWorkspace")),
  land: lazy(() => import("./workspaces/LandWorkspace")),
  daily: lazy(() => import("./workspaces/DailyRentalWorkspace")),
  agencies: lazy(() => import("./workspaces/AgenciesWorkspace")),
  favorites: lazy(() => import("./workspaces/FavoritesWorkspace")),
  subscriptions: lazy(() => import("./workspaces/SubscriptionsWorkspace")),
  history: lazy(() => import("./workspaces/HistoryWorkspace")),
  layers: lazy(() => import("./workspaces/MapLayersWorkspace")),
  settings: lazy(() => import("./workspaces/SettingsWorkspace")),
  profile: lazy(() => import("./workspaces/ProfileWorkspace")),
};

function WorkspaceFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 px-5 py-5" aria-busy="true" aria-label={t("sidebar.loadingAria")}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-11 animate-pulse rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)]" />
      ))}
    </div>
  );
}

interface WorkspaceRendererProps {
  workspaceKey: string;
  sectionId: string;
  getSectionFilters: <T extends Record<string, unknown>>(sectionId: string, defaults: T) => T;
  setFilter: (sectionId: string, key: string, value: unknown) => void;
  onSubmit?: () => void;
}

function WorkspaceRendererBase({
  workspaceKey,
  sectionId,
  getSectionFilters,
  setFilter,
  onSubmit,
}: WorkspaceRendererProps) {
  const Component = WORKSPACE_REGISTRY[workspaceKey];
  if (!Component) return null;

  const defaults = WORKSPACE_DEFAULTS[workspaceKey] ?? {};
  const values = getSectionFilters(sectionId, defaults);

  const setValue = (key: string, value: unknown) => setFilter(sectionId, key, value);

  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <Component sectionId={sectionId} values={values} setValue={setValue} onSubmit={onSubmit} />
    </Suspense>
  );
}

export const WorkspaceRenderer = memo(WorkspaceRendererBase);
