import {
  NewPublishedLayer,
  PublishedLayerUpdate,
} from "@/server/models/PublishedLayers";
import { db } from "@/server/services/database";

export function createPublishedLayer(publishedLayer: NewPublishedLayer) {
  return db.insertInto("publishedLayer").values(publishedLayer).execute();
}

export function listPublishedLayers() {
  return db.selectFrom("publishedLayer").selectAll().execute();
}

export function findPublishedLayerById(id: number) {
  return db
    .selectFrom("publishedLayer")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export function updatePublishedLayer(
  id: number,
  publishedLayer: PublishedLayerUpdate
) {
  return db
    .updateTable("publishedLayer")
    .set(publishedLayer)
    .where("id", "=", id)
    .execute();
}

export function deletePublishedLayer(id: number) {
  return db.deleteFrom("publishedLayer").where("id", "=", id).execute();
}
