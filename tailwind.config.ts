import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f8fafc",
        card: "#ffffff",
        ink: "#0f172a",
        muted: "#64748b",
        line: "#e2e8f0",
        accent: "#2563eb",
        good: "#15803d",
        bad: "#dc2626",
        warn: "#b45309",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15,23,42,0.04), 0 6px 18px rgba(15,23,42,0.06)",
        pop: "0 10px 28px rgba(15,23,42,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
