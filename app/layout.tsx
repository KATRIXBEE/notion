import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "NotionLite",
  description: "A simplified Notion clone with sketch UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sketch antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
