import { AreaSetCode, LooseGeocodingConfig } from "@/__generated__/types";

import { AreaSetGroupCode } from "@/__generated__/types";

export const getValidAreaSetGroupCodes = (
    dataSourceGeocodingConfig: LooseGeocodingConfig | null | undefined
): AreaSetGroupCode[] => {
    if (!dataSourceGeocodingConfig) {
        return [];
    }
    if (dataSourceGeocodingConfig.areaSetCode) {
        const validAreaSetGroupCodes: Record<AreaSetCode, AreaSetGroupCode[]> = {
            [AreaSetCode.PC]: [AreaSetGroupCode.OA21, AreaSetGroupCode.WMC24],
            [AreaSetCode.OA21]: [AreaSetGroupCode.OA21, AreaSetGroupCode.WMC24],
            [AreaSetCode.MSOA21]: [AreaSetGroupCode.OA21, AreaSetGroupCode.WMC24],
            [AreaSetCode.WMC24]: [AreaSetGroupCode.WMC24],
        };
        return validAreaSetGroupCodes[dataSourceGeocodingConfig.areaSetCode];
    }
    return [AreaSetGroupCode.OA21, AreaSetGroupCode.WMC24];
};
