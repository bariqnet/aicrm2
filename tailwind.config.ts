import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "hsl(var(--accent))",
        border: "hsl(var(--border))",
        bg: "hsl(var(--background))",
        fg: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))"
      }
    }
  },
  plugins: []
};

export default config;
