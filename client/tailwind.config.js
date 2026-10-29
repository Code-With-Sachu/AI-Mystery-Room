/** @type {import("tailwindcss").Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 950: "#0B1020", 900: "#141B2D", 800: "#1C263B", 700: "#2A3652", 600: "#3A4766" },
        gold: { DEFAULT: "#D6A85C", soft: "#E7C98F", deep: "#9C7634" },
        sky: { mr: "#74B9D5" },
        crimson: { mr: "#C65D5D" },
        paper: { DEFAULT: "#E9E1CC", dim: "#D9CFB5", ink: "#2B2418" },
        cream: "#F4F1E8",
        mute: "#A4AEC0",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["\"IBM Plex Sans\"", "system-ui", "sans-serif"],
        type: ["\"Special Elite\"", "\"Courier New\"", "monospace"],
      },
      keyframes: { stamp: { "0%": { transform: "scale(1.6) rotate(-14deg)", opacity: 0 }, "100%": { transform: "scale(1) rotate(-8deg)", opacity: 1 } } },
      animation: { stamp: "stamp .45s cubic-bezier(.2,.9,.3,1.2) both" },
    },
  },
  plugins: [],
};
