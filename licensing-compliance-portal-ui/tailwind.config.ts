import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        "bnr-brown": "var(--bnr-brown)",
        "bnr-brown-700": "var(--bnr-brown-700)",
        "bnr-brown-500": "var(--bnr-brown-500)",
        "bnr-brown-300": "var(--bnr-brown-300)",
        "bnr-gold": "var(--bnr-gold)",
        "bnr-gold-light": "var(--bnr-gold-light)",
        "bnr-cream": "var(--bnr-cream)",
        "bnr-cream-light": "var(--bnr-cream-light)",
        "bnr-cream-50": "var(--bnr-cream-50)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
        sans: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
