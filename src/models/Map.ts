import z from "zod";

export enum MarkerDisplayMode {
  Clusters = "clusters",
  Heatmap = "heatmap",
  // Uniform semi-transparent dots, no clustering: density reads via overdraw
  Overlap = "overlap",
}

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

export const mapConfigSchema = z.object({
  markerDataSourceIds: z.array(z.string()),
  membersDataSourceId: z.string().nullish(),
  markerDisplayModes: z.record(z.nativeEnum(MarkerDisplayMode)).optional(),
  // Marker layer colours live in the map view config ("markerColors" there);
  // migrated out of the map config by the marker_colors_to_view migration.
  placedMarkerColors: z.record(hexColorSchema).optional(),
  folderColors: z.record(hexColorSchema).optional(),
  turfColor: hexColorSchema.optional(),
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
