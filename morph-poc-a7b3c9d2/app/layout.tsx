import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/navigation/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Topbar } from "@/components/navigation/topbar";
import { Toaster } from "@/components/ui/toaster";
import { Morph } from "@runmorph/atoms";
import { mocked } from "@/lib/mocked-data";

/**
 * Inter font configuration for the application
 * Using Google Fonts for consistent typography
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * Application metadata configuration
 * This is used for SEO and browser tab information
 */
export const metadata: Metadata = {
  title: `Morph SDK Demo - ${mocked.morphPocId()}`,
  description:
    "A professional demo application showcasing the Morph Cloud SDK integration with Next.js",
  keywords: ["Morph", "SDK", "Demo", "Next.js", "Integration"],
};

/**
 * Root layout component that wraps the entire application
 * Provides the basic structure and necessary providers
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} The root layout component
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* 
          Morph Provider Configuration
          - Set your public key in .env.local (NEXT_PUBLIC_MORPH_PUBLIC_KEY)
          - This enables Morph SDK functionality throughout the app
        */}
        <Morph.Provider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <div>
                <Topbar />
                <main className="p-6 space-y-6">{children}</main>
              </div>
            </SidebarInset>
          </SidebarProvider>
        </Morph.Provider>
        <Toaster />
      </body>
    </html>
  );
}
