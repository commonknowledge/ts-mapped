import { AreaSetCodeLabels } from "@/labels";
import { getDefaultAreaSetGroupCode } from "../../components/Choropleth/configs";
import { BOUNDARY_GROUPS } from "../constants";
import type { AreaSetCode } from "@/models/AreaSet";

/** A boundary set by the name the boundaries picker gives it, e.g.
 *  "Westminster constituencies" */
export const getBoundaryName = (areaSetCode: AreaSetCode) => {
  const groupCode = getDefaultAreaSetGroupCode(areaSetCode);
  return (
    BOUNDARY_GROUPS.flatMap((group) => group.options).find(
      (option) => option.code === groupCode,
    )?.name ?? AreaSetCodeLabels[areaSetCode]
  );
};
