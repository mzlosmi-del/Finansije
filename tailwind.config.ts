import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b1020",
        card: "#121833",
        muted: "#8892b0",
        accent: "#7c5cff",
        good: "#22c55e",
        bad: "#ef4444",
        warn: "#f59e0b",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
