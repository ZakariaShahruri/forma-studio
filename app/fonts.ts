import localFont from "next/font/local";

// PP Editorial New — display / editorial headings.
// Optical, high-contrast serif that commands attention at monumental sizes.
export const editorial = localFont({
  src: [
    {
      path: "./fonts/PPEditorialNew-Ultralight.woff",
      weight: "200",
      style: "normal",
    },
    {
      path: "./fonts/PPEditorialNew-Regular.woff",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-editorial",
  display: "swap",
  fallback: ["Times New Roman", "Georgia", "serif"],
});

// Neue Montreal — precise, neutral grotesque for all UI text,
// captions, labels and body copy.
export const montreal = localFont({
  src: [
    {
      path: "./fonts/NeueMontreal-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/NeueMontreal-Medium.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-montreal",
  display: "swap",
  fallback: ["-apple-system", "Helvetica Neue", "Arial", "sans-serif"],
});
