import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pulse Market brand palette
        pulse: {
          50:  "#fff0f7",
          100: "#ffe0ef",
          200: "#ffc1de",
          300: "#ff93c4",
          400: "#ff55a3",
          500: "#ff2785",  // primary brand
          600: "#f0006a",
          700: "#c80057",
          800: "#a5004a",
          900: "#880040",
        },
        somnia: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c0d3ff",
          300: "#91b2ff",
          400: "#5a87ff",
          500: "#2f5cff",  // Somnia brand blue
          600: "#1538eb",
          700: "#1028c8",
          800: "#1224a3",
          900: "#142281",
        },
        dark: {
          50:  "#1a1a2e",
          100: "#16213e",
          200: "#0f3460",
          300: "#0a1628",
          400: "#070d1a",
          500: "#04080f",  // deepest background
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      backgroundImage: {
        "gradient-radial":       "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":        "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "pulse-gradient":        "linear-gradient(135deg, #ff2785 0%, #2f5cff 100%)",
        "dark-gradient":         "linear-gradient(180deg, #1a1a2e 0%, #04080f 100%)",
        "card-gradient":         "linear-gradient(135deg, rgba(255,39,133,0.1) 0%, rgba(47,92,255,0.1) 100%)",
      },
      animation: {
        "pulse-glow":     "pulseGlow 2s ease-in-out infinite",
        "float":          "float 6s ease-in-out infinite",
        "slide-up":       "slideUp 0.4s ease-out",
        "fade-in":        "fadeIn 0.3s ease-out",
        "spin-slow":      "spin 8s linear infinite",
        "border-rotate":  "borderRotate 4s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255,39,133,0.4)" },
          "50%":      { boxShadow: "0 0 40px rgba(255,39,133,0.8), 0 0 60px rgba(47,92,255,0.4)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        borderRotate: {
          "0%":   { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
      },
      boxShadow: {
        "pulse":       "0 0 30px rgba(255,39,133,0.3)",
        "pulse-lg":    "0 0 60px rgba(255,39,133,0.4)",
        "somnia":      "0 0 30px rgba(47,92,255,0.3)",
        "glass":       "0 8px 32px rgba(0,0,0,0.4)",
        "card":        "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
        "neon-yes":    "0 0 20px rgba(34,197,94,0.5)",
        "neon-no":     "0 0 20px rgba(239,68,68,0.5)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

export default config;
