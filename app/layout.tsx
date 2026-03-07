import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kandilli Arşiv Görüntüleyici — 115 Yıllık İklim Verileri",
  description:
    "Kandilli Rasathanesi'nin 1911'den günümüze analog grafik kağıtlarını dijital ortamda görüntüleyin, inceleyin ve sayısallaştırın.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
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
