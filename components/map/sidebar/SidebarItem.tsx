import {
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import { IconRenderer } from "./IconRenderer";

import type { IconSource } from "./IconRenderer";

interface SidebarItemProps {
  icon: IconSource;
  label: string;
  active?: boolean;
  collapsed?: boolean;
  onClick: () => void;
}

function getSidebarItemDescription(
  label: string
): string | null {
  const normalizedLabel =
    label
      .trim()
      .toLowerCase();

  if (
    normalizedLabel.includes(
      "аренд"
    )
  ) {
    return "Квартиры и другие объекты в аренду";
  }

  if (
    normalizedLabel.includes(
      "коммер"
    )
  ) {
    return "Коммерческая недвижимость";
  }

  if (
    normalizedLabel.includes(
      "зем"
    )
  ) {
    return "Земельные участки";
  }

  if (
    normalizedLabel.includes(
      "посуточ"
    )
  ) {
    return "Аренда на короткий срок";
  }

  if (
    normalizedLabel.includes(
      "агент"
    )
  ) {
    return "Риелторы и агентства";
  }

  if (
    normalizedLabel.includes(
      "избран"
    )
  ) {
    return "Сохранённые объявления";
  }

  if (
    normalizedLabel.includes(
      "подпис"
    )
  ) {
    return "Новые объявления по вашим критериям";
  }

  if (
    normalizedLabel.includes(
      "истор"
    )
  ) {
    return "Просмотренные объявления";
  }

  if (
    normalizedLabel.includes(
      "сло"
    ) ||
    normalizedLabel.includes(
      "инструмент"
    ) ||
    normalizedLabel.includes(
      "карт"
    )
  ) {
    return "Инструменты и дополнительные возможности карты";
  }

  if (
    normalizedLabel.includes(
      "настрой"
    )
  ) {
    return "Настройки JayMap";
  }

  if (
    normalizedLabel.includes(
      "профил"
    )
  ) {
    return "Ваш профиль и настройки аккаунта";
  }

  return null;
}

function SidebarItemBase({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: SidebarItemProps) {
  const description =
    getSidebarItemDescription(
      label
    );

  const buttonRef =
    useRef<HTMLButtonElement | null>(
      null
    );

  const showTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const hideTimerRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  const [
    tooltipVisible,
    setTooltipVisible,
  ] = useState(false);

  const [
    tooltipPosition,
    setTooltipPosition,
  ] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (
        showTimerRef.current
      ) {
        clearTimeout(
          showTimerRef.current
        );
      }

      if (
        hideTimerRef.current
      ) {
        clearTimeout(
          hideTimerRef.current
        );
      }
    };
  }, []);

  const handleMouseEnter =
    () => {
      if (!collapsed) {
        return;
      }

      if (
        hideTimerRef.current
      ) {
        clearTimeout(
          hideTimerRef.current
        );

        hideTimerRef.current =
          null;
      }

      showTimerRef.current =
        setTimeout(() => {
          const rect =
            buttonRef.current?.getBoundingClientRect();

          if (!rect) {
            return;
          }

          setTooltipPosition({
            top:
              rect.top +
              rect.height / 2,

            left:
              rect.right + 12,
          });

          setTooltipVisible(
            true
          );
        }, 500);
    };

  const handleMouseLeave =
    () => {
      if (
        showTimerRef.current
      ) {
        clearTimeout(
          showTimerRef.current
        );

        showTimerRef.current =
          null;
      }

      hideTimerRef.current =
        setTimeout(() => {
          setTooltipVisible(
            false
          );
        }, 80);
    };

  const handleFocus =
    () => {
      handleMouseEnter();
    };

  const handleBlur =
    () => {
      handleMouseLeave();
    };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onClick}
        onMouseEnter={
          handleMouseEnter
        }
        onMouseLeave={
          handleMouseLeave
        }
        onFocus={
          handleFocus
        }
        onBlur={
          handleBlur
        }
        aria-current={
          active
            ? "page"
            : undefined
        }
        aria-label={
          collapsed
            ? label
            : undefined
        }
        className={[
          "group relative flex min-h-[44px] w-full items-center gap-3 rounded-[16px] px-3.5 transition-colors duration-150 ease-out",
          active
            ? "bg-[var(--sb-active-bg)]"
            : "hover:bg-[var(--sb-hover-bg)]",
          collapsed
            ? "justify-center px-0"
            : "justify-start",
        ].join(" ")}
      >
        {active && (
          <span
            aria-hidden="true"
            className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-[var(--sb-accent)]"
          />
        )}

        <IconRenderer
          icon={icon}
          size={20}
          className={[
            "shrink-0 transition-colors duration-150",
            active
              ? "text-[var(--sb-accent)]"
              : "text-[var(--sb-icon-idle)] group-hover:text-[var(--sb-icon-hover)]",
          ].join(" ")}
        />

        <span
          className={[
            "overflow-hidden whitespace-nowrap text-[13.5px] font-medium transition-[opacity] duration-150 ease-out",
            collapsed
              ? "w-0 opacity-0"
              : "w-auto opacity-100",
            active
              ? "text-[var(--sb-text-strong)]"
              : "text-[var(--sb-text)]",
          ].join(" ")}
        >
          {label}
        </span>
      </button>

      {collapsed &&
        tooltipVisible &&
        tooltipPosition &&
        typeof document !==
          "undefined" &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position:
                "fixed",

              top:
                `${tooltipPosition.top}px`,

              left:
                `${tooltipPosition.left}px`,

              transform:
                "translateY(-50%)",
            }}
            className={[
              "pointer-events-none z-[1000]",
              "min-w-[150px] max-w-[280px]",
              "rounded-[14px]",
              "border border-[var(--sb-border)]",
              "bg-[color-mix(in_srgb,var(--sb-bg)_88%,transparent)]",
              "px-3.5 py-2.5",
              "shadow-[var(--sb-shadow)]",
              "backdrop-blur-xl",
              "transition-[opacity,transform]",
              "duration-150",
              "ease-out",
              "animate-in fade-in slide-in-from-left-1",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className="absolute left-[-5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-b border-l border-[var(--sb-border)] bg-[var(--sb-bg)]"
            />

            <span className="relative flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--sb-accent)] shadow-[0_0_9px_rgba(111,201,194,0.35)]"
              />

              <span className="min-w-0">
                <span className="block whitespace-nowrap text-[12.5px] font-semibold leading-4 text-[var(--sb-text-strong)]">
                  {label}
                </span>

                {description && (
                  <span className="mt-0.5 block text-[10.5px] font-normal leading-[15px] text-[var(--sb-text-muted)]">
                    {description}
                  </span>
                )}
              </span>
            </span>
          </div>,
          document.body
        )}
    </>
  );
}

export const SidebarItem =
  memo(
    SidebarItemBase
  );