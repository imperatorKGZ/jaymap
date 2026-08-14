"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import MainMap from "@/components/map/MainMap";
import Sidebar from "@/components/map/sidebar/Sidebar";
import ListingPopup from "@/components/map/ListingPopup";
import type { PopupListing } from "@/components/map/ListingPopup";
import type { City } from "@/lib/cities";
import type { UserFilters } from "@/lib/supabase/api";

// ----------------------------------------------------
// MapPage
//   ├── Navbar        -- onCitySelect(city)
//   ├── MainMap        -- selectedCity + userFilters -> GeoJSON
//   ├── Sidebar        -- onApplyFilters -> userFilters
//   └── ListingPopup   -- selectedListing -> карточка объекта
//
// Состояние фильтров поднято сюда, чтобы:
//   - MainMap реагировал на изменения
//   - Sidebar не пропадал при переключении разделов
//   - bounds управлялись внутри MainMap (не тут)
// ----------------------------------------------------

/** Преобразует значения из sidebar-воркспейса в типизированные фильтры API */
function convertSidebarValues(sectionId: string, values: Record<string, unknown>): UserFilters {
  const filters: UserFilters = {
    type: sectionId as UserFilters["type"],
  };

  // Цена
  if (values.priceMin && String(values.priceMin).trim() !== "") {
    filters.priceMin = parseInt(String(values.priceMin), 10);
  }
  if (values.priceMax && String(values.priceMax).trim() !== "") {
    filters.priceMax = parseInt(String(values.priceMax), 10);
  }

  // Комнаты
  if (typeof values.rooms === "number") {
    filters.rooms = values.rooms;
  }

  // Площадь
  if (values.areaMin && String(values.areaMin).trim() !== "") {
    filters.areaMin = parseInt(String(values.areaMin), 10);
  }
  if (values.areaMax && String(values.areaMax).trim() !== "") {
    filters.areaMax = parseInt(String(values.areaMax), 10);
  }

  // Этаж (можно добавить если нужно)
  if (values.floorMin && String(values.floorMin).trim() !== "") {
    // floorMin не входит в UserFilters, но можно добавить в params
    filters.params = { ...(filters.params ?? {}), floorMin: parseInt(String(values.floorMin), 10) };
  }
  if (values.floorMax && String(values.floorMax).trim() !== "") {
    filters.params = { ...(filters.params ?? {}), floorMax: parseInt(String(values.floorMax), 10) };
  }

  // Булевы фильтры
  if (typeof values.furnished === "boolean") filters.furnished = values.furnished;
  if (typeof values.parking === "boolean") filters.parking = values.parking;
  if (typeof values.pets === "boolean") filters.pets = values.pets;

  // Специфичные для типа
  if (sectionId === "commercial") {
    if (values.purpose) filters.params = { ...(filters.params ?? {}), purpose: values.purpose };
    if (typeof values.separateEntrance === "boolean") {
      filters.params = { ...(filters.params ?? {}), separateEntrance: values.separateEntrance };
    }
    if (typeof values.groundFloor === "boolean") {
      filters.params = { ...(filters.params ?? {}), groundFloor: values.groundFloor };
    }
  }

  if (sectionId === "land") {
    if (values.landUse) filters.params = { ...(filters.params ?? {}), landUse: values.landUse };
    if (values.utilities) filters.params = { ...(filters.params ?? {}), utilities: values.utilities };
    if (values.documents) filters.params = { ...(filters.params ?? {}), documents: values.documents };
  }

  return filters;
}

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [userFilters, setUserFilters] = useState<UserFilters | undefined>(undefined);
  const [selectedListing, setSelectedListing] = useState<PopupListing | null>(null);

  const handleApplyFilters = useCallback((sectionId: string, values: Record<string, unknown>) => {
    const filters = convertSidebarValues(sectionId, values);
    setUserFilters(filters);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Фоновая картинка */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: "url('/textures/topo-bg.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Карта */}
      <div className="absolute inset-0">
        <MainMap
          selectedCity={selectedCity}
          userFilters={userFilters}
          onListingSelect={setSelectedListing}
        />
      </div>

      <Navbar onCitySelect={setSelectedCity} />

      <Sidebar theme="dark" onApplyFilters={handleApplyFilters} />

      {/* Карточка объявления */}
      {selectedListing && (
        <ListingPopup
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
        />
      )}
    </main>
  );
}
