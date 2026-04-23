import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Memorepe — Estudiá menos, aprendé más',
    template: '%s · Memorepe',
  },
  description: 'Plataforma de aprendizaje por repetición espaciada. Estudiá con quizzes creados por la comunidad y aprendé de verdad con el algoritmo SM-2.',
  keywords: ['repetición espaciada', 'flashcards', 'quizzes', 'estudio', 'universitarios', 'aprendizaje'],
  authors: [{ name: 'Memorepe' }],
  metadataBase: new URL('https://memorepe.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://memorepe.vercel.app',
    siteName: 'Memorepe',
    title: 'Memorepe — Estudiá menos, aprendé más',
    description: 'Plataforma de aprendizaje por repetición espaciada. Quizzes creados por la comunidad universitaria.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}