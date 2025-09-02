import {
  Head,
  Html,
  Tailwind,
  pixelBasedPreset,
} from "@react-email/components";

export function EmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                brandBlue: "#678de3",
              },
            },
          },
        }}
      >
        {children}
      </Tailwind>
    </Html>
  );
}
