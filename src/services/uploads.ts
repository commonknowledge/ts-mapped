import { MAX_FILE_SIZE } from "@/constants";
import type { UploadResponseBody } from "@/types";

export const uploadFile = async (file: File | null): Promise<string> => {
  if (!file) {
    throw new Error("Invalid file");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be 500MiB or less");
  }
  const body = new FormData();
  body.set("file", file);
  const response = await fetch("/api/upload", {
    body,
    method: "POST",
  });
  if (!response.ok) {
    throw new Error("Failed to upload file");
  }
  const data = (await response.json()) as UploadResponseBody;
  return data.url;
};
