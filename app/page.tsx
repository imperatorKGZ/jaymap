"use client";

import {
  useCallback,
  useState,
} from "react";

import Navbar from "@/components/Navbar";

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
} from "@/lib/filters/types";

import type {
  FavoriteListing,
  ListingHistoryItem,
} from "@/lib/supabase/api";

export default function Home() {
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

          filters={
            appliedFilters
          }

          focusedListing={
            focusedFavorite
          }

          onListingSelect={
            setSelectedListing
          }
        />
      </div>

      {/* Navbar */}
      <Navbar
        onCitySelect={
          setSelectedCity
        }
      />

      {/* Sidebar */}
      <Sidebar
        theme="dark"

        onApplyFilters={
          handleApplyFilters
        }

        onFavoriteSelect={
          handleFavoriteSelect
        }

        onHistorySelect={
          handleHistorySelect
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