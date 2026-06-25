import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { HeadersProvider } from "./providers";
import HeaderComponent from "../components/Header";
import FooterComponent from "../components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ember | Automated non-custodial trading on HotStuff L1",
  description: "Deploy algorithmic grid bots, TWAP execution layers, and DCA recurring investment autopilots on HotStuff 7/24 tokenized assets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Anti-extension lock to prevent color distortion by DarkReader etc. */}
        <meta name="darkreader-lock" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('ember_theme') || 'dark';
                document.documentElement.className = theme;
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${inter.className} bg-white dark:bg-darkBg text-gray-900 dark:text-white transition-colors duration-200`}>
        <HeadersProvider>
          <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-darkBg">
            {/* Radial background glow gradients (visible in dark mode) */}
            <div className="absolute top-[-30%] left-[-20%] w-[80%] h-[80%] bg-gradient-radial from-[rgba(99,102,241,0.06)] to-transparent pointer-events-none rounded-full dark:opacity-100 opacity-20" />
            <div className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] bg-gradient-radial from-[rgba(255,51,102,0.04)] to-transparent pointer-events-none rounded-full dark:opacity-100 opacity-20" />
            
            <HeaderComponent />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 min-h-[75vh]">
              {children}
            </main>
            <FooterComponent />
          </div>
        </HeadersProvider>
      </body>
    </html>
  );
}
