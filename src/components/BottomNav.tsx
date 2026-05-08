"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Početna", icon: "🏠" },
  { href: "/charts", label: "Grafici", icon: "📊" },
  { href: "/add", label: "Dodaj", icon: "＋", primary: true },
  { href: "/recurring", label: "Redovno", icon: "🔁" },
  { href: "/history", label: "Istorija", icon: "📜" },
  { href: "/settings", label: "Opcije", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md">
      <div className="m-3 rounded-2xl bg-card/95 backdrop-blur shadow-pop border border-line">
        <ul className="grid grid-cols-6">
          {items.map((it) => {
            const active = pathname === it.href;
            if (it.primary) {
              return (
                <li key={it.href} className="flex items-center justify-center">
                  <Link
                    href={it.href}
                    aria-label={it.label}
                    className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white text-2xl shadow-pop active:scale-95"
                  >
                    {it.icon}
                  </Link>
                </li>
              );
            }
            return (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className={`flex flex-col items-center gap-0.5 py-3 text-[10px] ${
                    active ? "text-ink font-medium" : "text-muted"
                  }`}
                >
                  <span className="text-base leading-none">{it.icon}</span>
                  <span className="truncate max-w-full px-0.5">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
