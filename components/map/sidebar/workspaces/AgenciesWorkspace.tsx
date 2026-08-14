/**
 * AgenciesWorkspace — отдельный интерфейс для раздела "Агентства":
 * это не фильтр объектов, а список/поиск компаний.
 */
import { memo } from "react";
import { Field, Segmented, ChipGroup } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface AgenciesFilters {
  sortBy: string;
  specialization: string[];
  query: string;
}

export const AGENCIES_DEFAULTS: AgenciesFilters = {
  sortBy: "rating",
  specialization: [],
  query: "",
};

const MOCK_AGENCIES = [
  { name: "Bishkek Realty Group", listings: 214, rating: 4.8 },
  { name: "Prime Estate KG", listings: 132, rating: 4.6 },
  { name: "Ala-Too Homes", listings: 98, rating: 4.5 },
];

function AgenciesWorkspace({ values, setValue }: WorkspaceProps<AgenciesFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6 px-5 py-5">
      <Field label={t("agencies.search")}>
        <input
          value={values.query}
          onChange={(e) => setValue("query", e.target.value)}
          placeholder={t("agencies.searchPlaceholder")}
          className="h-11 w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3.5 text-[13px] text-[var(--sb-text-strong)] outline-none placeholder:text-[var(--sb-text-muted)] focus:border-[var(--sb-accent)]"
        />
      </Field>

      <Field label={t("agencies.sort")}>
        <Segmented
          value={values.sortBy}
          onChange={(v) => setValue("sortBy", v)}
          options={[
            { value: "rating", label: t("agencies.byRating") },
            { value: "listings", label: t("agencies.byListings") },
            { value: "name", label: t("agencies.byName") },
          ]}
        />
      </Field>

      <Field label={t("agencies.specialization")}>
        <ChipGroup
          value={values.specialization}
          onChange={(v) => setValue("specialization", v)}
          options={[
            { value: "rental", label: t("agencies.rental") },
            { value: "commercial", label: t("agencies.commercial") },
            { value: "land", label: t("agencies.land") },
          ]}
        />
      </Field>

      <div className="flex flex-col gap-2 pt-1">
        {MOCK_AGENCIES.map((a) => (
          <div
            key={a.name}
            className="flex items-center justify-between rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] px-3.5 py-3"
          >
            <div className="flex flex-col">
              <span className="text-[13px] font-medium text-[var(--sb-text-strong)]">{a.name}</span>
              <span className="text-[12px] text-[var(--sb-text-muted)]">{a.listings} {t("agencies.listingsSuffix")}</span>
            </div>
            <span className="text-[13px] font-semibold text-[var(--sb-accent)]">★ {a.rating}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(AgenciesWorkspace);
