import { type SchemaTypeDefinition } from "sanity";
import { aboutType } from "./about";
import { blockContentType } from "./blockContent";
import { docsSetType, docsType } from "./features";
import { featuresType } from "./featuresNew";
import { homepageVideosType } from "./homepageVideos";
import { newsSchema } from "./news";
import { solutionsType } from "./solutions";
import { youtubeType } from "./youtubeType";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    blockContentType,
    solutionsType,
    docsSetType,
    docsType,
    featuresType,
    newsSchema,
    youtubeType,
    aboutType,
    homepageVideosType,
  ],
};
