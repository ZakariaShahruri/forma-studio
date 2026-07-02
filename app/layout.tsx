import type { Metadata, Viewport } from "next";
import { editorial, montreal } from "./fonts";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "FORMA STUDIO — Architecture & Interior Design",
  description:
    "FORMA STUDIO is a boutique architecture and interior design practice. We work in restraint, proportion and material — shaping space with intention.",
  metadataBase: new URL("https://formastudio.example"),
  openGraph: {
    title: "FORMA STUDIO",
    description:
      "A boutique architecture and interior design practice working in restraint, proportion and material.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${editorial.variable} ${montreal.variable}`}>
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
