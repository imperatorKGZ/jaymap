"use client";

import { useCallback, useState } from "react";

import Navbar from "@/components/Navbar";
import MainMap from "@/components/map/MainMap";
import Sidebar from "@/components/map/sidebar/Sidebar";
import ListingPopup from "@/components/map/ListingPopup";

import type { PopupListing } from "@/components/map/ListingPopup";
import type { City } from "@/lib/cities";
import type { ListingsFilter } from "@/lib/filters/types";

export default function Home() {
  const [selectedCity, setSelectedCity] =
    useState<City | null>(null);

  const [appliedFilters, setAppliedFilters] =
    useState<ListingsFilter | undefined>(undefined);

  const [selectedListing, setSelectedListing] =
    useState<PopupListing | null>(null);

  /**
   * Sidebar уже возвращает canonical ListingsFilter.
   *
   * Никакого повторного преобразования здесь нет.
   */
  const handleApplyFilters = useCallback(
    (
      _sectionId: string,
      filters: Record<string, unknown>
    ) => {
      setAppliedFilters(
        filters as ListingsFilter
      );
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
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Карта */}
      <div className="absolute inset-0">
        <MainMap
          selectedCity={selectedCity}
          filters={appliedFilters}
          onListingSelect={setSelectedListing}
        />
      </div>

      {/* Navbar */}
      <Navbar
        onCitySelect={setSelectedCity}
      />

      {/* Sidebar */}
      <Sidebar
        theme="dark"
        onApplyFilters={
          handleApplyFilters
        }
      />

      {/* Popup */}
      {selectedListing && (
        <ListingPopup
          listing={selectedListing}
          onClose={() =>
            setSelectedListing(null)
          }
        />
      )}
    </main>
  );
}