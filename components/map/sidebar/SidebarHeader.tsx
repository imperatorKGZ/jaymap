/**
 * SidebarHeader.tsx
 * ------------------------------------------------------------
 * Заголовок РАБОЧЕЙ ОБЛАСТИ (не приложения — лого и бренд уже
 * есть в Navbar, здесь их быть не должно).
 * Показывает: кнопку "← Главное" / "×" и заголовок текущего раздела.
 * ------------------------------------------------------------
 */
import { memo } from "react";
import { ChevronLeftIcon } from "./icons";
import { IconRenderer } from "./IconRenderer";
import { useTranslation } from "@/lib/i18n";

interface SidebarHeaderProps {
  title: string;
  onBack: () => void;
  backLabel?: string;
}

function SidebarHeaderBase({ title, onBack, backLabel }: SidebarHeaderProps) {
  const { t } = useTranslation();
  const resolvedBackLabel = backLabel ?? t("sidebar.backDefault");
  return (
    <div className="flex items-center gap-2 px-3 pb-2 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-[36px] items-center gap-1 rounded-full px-2 text-[13px] font-medium text-[var(--sb-text-muted)] transition-colors hover:bg-[var(--sb-hover-bg)] hover:text-[var(--sb-text-strong)]"
      >
        <IconRenderer icon={ChevronLeftIcon} size={16} />
        {resolvedBackLabel}
      </button>
      <span className="mx-1 h-4 w-px bg-[var(--sb-divider)]" />
      <h2 className="truncate text-[14px] font-semibold text-[var(--sb-text-strong)]">{title}</h2>
    </div>
  );
}

export const SidebarHeader = memo(SidebarHeaderBase);
