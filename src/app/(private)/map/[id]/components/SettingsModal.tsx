import { PlusIcon } from "lucide-react";
import React, { useContext } from "react";

import { DataSourcesContext } from "@/app/(private)/map/[id]/context/DataSourcesContext";
import { MapContext } from "@/app/(private)/map/[id]/context/MapContext";
import IconButtonWithTooltip from "@/components/IconButtonWithTooltip";
import { Link } from "@/components/Link";
import { Button } from "@/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shadcn/ui/dialog";
import { Label } from "@/shadcn/ui/label";
import { Select } from "@/shadcn/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { Separator } from "@/shadcn/ui/separator";

export default function SettingsModal() {
  const { mapConfig, updateMapConfig } = useContext(MapContext);
  const { getDataSources } = useContext(DataSourcesContext);

  const dataSources = getDataSources();

  return (
    <Dialog>
      <DialogTrigger>
        <IconButtonWithTooltip tooltip="Add Members">
          <PlusIcon className="w-4 h-4" />
        </IconButtonWithTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Member Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription>Adjust the map settings</DialogDescription>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label htmlFor="membersDataSourceId">Members Data Source</Label>

          <Select
            value={mapConfig.membersDataSourceId}
            onValueChange={(value) =>
              updateMapConfig({ membersDataSourceId: value })
            }
          >
            <SelectTrigger className="w-full shadow-none">
              <SelectValue placeholder="Select a members data source" />
            </SelectTrigger>
            <SelectContent>
              {(dataSources || []).map((ds: { id: string; name: string }) => (
                <SelectItem key={ds.id} value={ds.id}>
                  {ds.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild>
            <Link href="/data-sources/new">
              <PlusIcon className="w-4 h-4" />
              Add new data source
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
