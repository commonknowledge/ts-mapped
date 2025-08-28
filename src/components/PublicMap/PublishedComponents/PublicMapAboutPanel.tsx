"use client";

import { Mail, X } from "lucide-react";
import { useContext } from "react";
import { PublicMapContext } from "@/components/PublicMap/PublicMapContext";
import { Button } from "@/shadcn/ui/button";
import { Separator } from "@/shadcn/ui/separator";

export default function PublicMapAboutPanel() {
  const { publicMap, aboutPanelVisible, setAboutPanelVisible } =
    useContext(PublicMapContext);

  if (!aboutPanelVisible || !publicMap) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 h-full w-[350px] bg-white border-r border-neutral-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200">
        <h2 className="text-lg font-semibold">About This Map</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAboutPanelVisible(false)}
          className="h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Map Title */}
        {publicMap.name && (
          <div>
            <h3 className="text-xl font-bold mb-2">{publicMap.name}</h3>
          </div>
        )}

        {/* Map Description */}
        {publicMap.description && (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-2">
              Description
            </h4>
            <p className="text-sm leading-relaxed">{publicMap.description}</p>
          </div>
        )}

        <Separator />

        {/* Data Sources */}
        {publicMap.dataSourceConfigs &&
          publicMap.dataSourceConfigs.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-neutral-600 mb-3">
                Data Sources
              </h4>
              <div className="space-y-2">
                {publicMap.dataSourceConfigs.map((config, index) => (
                  <div
                    key={config.dataSourceId}
                    className="p-3 bg-neutral-50 rounded-md"
                  >
                    <div className="font-medium text-sm">
                      {config.dataSourceLabel}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        <Separator />

        {/* Contact Information */}
        {publicMap.descriptionLink && (
          <div>
            <h4 className="text-sm font-medium text-neutral-600 mb-3">
              Contact
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`mailto:${publicMap.descriptionLink}`)}
              className="w-full justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              {publicMap.descriptionLink}
            </Button>
          </div>
        )}

        {/* Powered by */}
        <div className="mt-auto pt-6">
          <div className="text-center">
            <p className="text-xs text-neutral-400 mb-2">Powered by</p>
            <p className="text-sm font-medium text-neutral-600">Mapped</p>
          </div>
        </div>
      </div>
    </div>
  );
}
