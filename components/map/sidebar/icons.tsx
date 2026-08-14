/**
 * icons.tsx
 * ------------------------------------------------------------
 * Пример временного набора иконок (line-style, 1.6px stroke).
 * Sidebar НИЧЕГО не знает про этот файл — иконки приходят в
 * конфигурацию как ссылки на компоненты (или строки "/icon.svg").
 * Чтобы позже сменить набор — замените этот файл (или подключите
 * Lucide/Phosphor/свои SVG) и поправьте импорт в sidebarConfig.tsx.
 * Единственное требование: fill/stroke = currentColor.
 * ------------------------------------------------------------
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const RentalIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    {/* Фирменная подложка */}
    <path
      d="M6 10L12 5.3L18 10V18A1.5 1.5 0 0 1 16.5 19.5H7.5A1.5 1.5 0 0 1 6 18Z"
      fill="#6FC9C2"
      fillOpacity="0.14"
      stroke="none"
    />

    {/* Крыша */}
    <path d="M4.2 10.2L12 4L19.8 10.2" />

    {/* Корпус */}
    <path d="M6 9.8V18A1.5 1.5 0 0 0 7.5 19.5H16.5A1.5 1.5 0 0 0 18 18V9.8" />

    {/* Дверь */}
    <path d="M10.3 19.5V14.7A1.2 1.2 0 0 1 11.5 13.5H12.5A1.2 1.2 0 0 1 13.7 14.7V19.5" />
  </svg>
);

// 2. КОММЕРЦИЯ
export const CommercialIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2 20h20" />
    <path d="M8 20V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v16" />
    <path d="M4 20V9.5a0.5 0.5 0 0 1 .5-.5H8" />
    <path d="M16 9h3.5a0.5 0.5 0 0 1 .5.5V20" />
    <path d="M11 6.5h2M11 10.5h2M11 14.5h2" />
    <path d="M11 20v-2.5h2V20" />
  </svg>
);

// 3. ЗЕМЕЛЬНЫЕ УЧАСТКИ
export const LandIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M2 18.5h20" />
    <path d="M3 18.5l5.5-8.5 4 5 4.5-6.5 4 10" />
    <circle cx="17" cy="6" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// 4. ПОСУТОЧНАЯ АРЕНДА
export const DailyIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v3.5M16 3v3.5" />
    <path d="M9 14.5l2 2 4-4" />
  </svg>
);

// 5. АГЕНТСТВА
export const AgenciesIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3.5 20.5V9.5L12 3.5l8.5 6v11" />
    <path d="M9.5 20.5v-6a0.5 0.5 0 0 1 .5-.5h4a0.5 0.5 0 0 1 .5.5v6" />
    <path d="M12 14v6.5" />
    <circle cx="12" cy="9.5" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

// 6. ИЗБРАННОЕ (С мягкой фирменной заливкой #6FC9C2)
export const FavoritesIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path 
      d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
      fill="#6FC9C2" 
      stroke="#6FC9C2"
      strokeWidth="1"
      opacity="0.85" // <-- Регулируйте прозрачность здесь
    />
  </svg>
);

// 7. ПОДПИСКИ
export const SubscriptionsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M6 9a6 6 0 0 1 12 0v4.5l1.8 3a0.5 0.5 0 0 1-.43 0.75H4.63a0.5 0.5 0 0 1-.43-.75l1.8-3V9z" />
    <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
  </svg>
);

// 8. ИСТОРИЯ
export const HistoryIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

// 9. СЛОИ КАРТЫ
export const LayersIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M12 3L2.5 8 12 13l9.5-5Z" />
    <path d="M2.5 13l9.5 5 9.5-5" />
    <path d="M2.5 17.5l9.5 5 9.5-5" />
  </svg>
);

// 10. НАСТРОЙКИ
export const SettingsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// 11. ПРОФИЛЬ
export const ProfileIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

// 12. КНОПКА СВЕРНУТЬ
export const ChevronLeftIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

// 13. МЕНЮ ПАНЕЛИ
export const MenuRailIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

// 14. ГАЛОЧКА
export const CheckIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 12.5l5 4.5 11-11" />
  </svg>
);

// 15. КОМНАТЫ
export const RoomsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20.5V10L12 4.5l8 5.5v10.5" />
    <path d="M9.5 20.5v-6a0.5 0.5 0 0 1 .5-.5h4a0.5 0.5 0 0 1 .5.5v6" />
    <path d="M2 20.5h20" />
  </svg>
);

// 16. ПЛОЩАДЬ
export const AreaIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18M9 3v18" />
  </svg>
);

// 17. ЭТАЖ
export const FloorIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M4 20.5V6l8-4.5 8 4.5v14.5" />
    <path d="M9.5 20.5v-6a0.5 0.5 0 0 1 .5-.5h4a0.5 0.5 0 0 1 .5.5v6" />
    <path d="M2 20.5h20" />
    <path d="M8 10.5h8M8 14.5h8" />
  </svg>
);

// 18. МЕБЕЛЬ
export const FurnishedIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M5 16V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8" />
    <path d="M3 16h18v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3z" />
    <path d="M8 12h8" />
  </svg>
);

// 19. ПАРКОВКА
export const ParkingIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.5 7.5V16h3" />
    <path d="M10.5 11.5h2.5" />
  </svg>
);

// 20. ЖИВОТНЫЕ
export const PetsIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 11c-1.5 0-2.5-1-2.5-2.5S7.5 6 9 6s2.5 1 2.5 2.5S10.5 11 9 11z" />
    <path d="M15 11c-1.5 0-2.5-1-2.5-2.5S13.5 6 15 6s2.5 1 2.5 2.5S16.5 11 15 11z" />
    <path d="M5.5 16c-1.5 0-2.5-1-2.5-2.5S4 11 5.5 11 8 12 8 13.5 7 16 5.5 16z" />
    <path d="M18.5 16c-1.5 0-2.5-1-2.5-2.5S17 11 18.5 11s2.5 1 2.5 2.5-1 2.5-2.5 2.5z" />
    <path d="M12 13c-2.5 0-4 1.5-4 4 0 2 2 3 4 3s4-1 4-3c0-2.5-1.5-4-4-4z" />
  </svg>
);

// 21. ТЕЛЕФОН
export const PhoneIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

// 22. TELEGRAM
export const TelegramIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M21.5 3.5L2.5 11l6 2.5L12 20l2.5-6.5L21.5 3.5z" />
    <path d="M12 13.5l3-3" />
  </svg>
);

// 23. WHATSAPP
export const WhatsAppIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M17.5 14.5c-.5 1.5-2 2.5-3.5 2.5h-.5" />
    <path d="M12 21a9 9 0 1 0-9-9c0 1.5.5 3 1 4l-1 4 4-1c1.5.5 3 1 5 1z" />
    <path d="M9.5 10.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
    <path d="M12.5 9.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
    <path d="M15.5 10.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z" />
  </svg>
);

// 24. СЕРДЦЕ КОНТУР (избранное)
export const HeartOutlineIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

// 25. СТРЕЛКА ВПРАВО
export const ChevronRightIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <path d="M9 5l7 7-7 7" />
  </svg>
);

// 26. ЗАМОК
export const LockIcon = (p: IconProps) => (
  <svg {...base} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
