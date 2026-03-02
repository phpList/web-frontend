/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./templates/**/*.twig",
    "./themes/**/**/*.twig",
    "./assets/vue/*.vue",
    "./assets/vue/**/*.vue",
    "./assets/vue/**/**/*.vue",
  ],
  prefix: "",
  theme: {
    screens: {
      xs: "0px",
      sm: "576px",
      md: "768px",
      lg: "992px",
      xl: "1200px",
    },
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "sans-serif"],
        body: ["Poppins", "-apple-system", "sans-serif"],
      },
      colors: {
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  safelist: [

  ],};
