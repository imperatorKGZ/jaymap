-- ============================================================
-- JayMap: поиск объявлений вокруг координаты пользователя
-- Радиусы: 3 км / 5 км / 10 км
--
-- Существующий get_listings_geojson НЕ изменяем.
-- Эта функция добавляется отдельно.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_listings_geojson_radius(
  p_lat double precision,
  p_lng double precision,
  p_radius_m integer DEFAULT 3000,
  p_type text DEFAULT NULL,
  p_city_id text DEFAULT NULL,
  p_price_min integer DEFAULT NULL,
  p_price_max integer DEFAULT NULL,
  p_rooms integer DEFAULT NULL,
  p_area_min integer DEFAULT NULL,
  p_area_max integer DEFAULT NULL,
  p_furnished boolean DEFAULT NULL,
  p_parking boolean DEFAULT NULL,
  p_pets boolean DEFAULT NULL,
  p_params jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  result jsonb;
  user_point geometry;
BEGIN
  /*
   * Защита от некорректного радиуса.
   *
   * Поддерживаем только:
   * 3000 м
   * 5000 м
   * 10000 м
   */
  IF p_radius_m NOT IN (
    3000,
    5000,
    10000
  ) THEN
    RAISE EXCEPTION
      'Unsupported radius. Allowed values: 3000, 5000, 10000';
  END IF;

  /*
   * Проверяем координаты.
   */
  IF p_lat IS NULL
     OR p_lng IS NULL
  THEN
    RAISE EXCEPTION
      'Latitude and longitude are required';
  END IF;

  IF p_lat < -90
     OR p_lat > 90
  THEN
    RAISE EXCEPTION
      'Invalid latitude';
  END IF;

  IF p_lng < -180
     OR p_lng > 180
  THEN
    RAISE EXCEPTION
      'Invalid longitude';
  END IF;

  /*
   * Точка пользователя.
   *
   * SRID 4326 — тот же CRS, который используется
   * существующей картографической функцией.
   */
  user_point :=
    ST_SetSRID(
      ST_MakePoint(
        p_lng,
        p_lat
      ),
      4326
    );

  /*
   * Поиск строится через geography,
   * чтобы p_radius_m был именно в метрах.
   *
   * Это принципиально:
   *
   * geometry в 4326 → градусы
   * geography      → метры
   */
  SELECT jsonb_build_object(
    'type',
    'FeatureCollection',

    'features',
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'type',
          'Feature',

          'geometry',
          jsonb_build_object(
            'type',
            'Point',

            'coordinates',
            jsonb_build_array(
              ST_X(
                l.coordinates::geometry
              ),
              ST_Y(
                l.coordinates::geometry
              )
            )
          ),

          'properties',
          jsonb_build_object(
            'id',
            l.id,

            'type',
            l.type,

            'price',
            l.price,

            'currency',
            l.currency,

            'rooms',
            l.rooms,

            'area',
            l.area,

            'floor',
            l.floor,

            'total_floors',
            l.total_floors,

            'furnished',
            l.furnished,

            'parking',
            l.parking,

            'pets',
            l.pets,

            'title',
            l.title,

            'address',
            l.address,

            'photos',
            l.photos,

            'params',
            l.params,

            'is_premium',
            l.is_premium,

            'created_at',
            l.created_at
          )
        )

        ORDER BY
          l.is_premium DESC,
          l.created_at DESC
      ),

      '[]'::jsonb
    )
  )
  INTO result

  FROM public.listings l

  WHERE
    l.status = 'published'

    AND l.is_active = true

    /*
     * Главное условие радиуса.
     *
     * Центр:
     *   user_point
     *
     * Радиус:
     *   p_radius_m метров
     */
    AND ST_DWithin(
      l.coordinates::geography,
      user_point::geography,
      p_radius_m
    )

    /*
     * Остальные фильтры полностью
     * повторяют существующий geojson endpoint.
     */

    AND (
      p_type IS NULL
      OR l.type = p_type
    )

    AND (
      p_city_id IS NULL
      OR l.city_id = p_city_id
    )

    AND (
      p_price_min IS NULL
      OR l.price >= p_price_min
    )

    AND (
      p_price_max IS NULL
      OR l.price <= p_price_max
    )

    AND (
      p_rooms IS NULL
      OR l.rooms = p_rooms
    )

    AND (
      p_area_min IS NULL
      OR l.area >= p_area_min
    )

    AND (
      p_area_max IS NULL
      OR l.area <= p_area_max
    )

    AND (
      p_furnished IS NULL
      OR l.furnished = p_furnished
    )

    AND (
      p_parking IS NULL
      OR l.parking = p_parking
    )

    AND (
      p_pets IS NULL
      OR l.pets = p_pets
    )

    AND (
      p_params IS NULL
      OR l.params @> p_params
    );

  RETURN result;
END;
$$;

ALTER FUNCTION public.get_listings_geojson_radius(
  double precision,
  double precision,
  integer,
  text,
  text,
  integer,
  integer,
  integer,
  integer,
  integer,
  boolean,
  boolean,
  boolean,
  jsonb
) OWNER TO postgres;