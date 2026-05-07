import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/BottomNav";
import { PersonSwitcher } from "@/components/PersonSwitcher";
import { getCurrentPerson } from "@/lib/person";

export const metadata: Metadata = {
  title: "Finansije",
  description: "Couples finance, simply.",
  manifest: "/manifest.webmanifest",
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
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold tracking-tight">Finansije</h1>
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
