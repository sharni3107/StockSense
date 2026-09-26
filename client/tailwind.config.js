/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4F46E5",
          hover: "#4338CA",
          active: "#3730A3",
        },
        surface: "#F8F9FC",
        border: "#E2E8F0",
        status: {
          draft: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
          waiting: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
          ready: { bg: "#EEF2FF", text: "#4338CA", border: "#C7D2FE" },
          done: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
          canceled: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
          low: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
          out: { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
          in: { bg: "#ECFDF5", text: "#047857", border: "#A7F3D0" },
        },
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "4px",
        lg: "8px",
        xl: "12px",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
