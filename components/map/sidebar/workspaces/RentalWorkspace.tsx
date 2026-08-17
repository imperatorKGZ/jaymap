import { memo } from "react";
import {
  Field,
  Segmented,
  RangeRow,
  Toggle,
  PrimaryButton,
} from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface RentalFilters {
  propertyType: string;
  priceMin: string;
  priceMax: string;
  rooms: number | null;
  areaMin: string;
  areaMax: string;
  floorMin: string;
  floorMax: string;
  furnished: boolean;
  parking: boolean;
  pets: boolean;
}

function RentalWorkspace({
  values,
  setValue,
  onSubmit,
}: WorkspaceProps<RentalFilters>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("rental.propertyType")}>
        <Segmented
          value={values.propertyType}
          onChange={(value) =>
            setValue("propertyType", value)
          }
          options={[
            {
              value: "any",
              label: t("common.any"),
            },
            {
              value: "apartment",
              label: t("rental.apartment"),
            },
            {
              value: "house",
              label: t("rental.house"),
            },
            {
              value: "room",
              label: t("rental.room"),
            },
          ]}
        />
      </Field>

      <Field label={t("rental.price")}>
        <RangeRow
          minValue={values.priceMin}
          maxValue={values.priceMax}
          onMinChange={(value) =>
            setValue("priceMin", value)
          }
          onMaxChange={(value) =>
            setValue("priceMax", value)
          }
        />
      </Field>

      <Field label={t("rental.rooms")}>
        <Segmented
          value={
            values.rooms === null
              ? "any"
              : String(values.rooms)
          }
          onChange={(value) => {
            if (value === "any") {
              setValue("rooms", null);
              return;
            }

            setValue(
              "rooms",
              Number(value)
            );
          }}
          options={[
            {
              value: "any",
              label: t("common.any"),
            },
            {
              value: "1",
              label: "1",
            },
            {
              value: "2",
              label: "2",
            },
            {
              value: "3",
              label: "3",
            },
            {
              value: "4",
              label: "4",
            },
            {
              value: "5",
              label: "5",
            },
            {
              value: "6",
              label: "6",
            },
            {
              value: "7",
              label: "7",
            },
            {
              value: "8",
              label: "8",
            },
          ]}
        />
      </Field>

      <Field label={t("rental.area")}>
        <RangeRow
          minValue={values.areaMin}
          maxValue={values.areaMax}
          onMinChange={(value) =>
            setValue("areaMin", value)
          }
          onMaxChange={(value) =>
            setValue("areaMax", value)
          }
        />
      </Field>

      <Field label={t("rental.floor")}>
        <RangeRow
          minValue={values.floorMin}
          maxValue={values.floorMax}
          onMinChange={(value) =>
            setValue("floorMin", value)
          }
          onMaxChange={(value) =>
            setValue("floorMax", value)
          }
        />
      </Field>

      <div className="flex flex-col gap-1 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] p-1">
        <Toggle
          label={t("rental.furnished")}
          checked={values.furnished}
          onChange={(value) =>
            setValue(
              "furnished",
              value
            )
          }
        />

        <Toggle
          label={t("rental.parking")}
          checked={values.parking}
          onChange={(value) =>
            setValue(
              "parking",
              value
            )
          }
        />

        <Toggle
          label={t("rental.pets")}
          checked={values.pets}
          onChange={(value) =>
            setValue(
              "pets",
              value
            )
          }
        />
      </div>

      <PrimaryButton onClick={onSubmit}>
        {t("rental.showListings")}
      </PrimaryButton>
    </div>
  );
}

export default memo(
  RentalWorkspace
);