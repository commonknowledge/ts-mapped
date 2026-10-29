/** The key that signs every JWT the app issues. */
export const getJwtSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "");
