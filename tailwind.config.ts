import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Kleuren via CSS-variabelen, zodat Woonhuus.nl met dezelfde componenten
      // een eigen (blauwe) huisstijl krijgt. Waarden: app/globals.css.
      colors: {
        bosgroen: "rgb(var(--c-bosgroen) / <alpha-value>)",
        "bosgroen-dk": "rgb(var(--c-bosgroen-dk) / <alpha-value>)",
        salie: "rgb(var(--c-salie) / <alpha-value>)",
        "salie-lt": "rgb(var(--c-salie-lt) / <alpha-value>)",
        oranje: "rgb(var(--c-oranje) / <alpha-value>)",
        "oranje-dk": "rgb(var(--c-oranje-dk) / <alpha-value>)",
        zand: "rgb(var(--c-zand) / <alpha-value>)",
        creme: "rgb(var(--c-creme) / <alpha-value>)",
        inkt: "rgb(var(--c-inkt) / <alpha-value>)",
        grijs: "rgb(var(--c-grijs) / <alpha-value>)",
        lijn: "rgb(var(--c-lijn) / <alpha-value>)",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
