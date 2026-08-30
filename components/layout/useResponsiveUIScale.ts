"use client";

import {
  useEffect,
  useState,
} from "react";

/**
 * ============================================================
 * JAYMAP RESPONSIVE UI SCALE
 * ============================================================
 *
 * Единый responsive engine для overlay UI.
 *
 * Используется:
 *
 *   Navbar
 *   Sidebar
 *
 * MainMap сюда НЕ входит.
 *
 * BASELINE:
 *
 *   1920 × 912
 *
 * Поведение ниже baseline сохраняет существующую логику.
 *
 * Поведение выше baseline:
 *
 *   - UI плавно увеличивается;
 *   - Navbar и Sidebar имеют разную максимальную величину;
 *   - рост ограничен сверху;
 *   - mobile/tablet логика ниже baseline не изменяется.
 * ============================================================
 */

export const RESPONSIVE_UI_DESIGN_WIDTH =
  1920;

export const RESPONSIVE_UI_DESIGN_HEIGHT =
  912;

/**
 * Минимальный scale.
 *
 * Существующее значение сохраняем.
 */
export const RESPONSIVE_UI_MIN_SCALE =
  0.72;

/**
 * Максимальный scale Navbar
 * на больших desktop viewport.
 *
 * Было 1.18.
 * Поднимаем до 1.28, чтобы интерфейс
 * не терялся на больших мониторах.
 */
export const RESPONSIVE_UI_NAVBAR_MAX_SCALE =
  1.28;

/**
 * Максимальный scale Sidebar.
 *
 * Sidebar немного меньше Navbar,
 * чтобы не съедать рабочую область карты.
 */
export const RESPONSIVE_UI_SIDEBAR_MAX_SCALE =
  1.24;

/**
 * Базовая ширина Navbar.
 *
 * На baseline сохраняется существующая
 * геометрия компонента.
 */
export const RESPONSIVE_UI_NAVBAR_BASE_WIDTH =
  1000;

/**
 * Максимальная логическая ширина Navbar.
 *
 * Пока ширину самого компонента
 * не меняем — это только константа
 * responsive engine.
 */
export const RESPONSIVE_UI_NAVBAR_MAX_WIDTH =
  1240;

/**
 * Базовая ширина Sidebar.
 */
export const RESPONSIVE_UI_SIDEBAR_BASE_WIDTH =
  360;

/**
 * Максимальная логическая ширина Sidebar.
 */
export const RESPONSIVE_UI_SIDEBAR_MAX_WIDTH =
  420;

export type ResponsiveUIScaleMode =
  | "default"
  | "navbar"
  | "sidebar";

interface ResponsiveUIScaleOptions {
  mode?: ResponsiveUIScaleMode;
}

function clamp(
  value: number,
  min: number,
  max: number
): number {
  return Math.min(
    max,
    Math.max(min, value)
  );
}

/**
 * ============================================================
 * COMPACT SCALE
 * ============================================================
 *
 * Ниже baseline сохраняем старую модель:
 *
 * scale = min(widthRatio, heightRatio)
 *
 * с существующим нижним пределом.
 */
function calculateCompactScale(
  width: number,
  height: number
): number {
  const widthScale =
    width /
    RESPONSIVE_UI_DESIGN_WIDTH;

  const heightScale =
    height /
    RESPONSIVE_UI_DESIGN_HEIGHT;

  const rawScale =
    Math.min(
      widthScale,
      heightScale
    );

  return Math.max(
    RESPONSIVE_UI_MIN_SCALE,
    rawScale
  );
}

/**
 * ============================================================
 * LARGE DESKTOP SCALE
 * ============================================================
 *
 * Выше baseline главным фактором становится
 * ширина viewport.
 *
 * Мы сознательно используем width, а не
 * min(widthRatio, heightRatio), потому что
 * ultrawide viewport иначе остаётся слишком мелким.
 *
 * Диапазон нормируется:
 *
 *   1920 → 0
 *   3840 → 1
 *
 * После этого результат переводится
 * в диапазон:
 *
 *   1.00 → maxScale
 */
function calculateLargeDesktopScale(
  width: number,
  maxScale: number
): number {
  const widthProgress =
    clamp(
      (
        width -
          RESPONSIVE_UI_DESIGN_WIDTH
      ) /
        (
          3840 -
          RESPONSIVE_UI_DESIGN_WIDTH
        ),
      0,
      1
    );

  const scale =
    1 +
    widthProgress *
      (
        maxScale -
        1
      );

  return clamp(
    scale,
    1,
    maxScale
  );
}

/**
 * ============================================================
 * MAIN SCALE CALCULATION
 * ============================================================
 */
function calculateResponsiveUIScale(
  width: number,
  height: number,
  mode: ResponsiveUIScaleMode
): number {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return 1;
  }

  const widthScale =
    width /
    RESPONSIVE_UI_DESIGN_WIDTH;

  const heightScale =
    height /
    RESPONSIVE_UI_DESIGN_HEIGHT;

  /**
   * ----------------------------------------------------------
   * BELOW BASELINE
   * ----------------------------------------------------------
   *
   * Существующее поведение сохраняется.
   */
  if (
    widthScale < 1 ||
    heightScale < 1
  ) {
    return calculateCompactScale(
      width,
      height
    );
  }

  /**
   * ----------------------------------------------------------
   * BASELINE
   * ----------------------------------------------------------
   */
  if (
    width ===
      RESPONSIVE_UI_DESIGN_WIDTH &&
    height ===
      RESPONSIVE_UI_DESIGN_HEIGHT
  ) {
    return 1;
  }

  /**
   * ----------------------------------------------------------
   * LARGE DESKTOP
   * ----------------------------------------------------------
   */

  if (
    mode === "sidebar"
  ) {
    return calculateLargeDesktopScale(
      width,
      RESPONSIVE_UI_SIDEBAR_MAX_SCALE
    );
  }

  /**
   * Navbar и default.
   */
  return calculateLargeDesktopScale(
    width,
    RESPONSIVE_UI_NAVBAR_MAX_SCALE
  );
}

/**
 * ============================================================
 * RESPONSIVE UI SCALE HOOK
 * ============================================================
 */
export function useResponsiveUIScale(
  options: ResponsiveUIScaleOptions = {}
) {
  const {
    mode = "default",
  } = options;

  const [
    scale,
    setScale,
  ] =
    useState(1);

  useEffect(() => {
    let frameId:
      number | null =
      null;

    const updateScale =
      () => {
        if (
          frameId !==
          null
        ) {
          cancelAnimationFrame(
            frameId
          );
        }

        frameId =
          requestAnimationFrame(
            () => {
              const nextScale =
                calculateResponsiveUIScale(
                  window.innerWidth,
                  window.innerHeight,
                  mode
                );

              setScale(
                (
                  previousScale
                ) => {
                  if (
                    Math.abs(
                      previousScale -
                        nextScale
                    ) <
                    0.001
                  ) {
                    return previousScale;
                  }

                  return nextScale;
                }
              );

              frameId =
                null;
            }
          );
      };

    /**
     * Первичный расчёт.
     */
    updateScale();

    /**
     * Изменение размеров окна.
     */
    window.addEventListener(
      "resize",
      updateScale
    );

    /**
     * Отслеживание изменения
     * размера document root.
     */
    const resizeObserver =
      new ResizeObserver(
        () => {
          updateScale();
        }
      );

    resizeObserver.observe(
      document.documentElement
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateScale
      );

      resizeObserver.disconnect();

      if (
        frameId !==
        null
      ) {
        cancelAnimationFrame(
          frameId
        );
      }
    };
  }, [mode]);

  return scale;
}