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

import {
  useResponsiveUIScale,
} from "@/components/layout/useResponsiveUIScale";

import "./navbar.css";

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
  /*
   * =========================================================
   * RESPONSIVE UI SCALE
   * =========================================================
   *
   * ВАЖНО:
   *
   * Масштабируется только визуальная композиция Navbar.
   *
   * Внутренние координаты ниже НЕ меняются.
   *
   * Карта, Sidebar и остальная логика приложения
   * этим хуком не затрагиваются.
   */
  const uiScale =
    useResponsiveUIScale();

  /*
   * =========================================================
   * NAVBAR GEOMETRY
   * =========================================================
   *
   * ВСЕ ЭЛЕМЕНТЫ НЕЗАВИСИМЫ.
   *
   * Меняешь один параметр —
   * двигается только соответствующий элемент.
   */
  const NAVBAR_TOP = 20;
  const NAVBAR_HEIGHT = 68;
  const NAVBAR_WIDTH = 1000;

  /*
   * Общие настройки
   */
  const NAVBAR_HORIZONTAL_MARGIN = 20;

  /*
   * ---------------------------------------------------------
   * LOGO
   * ---------------------------------------------------------
   */

  const LOGO_LEFT = 18;
  const LOGO_TOP = 34;

  const LOGO_FONT_SIZE = 24;

  /*
   * ---------------------------------------------------------
   * LANGUAGES
   * ---------------------------------------------------------
   */

  const LANGUAGE_LEFT = 130;
  const LANGUAGE_TOP = 37;

  /*
   * ---------------------------------------------------------
   * SEARCH
   * ---------------------------------------------------------
   */

  const SEARCH_LEFT = 275;
  const SEARCH_TOP = 34;

  const SEARCH_WIDTH = 430;
  const SEARCH_HEIGHT = 48;

  const SEARCH_ICON_SIZE = 19;
  const SEARCH_ICON_OFFSET_X = 10;

  const SEARCH_TEXT_OFFSET_X = 18;

  /*
   * ---------------------------------------------------------
   * PROFILE / LOGIN
   * ---------------------------------------------------------
   */

  const PROFILE_LEFT = 780;
  const PROFILE_TOP = 34;

  /*
   * ---------------------------------------------------------
   * PUBLISH
   * ---------------------------------------------------------
   */

  const PUBLISH_LEFT = 870;
  const PUBLISH_TOP = 34;

  /*
   * ---------------------------------------------------------
   * USERNAME
   * ---------------------------------------------------------
   */

  const USERNAME_MAX_WIDTH = 120;

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

  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

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

  /*
   * =========================================================
   * CITIES
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    loadCities()
      .then(
        (
          loaded
        ) => {
          if (
            !cancelled
          ) {
            setCities(
              loaded
            );
          }
        }
      )
      .catch(
        (
          error
        ) => {
          console.error(
            "Не удалось загрузить список городов:",
            error
          );
        }
      );

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * =========================================================
   * CITY DROPDOWN POSITION
   * =========================================================
   */

  const updatePosition =
    useCallback(
      () => {
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
      },
      []
    );

  useEffect(() => {
    if (isOpen) {
      setIsMounted(
        true
      );

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
        setTimeout(
          () => {
            setIsMounted(
              false
            );
          },
          160
        );

      return () => {
        clearTimeout(
          timeout
        );
      };
    }
  }, [
    isOpen,
    isMounted,
    updatePosition,
  ]);

  /*
   * =========================================================
   * HANDLERS
   * =========================================================
   */

  const handleToggle =
    () => {
      setIsOpen(
        (
          previous
        ) =>
          !previous
      );
    };

  const handleRequestClose =
    () => {
      setIsOpen(
        false
      );
    };

  const handleSelectCity =
    (
      city: City
    ) => {
      setSelectedCity(
        city
      );

      setIsOpen(
        false
      );

      onCitySelect?.(
        city
      );
    };

  const handleLogin =
    () => {
      setAuthModalOpen(
        true
      );
    };

  const handleLogout =
    async () => {
      try {
        await signOut();
      } catch (
        error
      ) {
        console.error(
          "[Navbar] Logout failed:",
          error
        );
      }
    };

  const handlePublish =
    () => {
      if (!user) {
        setAuthModalOpen(
          true
        );

        return;
      }

      setListingCreateOpen(
        true
      );
    };

  /*
   * =========================================================
   * DISPLAY DATA
   * =========================================================
   */

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
    user?.email ??
    "";

  const userName =
    profile?.display_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    userEmail.split(
      "@"
    )[0] ||
    "Профиль";

  /*
   * Пользовательская фотография берётся только
   * из profile.avatar_url.
   *
   * Если её нет — ниже автоматически используется
   * стандартный JayMap avatar.
   */
  const userAvatar =
    profile?.avatar_url?.trim() ||
    null;

  console.log(
    "[Navbar avatar]",
    {
      userAvatar,

      profileAvatar:
        profile?.avatar_url,

      userId:
        user?.id,
    }
  );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <>
      <header
        className="
          jaymap-navbar
          fixed
          left-1/2
          z-50
        "
        style={{
          top:
            `${NAVBAR_TOP * uiScale}px`,

          width:
            `${NAVBAR_WIDTH}px`,

          height:
            `${NAVBAR_HEIGHT}px`,

          transform:
            `translateX(-50%) scale(${uiScale})`,

          transformOrigin:
            "top center",
        }}
      >
        <div
          className="
            glass
            relative
            h-full
            w-full
            rounded-full
          "
        >
          {/* =================================================
              LOGO
             ================================================= */}

          <div
            className="jaymap-navbar-element absolute"
            style={{
              left:
                `${LOGO_LEFT}px`,

              top:
                `${LOGO_TOP}px`,

              transform:
                "translateY(-50%)",

              fontSize:
                `${LOGO_FONT_SIZE}px`,
            }}
          >
            <h1
              className="
                m-0
                p-0
                whitespace-nowrap
                font-bold
                tracking-tight
              "
            >
              Jay
              <span
                className="
                  text-[#6FC9C2]
                "
              >
                Map
              </span>
            </h1>
          </div>

          {/* =================================================
              LANGUAGES
             ================================================= */}

          <div
            className="
              jaymap-navbar-element
              absolute
              flex
              items-center
              gap-1
            "
            style={{
              left:
                `${LANGUAGE_LEFT}px`,

              top:
                `${LANGUAGE_TOP}px`,

              transform:
                "translateY(-50%)",
            }}
          >
            {(
              [
                {
                  code:
                    "ky",

                  label:
                    "KG",
                },

                {
                  code:
                    "ru",

                  label:
                    "RU",
                },

                {
                  code:
                    "en",

                  label:
                    "EN",
                },
              ] as const
            ).map(
              ({
                code,
                label,
              }) => (
                <button
                  key={
                    code
                  }
                  type="button"
                  onClick={() =>
                    setLanguage(
                      code
                    )
                  }
                  className="
                    relative
                    m-0
                    border-0
                    bg-transparent
                    p-0
                    pb-1
                    text-[11px]
                    font-semibold
                    leading-none
                    tracking-[0.04em]
                    text-white/40
                    transition
                    hover:text-white
                  "
                >
                  {label}

                  {language ===
                    code && (
                    <span
                      className="
                        absolute
                        bottom-[-2px]
                        left-1/2
                        h-[1px]
                        w-[16px]
                        -translate-x-1/2
                        rounded-full
                        bg-[#6FC9C2]
                      "
                    />
                  )}
                </button>
              )
            )}
          </div>

          {/* =================================================
              SEARCH
             ================================================= */}

          <div
            className="
              jaymap-navbar-element
              absolute
            "
            style={{
              left:
                `${SEARCH_LEFT}px`,

              top:
                `${SEARCH_TOP}px`,

              transform:
                "translateY(-50%)",
            }}
          >
            <button
              ref={
                searchButtonRef
              }
              type="button"
              onClick={
                handleToggle
              }
              className="
                m-0
                flex
                items-center
                rounded-full
                border-0
                bg-white/70
                p-0
                px-5
                text-gray-700
                shadow-sm
                transition
                hover:bg-white
              "
              style={{
                width:
                  `${SEARCH_WIDTH}px`,

                height:
                  `${SEARCH_HEIGHT}px`,
              }}
            >
              <span
                className="
                  jaymap-navbar-icon
                "
                style={{
                  width:
                    `${SEARCH_ICON_SIZE}px`,

                  height:
                    `${SEARCH_ICON_SIZE}px`,

                  transform:
                    `translateX(${SEARCH_ICON_OFFSET_X}px)`,

                  fontSize:
                    `${SEARCH_ICON_SIZE}px`,
                }}
                aria-hidden="true"
              >
                🔍
              </span>

              <span
                className="
                  jaymap-navbar-search-text
                  whitespace-nowrap
                "
                style={{
                  marginLeft:
                    `${SEARCH_TEXT_OFFSET_X}px`,

                  fontFamily:
                    "Inter",

                  fontSize:
                    "19px",

                  fontWeight:
                    500,

                  color:
                    "#2b2d34",

                  lineHeight:
                    1,
                }}
              >
                {searchLabel}
              </span>
            </button>
          </div>

          {/* =================================================
              PROFILE / LOGIN
             ================================================= */}

          <div
            className="
              jaymap-navbar-element
              absolute
            "
            style={{
              left:
                `${PROFILE_LEFT}px`,

              top:
                `${PROFILE_TOP}px`,

              transform:
                "translateY(-50%)",
            }}
          >
            {authLoading ||
            profileLoading ? (
              <div
                className="
                  h-9
                  w-24
                  animate-pulse
                  rounded-full
                  bg-white/10
                "
              />
            ) : user ? (
              <button
                type="button"
                onClick={
                  handleLogout
                }
                title="Выйти"
                className="
                  m-0
                  flex
                  items-center
                  gap-2
                  rounded-full
                  border-0
                  bg-transparent
                  p-0
                  px-1
                  py-0
                  text-white/80
                  transition
                  hover:bg-white/10
                  hover:text-white
                "
              >
                {userAvatar ? (
                  <img
                    src={
                      userAvatar
                    }
                    alt=""
                    onError={(
                      event
                    ) => {
                      event.currentTarget.onerror =
                        null;

                      event.currentTarget.src =
                        "/jaymap-default-avatar.svg";
                    }}
                    className="
                      block
                      h-7
                      w-7
                      rounded-full
                      object-cover
                    "
                  />
                ) : (
                  <img
                    src="/jaymap-default-avatar.svg"
                    alt="JayMap"
                    className="
                      block
                      h-7
                      w-7
                      rounded-full
                      object-cover
                    "
                  />
                )}

                <span
                  className="
                    max-w-[120px]
                    truncate
                    text-[13px]
                    font-medium
                    leading-none
                  "
                >
                  {userName}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={
                  handleLogin
                }
                className="
                  m-0
                  border-0
                  bg-transparent
                  p-0
                  text-[18px]
                  font-medium
                  leading-none
                  text-[#D6D3CC]
                  transition
                  hover:text-black
                "
              >
                {t(
                  "navbar.login"
                )}
              </button>
            )}
          </div>

          {/* =================================================
              PUBLISH
             ================================================= */}

          <div
            className="
              jaymap-navbar-element
              absolute
            "
            style={{
              left:
                `${PUBLISH_LEFT}px`,

              top:
                `${PUBLISH_TOP}px`,

              transform:
                "translateY(-50%)",
            }}
          >
            <button
              type="button"
              onClick={
                handlePublish
              }
              className="
                m-0
                rounded-full
                border-0
                bg-emerald-600
                px-3
                py-2
                text-sm
                font-semibold
                leading-none
                text-white
                transition
                hover:bg-emerald-700
              "
            >
              {t(
                "navbar.post"
              )}
            </button>
          </div>
        </div>

        {/* ===================================================
            CITY DROPDOWN
           =================================================== */}

        {isMounted &&
          position &&
          createPortal(
            <CityDropdown
              cities={
                cities
              }
              selectedCityId={
                selectedCity?.id ??
                null
              }
              language={
                language
              }
              isOpen={
                isOpen
              }
              position={
                position
              }
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

      {/* =====================================================
          AUTH
         ===================================================== */}

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

      {/* =====================================================
          LISTING CREATION
         ===================================================== */}

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