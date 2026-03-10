import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
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
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
    try {
      var t = JSON.parse(localStorage.getItem('lauos-theme') || '{}');
      if (t.state && t.state.isDark) document.documentElement.classList.add('dark');
    } catch(e) {}
  ` }} />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}
