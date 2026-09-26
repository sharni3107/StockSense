/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Primary blue
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          hover: "#1D4ED8",
          active: "#1E40AF",
        },
        // Cyan/teal accent
        cyan: {
          DEFAULT: "#06B6D4",
          light: "#CFFAFE",
        },
        // Purple accent
        purple: {
          DEFAULT: "#7C3AED",
          light: "#EDE9FE",
        },
        // Teal accent
        teal: {
          DEFAULT: "#0D9488",
          light: "#CCFBF1",
        },
        // Amber accent
        amber: {
          DEFAULT: "#F59E0B",
          light: "#FEF3C7",
        },
        // App surfaces
        surface: "#F8FAFC",
        border: "#E2E8F0",
        // Navy text
        navy: {
          DEFAULT: "#0F172A",
          700: "#1E293B",
          600: "#334155",
          500: "#475569",
          400: "#64748B",
          300: "#94A3B8",
          200: "#CBD5E1",
        },
        // Dark mode surfaces
        dark: {
          bg: "#0F172A",
          surface: "#1E293B",
          elevated: "#293548",
          border: "#334155",
        },
        // Status colors
        status: {
          draft: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
          waiting: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
          ready: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
          done: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
          canceled: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
          low: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
          out: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
          in: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
          healthy: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
          needsReorder: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
          critical: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
        },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Caveat", "cursive"],
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "display-md": ["2rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
        "heading-lg": ["1.75rem", { lineHeight: "1.25" }],
        "heading-md": ["1.375rem", { lineHeight: "1.3" }],
        "heading-sm": ["1.125rem", { lineHeight: "1.4" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
        modal: "0 20px 60px -10px rgba(0,0,0,0.25)",
        sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "slide-up": "slideUp 0.2s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
