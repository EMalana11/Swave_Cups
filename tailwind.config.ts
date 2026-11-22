import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#2f4486", deep: "#1f2d5c" },
        butter: "#f3de7a",
        cream: "#fbf7ef",
        paper: "#fffdf8",
        orange: { DEFAULT: "#e8742c", dark: "#c95f1d" },
        rust: "#8c3b24",
        ink: "#2a2622",
        muted: "#6d655c",
        line: "#e6ddcd",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        hand: ["var(--font-caveat)", "cursive"],
        sans: ["var(--font-work)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
