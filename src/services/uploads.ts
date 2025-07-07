import { UploadResponseBody } from "@/types";

export const uploadFile = async (file: File | null): Promise<string> => {
  if (!file) {
    throw new Error("Invalid file");
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
  const data: UploadResponseBody = await response.json();
  return data.url;
};
