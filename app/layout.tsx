import type { Metadata, Viewport } from "next";
import { editorial, montreal } from "./fonts";
import { Navbar } from "@/components/Navbar";
import { Cursor } from "@/components/Cursor";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://forma-studio.vercel.app";

export const metadata: Metadata = {
  title: "FORMA STUDIO — Architecture & Interior Design",
  description:
    "FORMA STUDIO is a boutique architecture and interior design practice in Copenhagen, est. 1998. We work in restraint, proportion and material — shaping space with intention.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  keywords: [
    "architecture",
    "interior design",
    "architecture studio",
    "Copenhagen",
    "FORMA STUDIO",
  ],
  openGraph: {
    title: "FORMA STUDIO — Architecture & Interior Design",
    description:
      "A boutique architecture and interior design practice working in restraint, proportion and material. Copenhagen, est. 1998.",
    url: "/",
    siteName: "FORMA STUDIO",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/og.jpg",
        width: 1200,
        height: 630,
        alt: "FORMA STUDIO — the exterior of a private residence at dusk",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FORMA STUDIO — Architecture & Interior Design",
    description:
      "A boutique architecture and interior design practice working in restraint, proportion and material.",
    images: ["/images/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#111110",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${editorial.variable} ${montreal.variable}`}>
      <body>
        <Cursor />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
