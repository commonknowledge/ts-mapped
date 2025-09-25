import z from "zod";
import { folderSchema } from "@/server/models/Folder";
import { deleteFolder, upsertFolder } from "@/server/repositories/Folder";
import { deletePlacedMarkersByFolderId } from "@/server/repositories/PlacedMarker";
import { mapProcedure, router } from "..";

export const folderRouter = router({
  delete: mapProcedure
    .input(z.object({ folderId: z.string() }))
    .mutation(async ({ input }) => {
      await deletePlacedMarkersByFolderId(input.folderId);
      return deleteFolder(input.folderId);
    }),

  upsert: mapProcedure.input(folderSchema).mutation(async ({ input }) => {
    return upsertFolder(input);
  }),
});
