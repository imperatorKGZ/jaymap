"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";

import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/AuthProvider";

import {
  loadCities,
  getCityDisplayName,
  type City,
} from "@/lib/cities";

import CityDropdown from "./CityDropdown";
import AuthModal from "./auth/AuthModal";
import ListingCreateModal from "./listings/ListingCreateModal";

interface NavbarProps {
  onCitySelect?: (
    city: City
  ) => void;
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

export default function Navbar({
  onCitySelect,
}: NavbarProps) {
  const TOP = "top-5";
  const MAX_WIDTH = "max-w-[1000px]";
  const WIDTH = "w-[calc(100%-40px)]";
  const HEIGHT = "h-[68px]";
  const PADDING_X = "px-6";

  const LEFT_WIDTH = "220px";
  const RIGHT_WIDTH = "220px";

  const {
    t,
    language,
    setLanguage,
  } = useTranslation();

  const {
    user,
    profile,
    loading: authLoading,
    profileLoading,
    signOut,
  } = useAuth();

  const [
    authModalOpen,
    setAuthModalOpen,
  ] = useState(false);

  const [
    listingCreateOpen,
    setListingCreateOpen,
  ] = useState(false);

  const LOGO_X =
    "translate-x-[15px]";

  const LOGO_SIZE =
    "text-2xl";

  const LOGO_COLOR =
    "text-[#6FC9C2]";

  const SEARCH_WIDTH =
    "w-[430px]";

  const SEARCH_HEIGHT =
    "h-12";

  const SEARCH_X =
    "translate-x-[0px]";

  const SEARCH_PADDING =
    "px-5";

  const RIGHT_X =
    "translate-x-[-20px]";

  const BUTTON_GAP =
    "gap-2";

  const LOGIN_COLOR =
    "text-[#D6D3CC]";

  const searchButtonRef =
    useRef<HTMLButtonElement>(
      null
    );

  const [cities, setCities] =
    useState<City[]>([]);

  const [
    selectedCity,
    setSelectedCity,
  ] = useState<City | null>(
    null
  );

  const [isOpen, setIsOpen] =
    useState(false);

  const [
    isMounted,
    setIsMounted,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] =
    useState<DropdownPosition | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;

    loadCities()
      .then((loaded) => {
        if (!cancelled) {
          setCities(loaded);
        }
      })
      .catch((error) => {
        console.error(
          "Не удалось загрузить список городов:",
          error
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updatePosition =
    useCallback(() => {
      const rect =
        searchButtonRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setPosition({
        top:
          rect.bottom + 8,
        left:
          rect.left,
        width:
          rect.width,
      });
    }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);

      updatePosition();

      window.addEventListener(
        "resize",
        updatePosition
      );

      return () => {
        window.removeEventListener(
          "resize",
          updatePosition
        );
      };
    }

    if (isMounted) {
      const timeout =
        setTimeout(() => {
          setIsMounted(false);
        }, 160);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [
    isOpen,
    isMounted,
    updatePosition,
  ]);

  const handleToggle = () => {
    setIsOpen(
      (previous) =>
        !previous
    );
  };

  const handleRequestClose =
    () => {
      setIsOpen(false);
    };

  const handleSelectCity =
    (city: City) => {
      setSelectedCity(city);
      setIsOpen(false);

      onCitySelect?.(city);
    };

  const handleLogin = () => {
    setAuthModalOpen(true);
  };

  const handleLogout =
    async () => {
      try {
        await signOut();
      } catch (error) {
        console.error(
          "[Navbar] Logout failed:",
          error
        );
      }
    };

  /*
   * Главный handler публикации.
   *
   * Гость:
   *   → AuthModal
   *
   * Авторизованный:
   *   → ListingCreateModal
   */
  const handlePublish = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    setListingCreateOpen(true);
  };

  const searchLabel =
    selectedCity
      ? `📍 ${getCityDisplayName(
          selectedCity,
          language
        )}`
      : t(
          "navbar.searchPlaceholder"
        );

  const userEmail =
    user?.email ?? "";

  const userName =
    profile?.display_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userEmail.split("@")[0] ||
    "Профиль";

  const userAvatar =
    profile?.avatar_url ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    null;

  return (
    <>
      <header
        className={[
          "fixed",
          TOP,
          "left-1/2",
          "-translate-x-1/2",
          "z-50",
          WIDTH,
          MAX_WIDTH,
        ].join(" ")}
      >
        <div
          className={[
            "glass",
            "rounded-full",
            HEIGHT,
            PADDING_X,
            "grid",
            "items-center",
            "relative",
          ].join(" ")}
          style={{
            gridTemplateColumns:
              `${LEFT_WIDTH} 1fr ${RIGHT_WIDTH}`,
          }}
        >
          {/* Logo */}

          <div
            className={[
              "justify-self-start",
              LOGO_X,
            ].join(" ")}
          >
            <h1
              className={[
                LOGO_SIZE,
                "font-bold",
                "tracking-tight",
              ].join(" ")}
            >
              Jay
              <span
                className={
                  LOGO_COLOR
                }
              >
                Map
              </span>
            </h1>
          </div>

          {/* Language */}

          <div className="absolute left-[130px] top-[37px] -translate-y-1/2 flex items-center gap-1">
            {(
              [
                {
                  code: "ky",
                  label: "KG",
                },
                {
                  code: "ru",
                  label: "RU",
                },
                {
                  code: "en",
                  label: "EN",
                },
              ] as const
            ).map(
              ({
                code,
                label,
              }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() =>
                    setLanguage(
                      code
                    )
                  }
                  className="relative pb-1 text-[5px] font-semibold tracking-[0.08em] text-white/40 transition hover:text-white"
                >
                  {label}

                  {language ===
                    code && (
                    <span className="absolute left-1 right-1 -bottom-[1px] h-[1px] rounded-full bg-[#6FC9C2]" />
                  )}
                </button>
              )
            )}
          </div>

          {/* Search */}

          <div
            className={[
              "relative",
              "justify-self-center",
              SEARCH_X,
            ].join(" ")}
          >
            <button
              ref={
                searchButtonRef
              }
              type="button"
              onClick={
                handleToggle
              }
              className={[
                "flex",
                "items-center",
                SEARCH_WIDTH,
                SEARCH_HEIGHT,
                "rounded-full",
                "bg-white/70",
                SEARCH_PADDING,
                "text-sm",
                "text-gray-700",
                "shadow-sm",
                "transition",
                "hover:bg-white",
              ].join(" ")}
            >
              <span
                style={{
                  fontSize:
                    "19px",
                  transform:
                    "translateX(10px)",
                  display:
                    "inline-block",
                }}
              >
                🔍
              </span>

              <span
                style={{
                  fontFamily:
                    "Inter",
                  fontSize:
                    "19px",
                  color:
                    "#2b2d34",
                  marginLeft:
                    "18px",
                  fontWeight:
                    500,
                }}
              >
                {searchLabel}
              </span>
            </button>
          </div>

          {/* Right */}

          <div
            className={[
              "justify-self-end",
              "flex",
              "items-center",
              BUTTON_GAP,
              RIGHT_X,
            ].join(" ")}
          >
            <div className="flex items-center gap-1 mr-3">
              {authLoading ||
              profileLoading ? (
                <div className="h-9 w-24 animate-pulse rounded-full bg-white/10" />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      handleLogout
                    }
                    className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-white/80 transition hover:bg-white/10 hover:text-white"
                    title="Выйти"
                  >
                    {userAvatar ? (
                      <img
                        src={
                          userAvatar
                        }
                        alt=""
                        className="h-7 w-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6FC9C2] text-[11px] font-bold text-[#0a0f14]">
                        {userName
                          .slice(
                            0,
                            1
                          )
                          .toUpperCase()}
                      </div>
                    )}

                    <span className="max-w-[120px] truncate text-[13px] font-medium">
                      {userName}
                    </span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={
                    handleLogin
                  }
                  className={[
                    "font-medium",
                    LOGIN_COLOR,
                    "hover:text-black",
                  ].join(" ")}
                  style={{
                    fontSize:
                      "18px",
                    fontWeight:
                      500,
                    marginRight:
                      "15px",
                  }}
                >
                  {t(
                    "navbar.login"
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={
                  handlePublish
                }
                className="rounded-full bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
                style={{
                  paddingLeft:
                    "7px",
                  paddingRight:
                    "7px",
                  paddingTop:
                    "3px",
                  paddingBottom:
                    "3px",
                  whiteSpace:
                    "nowrap",
                  flexShrink:
                    0,
                }}
              >
                {t(
                  "navbar.post"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* City dropdown */}

        {isMounted &&
          position &&
          createPortal(
            <CityDropdown
              cities={cities}
              selectedCityId={
                selectedCity?.id ??
                null
              }
              language={
                language
              }
              isOpen={isOpen}
              position={position}
              onSelect={
                handleSelectCity
              }
              onRequestClose={
                handleRequestClose
              }
              triggerRef={
                searchButtonRef
              }
            />,
            document.body
          )}
      </header>

      {/* Auth */}

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

      {/* Listing creation */}

      <ListingCreateModal
        open={
          listingCreateOpen
        }
        onClose={() =>
          setListingCreateOpen(
            false
          )
        }
      />
    </>
  );
}