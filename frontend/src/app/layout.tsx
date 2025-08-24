import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, Orbitron, Exo_2 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const orbitron = Orbitron({
  variable: "--font-futuristic",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const exo2 = Exo_2({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "AI-Powered Personal Agent Platform",
    template: "%s | Personal Agent",
  },
  description: "Professional AI agent with RAG, citations, and optional tools.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "AI-Powered Personal Agent Platform",
    description: "Chat with your documents, get citations, and use agent tools.",
    url: "/",
    siteName: "Personal Agent",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI-Powered Personal Agent Platform",
    description: "Chat with your documents, get citations, and use agent tools.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-black">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable} ${exo2.variable} antialiased font-sans`}>
        {children}
        {/* Modal portal mount point */}
        <div id="modal-root" />
      </body>
    </html>
  );
}
