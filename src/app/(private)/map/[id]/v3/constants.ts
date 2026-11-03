import { AreaSetGroupCode } from "@/models/AreaSet";

/**
 * The boundary sets as the light editor offers them: grouped by what they're
 * for, with plain names and a line on each. "then … as you zoom in" sets
 * switch to smaller areas at closer zoom levels.
 */
export const BOUNDARY_GROUPS: {
  label: string;
  options: { code: AreaSetGroupCode; name: string; description: string }[];
}[] = [
  {
    label: "Parliaments",
    options: [
      {
        code: AreaSetGroupCode.WMC24,
        name: "Westminster constituencies",
        description: "UK Parliament seats, 2024 boundaries",
      },
      {
        code: AreaSetGroupCode.SPC22,
        name: "Scottish Parliament constituencies",
        description: "Holyrood seats",
      },
      {
        code: AreaSetGroupCode.SENC22,
        name: "Senedd constituencies",
        description: "Welsh Parliament seats",
      },
    ],
  },
  {
    label: "Local government",
    options: [
      {
        code: AreaSetGroupCode.LAD25,
        name: "Local authorities",
        description: "District, borough and unitary councils",
      },
      {
        code: AreaSetGroupCode.W26,
        name: "Local authorities, then wards",
        description: "Council wards as you zoom in",
      },
      {
        code: AreaSetGroupCode.CTYUA24,
        name: "Counties",
        description: "Counties and unitary authorities",
      },
      {
        code: AreaSetGroupCode.CED26,
        name: "Counties, then electoral divisions",
        description: "County council divisions as you zoom in",
      },
      {
        code: AreaSetGroupCode.CAUTH25,
        name: "Combined authorities",
        description: "Groups of councils, often with a mayor",
      },
      {
        code: AreaSetGroupCode.PUA26,
        name: "Proposed unitary authorities",
        description: "New councils proposed in local government reorganisation",
      },
    ],
  },
  {
    label: "Census neighbourhoods",
    options: [
      {
        code: AreaSetGroupCode.MSOA21,
        name: "MSOAs, then output areas",
        description:
          "England and Wales: about 7,000 people each, then about 300",
      },
      {
        code: AreaSetGroupCode.LSOA21,
        name: "MSOAs, then LSOAs, then output areas",
        description: "Adds LSOAs, about 1,500 people each, in between",
      },
      {
        code: AreaSetGroupCode.SOA22,
        name: "Scottish census areas",
        description: "Intermediate zones, then data zones and output areas",
      },
    ],
  },
  {
    label: "Regions and nations",
    options: [
      {
        code: AreaSetGroupCode.UKR18,
        name: "Regions",
        description: "English regions, plus Scotland, Wales and NI",
      },
      {
        code: AreaSetGroupCode.UKC24,
        name: "Countries",
        description: "England, Scotland, Wales and Northern Ireland",
      },
    ],
  },
  {
    label: "Other",
    options: [
      {
        code: AreaSetGroupCode.ICB22,
        name: "NHS integrated care boards",
        description: "Areas that plan health services in England",
      },
      {
        code: AreaSetGroupCode.COED26,
        name: "Church of England dioceses",
        description: "Areas served by each bishop",
      },
    ],
  },
];
