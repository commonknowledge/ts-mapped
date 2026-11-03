"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useFolderMutations, useFoldersQuery } from "./useFolders";
import { useHandleDropPin } from "./usePlacedMarkers";

export const CUSTOM_MARKERS_FOLDER_NAME = "Custom markers";

/**
 * Starts pin-drop mode; the pin lands in a "Custom markers" folder, created
 * the first time. The folder is a normal folder, so it can be renamed,
 * reordered or deleted like any other.
 */
export function useDropCustomMarker() {
  const { data: folders = [] } = useFoldersQuery();
  const { insertFolder } = useFolderMutations();
  const { handleDropPin } = useHandleDropPin();

  return useCallback(() => {
    const existing = folders.find(
      (f) =>
        (!f.type || f.type === "placedMarker") &&
        f.name === CUSTOM_MARKERS_FOLDER_NAME,
    );
    let folderId = existing?.id;
    if (!folderId) {
      folderId = uuidv4();
      insertFolder({
        id: folderId,
        name: CUSTOM_MARKERS_FOLDER_NAME,
        notes: "",
        type: "placedMarker",
      });
    }
    handleDropPin({ folderId });
  }, [folders, handleDropPin, insertFolder]);
}
