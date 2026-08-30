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
 * ВАЖНО:
 *
 * Это масштаб ТОЛЬКО интерфейса.
 *
 * Карта MainMap сюда НЕ входит.
 *
 * Baseline:
 *
 * 1920 × 912
 *
 * При viewport больше baseline:
 * scale = 1
 *
 * При viewport меньше baseline:
 * UI постепенно уменьшается.
 *
 * Ниже MIN_SCALE не опускаемся.
 * Мобильный интерфейс позже будет отдельным.
 */

export const RESPONSIVE_UI_DESIGN_WIDTH =
  1920;

export const RESPONSIVE_UI_DESIGN_HEIGHT =
  912;

/**
 * Минимальный размер desktop/tablet UI.
 *
 * Ниже этого значения позже переключимся
 * на MobileNavbar / MobileSidebar.
 */
export const RESPONSIVE_UI_MIN_SCALE =
  0.72;

function calculateResponsiveUIScale(
  width: number,
  height: number
): number {
  if (
    width <= 0 ||
    height <= 0
  ) {
    return 1;
  }

  /**
   * Сравниваем реальный viewport
   * с нашим baseline сразу по двум осям.
   *
   * Берём меньший коэффициент,
   * потому что именно он ограничивает
   * доступное пространство.
   */
  const widthScale =
    width /
    RESPONSIVE_UI_DESIGN_WIDTH;

  const heightScale =
    height /
    RESPONSIVE_UI_DESIGN_HEIGHT;

  const rawScale =
    Math.min(
      widthScale,
      heightScale,
      1
    );

  /**
   * Не позволяем desktop/tablet UI
   * становиться слишком маленьким.
   *
   * При достижении этого значения
   * в будущем будем использовать
   * отдельную mobile-композицию.
   */
  return Math.max(
    RESPONSIVE_UI_MIN_SCALE,
    rawScale
  );
}

export function useResponsiveUIScale() {
  const [
    scale,
    setScale,
  ] = useState(1);

  useEffect(() => {
    let frameId:
      number | null =
      null;

    const updateScale =
      () => {
        /**
         * Не пересчитываем DOM
         * несколько раз подряд во время resize.
         */
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
                  window.innerHeight
                );

              setScale(
                nextScale
              );
            }
          );
      };

    /**
     * Первичный расчёт.
     */
    updateScale();

    /**
     * Обычный resize.
     */
    window.addEventListener(
      "resize",
      updateScale
    );

    /**
     * ResizeObserver нужен потому,
     * что размер layout может меняться
     * не только из-за window.resize:
     *
     * DevTools,
     * split view,
     * изменение размеров iframe,
     * контейнерные изменения и т.д.
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
  }, []);

  return scale;
}