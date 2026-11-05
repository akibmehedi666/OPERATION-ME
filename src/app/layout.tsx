import type { Metadata } from "next";
import { JetBrains_Mono, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-share-tech",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OPERATION: ME // AGENT AKIB",
  description: "Tactical Classified Task Tracker for Agent Akib",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${jetbrainsMono.variable} ${shareTechMono.variable} font-mono bg-spy-bg text-spy-text antialiased min-h-screen selection:bg-spy-green selection:text-black scanlines`}
      >
        {children}
      </body>
    </html>
  );
}
