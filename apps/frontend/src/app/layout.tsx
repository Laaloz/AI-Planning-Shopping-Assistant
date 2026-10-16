import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AI Planning & Shopping Assistant",
  description:
    "Kerro tarpeesi, niin avustaja kokoaa siitä muokattavan suunnitelman: osat, budjetin ja sopivat tuotteet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fi" className={cn("h-full antialiased", "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
