import { Link } from "@/components/Link";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import { Separator } from "@/shadcn/ui/separator";
import { Switch } from "@/shadcn/ui/switch";
import { usePublicMapStore } from "../../stores/usePublicMapStore";

export default function EditorPublishSettings({
  publishedHost,
}: {
  publishedHost: string;
}) {
  const publicMap = usePublicMapStore((s) => s.publicMap);
  const updatePublicMap = usePublicMapStore((s) => s.updatePublicMap);

  if (!publicMap) {
    return null;
  }

  // Helper functions
  const getBaseUrl = () =>
    new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001");

  const makeHost = (subdomain: string) => {
    const baseHost = getBaseUrl().host;
    return `${subdomain}.${baseHost}`;
  };

  const getPublicMapUrlAfterSubDomain = () => {
    const baseHost = getBaseUrl().host;
    return `.${baseHost}`;
  };

  const getSubdomain = (host: string | undefined) => {
    if (!host) {
      return "";
    }
    return host.split(".")[0];
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>Published Status</Label>
      <div className="flex items-center gap-2">
        <Switch
          checked={publicMap.published}
          onCheckedChange={(published) => updatePublicMap({ published })}
        />{" "}
        {publicMap.published ? "Public" : "Unpublished"}
      </div>
      <div className="flex items-center gap-2 text-xs ">
        View at:
        {publishedHost ? (
          <Link
            href={`${getBaseUrl().protocol}//${publishedHost}`}
            target="_blank"
            className="underline"
            prefetch={false}
          >
            {publicMap.host}
          </Link>
        ) : (
          <span className="text-neutral-500">
            Enter a subdomain below and click publish
          </span>
        )}
      </div>
      <Separator className="my-4" />
      <Label>URL</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-500">{`${getBaseUrl().protocol}//`}</span>
        <Input
          type="text"
          placeholder="my-map"
          value={getSubdomain(publicMap.host)}
          onChange={(e) => updatePublicMap({ host: makeHost(e.target.value) })}
          required
          pattern="^[a-z]+(-[a-z]+)*$"
        />
        <span className="text-sm text-neutral-500">
          {getPublicMapUrlAfterSubDomain()}
        </span>
      </div>
    </div>
  );
}
