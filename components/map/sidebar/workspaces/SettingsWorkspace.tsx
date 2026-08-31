import { memo } from "react";

import {
  Segmented,
  Toggle,
} from "../controls/FilterControls";

import type {
  WorkspaceProps,
} from "./types";

import {
  useTranslation,
} from "@/lib/i18n";

import {
  useSettings,
} from "@/lib/settings/provider";

interface SettingsFilters {
  theme:
    | "dark"
    | "light"
    | "custom";
  units: string;
  notifications: boolean;
}

export const SETTINGS_DEFAULTS: SettingsFilters = {
  theme: "dark",
  units: "metric",
  notifications: true,
};

function SettingsWorkspace({
  values,
  setValue,
}: WorkspaceProps<SettingsFilters>) {
  const {
    t,
  } = useTranslation();

  const {
    theme,
    setTheme,
  } = useSettings();

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">
          {t("settings.theme")}
        </span>

        <Segmented
          value={theme}
          onChange={(value) =>
            setTheme(
              value as
                | "dark"
                | "light"
                | "custom"
            )
          }
          options={[
            {
              value: "dark",
              label: t(
                "settings.themeDark"
              ),
            },
            {
              value: "light",
              label: t(
                "settings.themeLight"
              ),
            },
            {
              value: "custom",
              label: t(
                "settings.themeCustom"
              ),
            },
          ]}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">
          {t("settings.units")}
        </span>

        <Segmented
          value={values.units}
          onChange={(value) =>
            setValue(
              "units",
              value
            )
          }
          options={[
            {
              value: "metric",
              label: t(
                "settings.unitsMetric"
              ),
            },
            {
              value: "imperial",
              label: t(
                "settings.unitsImperial"
              ),
            },
          ]}
        />
      </div>

      <Toggle
        label={t(
          "settings.notifications"
        )}
        checked={
          values.notifications
        }
        onChange={(value) =>
          setValue(
            "notifications",
            value
          )
        }
      />
    </div>
  );
}

export default memo(
  SettingsWorkspace
);