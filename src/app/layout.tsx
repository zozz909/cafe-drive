import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "كافي درايف ☕",
  description: "اطلب قهوتك من سيارتك",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-gradient-to-b from-amber-50 to-orange-50 min-h-screen">
        {children}
        <Toaster richColors position="bottom-center" />
      </body>
    </html>
  );
}
