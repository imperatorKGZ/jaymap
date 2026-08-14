import { memo } from "react";
import { Toggle } from "../controls/FilterControls";
import type { WorkspaceProps } from "./types";
import { useTranslation } from "@/lib/i18n";

interface LayersFilters {
  heatmap: boolean;
  transit: boolean;
  schools: boolean;
  boundaries: boolean;
}
export const LAYERS_DEFAULTS: LayersFilters = { heatmap: false, transit: false, schools: false, boundaries: true };

function MapLayersWorkspace({ values, setValue }: WorkspaceProps<LayersFilters>) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-1 px-5 py-5">
      <Toggle label={t("layers.heatmap")} checked={values.heatmap} onChange={(v) => setValue("heatmap", v)} />
      <Toggle label={t("layers.transit")} checked={values.transit} onChange={(v) => setValue("transit", v)} />
      <Toggle label={t("layers.schools")} checked={values.schools} onChange={(v) => setValue("schools", v)} />
      <Toggle label={t("layers.boundaries")} checked={values.boundaries} onChange={(v) => setValue("boundaries", v)} />
    </div>
  );
}
export default memo(MapLayersWorkspace);
