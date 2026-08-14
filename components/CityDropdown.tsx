"use client";

import { useEffect, useRef } from "react";
import type { City } from "@/lib/cities";
import type { Language } from "@/lib/i18n";
import { getCityDisplayName } from "@/lib/cities";

interface CityDropdownProps {
  cities: City[];
  selectedCityId: string | null;
  language: Language;
  isOpen: boolean;
  /** Координаты, откуда рисовать dropdown (обычно — под кнопкой поиска).
   * Считаются снаружи через getBoundingClientRect, т.к. компонент
   * рендерится через portal и больше не является потомком .glass. */
  position: { top: number; left: number; width: number };
  onSelect: (city: City) => void;
  onRequestClose: () => void;
  /** Кнопка-триггер (поле поиска) — клики по ней не должны триггерить
   * "закрытие по клику вне", иначе toggle будет дёргаться. */
  triggerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Компактный dropdown выбора города.
 * Рендерится через createPortal в document.body, чтобы не обрезаться
 * overflow:hidden родительского .glass-пилюли навбара.
 * Ничего не знает о MapLibre — только сообщает наверх выбранный City.
 */
export default function CityDropdown({
  cities,
  selectedCityId,
  language,
  isOpen,
  position,
  onSelect,
  onRequestClose,
  triggerRef,
}: CityDropdownProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  // Закрытие по клику вне dropdown (но не по клику на саму кнопку-триггер —
  // это toggle обрабатывает сам).
  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (!rootRef.current || rootRef.current.contains(target)) return;
      onRequestClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [onRequestClose, triggerRef]);

  // Закрытие по ESC
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onRequestClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onRequestClose]);

  return (
    <div
      ref={rootRef}
      className={`
        fixed z-[9999]
        max-h-[380px]
        overflow-y-auto
        rounded-[18px]
        bg-white
        p-2
        origin-top
        transition-all duration-[160ms] ease-out
        ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-1.5 pointer-events-none"}
      `}
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        boxShadow: "0 12px 35px rgba(0,0,0,.18)",
      }}
      role="listbox"
    >
      {cities.map((city) => {
        const isSelected = city.id === selectedCityId;
        return (
          <button
            key={city.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(city)}
            className="flex w-full h-[42px] items-center rounded-[12px] px-[14px] text-[15px] font-medium text-gray-800 transition-colors hover:bg-[#F4F4F4] cursor-pointer"
            style={
              isSelected
                ? {
                    borderLeft: "3px solid #6FC9C2",
                    backgroundColor: "rgba(111, 201, 194, 0.08)",
                  }
                : undefined
            }
          >
            {getCityDisplayName(city, language)}
          </button>
        );
      })}
    </div>
  );
}
