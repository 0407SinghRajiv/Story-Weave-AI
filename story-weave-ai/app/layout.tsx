import { ClerkProvider } from "@clerk/nextjs";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryWeaveAI \u2013 Generate Magical Stories with AI",
  description: "Create captivating stories with AI. Enter keywords, choose a theme, and let StoryWeaveAI weave a unique tale just for you using Gemini AI.",
  keywords: "AI story generator, automatic storytelling, Gemini AI, creative writing, fantasy stories",
  openGraph: {
    title: "StoryWeaveAI \u2013 Generate Magical Stories with AI",
    description: "Create captivating stories with AI. Enter keywords, choose a theme, and let StoryWeaveAI weave a unique tale.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Cinzel:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ClerkProvider afterSignOutUrl="/">
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
