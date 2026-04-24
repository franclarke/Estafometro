import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans } from "next/font/google";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://estafometro.app";
const description =
  "Revisá señales de estafa en un mensaje, llamado o publicación antes de pagar, responder o compartir datos. Gratis y sin cuenta.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Estafómetro",
    template: "%s · Estafómetro",
  },
  description,
  applicationName: "Estafómetro",
  keywords: [
    "estafa",
    "phishing",
    "whatsapp",
    "mercado libre",
    "seguridad",
    "argentina",
  ],
  openGraph: {
    title: "Estafómetro",
    description,
    url: siteUrl,
    siteName: "Estafómetro",
    type: "website",
    locale: "es_AR",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Estafómetro · Revisá señales de estafa antes de pagar, responder o compartir datos.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Estafómetro",
    description,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-AR"
      data-scroll-behavior="smooth"
      className={`${publicSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
