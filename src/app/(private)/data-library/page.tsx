import { Database, Mail, Pentagon } from "lucide-react";
import { Link } from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import { AreaSetGroupCodeLabels } from "@/labels";
import { AreaSetGroupCode } from "@/server/models/AreaSet";
import { Button } from "@/shadcn/ui/button";

// Define mapped data library items grouped by category
const mappedDataLibrary = {
  localityShapes: [
    {
      id: "boundaries-wmc24",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.WMC24],
      description: "Westminster Parliamentary Constituencies for UK mapping",
      type: "boundary",
      category: "Locality shapes",
    },
    {
      id: "boundaries-lsoa21",
      name: AreaSetGroupCodeLabels[AreaSetGroupCode.LSOA21],
      description: "Census Output Areas for detailed area mapping",
      type: "boundary",
      category: "Locality shapes",
    },
  ],
  referenceData: [
    {
      id: "ge-2024",
      name: "General Election 2024",
      description: "Elecectoral results for the 2024 General Election",
      type: "dataset",
      category: "Reference data",
    },
    {
      id: "deprivation-2021",
      name: "Deprivation 2021",
      description:
        "Deprivation data for the 2021 Index of Multiple Deprivation",
      type: "dataset",
      category: "Reference data",
    },
  ],
};

export default function DataLibraryPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Movement data library"
          action={
            <Button variant="default" size="lg" asChild={true}>
              <Link href="mailto:mapped@commonknowledge.coop?subject=Movement Data Library request">
                <Mail size={16} />
                Request a new data source
              </Link>
            </Button>
          }
        />
      </div>
      {/* Locality Shapes Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Pentagon className="w-5 h-5 text-blue-600" />
          Locality shapes
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappedDataLibrary.localityShapes.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 rounded-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center text-white">
                  <Pentagon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Boundary
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {item.description}
                  </p>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reference Data Section */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-green-600" />
          Reference data
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mappedDataLibrary.referenceData.map((item) => (
            <div
              key={item.id}
              className="p-4 border border-gray-200 rounded-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-teal-500 rounded-lg flex items-center justify-center text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">
                      {item.name}
                    </h4>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Dataset
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    {item.description}
                  </p>
                  <span className="text-xs text-gray-500">{item.category}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
