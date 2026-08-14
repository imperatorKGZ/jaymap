/**
 * RentalWorkspace — рабочая область раздела "Аренда".
 * Тип жильё, цена, комнаты, площадь, этаж, мебель, парковка, животные.
 */
import { memo } from "react";
import { Field, Segmented, RangeRow, Toggle, Stepper, PrimaryButton } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface RentalFilters {
  propertyType: string;
  priceMin: string;
  priceMax: string;
  rooms: number;
  areaMin: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  furnished: boolean;
  parking: boolean;
  pets: boolean;
}

export const RENTAL_DEFAULTS: RentalFilters = {
  propertyType: "apartment",
  priceMin: "",
  priceMax: "",
  rooms: 1,
  areaMin: "",
  areaMax: "",
  floorMin: "",
  floorMax: "",
  furnished: false,
  parking: false,
  pets: false,
};

function RentalWorkspace({ values, setValue, onSubmit }: WorkspaceProps<RentalFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("rental.propertyType")}>
        <Segmented
          value={values.propertyType}
          onChange={(v) => setValue("propertyType", v)}
          options={[
            { value: "apartment", label: t("rental.apartment") },
            { value: "house", label: t("rental.house") },
            { value: "room", label: t("rental.room") },
          ]}
        />
      </Field>

      <Field label={t("rental.price")}>
        <RangeRow
          minValue={values.priceMin}
          maxValue={values.priceMax}
          onMinChange={(v) => setValue("priceMin", v)}
          onMaxChange={(v) => setValue("priceMax", v)}
        />
      </Field>

      <Field label={t("rental.rooms")}>
        <Stepper label={t("rental.roomsCount")} value={values.rooms} onChange={(v) => setValue("rooms", v)} min={0} max={8} />
      </Field>

      <Field label={t("rental.area")}>
        <RangeRow
          minValue={values.areaMin}
          maxValue={values.areaMax}
          onMinChange={(v) => setValue("areaMin", v)}
          onMaxChange={(v) => setValue("areaMax", v)}
        />
      </Field>

      <Field label={t("rental.floor")}>
        <RangeRow
          minValue={values.floorMin}
          maxValue={values.floorMax}
          onMinChange={(v) => setValue("floorMin", v)}
          onMaxChange={(v) => setValue("floorMax", v)}
        />
      </Field>

      <div className="flex flex-col gap-1 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] p-1">
        <Toggle label={t("rental.furnished")} checked={values.furnished} onChange={(v) => setValue("furnished", v)} />
        <Toggle label={t("rental.parking")} checked={values.parking} onChange={(v) => setValue("parking", v)} />
        <Toggle label={t("rental.pets")} checked={values.pets} onChange={(v) => setValue("pets", v)} />
      </div>

      <PrimaryButton onClick={onSubmit}>{t("rental.showListings")}</PrimaryButton>
    </div>
  );
}

export default memo(RentalWorkspace);
