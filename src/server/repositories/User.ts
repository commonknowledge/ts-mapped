import { NewUser } from "@/server/models/User";
import { db } from "@/server/services/database";
import { hashPassword, verifyPassword } from "@/server/utils/auth";

export async function upsertUser(
  user: Omit<NewUser, "passwordHash"> & { password: string },
) {
  const passwordHash = await hashPassword(user.password);
  const newUser = { ...user, passwordHash, password: undefined };
  return db
    .insertInto("user")
    .values(newUser)
    .onConflict((oc) =>
      oc.columns(["email"]).doUpdateSet({
        passwordHash: newUser.passwordHash,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteUser(id: string) {
  return db.deleteFrom("user").where("id", "=", id).executeTakeFirstOrThrow();
}

export async function findUserByEmailAndPassword({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const user = await db
    .selectFrom("user")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();
  if (!user) {
    return null;
  }
  const passwordValid = await verifyPassword(password, user.passwordHash);
  return passwordValid ? user : null;
}
