import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5F3EE",
        card: "#FFFFFF",
        ink: "#16181D",
        "ink-soft": "#5B5F66",
        line: "#E1DDD3",
        navy: {
          DEFAULT: "#1E2A44",
          soft: "#2E3D5C",
          tint: "#E7EAF0",
        },
        amber: {
          DEFAULT: "#F2A93B",
          deep: "#D98F1F",
        },
        teal: {
          DEFAULT: "#1F6F63",
          soft: "#E3EFEC",
        },
        danger: "#B4442E",
        admin: {
          DEFAULT: "#3F3A52",
          tint: "#E9E7EF",
        },
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
