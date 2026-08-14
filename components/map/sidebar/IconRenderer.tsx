/**
 * IconRenderer.tsx
 * ------------------------------------------------------------
 * Единственное место в приложении, которое умеет "показать иконку".
 * Не знает ни про одну конкретную библиотеку иконок.
 * Принимает:
 *   - React-компонент  icon={RentalIcon}
 *   - строку-путь к SVG-файлу  icon="/icons/rental.svg"
 * Замена всего набора иконок = замена значений в sidebarConfig.tsx,
 * этот файл трогать не нужно.
 * ------------------------------------------------------------
 */
import { memo, type ComponentType, type SVGProps } from "react";

export type IconSource = ComponentType<SVGProps<SVGSVGElement>> | string;

interface IconRendererProps {
  icon: IconSource;
  size?: number;
  className?: string;
  title?: string;
}

function IconRendererBase({ icon: Icon, size = 20, className, title }: IconRendererProps) {
  if (typeof Icon === "string") {
    return (
      <span
        role="img"
        aria-label={title}
        className={className}
        style={{
          display: "inline-block",
          width: size,
          height: size,
          backgroundColor: "currentColor",
          WebkitMaskImage: `url(${Icon})`,
          maskImage: `url(${Icon})`,
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
        }}
      />
    );
  }

  return <Icon width={size} height={size} className={className} aria-hidden="true" focusable="false" />;
}

export const IconRenderer = memo(IconRendererBase);
