import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blue Prince Wiki",
  description: "Sammlung aller Funde aus Blue Prince",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
