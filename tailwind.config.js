/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#587D71",              // 👈 tu color del header/footer/botón
        "background-light": "#F8F9FA",
        "background-dark": "#121212",
        "surface-light": "#FFFFFF",
        "surface-dark": "#1E1E1E",
        "text-light": "#212529",
        "text-dark": "#E0E0E0",
        "text-muted-light": "#6C757D",
        "text-muted-dark": "#9E9E9E",
        "border-light": "#DEE2E6",
        "border-dark": "#424242",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
};
