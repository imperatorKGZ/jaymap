/**
 * DailyRentalWorkspace — посуточная аренда: даты заезда/выезда,
 * количество гостей, мгновенное бронирование, рейтинг хозяина.
 */
import { memo } from "react";
import { Field, Stepper, Toggle, Segmented, PrimaryButton } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface DailyFilters {
  checkIn: string;
  checkOut: string;
  guests: number;
  instantBooking: boolean;
  minRating: string;
}

export const DAILY_DEFAULTS: DailyFilters = {
  checkIn: "",
  checkOut: "",
  guests: 2,
  instantBooking: false,
  minRating: "any",
};

function DailyRentalWorkspace({ values, setValue, onSubmit }: WorkspaceProps<DailyFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("daily.dates")}>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={values.checkIn}
            onChange={(e) => setValue("checkIn", e.target.value)}
            className="h-11 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3 text-[13px] text-[var(--sb-text-strong)] outline-none focus:border-[var(--sb-accent)]"
          />
          <input
            type="date"
            value={values.checkOut}
            onChange={(e) => setValue("checkOut", e.target.value)}
            className="h-11 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3 text-[13px] text-[var(--sb-text-strong)] outline-none focus:border-[var(--sb-accent)]"
          />
        </div>
      </Field>

      <Field label={t("daily.guests")}>
        <Stepper label={t("daily.guestsCount")} value={values.guests} onChange={(v) => setValue("guests", v)} min={1} max={16} />
      </Field>

      <Field label={t("daily.hostRating")}>
        <Segmented
          value={values.minRating}
          onChange={(v) => setValue("minRating", v)}
          options={[
            { value: "any", label: t("common.any") },
            { value: "4", label: "4+" },
            { value: "4.5", label: "4.5+" },
          ]}
        />
      </Field>

      <Toggle
        label={t("daily.instantBooking")}
        description={t("daily.instantBookingDesc")}
        checked={values.instantBooking}
        onChange={(v) => setValue("instantBooking", v)}
      />

      <PrimaryButton onClick={onSubmit}>{t("daily.showOptions")}</PrimaryButton>
    </div>
  );
}

export default memo(DailyRentalWorkspace);
