import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kandilli Archive Viewer — 115 Years of Climate Data",
  description:
    "View, inspect, and digitize analog chart papers from Kandilli Observatory spanning from 1911 to the present.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
