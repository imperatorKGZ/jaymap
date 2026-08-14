"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  HeartOutlineIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  RoomsIcon,
  AreaIcon,
  FloorIcon,
  FurnishedIcon,
  ParkingIcon,
  PetsIcon,
  PhoneIcon,
  TelegramIcon,
  WhatsAppIcon,
  LockIcon,
} from "./icons";
import { getCurrentUser } from "@/lib/supabase/api";

export interface PopupListing {
  id: string;
  title: string;
  price: number;
  currency: string;
  address?: string;
  photos?: string[];
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  params?: Record<string, unknown>;
  description?: string;
  rooms?: number;
  area?: number;
  floor?: number;
  totalFloors?: number;
  furnished?: boolean;
  parking?: boolean;
  pets?: boolean;
}

interface ListingPopupProps {
  listing: PopupListing;
  onClose: () => void;
}

export default function ListingPopup({ listing, onClose }: ListingPopupProps) {
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Плавное появление
  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Проверка авторизации
  useEffect(() => {
    getCurrentUser().then((user) => setIsAuthenticated(!!user));
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(), 200);
  }, [onClose]);

  const photos = listing.photos ?? [];
  const photoCount = photos.length;

  const nextPhoto = useCallback(() => {
    setCurrentPhoto((i) => (i + 1) % Math.max(photoCount, 1));
  }, [photoCount]);

  const prevPhoto = useCallback(() => {
    setCurrentPhoto((i) => (i - 1 + Math.max(photoCount, 1)) % Math.max(photoCount, 1));
  }, [photoCount]);

  // Свайп
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40) nextPhoto();
    if (dx > 40) prevPhoto();
    touchStartX.current = null;
  };

  // Формат цены
  const priceLabel = `${listing.price.toLocaleString("ru-RU")} ${listing.currency}`;

  // Параметры для отображения
  const params: { icon: React.ReactNode; text: string }[] = [];
  if (listing.rooms != null) {
    params.push({ icon: <RoomsIcon size={16} />, text: `${listing.rooms} комн.` });
  }
  if (listing.area != null) {
    params.push({ icon: <AreaIcon size={16} />, text: `${listing.area} м²` });
  }
  if (listing.floor != null) {
    const floorText = listing.totalFloors
      ? `${listing.floor}/${listing.totalFloors} эт.`
      : `${listing.floor} эт.`;
    params.push({ icon: <FloorIcon size={16} />, text: floorText });
  }
  if (listing.furnished) {
    params.push({ icon: <FurnishedIcon size={16} />, text: "С мебелью" });
  }
  if (listing.parking) {
    params.push({ icon: <ParkingIcon size={16} />, text: "Парковка" });
  }
  if (listing.pets) {
    params.push({ icon: <PetsIcon size={16} />, text: "Животные" });
  }

  const hasContacts = listing.phone || listing.telegram || listing.whatsapp;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Оверлей */}
      <div
        className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Карточка */}
      <div
        ref={containerRef}
        className={`relative w-[420px] max-w-[calc(100vw-32px)] max-h-[85vh] flex flex-col rounded-[20px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
          isVisible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-[0.96] translate-y-2"
        }`}
        style={{
          background: "rgba(18, 24, 32, 0.82)",
          backdropFilter: "blur(24px) saturate(1.4)",
          WebkitBackdropFilter: "blur(24px) saturate(1.4)",
        }}
      >
        {/* ===== ШАПКА: избранное + закрыть ===== */}
        <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
          <button
            type="button"
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/60 hover:text-white"
            aria-label="В избранное"
          >
            <HeartOutlineIcon size={18} />
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/60 hover:text-white"
            aria-label="Закрыть"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ===== ФОТО ===== */}
        <div
          className="relative h-[220px] w-full shrink-0 bg-neutral-800"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhoto]}
                alt={`Фото ${currentPhoto + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {/* Индикатор */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
                {currentPhoto + 1} / {photoCount}
              </div>
              {/* Стрелки */}
              {photoCount > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60"
                    aria-label="Предыдущее фото"
                  >
                    <ChevronLeftIcon size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60"
                    aria-label="Следующее фото"
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-white/40">
              Нет фото
            </div>
          )}
        </div>

        {/* ===== КОНТЕНТ (скролл) ===== */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Цена */}
          <div className="text-[22px] font-semibold tracking-tight text-[#2FD4C0]">
            {priceLabel}
          </div>

          {/* Название */}
          <h2 className="mt-1 text-[15px] font-semibold text-white/95 leading-snug">
            {listing.title}
          </h2>

          {/* Адрес */}
          {listing.address && (
            <p className="mt-0.5 text-[13px] text-white/50">{listing.address}</p>
          )}

          {/* Параметры */}
          {params.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {params.map((p, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/75"
                >
                  {p.icon}
                  {p.text}
                </span>
              ))}
            </div>
          )}

          {/* Описание */}
          {listing.description && (
            <div className="mt-3">
              <p
                className={`text-[13px] leading-relaxed text-white/65 ${
                  isExpanded ? "" : "line-clamp-3"
                }`}
              >
                {listing.description}
              </p>
              {!isExpanded && listing.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="mt-1 text-[12px] font-medium text-[#2FD4C0] hover:text-[#3EE8D4] transition"
                >
                  Показать полностью
                </button>
              )}
            </div>
          )}

          {/* Контакты */}
          <div className="mt-4">
            {isAuthenticated === null ? (
              // Загрузка
              <div className="h-10 animate-pulse rounded-xl bg-white/5" />
            ) : isAuthenticated ? (
              hasContacts ? (
                <div className="flex flex-col gap-2">
                  {listing.phone && (
                    <a
                      href={`tel:${listing.phone}`}
                      className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3.5 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                    >
                      <PhoneIcon size={16} className="text-[#2FD4C0]" />
                      {listing.phone}
                    </a>
                  )}
                  <div className="flex gap-2">
                    {listing.telegram && (
                      <a
                        href={`https://t.me/${listing.telegram.replace(/^@/, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                      >
                        <TelegramIcon size={16} className="text-[#2FD4C0]" />
                        Telegram
                      </a>
                    )}
                    {listing.whatsapp && (
                      <a
                        href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                      >
                        <WhatsAppIcon size={16} className="text-[#2FD4C0]" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-white/40">Контакты не указаны</p>
              )
            ) : (
              // Не авторизован
              <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-5">
                <LockIcon size={24} className="text-white/30" />
                <p className="text-[13px] text-white/50 text-center">
                  Войдите, чтобы увидеть контакты
                </p>
                <button
                  type="button"
                  onClick={() => console.log("[ListingPopup] Login clicked")}
                  className="rounded-full bg-[#2FD4C0] px-5 py-2 text-[13px] font-semibold text-[#0a0f14] transition hover:bg-[#3EE8D4]"
                >
                  Войти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
