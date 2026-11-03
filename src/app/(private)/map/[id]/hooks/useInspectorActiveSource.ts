"use client";

import { useAtom } from "jotai";
import { inspectorActiveSourceIdAtom } from "../atoms/inspectorAtoms";

export function useInspectorActiveSource() {
  return useAtom(inspectorActiveSourceIdAtom);
}
