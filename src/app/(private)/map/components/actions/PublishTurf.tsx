import { Button } from "@/shadcn/components/ui/button";
import { Globe } from "lucide-react";
import { DrawnPolygon } from "@/types";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { TooltipProvider } from "@/shadcn/components/ui/tooltip";
import { Tooltip } from "@/shadcn/components/ui/tooltip";
import { TooltipContent } from "@/shadcn/components/ui/tooltip";
import { TooltipTrigger } from "@/shadcn/components/ui/tooltip";

const CREATE_PUBLISHED_LAYER = gql`
  mutation CreatePublishedLayer($input: CreatePublishedLayerInput!) {
    createPublishedLayer(input: $input) {
      id
      name
      type
      geography
    }
  }
`;

export default function PublishTurf({ polygon }: { polygon: DrawnPolygon }) {
  const [createLayer, { loading }] = useMutation(CREATE_PUBLISHED_LAYER);

  const publishTurf = async () => {
    try {
      await createLayer({
        variables: {
          input: {
            name: polygon.name || `Area: ${polygon.area.toFixed(2)}m²`,
            type: "turf",
            geography: polygon.geometry,
          },
        },
      });
      console.log("Successfully published turf");
    } catch (error) {
      console.error("Failed to publish turf:", error);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            onClick={publishTurf}
            disabled={loading}
            className="opacity-50 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          >
            <Globe className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Publish Turf</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
