import { memo } from "react";
import { Segmented, Toggle } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface SettingsFilters {
  theme: "dark" | "light" | "custom";
  units: string;
  notifications: boolean;
}
export const SETTINGS_DEFAULTS: SettingsFilters = { theme: "dark", units: "metric", notifications: true };

function SettingsWorkspace({ values, setValue }: WorkspaceProps<SettingsFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">{t("settings.theme")}</span>
        <Segmented
          value={values.theme}
          onChange={(v) => setValue("theme", v as SettingsFilters["theme"])}
          options={[
            { value: "dark", label: t("settings.themeDark") },
            { value: "light", label: t("settings.themeLight") },
            { value: "custom", label: t("settings.themeCustom") },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">{t("settings.units")}</span>
        <Segmented
          value={values.units}
          onChange={(v) => setValue("units", v)}
          options={[
            { value: "metric", label: t("settings.unitsMetric") },
            { value: "imperial", label: t("settings.unitsImperial") },
          ]}
        />
      </div>
      <Toggle label={t("settings.notifications")} checked={values.notifications} onChange={(v) => setValue("notifications", v)} />
    </div>
  );
}
export default memo(SettingsWorkspace);
