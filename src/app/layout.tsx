import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PersonSwitcher } from "@/components/PersonSwitcher";
import { BrandLockup } from "@/components/Logo";
import { getCurrentPerson } from "@/lib/person";

export const metadata: Metadata = {
  title: "Go Run Finance",
  description: "Jednostavna mobilna aplikacija za vođenje kućnog budžeta.",
  manifest: "/manifest.webmanifest",
  applicationName: "Go Run Finance",
  appleWebApp: {
    capable: true,
    title: "Go Run Finance",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
    ],
    apple: [{ url: "/icon.svg" }],
    shortcut: ["/favicon.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f7fb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, users } = await getCurrentPerson();
  return (
    <html lang="sr-Latn">
      <body>
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">
          <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur px-4 pt-4 pb-3 border-b border-line">
            <div className="flex items-center justify-between gap-3">
              <BrandLockup size={28} />
              <PersonSwitcher users={users} currentId={user?.id ?? null} />
            </div>
          </header>
          <main className="flex-1 px-4 pb-28">{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
