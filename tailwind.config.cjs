/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#D4AF37", // A rich gold color
        "background-light": "#F5F5F5",
        "background-dark": "#2a2a2e", // Slightly textured dark gray
        "surface-light": "#FFFFFF",
        "surface-dark": "#2C2C2C",
        "border-light": "#E0E0E0",
        "border-dark": "#444444",
        "text-light-primary": "#212121",
        "text-light-secondary": "#757575",
        "text-dark-primary": "#FFFFFF",
        "text-dark-secondary": "#BDBDBD",
      },
      fontFamily: {
        display: ["MedievalSharp", "cursive"],
        sans: ["Noto Sans SC", "Roboto", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      boxShadow: {
        "ornate-gold":
          "0 0 15px rgba(212, 175, 55, 0.3), 0 0 5px rgba(212, 175, 55, 0.5)",
        "inner-right": "inset -1px 0 0px 0px rgba(68, 68, 68, 1)",
        "gold-glow": "0 0 8px rgba(212, 175, 55, 0.4)",
      },
    },
  },
  plugins: [],
};
