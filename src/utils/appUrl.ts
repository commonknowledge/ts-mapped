import { DEV_NEXT_PUBLIC_BASE_URL } from "@/constants";
import { trimLeadingSlashes, trimTrailingSlashes } from "./text";

export const getAbsoluteUrl = (path = "/") => {
  const base = process.env.NEXT_PUBLIC_BASE_URL || DEV_NEXT_PUBLIC_BASE_URL;
  return `${trimTrailingSlashes(base)}/${trimLeadingSlashes(path)}`;
};
