import { AreaSetCode } from "@/server/models/AreaSet";

export interface AreaSetMetadata {
  code: AreaSetCode;
  name: string;
  filename: string;
  link: string;
  isNationalGridSRID: boolean;
  codeKey: string;
  nameKey: string;
  nameFormatter?: (props: Record<string, string>) => string;
}

export const areaSetsMetadata: AreaSetMetadata[] = [
  {
    code: AreaSetCode.WMC24,
    name: "Westminster Constituencies 2024",
    filename: "constituencies.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/ons::westminster-parliamentary-constituencies-july-2024-boundaries-uk-bgc-2/about",
    isNationalGridSRID: false,
    codeKey: "PCON24CD",
    nameKey: "PCON24NM",
  },
  {
    code: AreaSetCode.LAD25,
    name: "Local Authority Districts 2025",
    filename: "lads.geojson",
    link: "https://www.data.gov.uk/dataset/bde3b6d9-23a7-4bf6-bb55-df7b439b713a/local-authority-districts-may-2025-boundaries-uk-bgc-v2",
    isNationalGridSRID: true,
    codeKey: "LAD25CD",
    nameKey: "LAD25NM",
  },
  {
    code: AreaSetCode.W25,
    name: "UK Wards 2025",
    filename: "wards.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/6ba7cf950a504d82809131c945fe70f1_0/about",
    isNationalGridSRID: false,
    codeKey: "WD25CD",
    nameKey: "WD25NM",
  },
  {
    code: AreaSetCode.LSOA21,
    name: "Lower Super Output Areas 2021",
    filename: "lsoas.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/ons::lower-layer-super-output-areas-december-2021-boundaries-ew-bgc-v5-2/about",
    isNationalGridSRID: false,
    codeKey: "LSOA21CD",
    nameKey: "LSOA21NM",
  },
  {
    code: AreaSetCode.MSOA21,
    name: "Middle Super Output Areas 2021",
    filename: "msoas.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/ons::middle-layer-super-output-areas-december-2021-boundaries-ew-bgc-v3-2/about",
    isNationalGridSRID: false,
    codeKey: "MSOA21CD",
    nameKey: "MSOA21NM",
  },
  {
    code: AreaSetCode.OA21,
    name: "Census Output Areas 2021",
    filename: "outputAreas.geojson",
    link: "https://www.data.gov.uk/dataset/4d4e021d-fe98-4a0e-88e2-3ead84538537/output-areas-december-2021-boundaries-ew-bgc-v21",
    isNationalGridSRID: true,
    codeKey: "OA21CD",
    nameKey: "LSOA21NM",
    nameFormatter: (props) => `${props.LSOA21NM}: ${props.OA21CD}`,
  },
  {
    code: AreaSetCode.UKR18,
    name: "Regions & Nations 2018",
    filename: "regions.geojson",
    link: "https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/932f769148bb4753989e55b6703b7add/geojson?layers=0",
    isNationalGridSRID: true,
    codeKey: "eer18cd",
    nameKey: "eer18nm",
  },
  {
    code: AreaSetCode.UKC24,
    name: "UK Countries 2024",
    filename: "countries.geojson",
    link: "https://www.data.gov.uk/dataset/c0ebe11c-0c81-4eed-81b3-a0394d4116a9/countries-december-2024-boundaries-uk-bgc1",
    isNationalGridSRID: true,
    codeKey: "CTRY24CD",
    nameKey: "CTRY24NM",
  },
  {
    code: AreaSetCode.CTYUA24,
    name: "Counties 2024",
    filename: "counties.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/ons::counties-and-unitary-authorities-december-2024-boundaries-uk-bgc-1/about",
    isNationalGridSRID: false,
    codeKey: "CTYUA24CD",
    nameKey: "CTYUA24NM",
  },
  {
    code: AreaSetCode.CAUTH25,
    name: "Combined Authorities 2025",
    filename: "combined_authorities.geojson",
    link: "https://geoportal.statistics.gov.uk/datasets/ons::combined-authorities-may-2025-boundaries-en-bgc/about",
    isNationalGridSRID: false,
    codeKey: "CAUTH25CD",
    nameKey: "CAUTH25NM",
  },
  {
    code: AreaSetCode.SPC22,
    name: "Scottish Parliament Constituencies 2022",
    filename: "sp_constituencies.geojson",
    link: "https://www.data.gov.uk/dataset/58363e4f-c65f-4f19-bc3b-b07d04520804/scottish-parliamentary-constituencies-december-2022-boundaries-sc-bgc",
    isNationalGridSRID: true,
    codeKey: "SPC22CD",
    nameKey: "SPC22NM",
  },
  {
    code: AreaSetCode.SENC22,
    name: "Senedd Constituencies 2022",
    filename: "senedd_constituencies.geojson",
    link: "https://www.data.gov.uk/dataset/b15cb929-0c68-411e-bd1e-2be98fbe2625/senedd-cymru-constituencies-december-2022-boundaries-wa-bgc",
    isNationalGridSRID: true,
    codeKey: "SENC22CD",
    nameKey: "SENC22NM",
  },
];
