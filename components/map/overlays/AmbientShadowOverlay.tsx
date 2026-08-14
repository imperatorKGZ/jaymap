'use client';

import React, { useEffect, useRef } from 'react';
import { Map as MapLibre } from 'maplibre-gl';
import { MapLibreShadowLayer } from './MapLibreShadowLayer';

interface AmbientShadowOverlayProps {
  map: MapLibre | null;
  geojsonUrl?: string;
  beforeLayerId?: string; // Позволяет вставить тень под дороги или метки
}

export const AmbientShadowOverlay: React.FC<AmbientShadowOverlayProps> = ({
  map,
  geojsonUrl = '/geojson/kyrgyzstan.geojson',
  beforeLayerId
}) => {
  const layerIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;

    const shadowLayer = new MapLibreShadowLayer(geojsonUrl);
    layerIdRef.current = shadowLayer.id;

    // Добавляем слой только когда стиль карты загружен
    const addLayer = () => {
      if (!map.getLayer(shadowLayer.id)) {
        map.addLayer(shadowLayer, beforeLayerId);
      }
    };

    if (map.isStyleLoaded()) {
      addLayer();
    } else {
      map.once('styledata', addLayer);
    }

    return () => {
      if (map.getStyle() && layerIdRef.current && map.getLayer(layerIdRef.current)) {
        map.removeLayer(layerIdRef.current);
      }
    };
  }, [map, geojsonUrl, beforeLayerId]);

  // UI компонента не существует, рендер идет внутри MapLibre WebGL контекста
  return null;
};