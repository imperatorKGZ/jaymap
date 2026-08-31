import type { Metadata } from "next";

import "./globals.css";

import { LanguageProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { SettingsProvider } from "@/lib/settings/provider";

export const metadata: Metadata = {
  title: "MapKG",
  description: "Real Estate Map of Kyrgyzstan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}