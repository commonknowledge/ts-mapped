export interface LayerStyles {
  container: string;
  header: string;
  content: string;
}

export const defaultLayerStyles: LayerStyles = {
  container: "rounded-lg p-1 mb-3 border border-neutral-200",
  header: "flex items-center justify-between px-1 py-1",
  content: "relative pt-2",
};
