/**
 * CommercialWorkspace — совершенно другой набор фильтров, чем "Аренда":
 * назначение помещения, площадь, ставка за м², класс здания, отдельный вход.
 */
import { memo } from "react";
import { Field, ChipGroup, RangeRow, Segmented, Toggle, PrimaryButton } from "../controls/FilterControls";
// RangeRow остаётся для поля "Площадь"; отдельный однозначный input используется для ставки.
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface CommercialFilters {
  purpose: string[];
  areaMin: string;
  areaMax: string;
  ratePerSqm: string;
  buildingClass: string;
  separateEntrance: boolean;
  groundFloor: boolean;
}

export const COMMERCIAL_DEFAULTS: CommercialFilters = {
  purpose: [],
  areaMin: "",
  areaMax: "",
  ratePerSqm: "",
  buildingClass: "any",
  separateEntrance: false,
  groundFloor: false,
};

function CommercialWorkspace({ values, setValue, onSubmit }: WorkspaceProps<CommercialFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("commercial.purpose")}>
        <ChipGroup
          value={values.purpose}
          onChange={(v) => setValue("purpose", v)}
          options={[
            { value: "office", label: t("commercial.office") },
            { value: "retail", label: t("commercial.retail") },
            { value: "warehouse", label: t("commercial.warehouse") },
            { value: "production", label: t("commercial.production") },
            { value: "catering", label: t("commercial.catering") },
          ]}
        />
      </Field>

      <Field label={t("commercial.buildingClass")}>
        <Segmented
          value={values.buildingClass}
          onChange={(v) => setValue("buildingClass", v)}
          options={[
            { value: "any", label: t("common.any") },
            { value: "a", label: "A" },
            { value: "b", label: "B" },
            { value: "c", label: "C" },
          ]}
        />
      </Field>

      <Field label={t("commercial.area")}>
        <RangeRow
          minValue={values.areaMin}
          maxValue={values.areaMax}
          onMinChange={(v) => setValue("areaMin", v)}
          onMaxChange={(v) => setValue("areaMax", v)}
        />
      </Field>

      <Field label={t("commercial.rate")}>
        <input
          inputMode="numeric"
          value={values.ratePerSqm}
          onChange={(e) => setValue("ratePerSqm", e.target.value)}
          placeholder={t("commercial.ratePlaceholder")}
          className="h-11 w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3.5 text-[13px] text-[var(--sb-text-strong)] outline-none placeholder:text-[var(--sb-text-muted)] focus:border-[var(--sb-accent)]"
        />
      </Field>

      <div className="flex flex-col gap-1 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] p-1">
        <Toggle
          label={t("commercial.separateEntrance")}
          checked={values.separateEntrance}
          onChange={(v) => setValue("separateEntrance", v)}
        />
        <Toggle label={t("commercial.groundFloor")} checked={values.groundFloor} onChange={(v) => setValue("groundFloor", v)} />
      </div>

      <PrimaryButton onClick={onSubmit}>{t("commercial.showListings")}</PrimaryButton>
    </div>
  );
}

export default memo(CommercialWorkspace);
