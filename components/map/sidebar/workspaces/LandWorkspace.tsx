/**
 * LandWorkspace — собственный интерфейс для земельных участков:
 * назначение земли, площадь в сотках, коммуникации, статус документов.
 */
import { memo } from "react";
import { Field, RangeRow, ChipGroup, Segmented, PrimaryButton } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface LandFilters {
  landUse: string;
  areaSotMin: string;
  areaSotMax: string;
  utilities: string[];
  documentsReady: string;
}

export const LAND_DEFAULTS: LandFilters = {
  landUse: "residential",
  areaSotMin: "",
  areaSotMax: "",
  utilities: [],
  documentsReady: "any",
};

function LandWorkspace({ values, setValue, onSubmit }: WorkspaceProps<LandFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("land.landUse")}>
        <Segmented
          value={values.landUse}
          onChange={(v) => setValue("landUse", v)}
          options={[
            { value: "residential", label: t("land.residential") },
            { value: "agricultural", label: t("land.agricultural") },
            { value: "commercial", label: t("land.commercial") },
          ]}
        />
      </Field>

      <Field label={t("land.area")}>
        <RangeRow
          minValue={values.areaSotMin}
          maxValue={values.areaSotMax}
          onMinChange={(v) => setValue("areaSotMin", v)}
          onMaxChange={(v) => setValue("areaSotMax", v)}
        />
      </Field>

      <Field label={t("land.utilities")}>
        <ChipGroup
          value={values.utilities}
          onChange={(v) => setValue("utilities", v)}
          options={[
            { value: "electricity", label: t("land.electricity") },
            { value: "water", label: t("land.water") },
            { value: "gas", label: t("land.gas") },
            { value: "sewage", label: t("land.sewage") },
          ]}
        />
      </Field>

      <Field label={t("land.documents")}>
        <Segmented
          value={values.documentsReady}
          onChange={(v) => setValue("documentsReady", v)}
          options={[
            { value: "any", label: t("common.any") },
            { value: "ready", label: t("land.ready") },
            { value: "process", label: t("land.inProcess") },
          ]}
        />
      </Field>

      <PrimaryButton onClick={onSubmit}>{t("land.showPlots")}</PrimaryButton>
    </div>
  );
}

export default memo(LandWorkspace);
