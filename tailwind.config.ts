import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f6f7fb",
        card: "#ffffff",
        ink: "#0f172a",
        muted: "#6b7280",
        line: "#e5e7eb",
        accent: "#7c5cff",
        good: "#16a34a",
        bad: "#dc2626",
        warn: "#d97706",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.06)",
        pop: "0 8px 24px rgba(15,23,42,0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
