import { verify } from "jsonwebtoken";
import { db } from "@/server/services/database";
import { hashPassword, verifyPassword } from "@/server/utils/auth";
import { User } from "../models/User";

export async function upsertUser(
  user: Pick<User, "email"> & { password: string }
) {
  const passwordHash = await hashPassword(user.password);
  const newUser = { ...user, passwordHash, password: undefined };
  return db
    .insertInto("user")
    .values(newUser)
    .onConflict((oc) =>
      oc.columns(["email"]).doUpdateSet({
        passwordHash: newUser.passwordHash,
      })
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
}: Pick<User, "email"> & { password: string }) {
  const user = await db
    .selectFrom("user")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();
  if (!user) return null;
  const passwordValid = await verifyPassword(password, user.passwordHash);
  return passwordValid ? user : null;
}

export async function findUserById(id: string) {
  return db
    .selectFrom("user")
    .where("id", "=", id)
    .selectAll()
    .executeTakeFirst();
}

export async function findUserByEmail(email: string) {
  return db
    .selectFrom("user")
    .where("email", "=", email)
    .selectAll()
    .executeTakeFirst();
}

export async function findUserByToken(token: string) {
  const decoded = verify(token, process.env.JWT_SECRET || "") as { id: string };
  return findUserById(decoded.id);
}
