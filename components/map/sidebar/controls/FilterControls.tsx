/**
 * FilterControls.tsx
 * ------------------------------------------------------------
 * Небольшой набор общих UI-примитивов для рабочих областей
 * (Field, Segmented, RangeRow, ChipGroup, Toggle, Stepper).
 * Это НЕ шаблон рабочей области — каждая рабочая область сама
 * решает, какие примитивы использовать и в каком порядке,
 * поэтому "Аренда", "Коммерция", "Земля" и т.д. выглядят по-разному,
 * хотя и переиспользуют одни и те же кирпичики (это нормально,
 * запрет из ТЗ касается копирования целой структуры раздела,
 * а не общих контролов уровня <input>).
 * ------------------------------------------------------------
 */
import { memo, type ReactNode } from "react";
import { useTranslation } from "@/lib/i18n";

export const Field = memo(function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--sb-text-muted)]">
        {label}
      </span>
      {children}
    </div>
  );
});

export const Segmented = memo(function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      role="radiogroup"
      className="flex flex-wrap gap-1.5 rounded-[var(--sb-radius-control)] bg-[var(--sb-hover-bg)] p-1"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={[
              "min-h-[36px] flex-1 rounded-[10px] px-3 text-[13px] font-medium transition-[background-color,color] duration-150",
              active
                ? "bg-[var(--sb-accent)] text-[var(--sb-icon-active)]"
                : "text-[var(--sb-text)] hover:bg-[var(--sb-hover-bg)]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
});

export const ChipGroup = memo(function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(opt.value)}
            className={[
              "min-h-[36px] rounded-full border px-3.5 text-[13px] font-medium transition-colors duration-150",
              active
                ? "border-[var(--sb-accent)] bg-[var(--sb-accent-soft)] text-[var(--sb-text-strong)]"
                : "border-[var(--sb-border)] text-[var(--sb-text)] hover:bg-[var(--sb-hover-bg)]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
});

export const RangeRow = memo(function RangeRow({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder,
  maxPlaceholder,
  suffix,
}: {
  minValue: string;
  maxValue: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  suffix?: string;
}) {
  const { t } = useTranslation();
  const resolvedMinPlaceholder = minPlaceholder ?? t("common.from");
  const resolvedMaxPlaceholder = maxPlaceholder ?? t("common.to");
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          inputMode="numeric"
          value={minValue}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder={resolvedMinPlaceholder}
          aria-label={resolvedMinPlaceholder}
          className="h-11 w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3.5 text-[13px] text-[var(--sb-text-strong)] outline-none placeholder:text-[var(--sb-text-muted)] focus:border-[var(--sb-accent)]"
        />
      </div>
      <span className="h-px w-3 bg-[var(--sb-border)]" />
      <div className="relative flex-1">
        <input
          inputMode="numeric"
          value={maxValue}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder={resolvedMaxPlaceholder}
          aria-label={resolvedMaxPlaceholder}
          className="h-11 w-full rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] bg-transparent px-3.5 text-[13px] text-[var(--sb-text-strong)] outline-none placeholder:text-[var(--sb-text-muted)] focus:border-[var(--sb-accent)]"
        />
      </div>
      {suffix && <span className="text-[12px] text-[var(--sb-text-muted)]">{suffix}</span>}
    </div>
  );
});

export const Toggle = memo(function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full min-h-[44px] items-center justify-between gap-3 rounded-[var(--sb-radius-control)] px-1 py-1.5 text-left transition-colors hover:bg-[var(--sb-hover-bg)]"
    >
      <span className="flex flex-col">
        <span className="text-[13px] font-medium text-[var(--sb-text-strong)]">{label}</span>
        {description && (
          <span className="text-[12px] text-[var(--sb-text-muted)]">{description}</span>
        )}
      </span>
      <span
        className={[
          "relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150",
          checked ? "bg-[var(--sb-accent)]" : "bg-[var(--sb-track-bg)]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-150",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
});

export const Stepper = memo(function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between rounded-[var(--sb-radius-control)] border border-[var(--sb-border)] px-3.5 py-2">
      <span className="text-[13px] font-medium text-[var(--sb-text-strong)]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${t("sidebar.decreaseAria")}: ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sb-text)] hover:bg-[var(--sb-hover-bg)]"
        >
          –
        </button>
        <span className="w-4 text-center text-[13px] text-[var(--sb-text-strong)]">{value}</span>
        <button
          type="button"
          aria-label={`${t("sidebar.increaseAria")}: ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--sb-text)] hover:bg-[var(--sb-hover-bg)]"
        >
          +
        </button>
      </div>
    </div>
  );
});

export const PrimaryButton = memo(function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[48px] w-full rounded-full bg-[var(--sb-cta)] text-[14px] font-semibold text-[var(--sb-cta-text)] transition-colors hover:bg-[var(--sb-cta-hover)]"
    >
      {children}
    </button>
  );
});
