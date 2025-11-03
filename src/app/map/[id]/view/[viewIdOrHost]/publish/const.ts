import { PublicMapColumnType } from "@/server/models/PublicMap";

export const TRANS_FRIENDLY_GPS_LABEL = "Services";
export const TRANS_FRIENDLY_GPS_FILTERS = [
  {
    name: "Bridging Prescription with Recommendation",
    type: PublicMapColumnType.Boolean,
  },
  {
    name: "Bridging Prescription without recommendation",
    type: PublicMapColumnType.Boolean,
  },
  {
    name: "Injections",
    type: PublicMapColumnType.Boolean,
  },
  {
    name: "Blood Tests for self-medication",
    type: PublicMapColumnType.Boolean,
  },
  {
    name: "Non-binary identity accepted",
    type: PublicMapColumnType.Boolean,
  },
  {
    name: "Shared Care Agreement",
    type: PublicMapColumnType.Boolean,
  },
];
