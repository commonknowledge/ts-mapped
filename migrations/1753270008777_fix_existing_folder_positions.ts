import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  // Get all marker folders that don't have a position or have position = 0
  const folders = await db
    .selectFrom("markerFolder")
    .select(["id", "position"])
    .where((eb) => eb.or([eb("position", "=", 0), eb("position", "is", null)]))
    .execute();

  console.log(`Found ${folders.length} folders that need position updates`);

  // Update each folder with a unique position
  for (let i = 0; i < folders.length; i++) {
    const position = (i + 1) * 1000; // Start from 1000, increment by 1000
    await db
      .updateTable("markerFolder")
      .set({ position })
      .where("id", "=", folders[i].id)
      .execute();

    console.log(`Updated folder ${folders[i].id} with position ${position}`);
  }
}

export async function down(db: Kysely<unknown>): Promise<void> {
  // Reset all positions to 0
  await db.updateTable("markerFolder").set({ position: 0 }).execute();
}
