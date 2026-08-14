import { memo } from "react";
import type { WorkspaceProps } from "./types";

const MOCK_HISTORY = ["Аренда, Бишкек, до 40 000 ₽", "Коммерция, офис, Ош", "Земля, ИЖС, Чуйская обл."];

function HistoryWorkspace(_: WorkspaceProps) {
  return (
    <div className="flex flex-col gap-2 px-5 py-5">
      {MOCK_HISTORY.map((h, i) => (
        <div key={i} className="rounded-[var(--sb-radius-control)] px-3.5 py-3 text-[13px] text-[var(--sb-text)] hover:bg-[var(--sb-hover-bg)]">
          {h}
        </div>
      ))}
    </div>
  );
}
export default memo(HistoryWorkspace);
