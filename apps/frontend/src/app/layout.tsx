import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Planning & Shopping Assistant",
  description:
    "Kerro tarpeesi, niin avustaja kokoaa siitä muokattavan suunnitelman: osat, budjetin ja sopivat tuotteet.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fi" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
