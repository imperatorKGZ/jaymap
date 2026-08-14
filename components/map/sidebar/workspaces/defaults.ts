/**
 * Лёгкие дефолтные значения фильтров для каждой рабочей области.
 * Импортируются отдельно от самих компонентов (которые грузятся лениво),
 * чтобы восстановить сохранённые фильтры ещё до загрузки чанка.
 */
import { RENTAL_DEFAULTS } from "./RentalWorkspace";
import { COMMERCIAL_DEFAULTS } from "./CommercialWorkspace";
import { LAND_DEFAULTS } from "./LandWorkspace";
import { DAILY_DEFAULTS } from "./DailyRentalWorkspace";
import { AGENCIES_DEFAULTS } from "./AgenciesWorkspace";
import { SUBSCRIPTIONS_DEFAULTS } from "./SubscriptionsWorkspace";
import { LAYERS_DEFAULTS } from "./MapLayersWorkspace";
import { SETTINGS_DEFAULTS } from "./SettingsWorkspace";

export const WORKSPACE_DEFAULTS: Record<string, Record<string, unknown>> = {
  rental: RENTAL_DEFAULTS,
  commercial: COMMERCIAL_DEFAULTS,
  land: LAND_DEFAULTS,
  daily: DAILY_DEFAULTS,
  agencies: AGENCIES_DEFAULTS,
  subscriptions: SUBSCRIPTIONS_DEFAULTS,
  layers: LAYERS_DEFAULTS,
  settings: SETTINGS_DEFAULTS,
  favorites: {},
  history: {},
  profile: {},
};
