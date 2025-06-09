import { randomBytes, scrypt } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const [salt, hexKey] = hash.split(":");
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        return reject(err);
      }
      resolve(derivedKey.toString("hex") === hexKey);
    });
  });
}
