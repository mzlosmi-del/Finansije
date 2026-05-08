import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PersonSwitcher } from "@/components/PersonSwitcher";
import { BrandLockup } from "@/components/Logo";
import { getCurrentPerson } from "@/lib/person";

export const metadata: Metadata = {
  title: "Go Run Finance",
  description:
    "A simple, mobile-first finance tracker for couples. Built by Go Run Finance.",
  manifest: "/manifest.webmanifest",
  applicationName: "Go Run Finance",
  appleWebApp: {
    capable: true,
    title: "Go Run Finance",
    statusBarStyle: "black-translucent",
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
  themeColor: "#0b1020",
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
    <html lang="en">
      <body>
        <div className="mx-auto max-w-md min-h-dvh flex flex-col">
          <header className="sticky top-0 z-20 bg-bg/80 backdrop-blur px-4 pt-4 pb-3">
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
