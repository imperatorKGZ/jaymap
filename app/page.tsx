"use client";

import {
  useCallback,
  useRef,
  useState,
} from "react";

import Navbar from "@/components/Navbar";

import QuickSearch from "@/components/map/QuickSearch";

import MainMap from "@/components/map/MainMap";

import Sidebar from "@/components/map/sidebar/Sidebar";

import ListingPopup from "@/components/map/ListingPopup";

import type {
  PopupListing,
} from "@/components/map/ListingPopup";

import type {
  City,
} from "@/lib/cities";

import type {
  ListingsFilter,
  ListingType,
} from "@/lib/filters/types";

import type {
  FavoriteListing,
  ListingHistoryItem,
} from "@/lib/supabase/api";

import type {
  SearchRadius,
} from "@/components/map/sidebar/WorkspaceRenderer";

import {
  useSettings,
} from "@/lib/settings/provider";

export default function Home() {
  const {
    theme,
  } = useSettings();

  const [
    selectedCity,
    setSelectedCity,
  ] = useState<
    City | null
  >(null);

  const [
    appliedFilters,
    setAppliedFilters,
  ] = useState<
    ListingsFilter | undefined
  >(undefined);

  const [
    quickSearchType,
    setQuickSearchType,
  ] = useState<
    ListingType | null
  >(null);

  const [
    mapZoom,
    setMapZoom,
  ] = useState<
    number
  >(0);

  const [
    selectedListing,
    setSelectedListing,
  ] = useState<
    PopupListing | null
  >(null);

  /*
   * Объявление, к которому карта должна
   * переместиться.
   *
   * Используется и для Избранного,
   * и для Истории.
   */
  const [
    focusedFavorite,
    setFocusedFavorite,
  ] = useState<{
    id: string;

    coordinates: [
      number,
      number
    ];
  } | null>(null);

  /**
   * Функция запуска определения
   * местоположения, которую предоставляет MainMap.
   */
  const locateMeRef =
    useRef<
      (() => void) | null
    >(null);

  /**
   * Последние координаты пользователя.
   *
   * Используются инструментами карты,
   * которым нужен центр поиска.
   */
  const [
    userLocation,
    setUserLocation,
  ] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  /**
   * Текущий радиус поиска вокруг пользователя.
   *
   * null = радиус выключен.
   */
  const [
    searchRadius,
    setSearchRadius,
  ] = useState<SearchRadius>(
    null
  );

  /**
   * MainMap сообщает сюда готовую
   * функцию запуска геолокации.
   */
  const handleLocateMeReady =
    useCallback(
      (
        locateMe: () => void
      ) => {
        locateMeRef.current =
          locateMe;
      },
      []
    );

  /**
   * MainMap сообщает сюда координаты
   * после успешного определения местоположения.
   */
  const handleLocationChange =
    useCallback(
      (coordinates: {
        latitude: number;
        longitude: number;
        accuracy: number;
      }) => {
        setUserLocation(
          coordinates
        );
      },
      []
    );

  /**
   * MainMap сообщает сюда текущий zoom карты.
   *
   * QuickSearch использует его,
   * чтобы показываться только в городском
   * масштабе карты.
   */
  const handleMapZoomChange =
    useCallback(
      (
        zoom: number
      ) => {
        setMapZoom(
          zoom
        );
      },
      []
    );

  /**
   * Sidebar сообщает сюда выбранный радиус.
   *
   * null  → выключить радиус
   * 3000  → 3 км
   * 5000  → 5 км
   * 10000 → 10 км
   */
  const handleRadiusChange =
    useCallback(
      (
        radius: SearchRadius
      ) => {
        setSearchRadius(
          radius
        );
      },
      []
    );

  /**
   * Sidebar уже возвращает canonical ListingsFilter.
   */
  const handleApplyFilters =
    useCallback(
      (
        _sectionId: string,
        filters: Record<
          string,
          unknown
        >
      ) => {
        setAppliedFilters(
          filters as ListingsFilter
        );
      },
      []
    );

  /**
   * Быстрый выбор основного режима поиска.
   *
   * Использует тот же ListingsFilter,
   * который уже используется Sidebar → MainMap.
   * Sidebar дополнительно открывает соответствующий workspace
   * через существующее событие навигации.
   */
  const handleQuickSearchSelect =
    useCallback(
      (
        type: ListingType
      ) => {
        setQuickSearchType(
          type
        );

        setAppliedFilters(
          (previous) => ({
            ...(previous ?? {}),
            type,
          })
        );

        window.dispatchEvent(
          new CustomEvent(
            "jaymap:open-sidebar-section",
            {
              detail: {
                sectionId:
                  type,
              },
            }
          )
        );
      },
      []
    );

  /**
   * Выбор объявления
   * из FavoritesWorkspace.
   */
  const handleFavoriteSelect =
    useCallback(
      (
        favorite: FavoriteListing
      ) => {
        setFocusedFavorite({
          id:
            favorite.id,

          coordinates:
            favorite.coordinates,
        });

        setSelectedListing({
          id:
            favorite.id,

          title:
            favorite.title,

          price:
            favorite.price,

          currency:
            favorite.currency,

          address:
            favorite.address ??
            undefined,

          photos:
            favorite.photos,

          description:
            favorite.description ??
            undefined,

          rooms:
            favorite.rooms ??
            undefined,

          area:
            favorite.area ??
            undefined,

          floor:
            favorite.floor ??
            undefined,

          totalFloors:
            favorite.total_floors ??
            undefined,

          furnished:
            favorite.furnished,

          parking:
            favorite.parking,

          pets:
            favorite.pets,
        });
      },
      []
    );

  /**
   * Выбор объявления
   * из HistoryWorkspace.
   *
   * ListingHistoryItem содержит те же
   * данные, которые нужны Popup + карте.
   */
  const handleHistorySelect =
    useCallback(
      (
        item: ListingHistoryItem
      ) => {
        setFocusedFavorite({
          id:
            item.id,

          coordinates:
            item.coordinates,
        });

        setSelectedListing({
          id:
            item.id,

          title:
            item.title,

          price:
            item.price,

          currency:
            item.currency,

          address:
            item.address ??
            undefined,

          photos:
            item.photos,

          description:
            item.description ??
            undefined,

          rooms:
            item.rooms ??
            undefined,

          area:
            item.area ??
            undefined,

          floor:
            item.floor ??
            undefined,

          totalFloors:
            item.total_floors ??
            undefined,

          furnished:
            item.furnished,

          parking:
            item.parking,

          pets:
            item.pets,
        });
      },
      []
    );

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Фон */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "url('/textures/topo-bg.svg')",

          backgroundSize:
            "cover",

          backgroundPosition:
            "center",

          backgroundRepeat:
            "no-repeat",
        }}
      />

      {/* Карта */}
      <div className="absolute inset-0">
        <MainMap
          selectedCity={
            selectedCity
          }

          onZoomChange={
            handleMapZoomChange
          }

          filters={
            appliedFilters
          }

          focusedListing={
            focusedFavorite
          }

          onListingSelect={
            setSelectedListing
          }

          onLocateMeReady={
            handleLocateMeReady
          }

          onLocationChange={
            handleLocationChange
          }

          searchRadius={
            searchRadius
          }

          userLocation={
            userLocation
          }
        />
      </div>

      {/* Navbar */}
      <Navbar
        onCitySelect={
          setSelectedCity
        }
      />

      {/* Контекстная навигация по основным режимам.
          Появляется только в городском масштабе карты. */}
      <QuickSearch
        value={
          quickSearchType
        }

        visible={
          selectedCity !== null
        }

        mapZoom={
          mapZoom
        }

        onSelect={
          handleQuickSearchSelect
        }
      />

      {/* Sidebar */}
      <Sidebar
        theme={theme}

        onApplyFilters={
          handleApplyFilters
        }

        onFavoriteSelect={
          handleFavoriteSelect
        }

        onHistorySelect={
          handleHistorySelect
        }

        onLocateMe={() => {
          locateMeRef.current?.();
        }}

        searchRadius={
          searchRadius
        }

        onRadiusChange={
          handleRadiusChange
        }
      />

      {/* Popup */}
      {selectedListing && (
        <ListingPopup
          listing={
            selectedListing
          }
          onClose={() =>
            setSelectedListing(
              null
            )
          }
        />
      )}
    </main>
  );
}