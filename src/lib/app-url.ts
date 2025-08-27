import { trimLeadingSlashes, trimTrailingSlashes } from "./text";

export const getAbsoluteUrl = (path = "/") => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://localhost:3000";
  return `${trimTrailingSlashes(base)}/${trimLeadingSlashes(path)}`;
};
