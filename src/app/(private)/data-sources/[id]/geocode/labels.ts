import { AreaSetCode, GeocodingType } from "@/types";

export const AreaSetCodeLabels: Record<AreaSetCode, string> = {
  PC: "",
  // PC is excluded from the area set dropdown, as a convenience
  // top-level option of type: "postcode" is provided to users
  OA21: "Census Output Area (2021)",
  MSOA21: "Middle Super Output Area (2021)",
  WMC24: "Westminster Constituency (2024)",
};

export const GeocodingTypeLabels: Record<GeocodingType | "postcode", string> = {
  address: 'Address, e.g. "113-115 Fonthill Road, N4 3HH"',
  code: 'Area code, e.g. "E14001305"',
  name: 'Area name, e.g. "Islington North"',
  postcode: "UK Postcode",
  none: "", // This is excluded from the dropdown, but here for type safety
};
