import createImageUrlBuilder from "@sanity/image-url";
import { dataset, projectId } from "../env";
// v2 removed the deep "@sanity/image-url/lib/types/types" entry point and
// exports the type from the package root instead
import type { SanityImageSource } from "@sanity/image-url";

// https://www.sanity.io/docs/image-url
const builder = createImageUrlBuilder({ projectId, dataset });

export const urlFor = (source: SanityImageSource) => {
  return builder.image(source);
};
