import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DarkModeInit } from "./components/DarkModeInit";
import NetworkBackground from "./components/NetworkBackground";

const dmSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en" className={dmSans.variable}>
      <body className="font-sans antialiased text-ink">
        <div id="app-bg" className="fixed inset-0 -z-20" aria-hidden />
        <NetworkBackground />
        <DarkModeInit />
        {children}
      </body>
    </html>
  );
}
