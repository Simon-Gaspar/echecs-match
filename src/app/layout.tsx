import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://echecs-match.vercel.app"),
  title: {
    default: "Échecs Match | Trouvez votre prochain tournoi d'échecs",
    template: "%s | Échecs Match",
  },
  description: "L'outil de recherche ultime pour les joueurs d'échecs. Explorez les tournois FFE et FIDE en France et en Suisse sur une carte interactive. Filtrez par format, Elo et distance.",
  keywords: ["échecs", "tournoi", "FFE", "FIDE", "chess", "tournament", "France", "carte", "blitz", "rapide"],
  authors: [{ name: "Simon Gaspar" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://echecs-match.vercel.app",
    siteName: "Échecs Match",
    title: "Échecs Match | Trouvez votre prochain tournoi d'échecs",
    description: "Explorez les tournois d'échecs homologués FFE et FIDE sur une carte interactive. Filtrez par format, Elo et distance en temps réel.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Échecs Match | Tournois d'échecs sur carte",
    description: "Trouvez et comparez les tournois d'échecs près de chez vous.",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <Providers>
          {children}
        </Providers>

        {process.env.NEXT_PUBLIC_CLARITY_ID && (
          <Script id="clarity-script" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_ID}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
