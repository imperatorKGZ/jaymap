"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { toggleFavorite } from "@/lib/supabase/api";

interface PopupListing {
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
}

export function ListingPopup({
  listing,
  onClose,
}: {
  listing: PopupListing;
  onClose: () => void;
}) {
  const [isFav, setIsFav] = useState(false);

  const handleFavorite = async () => {
    try {
      const result = await toggleFavorite(listing.id);
      setIsFav(result);
    } catch {
      // не авторизован — игнорируем или показываем тост
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[var(--sb-radius-panel)] border border-[var(--sb-border)] bg-[var(--sb-bg-solid)] shadow-[var(--sb-shadow)]"
        style={{ colorScheme: "dark" }}
      >
        {/* Фото */}
        <div className="relative h-52 bg-neutral-800">
          {listing.photos?.[0] ? (
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--sb-text-muted)]">
              Нет фото
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
          >
            ✕
          </button>
          <button
            onClick={handleFavorite}
            className={`absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition ${
              isFav ? "bg-[#6FC9C2] text-white" : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            ♥
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-[var(--sb-text-strong)]">
              {listing.title}
            </h3>
            {listing.address && (
              <p className="mt-1 text-sm text-[var(--sb-text-muted)]">
                {listing.address}
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-[var(--sb-accent)]">
              {listing.price.toLocaleString()}
            </span>
            <span className="text-sm text-[var(--sb-text-muted)]">
              {listing.currency}
            </span>
          </div>

          {/* Параметры */}
          {listing.params && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(listing.params).map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] px-2.5 py-1 text-xs text-[var(--sb-text)]"
                >
                  {k}: {String(v)}
                </span>
              ))}
            </div>
          )}

          {/* Кнопки связи */}
          <div className="flex gap-3 pt-1">
            {listing.phone && (
              <a
                href={`tel:${listing.phone}`}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-[var(--sb-cta)] text-sm font-semibold text-[var(--sb-cta-text)] transition hover:bg-[var(--sb-cta-hover)]"
              >
                Позвонить
              </a>
            )}
            {listing.telegram && (
              <a
                href={`https://t.me/${listing.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] text-[var(--sb-text)] transition hover:bg-[var(--sb-active-bg)]"
              >
                TG
              </a>
            )}
            {listing.whatsapp && (
              <a
                href={`https://wa.me/${listing.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--sb-border)] bg-[var(--sb-hover-bg)] text-[var(--sb-text)] transition hover:bg-[var(--sb-active-bg)]"
              >
                WA
              </a>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}