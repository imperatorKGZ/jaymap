"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "@/lib/i18n";
import { loadCities, getCityDisplayName, type City } from "@/lib/cities";
import CityDropdown from "./CityDropdown";

interface NavbarProps {
  /** Navbar только сообщает наверх, какой город выбран. Про карту и
   * MapLibre Navbar ничего не знает — перемещением карты занимается
   * компонент карты. */
  onCitySelect?: (city: City) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export default function Navbar({ onCitySelect }: NavbarProps) {
  // =========================
  // Navbar
  // =========================
  const TOP = "top-5";
  const MAX_WIDTH = "max-w-[1000px]";
  const WIDTH = "w-[calc(100%-40px)]";
  const HEIGHT = "h-[68px]";
  const PADDING_X = "px-6";

  // =========================
  // Grid
  // Левая | Центр | Правая
  // =========================
  const LEFT_WIDTH = "220px";
  const RIGHT_WIDTH = "220px";
  const { t, language, setLanguage } = useTranslation();

  // =========================
  // Logo
  // =========================
  const LOGO_X = "translate-x-[15px]";
  const LOGO_SIZE = "text-2xl";
  const LOGO_COLOR = "text-[#6FC9C2]";

  // =========================
  // Search
  // =========================
  const SEARCH_WIDTH = "w-[430px]";
  const SEARCH_HEIGHT = "h-12";
  const SEARCH_X = "translate-x-[0px]";
  const SEARCH_PADDING = "px-5";

  // =========================
  // Right
  // =========================
  const RIGHT_X = "translate-x-[-20px]";
  const BUTTON_GAP = "gap-2";

  // =========================
  // Buttons
  // =========================
  const LOGIN_COLOR = "text-[#D6D3CC]";
  const POST_BG = "bg-emerald-600";

  // =========================
  // Выбор города
  // =========================
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isOpen, setIsOpen] = useState(false); // желаемое состояние (для анимации)
  const [isMounted, setIsMounted] = useState(false); // остаётся в DOM пока идёт анимация закрытия
  const [position, setPosition] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCities()
      .then((loaded) => {
        if (!cancelled) setCities(loaded);
      })
      .catch((error) => {
        console.error("Не удалось загрузить список городов:", error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePosition = useCallback(() => {
    const rect = searchButtonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // dropdown рендерится через portal в document.body (см. CityDropdown) —
  // поэтому позицию считаем вручную от кнопки-триггера, а не через CSS
  // absolute-позиционирование внутри .glass (у неё overflow: hidden и
  // dropdown был бы обрезан).
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      updatePosition();
      window.addEventListener("resize", updatePosition);
      return () => window.removeEventListener("resize", updatePosition);
    }
    if (isMounted) {
      const timeout = setTimeout(() => setIsMounted(false), 160);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isMounted, updatePosition]);

  const handleToggle = () => setIsOpen((prev) => !prev);
  const handleRequestClose = () => setIsOpen(false);

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setIsOpen(false);
    onCitySelect?.(city);
  };

  const searchLabel = selectedCity
    ? `📍 ${getCityDisplayName(selectedCity, language)}`
    : t("navbar.searchPlaceholder");

  return (
    <header
      className={`fixed ${TOP} left-1/2 -translate-x-1/2 z-50 ${WIDTH} ${MAX_WIDTH}`}
    >
      <div
        className="glass rounded-full h-[68px] px-6 grid items-center relative"
        style={{
          gridTemplateColumns: `${LEFT_WIDTH} 1fr ${RIGHT_WIDTH}`,
        }}
      >
        {/* ================= Logo ================= */}

        <div className={`justify-self-start ${LOGO_X}`}>
          <h1 className={`${LOGO_SIZE} font-bold tracking-tight`}>
            Jay<span className={LOGO_COLOR}>Map</span>
          </h1>
        </div>
        {/* ================= LANGUADGE ================= */}
        <div className="absolute left-[130px] top-[37px] -translate-y-1/2 flex items-center gap-1">
          {(
            [
              { code: "ky", label: "KG" },
              { code: "ru", label: "RU" },
              { code: "en", label: "EN" },
            ] as const
          ).map(({ code, label }) => (
            <button
              key={code}
              onClick={() => setLanguage(code)}
              className="relative pb-1 text-[5px] font-semibold tracking-[0.08em] text-white/40 hover:text-white transition"
            >
              {label}

              {language === code && (
                <span className="absolute left-1 right-1 -bottom-[1px] h-[1px] rounded-full bg-[#6FC9C2]" />
              )}
            </button>
          ))}
        </div>
        {/* ================= Search ================= */}

        <div className={`relative justify-self-center ${SEARCH_X}`}>
          <button
            ref={searchButtonRef}
            onClick={handleToggle}
            className={`
              flex
              items-center
              ${SEARCH_WIDTH}
              ${SEARCH_HEIGHT}
              rounded-full
              bg-white/70
              ${SEARCH_PADDING}
              text-sm
              text-gray-700
              shadow-sm
              transition
              hover:bg-white
            `}
          >
            <span
              style={{
                fontSize: "19px",
                transform: "translateX(10px)",
                display: "inline-block",
              }}
            >
              🔍
            </span>
            <span
              style={{
                fontFamily: "Inter",
                fontSize: "19px",
                color: "#2b2d34",
                marginLeft: "18px",
                fontWeight: 500,
              }}
            >
              {searchLabel}
            </span>
          </button>
        </div>

        {/* ================= Right ================= */}

        <div
          className={`justify-self-end flex items-center ${BUTTON_GAP} ${RIGHT_X}`}
        >
          <div className="flex gap-1 mr-3">
            <button
              className={`font-medium ${LOGIN_COLOR} hover:text-black`}
              style={{
                fontSize: "18px",
                fontWeight: 500,
                marginRight: "15px",
              }}
            >
              {t("navbar.login")}
            </button>

            <button
              className="rounded-full bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
              style={{
                paddingLeft: "7px",   // Левый отступ внутри зеленой подложки
                paddingRight: "7px",  // Правый отступ внутри зеленой подложки
                paddingTop: "3px",    // Верхний отступ
                paddingBottom: "3px", // Нижний отступ
                whiteSpace: "nowrap",  // Запрет переноса текста
                flexShrink: 0,         // Запрет флексу сжимать кнопку
              }}
            >
              {t("navbar.post")}
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown рендерится в document.body через portal, поэтому не
          обрезается overflow:hidden у .glass */}
      {isMounted &&
        position &&
        createPortal(
          <CityDropdown
            cities={cities}
            selectedCityId={selectedCity?.id ?? null}
            language={language}
            isOpen={isOpen}
            position={position}
            onSelect={handleSelectCity}
            onRequestClose={handleRequestClose}
            triggerRef={searchButtonRef}
          />,
          document.body
        )}
    </header>
  );
}
