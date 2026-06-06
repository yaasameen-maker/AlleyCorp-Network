import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlleyCorp · Relationship Intelligence",
  description:
    "Co-investor relationship intelligence and warmth tracking for the AlleyCorp Deep Tech portfolio.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AlleyCorp",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d1320",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased bg-paper text-ink">{children}</body>
    </html>
  );
}
