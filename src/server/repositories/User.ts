import { jwtVerify } from "jose";
import { NewUser, UserUpdate } from "@/server/models/User";
import { db } from "@/server/services/database";
import { hashPassword, verifyPassword } from "@/server/utils/auth";

type Nullable<T> = { [K in keyof T]: T[K] | null };

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
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "");
  const { payload } = await jwtVerify<{ id: string }>(token, secret);
  return findUserById(payload.id);
}

export async function updateUser(
  id: string,
  {
    password,
    ...data
  }: Nullable<Omit<UserUpdate, "id" | "passwordHash"> & { password?: string }>,
) {
  const update = { email: data?.email || undefined } as UserUpdate;

  if (password) {
    update.passwordHash = await hashPassword(password);
  }
  if (data.email) {
    update.email = data.email.toLowerCase().trim();
  }

  return db
    .updateTable("user")
    .where("id", "=", id)
    .set(update)
    .returningAll()
    .executeTakeFirstOrThrow();
}
