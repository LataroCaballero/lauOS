import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "lauOS",
  description: "Your personal command center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
    try {
      var t = JSON.parse(localStorage.getItem('lauos-theme') || '{}');
      var s = t.state || {};
      if (s.isDark) document.documentElement.classList.add('dark');
      var av = {yellow:'oklch(0.85 0.18 95)',blue:'oklch(0.60 0.22 240)',green:'oklch(0.65 0.20 150)',purple:'oklch(0.60 0.22 290)',red:'oklch(0.60 0.22 25)',orange:'oklch(0.72 0.20 60)'};
      if (s.accent && av[s.accent]) document.documentElement.style.setProperty('--primary', av[s.accent]);
    } catch(e) {}
  ` }} />
      </head>
      <body className={`${outfit.className} antialiased`}>
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
