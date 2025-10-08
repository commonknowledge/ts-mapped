import type { RouterOutputs } from "@/services/trpc/react";

export type View = RouterOutputs["map"]["get"]["views"][number];
