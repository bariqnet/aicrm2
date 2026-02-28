import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        accent: "hsl(var(--accent))",
        accentfg: "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        bg: "hsl(var(--background))",
        fg: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        mutedfg: "hsl(var(--muted-foreground))",
        surface: "hsl(var(--surface))",
        surface2: "hsl(var(--surface-2))"
      }
    }
  },
  plugins: []
};

export default config;
