import z from "zod";

export enum PublicMapColumnType {
  Boolean = "Boolean",
  CommaSeparatedList = "CommaSeparatedList",
  ImageUrl = "ImageUrl",
  Link = "Link",
  String = "String",
}

export const publicMapColumnTypes = Object.values(PublicMapColumnType);

// Who can see a published public map: anyone, or only visitors a
// moderator has approved (see PublicMapAccess)
export enum PublicMapAccessMode {
  Open = "Open",
  Moderated = "Moderated",
}

export const publicMapColumnSchema = z.object({
  label: z.string(),
  sourceColumns: z.array(z.string()),
  type: z.enum(PublicMapColumnType),
});

export type PublicMapColumn = z.infer<typeof publicMapColumnSchema>;

export const publicMapDataSourceConfigSchema = z.object({
  allowUserEdit: z.boolean(),
  allowUserSubmit: z.boolean(),
  dataSourceId: z.string(),
  dataSourceLabel: z.string(),
  formUrl: z.string(),
  formButtonText: z.string().optional(),
  editFormUrl: z.string(),
  editFormButtonText: z.string().optional(),
  nameColumns: z.array(z.string()),
  nameLabel: z.string(),
  descriptionColumn: z.string(),
  descriptionLabel: z.string(),
  dateColumn: z.string().optional(),
  dateFormat: z.string().optional(),
  sortBy: z.enum(["name", "date"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  // Hide records whose date is before today from the public listing and map.
  // Unset means "on for Events data sources, off otherwise" (see
  // getHidePastEvents); the public sidebar offers a "Past events" filter to
  // reach the hidden records.
  hidePastEvents: z.boolean().optional(),
  additionalColumns: z.array(publicMapColumnSchema),
  positiveTooltip: z.string().optional(),
  negativeTooltip: z.string().optional(),
  unknownTooltip: z.string().optional(),
});

export type PublicMapDataSourceConfig = z.infer<
  typeof publicMapDataSourceConfigSchema
>;

// The editable fields that can appear in a draft
export const publicMapDraftSchema = z.object({
  host: z.string(),
  name: z.string(),
  description: z.string(),
  descriptionLong: z.string(),
  descriptionLink: z.string(),
  imageUrl: z.string().nullish(),
  published: z.boolean(),
  dataSourceConfigs: z.array(publicMapDataSourceConfigSchema),
  colorScheme: z.string(),
  // Whether markers cluster at low zoom on the published map
  clusteringEnabled: z.boolean(),
  accessMode: z.enum(PublicMapAccessMode),
  // Emailed about new access requests on a moderated map. Never sent to
  // visitors (stripped by publicMap.get).
  moderatorEmails: z.array(z.email()),
  // The pages the map is embedded on. Magic links only ever point at one of
  // these (the one the request came from, else the first), or at the map's
  // own subdomain when empty.
  embedUrls: z.array(z.url()),
});

export type PublicMapDraft = z.infer<typeof publicMapDraftSchema>;

export const publicMapSchema = publicMapDraftSchema.extend({
  host: z.string().nullable(),
  id: z.string(),
  mapId: z.string(),
  viewId: z.string(),
  // If this map should show in the Public Maps dashboard
  // True if created from the Public Maps dashboard, or if the map has ever been published
  // This is to prevent auto-generated public maps cluttering the dashboard
  listed: z.boolean(),
  createdAt: z.date(),
  draft: publicMapDraftSchema.nullish(),
});

export type PublicMap = z.infer<typeof publicMapSchema>;
