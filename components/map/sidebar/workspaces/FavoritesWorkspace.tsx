import { memo } from "react";
import { FavoritesIcon } from "../icons";
import { IconRenderer } from "../IconRenderer";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

const MOCK_FAVORITES = [
  { title: "2-комн. квартира, Асанбай", price: "38 000 ₽/мес" },
  { title: "Дом с участком, Кой-Таш", price: "125 000 ₽/мес" },
];

function FavoritesWorkspace(_: WorkspaceProps) {
  const { t } = useTranslation();
  if (MOCK_FAVORITES.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <IconRenderer icon={FavoritesIcon} size={28} className="text-[var(--sb-text-muted)]" />
        <p className="text-[13px] text-[var(--sb-text-muted)]">
          {t("favorites.empty")}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 px-5 py-5">
      {MOCK_FAVORITES.map((f) => (
        <div key={f.title} className="rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] px-3.5 py-3">
          <p className="text-[13px] font-medium text-[var(--sb-text-strong)]">{f.title}</p>
          <p className="text-[12px] text-[var(--sb-text-muted)]">{f.price}</p>
        </div>
      ))}
    </div>
  );
}

export default memo(FavoritesWorkspace);
