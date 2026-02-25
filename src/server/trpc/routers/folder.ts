import z from "zod";
import { folderSchema } from "@/server/models/Folder";
import { deleteFolder, upsertFolder } from "@/server/repositories/Folder";
import { deletePlacedMarkersByFolderId } from "@/server/repositories/PlacedMarker";
import { deleteTurfsByFolderId } from "@/server/repositories/Turf";
import { mapWriteProcedure, router } from "..";

export const folderRouter = router({
  delete: mapWriteProcedure
    .input(z.object({ folderId: z.string() }))
    .mutation(async ({ input }) => {
      await deletePlacedMarkersByFolderId(input.folderId);
      await deleteTurfsByFolderId(input.folderId);
      await deleteFolder(input.folderId);
      return true;
    }),

  upsert: mapWriteProcedure.input(folderSchema).mutation(async ({ input }) => {
    return upsertFolder(input);
  }),
});
