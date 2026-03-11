import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Empreendii Soluções ScoreMaster — Do 0 ao Crédito",
  description: "Transforme seu perfil financeiro com a metodologia Empreendii Soluções ScoreMaster. Guia gamificado para recuperação e expansão de crédito.",
  keywords: "crédito, score, recuperação financeira, renegociação de dívidas, fintech",
  openGraph: {
    title: "Empreendii Soluções ScoreMaster — Do 0 ao Crédito",
    description: "Transforme seu perfil financeiro com a metodologia Empreendii Soluções ScoreMaster.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
