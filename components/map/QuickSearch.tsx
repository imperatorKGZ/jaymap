"use client";

import {
  useMemo,
} from "react";

import {
  RentalIcon,
  CommercialIcon,
  LandIcon,
  DailyIcon,
} from "@/components/map/sidebar/icons";

import type {
  ListingType,
} from "@/lib/filters/types";

import {
  useTranslation,
} from "@/lib/i18n";

interface QuickSearchProps {
  value?: ListingType | null;

  visible: boolean;

  mapZoom?: number;

  onSelect: (
    type: ListingType
  ) => void;
}

interface QuickSearchOption {
  value: ListingType;
  titleKey:
    | "sidebar.sections.rental"
    | "sidebar.sections.commercial"
    | "sidebar.sections.land"
    | "sidebar.sections.daily";
  icon: typeof RentalIcon;
}

const OPTIONS: QuickSearchOption[] = [
  {
    value: "rental",
    titleKey:
      "sidebar.sections.rental",
    icon: RentalIcon,
  },
  {
    value: "commercial",
    titleKey:
      "sidebar.sections.commercial",
    icon: CommercialIcon,
  },
  {
    value: "land",
    titleKey:
      "sidebar.sections.land",
    icon: LandIcon,
  },
  {
    value: "daily",
    titleKey:
      "sidebar.sections.daily",
    icon: DailyIcon,
  },
];

const CITY_VIEW_MIN_ZOOM =
  10.5;

export default function QuickSearch({
  value = null,
  visible,
  mapZoom,
  onSelect,
}: QuickSearchProps) {
  const {
    t,
  } = useTranslation();

  const options =
    useMemo(
      () =>
        OPTIONS.map(
          (option) => ({
            ...option,
            title:
              t(option.titleKey),
          })
        ),
      [t]
    );

  const isVisible =
    visible &&
    typeof mapZoom ===
      "number" &&
    mapZoom >=
      CITY_VIEW_MIN_ZOOM;

  return (
    <div
      aria-hidden={!isVisible}
      className={[
        "pointer-events-none",
        "absolute left-1/2 top-[88px] z-40",
        "-translate-x-1/2",
        "transition-all duration-200 ease-out",
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-2 opacity-0",
      ].join(" ")}
    >
      <nav
        aria-label="Что искать"
        className={[
          "pointer-events-auto",
          "flex items-center",
          "rounded-2xl",
          "border border-white/10",
          "bg-[#10171e]/66",
          "px-2 py-2",
          "shadow-[0_12px_35px_rgba(4,8,12,0.22)]",
          "backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-[#10171e]/50",
        ].join(" ")}
      >
        <div
          className={[
            "flex shrink-0 items-center",
            "gap-2 px-2.5",
            "text-[11px] font-semibold",
            "tracking-[0.08em]",
            "text-white/58",
            "uppercase",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className={[
              "h-1.5 w-1.5 rounded-full",
              "bg-[#6FC9C2]",
              "shadow-[0_0_10px_rgba(111,201,194,0.4)]",
            ].join(" ")}
          />
          {"Что ищете?"}
        </div>

        <div
          aria-hidden="true"
          className="mx-1 h-7 w-px bg-white/10"
        />

        <div
          className={[
            "flex items-center gap-1",
            "overflow-x-auto scrollbar-none",
          ].join(" ")}
        >
          {options.map(
            ({
              value: optionValue,
              title,
              icon: Icon,
            }) => {
              const active =
                value ===
                optionValue;

              return (
                <button
                  key={optionValue}
                  type="button"
                  onClick={() =>
                    onSelect(
                      optionValue
                    )
                  }
                  aria-pressed={active}
                  className={[
                    "group relative",
                    "inline-flex shrink-0 items-center",
                    "gap-2",
                    "rounded-xl",
                    "px-3 py-2",
                    "text-[13px] font-medium",
                    "transition-all duration-200",
                    "ease-out",
                    "focus:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-[#6FC9C2]/45",
                    active
                      ? [
                          "bg-white/[0.09]",
                          "text-white",
                        ].join(" ")
                      : [
                          "text-white/65",
                          "hover:bg-white/[0.055]",
                          "hover:text-white",
                        ].join(" "),
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 items-center",
                      "justify-center rounded-lg",
                      active
                        ? "text-[#7fd2cb] bg-[#6FC9C2]/10"
                        : "text-white/48 group-hover:text-[#7fd2cb]",
                      "transition-colors duration-200",
                    ].join(" ")}
                  >
                    <Icon
                      width={16}
                      height={16}
                    />
                  </span>

                  <span className="whitespace-nowrap">
                    {title}
                  </span>

                  {active && (
                    <span
                      aria-hidden="true"
                      className={[
                        "absolute inset-x-3 -bottom-[1px]",
                        "h-px rounded-full",
                        "bg-[#6FC9C2]/80",
                        "shadow-[0_0_8px_rgba(111,201,194,0.45)]",
                      ].join(" ")}
                    />
                  )}
                </button>
              );
            }
          )}
        </div>
      </nav>
    </div>
  );
}
