import type { RouterOutputs } from "@/services/trpc/react";

export type View = RouterOutputs["map"]["byId"]["views"][number];
