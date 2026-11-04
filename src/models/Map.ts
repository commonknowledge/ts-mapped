import z from "zod";
import { AreaSetCode } from "./AreaSet";
import { overlayBoundarySchema, savedVisualisationSchema } from "./MapView";
import { CalculationType } from "./shared";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// The most areas one list can hold
export const AREA_LIST_MAX_AREAS = 2000;

/** A named list of key areas, e.g. target seats: area codes from one
 *  boundary set, kept with their names so the list reads without lookups */
export const areaListSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(200),
  color: hexColorSchema,
  areaSetCode: z.enum(AreaSetCode),
  areas: z
    .array(z.object({ code: z.string(), name: z.string() }))
    .max(AREA_LIST_MAX_AREAS),
  // The data a list was picked by (e.g. lowest Majority), kept in its
  // table whatever the map shows later
  origin: z
    .object({
      dataSourceId: z.string(),
      calculationType: z.enum(CalculationType),
      columns: z
        .array(z.object({ name: z.string(), label: z.string() }))
        .min(1)
        .max(2),
      // Picked from the lowest or highest values, e.g. the most marginal
      order: z.enum(["lowest", "highest"]).optional(),
    })
    .optional(),
});

export type AreaList = z.infer<typeof areaListSchema>;

export const mapConfigSchema = z.object({
  markerDataSourceIds: z.array(z.string()),
  membersDataSourceId: z.string().nullish(),
  // Marker layer colours, shared by every view so a layer looks the same
  // whichever view is open. Views may still hold older per-view colours
  // ("markerColors" in the view config), used until a colour is picked here.
  markerColors: z.record(z.string(), hexColorSchema).optional(),
  placedMarkerColors: z.record(z.string(), hexColorSchema).optional(),
  folderColors: z.record(z.string(), hexColorSchema).optional(),
  turfColor: hexColorSchema.optional(),
  // The light editor's Areas list and inspector settings, shared by every
  // view of the map (each view keeps which visualisation is on). Same
  // shapes as the view config fields of the same names.
  savedVisualisations: z.array(savedVisualisationSchema).optional(),
  // Set once every view's visualisations have been gathered into the
  // map's list, so deleting one later doesn't bring it back
  visualisationsMergedFromViews: z.boolean().optional(),
  // Overlay boundary sets; each view keeps which are visible
  overlayBoundaries: z.array(overlayBoundarySchema).optional(),
  inspectorHiddenDataSourceIds: z.array(z.string()).optional(),
  inspectorExtraDataSourceIds: z.array(z.string()).optional(),
  inspectorAutoDataSourceIds: z.array(z.string()).optional(),
  inspectorOrderCustomised: z.boolean().optional(),
  inspectorRecordNameColumns: z.record(z.string(), z.string()).optional(),
  // Lists of key areas, shared by every view of the map
  areaLists: z.array(areaListSchema).optional(),
  // A tutorial map's own data, which its guided tour has you add
  tutorial: z
    .object({ membersDataSourceId: z.string(), areaDataSourceId: z.string() })
    .optional(),
});

export type MapConfig = z.infer<typeof mapConfigSchema>;

export const mapSchema = z.object({
  id: z.string(),
  name: z.string(),
  organisationId: z.string(),
  imageUrl: z.string().nullish(),
  infoContent: z.string().nullish(),
  config: mapConfigSchema,
  createdAt: z.date(),
});

export type Map = z.infer<typeof mapSchema>;
