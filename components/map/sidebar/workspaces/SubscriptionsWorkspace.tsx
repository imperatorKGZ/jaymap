import { memo } from "react";
import { Toggle } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface SubscriptionsFilters {
  newListings: boolean;
  priceDrops: boolean;
}
export const SUBSCRIPTIONS_DEFAULTS: SubscriptionsFilters = { newListings: true, priceDrops: false };

function SubscriptionsWorkspace({ values, setValue }: WorkspaceProps<SubscriptionsFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-4 px-5 py-5">
      <p className="text-[13px] text-[var(--sb-text-muted)]">
        {t("subscriptions.description")}
      </p>
      <div className="flex flex-col gap-1 rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] p-1">
        <Toggle label={t("subscriptions.newListings")} checked={values.newListings} onChange={(v) => setValue("newListings", v)} />
        <Toggle label={t("subscriptions.priceDrops")} checked={values.priceDrops} onChange={(v) => setValue("priceDrops", v)} />
      </div>
    </div>
  );
}
export default memo(SubscriptionsWorkspace);
