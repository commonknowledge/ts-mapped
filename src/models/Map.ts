import z from "zod";
import { savedVisualisationSchema } from "./MapView";

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const mapConfigSchema = z.object({
  markerDataSourceIds: z.array(z.string()),
  membersDataSourceId: z.string().nullish(),
  // Marker layer colours live in the map view config ("markerColors" there);
  // migrated out of the map config by the marker_colors_to_view migration.
  placedMarkerColors: z.record(z.string(), hexColorSchema).optional(),
  folderColors: z.record(z.string(), hexColorSchema).optional(),
  turfColor: hexColorSchema.optional(),
  // The light editor's Areas list and inspector settings, shared by every
  // view of the map (each view keeps which visualisation is on). Same
  // shapes as the view config fields of the same names.
  savedVisualisations: z.array(savedVisualisationSchema).optional(),
  inspectorHiddenDataSourceIds: z.array(z.string()).optional(),
  inspectorExtraDataSourceIds: z.array(z.string()).optional(),
  inspectorAutoDataSourceIds: z.array(z.string()).optional(),
  inspectorOrderCustomised: z.boolean().optional(),
  inspectorRecordNameColumns: z.record(z.string(), z.string()).optional(),
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
