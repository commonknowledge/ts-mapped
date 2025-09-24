export interface Feature {
  _id: string;
  title: string;
  subtitle?: string;
  slug: { current: string };
  description?: string;
  icon?: string;
  order?: number;
  isActive?: boolean;
  featureSet?: {
    _id: string;
    title: string;
    slug: { current: string };
  };
  howToUse?: {
    title: string;
    steps: FeatureHowToUseSteps[];
  };
}

export interface FeatureSet {
  _id: string;
  title: string;
  subtitle?: string;
  slug: { current: string };
  description?: string;
  icon?: string;
  order?: number;
  features: Feature[] | null;
}

export interface FeatureSetProps {
  featureSets: FeatureSet[];
}

export interface RichTextBlock {
  _type: string;
  children: { text: string }[];
  style?: string;
}

export interface ImageAsset {
  _type: string;
  asset: {
    _ref: string;
    _type: string;
  };
  alt?: string;
  caption?: string;
}

export interface FeatureHowToUseSteps {
  title: string;
  description: RichTextBlock[];
  images: ImageAsset[];
  order: number;
}

export interface NewsItem {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  image: ImageAsset;
}
