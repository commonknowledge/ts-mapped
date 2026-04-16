"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { type FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import FormFieldWrapper from "@/components/forms/FormFieldWrapper";
import { useOrganisations } from "@/hooks/useOrganisations";
import { useTRPC } from "@/services/trpc/react";
import { Button } from "@/shadcn/ui/button";
import { Checkbox } from "@/shadcn/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";

interface MapSelection {
  mapId: string;
  dataSourceIds: string[];
}

export default function CreateInvitationModal() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isCreatingNewOrg, setIsCreatingNewOrg] = useState(true);
  const [selectedMapIds, setSelectedMapIds] = useState<Set<string>>(new Set());
  const [selectedDataSourceIds, setSelectedDataSourceIds] = useState<
    Set<string>
  >(new Set());

  const { organisationId: senderOrganisationId } = useOrganisations();
  const trpc = useTRPC();
  const client = useQueryClient();

  const { data: organisations } = useQuery(
    trpc.organisation.listAll.queryOptions(),
  );
  const { data: mapData } = useQuery(trpc.map.listAll.queryOptions());

  const { mutate: createInvitationMutate, isPending } = useMutation(
    trpc.invitation.create.mutationOptions({
      onSuccess: () => {
        toast.success("Invitation created successfully", {
          description: "An invite has been sent to the user",
        });
        resetForm();
        setDialogOpen(false);
        client.invalidateQueries({
          queryKey: trpc.organisation.listAll.queryKey(),
        });
        client.invalidateQueries(trpc.invitation.list.queryFilter());
      },
      onError: (error) => {
        toast.error("Failed to create invitation.", {
          description: error.message,
        });
      },
    }),
  );

  const resetForm = () => {
    setName("");
    setEmail("");
    setOrganisationId("");
    setOrganisationName("");
    setIsCreatingNewOrg(true);
    setSelectedMapIds(new Set());
    setSelectedDataSourceIds(new Set());
  };

  // Collect data source IDs for each map
  const dataSourceIdsByMap = useMemo(() => {
    if (!mapData) return new Map<string, Set<string>>();
    const result = new Map<string, Set<string>>();
    for (const map of mapData.maps) {
      const dsIds = new Set<string>();
      for (const id of map.config.markerDataSourceIds) {
        if (id) dsIds.add(id);
      }
      if (map.config.membersDataSourceId) {
        dsIds.add(map.config.membersDataSourceId);
      }
      for (const view of map.views) {
        if (view.config.areaDataSourceId) {
          dsIds.add(view.config.areaDataSourceId);
        }
        for (const dsv of view.dataSourceViews) {
          dsIds.add(dsv.dataSourceId);
        }
      }
      result.set(map.id, dsIds);
    }
    return result;
  }, [mapData]);

  const toggleMap = (mapId: string) => {
    setSelectedMapIds((prev) => {
      const next = new Set(prev);
      if (next.has(mapId)) {
        next.delete(mapId);
        // Also deselect all data sources for this map
        const dsIds = dataSourceIdsByMap.get(mapId);
        if (dsIds) {
          setSelectedDataSourceIds((prevDs) => {
            const nextDs = new Set(prevDs);
            for (const id of dsIds) nextDs.delete(id);
            return nextDs;
          });
        }
      } else {
        next.add(mapId);
        // Auto-select all data sources for this map
        const dsIds = dataSourceIdsByMap.get(mapId);
        if (dsIds) {
          setSelectedDataSourceIds((prevDs) => {
            const nextDs = new Set(prevDs);
            for (const id of dsIds) nextDs.add(id);
            return nextDs;
          });
        }
      }
      return next;
    });
  };

  const toggleDataSource = (dsId: string) => {
    setSelectedDataSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(dsId)) {
        next.delete(dsId);
      } else {
        next.add(dsId);
      }
      return next;
    });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!organisationId && !organisationName) {
      toast.error("Please select an organisation or create a new one");
      return;
    }

    const mapSelections: MapSelection[] = [];
    for (const mapId of selectedMapIds) {
      const dsIds = dataSourceIdsByMap.get(mapId);
      if (!dsIds) continue;
      mapSelections.push({
        mapId,
        dataSourceIds: [...dsIds].filter((id) => selectedDataSourceIds.has(id)),
      });
    }

    createInvitationMutate({
      senderOrganisationId: senderOrganisationId ?? "",
      organisationId,
      organisationName,
      email,
      name,
      mapSelections: mapSelections.length > 0 ? mapSelections : undefined,
    });
  };

  const toggleOrganisationMode = () => {
    setIsCreatingNewOrg(!isCreatingNewOrg);
    if (isCreatingNewOrg) {
      setOrganisationName("");
    } else {
      setOrganisationId("");
    }
  };

  // Group maps by organisation
  const mapsByOrg = useMemo(() => {
    if (!mapData) return [];
    const groups = new Map<string, typeof mapData.maps>();
    for (const map of mapData.maps) {
      const orgName = map.organisationName;
      const existing = groups.get(orgName);
      if (existing) {
        existing.push(map);
      } else {
        groups.set(orgName, [map]);
      }
    }
    return [...groups.entries()].map(([orgName, maps]) => ({ orgName, maps }));
  }, [mapData]);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Create Invitation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invitation</DialogTitle>
          <DialogDescription>
            Send an invitation to a new user to join the platform.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <FormFieldWrapper id="name" label="Name">
            <Input
              id="name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormFieldWrapper>

          <FormFieldWrapper id="email" label="Email">
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormFieldWrapper>

          <FormFieldWrapper
            id="organisation"
            label={
              <div className="flex items-center justify-between w-full">
                <span>Organisation</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={toggleOrganisationMode}
                  className="h-auto p-0 text-xs"
                >
                  {isCreatingNewOrg
                    ? "or select existing"
                    : "or create a new one"}
                </Button>
              </div>
            }
          >
            {isCreatingNewOrg ? (
              <Input
                id="new-organisation"
                name="new-organisation"
                type="text"
                autoFocus
                placeholder="Enter new organisation name"
                value={organisationName}
                onChange={(e) => setOrganisationName(e.target.value)}
                required
              />
            ) : (
              <Select
                value={organisationId}
                onValueChange={(org) => setOrganisationId(org)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an existing organisation" />
                </SelectTrigger>
                <SelectContent>
                  {organisations?.map((o) => (
                    <SelectItem key={o.id} value={o.id.toString()}>
                      {o.name || "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormFieldWrapper>

          {mapData && mapsByOrg.length > 0 && (
            <div className="flex flex-col gap-2 mt-4">
              <Label>Maps to copy</Label>
              <p className="text-xs text-muted-foreground">
                Select maps to copy to the new organisation. Untick data sources
                you do not want to include.
              </p>
              <div className="flex flex-col gap-3 max-h-60 overflow-y-auto border rounded p-3">
                {mapsByOrg.map(({ orgName, maps }) => (
                  <div key={orgName}>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      {orgName}
                    </p>
                    <div className="flex flex-col gap-2 pl-2">
                      {maps.map((map) => {
                        const dsIds = dataSourceIdsByMap.get(map.id);
                        return (
                          <div key={map.id}>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`map-${map.id}`}
                                checked={selectedMapIds.has(map.id)}
                                onCheckedChange={() => toggleMap(map.id)}
                              />
                              <Label
                                htmlFor={`map-${map.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {map.name}
                              </Label>
                            </div>
                            {selectedMapIds.has(map.id) &&
                              dsIds &&
                              dsIds.size > 0 && (
                                <div className="flex flex-col gap-1 pl-6 mt-1">
                                  {[...dsIds].map((dsId) => (
                                    <div
                                      key={dsId}
                                      className="flex items-center gap-2"
                                    >
                                      <Checkbox
                                        id={`ds-${dsId}-${map.id}`}
                                        checked={selectedDataSourceIds.has(
                                          dsId,
                                        )}
                                        onCheckedChange={() =>
                                          toggleDataSource(dsId)
                                        }
                                      />
                                      <Label
                                        htmlFor={`ds-${dsId}-${map.id}`}
                                        className="text-xs font-normal cursor-pointer text-muted-foreground"
                                      >
                                        {mapData.dataSourceNames[dsId] ?? dsId}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button disabled={isPending} type="submit" size="sm" className="mt-2">
            Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
