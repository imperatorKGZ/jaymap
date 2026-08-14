/**
 * SidebarOverlay.tsx
 * ------------------------------------------------------------
 * Затемняющая подложка для Tablet/Mobile, когда Sidebar открыта
 * поверх карты. Клик по подложке закрывает Sidebar.
 * На Desktop не используется (Sidebar всегда рядом с картой).
 * ------------------------------------------------------------
 */
import { memo } from "react";

interface SidebarOverlayProps {
  visible: boolean;
  onClose: () => void;
}

function SidebarOverlayBase({ visible, onClose }: SidebarOverlayProps) {
  return (
    <div
      aria-hidden={!visible}
      onClick={onClose}
      className={[
        "fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] transition-opacity duration-200 ease-out",
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      ].join(" ")}
    />
  );
}

export const SidebarOverlay = memo(SidebarOverlayBase);
