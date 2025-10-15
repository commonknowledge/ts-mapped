export interface LayerStyles {
  container: string;
  header: string;
  content: string;
}

export const defaultLayerStyles: LayerStyles = {
  container: "rounded-lg p-1 pr- mb-3 border border-neutral-200 bg-white",
  header: "flex items-center justify-between px-1 py-1",
  content: "relative pt-2",
};
