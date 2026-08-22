"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

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
} from "./sidebar/icons";

import AuthModal from "@/components/auth/AuthModal";

import {
  getListingContacts,
} from "@/lib/supabase/api";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

export interface PopupListing {
  id: string;
  title: string;
  price: number;
  currency: string;

  address?: string;

  photos?: string[];

  /*
   * Эти поля пока оставляем
   * для совместимости с текущим
   * MainMap / PopupListing.
   *
   * ListingPopup больше НЕ использует
   * их как источник контактов.
   */
  phone?: string;
  telegram?: string;
  whatsapp?: string;

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

interface ListingContacts {
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
}

export default function ListingPopup({
  listing,
  onClose,
}: ListingPopupProps) {
  const {
    user,
  } = useAuth();

  const [
    currentPhoto,
    setCurrentPhoto,
  ] = useState(0);

  const [
    isExpanded,
    setIsExpanded,
  ] = useState(false);

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState<
    boolean | null
  >(null);

  const [
    contacts,
    setContacts,
  ] = useState<
    ListingContacts | null
  >(null);

  const [
    contactsLoading,
    setContactsLoading,
  ] = useState(false);

  const [
    authModalOpen,
    setAuthModalOpen,
  ] = useState(false);

  const [
    isVisible,
    setIsVisible,
  ] = useState(false);

  const touchStartX =
    useRef<number | null>(
      null
    );

  /*
   * Entrance animation.
   */
  useEffect(() => {
    const timer =
      setTimeout(
        () => {
          setIsVisible(true);
        },
        10
      );

    return () =>
      clearTimeout(
        timer
      );
  }, []);

  /*
   * Auth state.
   */
  useEffect(() => {
    setIsAuthenticated(
      !!user
    );
  }, [user]);

  /*
   * Secure contacts.
   *
   * ВАЖНО:
   *
   * Гость:
   *   RPC contacts НЕ вызывается.
   *
   * Authenticated:
   *   get_listing_contacts()
   *
   * Доступ дополнительно ограничен
   * на уровне Supabase RPC.
   */
  useEffect(() => {
    if (!user) {
      setContacts(null);
      setContactsLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    setContactsLoading(
      true
    );

    setContacts(null);

    getListingContacts(
      listing.id
    )
      .then((data) => {
        if (
          cancelled
        ) {
          return;
        }

        setContacts(
          data
        );
      })
      .catch((error) => {
        if (
          cancelled
        ) {
          return;
        }

        console.error(
          "[ListingPopup] Contacts load failed:",
          error
        );

        setContacts(
          null
        );
      })
      .finally(() => {
        if (
          cancelled
        ) {
          return;
        }

        setContactsLoading(
          false
        );
      });

    return () => {
      cancelled =
        true;
    };
  }, [
    user,
    listing.id,
  ]);

  /*
   * Escape.
   */
  useEffect(() => {
    const onKey = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        handleClose();
      }
    };

    window.addEventListener(
      "keydown",
      onKey
    );

    return () => {
      window.removeEventListener(
        "keydown",
        onKey
      );
    };
  }, []);

  /*
   * Close animation.
   */
  const handleClose =
    useCallback(() => {
      setIsVisible(
        false
      );

      setTimeout(() => {
        onClose();
      }, 200);
    }, [onClose]);

  const photos =
    listing.photos ?? [];

  const photoCount =
    photos.length;

  /*
   * Gallery.
   */
  const nextPhoto =
    useCallback(() => {
      setCurrentPhoto(
        (index) =>
          (index + 1) %
          Math.max(
            photoCount,
            1
          )
      );
    }, [photoCount]);

  const prevPhoto =
    useCallback(() => {
      setCurrentPhoto(
        (index) =>
          (index - 1 +
            Math.max(
              photoCount,
              1
            )) %
          Math.max(
            photoCount,
            1
          )
      );
    }, [photoCount]);

  const onTouchStart =
    (
      event: React.TouchEvent
    ) => {
      touchStartX.current =
        event.touches[0]
          .clientX;
    };

  const onTouchEnd =
    (
      event: React.TouchEvent
    ) => {
      if (
        touchStartX.current ==
        null
      ) {
        return;
      }

      const deltaX =
        event.changedTouches[0]
          .clientX -
        touchStartX.current;

      if (
        deltaX < -40
      ) {
        nextPhoto();
      }

      if (
        deltaX > 40
      ) {
        prevPhoto();
      }

      touchStartX.current =
        null;
    };

  /*
   * Price.
   */
  const priceLabel =
    `${listing.price.toLocaleString(
      "ru-RU"
    )} ${listing.currency}`;

  /*
   * Parameters.
   */
  const params: {
    icon: React.ReactNode;
    text: string;
  }[] = [];

  if (
    listing.rooms !=
    null
  ) {
    params.push({
      icon: (
        <RoomsIcon
          size={16}
        />
      ),
      text:
        `${listing.rooms} комн.`,
    });
  }

  if (
    listing.area !=
    null
  ) {
    params.push({
      icon: (
        <AreaIcon
          size={16}
        />
      ),
      text:
        `${listing.area} м²`,
    });
  }

  if (
    listing.floor !=
    null
  ) {
    const floorText =
      listing.totalFloors
        ? `${listing.floor}/${listing.totalFloors} эт.`
        : `${listing.floor} эт.`;

    params.push({
      icon: (
        <FloorIcon
          size={16}
        />
      ),
      text:
        floorText,
    });
  }

  if (
    listing.furnished
  ) {
    params.push({
      icon: (
        <FurnishedIcon
          size={16}
        />
      ),
      text: "С мебелью",
    });
  }

  if (
    listing.parking
  ) {
    params.push({
      icon: (
        <ParkingIcon
          size={16}
        />
      ),
      text: "Парковка",
    });
  }

  if (
    listing.pets
  ) {
    params.push({
      icon: (
        <PetsIcon
          size={16}
        />
      ),
      text: "Животные",
    });
  }

  const hasContacts =
    !!(
      contacts?.phone ||
      contacts?.telegram ||
      contacts?.whatsapp
    );

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/35 transition-opacity duration-200 ${
            isVisible
              ? "opacity-100"
              : "opacity-0"
          }`}
          onClick={
            handleClose
          }
        />

        {/* Modal */}
        <div
          className={`relative w-[420px] max-w-[calc(100vw-32px)] max-h-[85vh] flex flex-col rounded-[20px] border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ease-out ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-[0.96] translate-y-2"
          }`}
          style={{
            background:
              "rgba(18, 24, 32, 0.82)",
            backdropFilter:
              "blur(24px) saturate(1.4)",
            WebkitBackdropFilter:
              "blur(24px) saturate(1.4)",
          }}
        >
          {/* Top actions */}
          <div className="absolute top-3 left-3 right-3 z-10 flex justify-between pointer-events-none">
            <button
              type="button"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/60 hover:text-white"
              aria-label="В избранное"
            >
              <HeartOutlineIcon
                size={18}
              />
            </button>

            <button
              type="button"
              onClick={
                handleClose
              }
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/70 transition hover:bg-black/60 hover:text-white"
              aria-label="Закрыть"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Gallery */}
          <div
            className="relative h-[220px] w-full shrink-0 bg-neutral-800"
            onTouchStart={
              onTouchStart
            }
            onTouchEnd={
              onTouchEnd
            }
          >
            {photos.length >
            0 ? (
              <>
                <img
                  src={
                    photos[
                      currentPhoto
                    ]
                  }
                  alt={`Фото ${
                    currentPhoto +
                    1
                  }`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-0.5 text-[11px] font-medium text-white/90">
                  {currentPhoto +
                    1}{" "}
                  /{" "}
                  {
                    photoCount
                  }
                </div>

                {photoCount >
                  1 && (
                  <>
                    <button
                      type="button"
                      onClick={
                        prevPhoto
                      }
                      className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60"
                      aria-label="Предыдущее фото"
                    >
                      <ChevronLeftIcon
                        size={
                          18
                        }
                      />
                    </button>

                    <button
                      type="button"
                      onClick={
                        nextPhoto
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60"
                      aria-label="Следующее фото"
                    >
                      <ChevronRightIcon
                        size={
                          18
                        }
                      />
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <div className="text-[22px] font-semibold tracking-tight text-[#2FD4C0]">
              {priceLabel}
            </div>

            <h2 className="mt-1 text-[15px] font-semibold text-white/95 leading-snug">
              {
                listing.title
              }
            </h2>

            {listing.address && (
              <p className="mt-0.5 text-[13px] text-white/50">
                {
                  listing.address
                }
              </p>
            )}

            {params.length >
              0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {params.map(
                  (
                    param,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[12px] text-white/75"
                    >
                      {
                        param.icon
                      }

                      {
                        param.text
                      }
                    </span>
                  )
                )}
              </div>
            )}

            {listing.description && (
              <div className="mt-3">
                <p
                  className={`text-[13px] leading-relaxed text-white/65 ${
                    isExpanded
                      ? ""
                      : "line-clamp-3"
                  }`}
                >
                  {
                    listing.description
                  }
                </p>

                {!isExpanded &&
                  listing
                    .description
                    .length >
                    120 && (
                    <button
                      type="button"
                      onClick={() =>
                        setIsExpanded(
                          true
                        )
                      }
                      className="mt-1 text-[12px] font-medium text-[#2FD4C0] transition hover:text-[#3EE8D4]"
                    >
                      Показать полностью
                    </button>
                  )}
              </div>
            )}

            {/* ===================================================
               Contacts
               =================================================== */}

            <div className="mt-4">
              {!isAuthenticated ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-5">
                  <LockIcon
                    size={24}
                    className="text-white/30"
                  />

                  <p className="text-center text-[13px] text-white/50">
                    Войдите, чтобы увидеть контакты
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setAuthModalOpen(
                        true
                      )
                    }
                    className="rounded-full bg-[#2FD4C0] px-5 py-2 text-[13px] font-semibold text-[#0a0f14] transition hover:bg-[#3EE8D4]"
                  >
                    Войти
                  </button>
                </div>
              ) : contactsLoading ? (
                <div className="h-20 animate-pulse rounded-xl bg-white/5" />
              ) : hasContacts ? (
                <div className="flex flex-col gap-2">
                  {contacts?.phone && (
                    <a
                      href={`tel:${contacts.phone}`}
                      className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3.5 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                    >
                      <PhoneIcon
                        size={16}
                        className="text-[#2FD4C0]"
                      />

                      {
                        contacts.phone
                      }
                    </a>
                  )}

                  <div className="flex gap-2">
                    {contacts?.telegram && (
                      <a
                        href={`https://t.me/${contacts.telegram.replace(
                          /^@/,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                      >
                        <TelegramIcon
                          size={16}
                          className="text-[#2FD4C0]"
                        />

                        Telegram
                      </a>
                    )}

                    {contacts?.whatsapp && (
                      <a
                        href={`https://wa.me/${contacts.whatsapp.replace(
                          /\D/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-2.5 text-[13px] text-white/90 transition hover:bg-white/10"
                      >
                        <WhatsAppIcon
                          size={16}
                          className="text-[#2FD4C0]"
                        />

                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-white/40">
                  Контакты не указаны
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Auth modal */}
      <AuthModal
        open={
          authModalOpen
        }
        onClose={() =>
          setAuthModalOpen(
            false
          )
        }
      />
    </>
  );
}