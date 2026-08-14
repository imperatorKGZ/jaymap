import { memo } from "react";
import { ProfileIcon } from "../icons";
import { IconRenderer } from "../IconRenderer";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

function ProfileWorkspace(_: WorkspaceProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--sb-accent-soft)] text-[var(--sb-accent)]">
        <IconRenderer icon={ProfileIcon} size={28} />
      </div>
      <div>
        <p className="text-[14px] font-semibold text-[var(--sb-text-strong)]">{t("profile.guest")}</p>
        <p className="text-[12px] text-[var(--sb-text-muted)]">{t("profile.loginPrompt")}</p>
      </div>
      <button className="mt-2 min-h-[44px] w-full rounded-full bg-[var(--sb-cta)] px-4 text-[13px] font-semibold text-[var(--sb-cta-text)] hover:bg-[var(--sb-cta-hover)]">
        {t("profile.login")}
      </button>
    </div>
  );
}
export default memo(ProfileWorkspace);
