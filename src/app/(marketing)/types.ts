export interface Feature {
  slug: string;
  title: string;
  subtitle?: string;
  featureSetSlug: string;
}

export interface FeatureSet {
  slug: string;
  title: string;
  description?: string;
  order?: number;
  features: Feature[];
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

export interface NewsItem {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  image: ImageAsset;
}
