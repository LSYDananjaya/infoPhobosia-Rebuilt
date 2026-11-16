import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { OutpostBootLoader } from "@/components/layout/OutpostBootLoader";
import { RouteAtmosphere } from "@/components/layout/RouteAtmosphere";
import { SmoothScrollProvider } from "@/components/scenes/SmoothScrollProvider";
import { TacticalMarsCursor } from "@/components/ui/TacticalMarsCursor";

const orbitron = localFont({
  src: "./fonts/orbitron-latin.woff2",
  weight: "600 700",
  variable: "--font-orbitron",
  display: "swap",
});

const exo2 = localFont({
  src: "./fonts/exo2-latin.woff2",
  weight: "500 600",
  variable: "--font-exo-2",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk-latin.woff2",
  weight: "400 500",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PHOBOSIA: 3D Mars Exploration & Scientific Observation Experience",
    template: "%s | PHOBOSIA 3D Mars Portfolio",
  },
  description:
    "Official project portfolio for PHOBOSIA, an interactive 3D Mars exploration experience developed with Next.js, Three.js, and authentic NASA HiRISE planetary data.",
  keywords: [
    "PHOBOSIA",
    "Mars 3D Exploration",
    "Interactive Mars Simulation",
    "Three.js",
    "WebGL",
    "Next.js",
    "Tailwind CSS",
    "HiRISE DTM",
    "Elysium Planitia",
    "Osanda Hirushaka",
  ],
  authors: [{ name: "Osanda Hirushaka (Muthukumarana)", url: "https://github.com/osa623" }],
  creator: "Osanda Hirushaka",
  metadataBase: new URL("https://phobosia.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://phobosia.vercel.app",
    siteName: "PHOBOSIA",
    title: "PHOBOSIA: 3D Mars Exploration & Scientific Observation",
    description:
      "Interactive 3D Mars exploration experience bringing a fictional Martian outpost, planetary observation, and SOL 1 to 11 missions to your browser.",
    images: [
      {
        url: "/phobosia-social.png",
        width: 1200,
        height: 630,
        alt: "PHOBOSIA 3D Mars Outpost",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PHOBOSIA: 3D Mars Exploration Experience",
    description: "Interactive 3D Mars exploration experience powered by NASA planetary elevation data.",
    images: ["/phobosia-social.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070e",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${orbitron.variable} ${exo2.variable} ${spaceGrotesk.variable}`}
    >
      <body className="min-h-screen bg-space-950 text-slate-100 antialiased selection:bg-mars-500/35 selection:text-white flex flex-col justify-between">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:px-4 focus:py-2.5 focus:rounded-full focus:bg-space-900 focus:text-white focus:border focus:border-cyan-400"
        >
          Skip to main content
        </a>
        <RouteAtmosphere />
        <TacticalMarsCursor />
        <OutpostBootLoader />
        <Navbar />
        <SmoothScrollProvider>
          <main id="main-content" className="relative z-10 flex-grow">
            {children}
          </main>
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
