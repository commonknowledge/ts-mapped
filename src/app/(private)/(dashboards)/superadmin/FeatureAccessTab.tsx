"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Feature } from "@/models/Organisation";
import { useTRPC } from "@/services/trpc/react";
import { Switch } from "@/shadcn/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shadcn/ui/table";

const ALL_FEATURES = Object.values(Feature);

export function FeatureAccessTab() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: organisations } = useQuery(
    trpc.organisation.listAll.queryOptions(),
  );

  const { mutate: setFeatures } = useMutation(
    trpc.organisation.setFeatures.mutationOptions({
      onMutate: async ({ organisationId, features }) => {
        await queryClient.cancelQueries({
          queryKey: trpc.organisation.listAll.queryKey(),
        });
        const previous = queryClient.getQueryData(
          trpc.organisation.listAll.queryKey(),
        );
        queryClient.setQueryData(trpc.organisation.listAll.queryKey(), (old) =>
          old?.map((org) =>
            org.id === organisationId ? { ...org, features } : org,
          ),
        );
        return { previous };
      },
      onError: (error, _variables, context) => {
        if (context?.previous) {
          queryClient.setQueryData(
            trpc.organisation.listAll.queryKey(),
            context.previous,
          );
        }
        toast.error("Failed to update features", {
          description: error.message,
        });
      },
      onSettled: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.organisation.listAll.queryKey(),
        });
      },
    }),
  );

  const toggleFeature = (
    organisationId: string,
    currentFeatures: Feature[],
    feature: Feature,
    enabled: boolean,
  ) => {
    const features = enabled
      ? [...currentFeatures, feature]
      : currentFeatures.filter((f) => f !== feature);
    setFeatures({ organisationId, features });
  };

  return (
    <div className="mt-6">
      <h2 className="text-2xl font-medium mb-4">Feature Access</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Organisation</TableHead>
            {ALL_FEATURES.map((f) => (
              <TableHead key={f}>{f}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {organisations?.map((org) => (
            <TableRow key={org.id}>
              <TableCell>{org.name}</TableCell>
              {ALL_FEATURES.map((f) => (
                <TableCell key={f}>
                  <Switch
                    checked={org.features?.includes(f) ?? false}
                    onCheckedChange={(enabled) =>
                      toggleFeature(org.id, org.features ?? [], f, enabled)
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
