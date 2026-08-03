import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bosgroen: "#2C6B45",
        "bosgroen-dk": "#1F4E32",
        salie: "#7CAE86",
        "salie-lt": "#C9E0CE",
        oranje: "#E8823B",
        "oranje-dk": "#C9691F",
        zand: "#F6F1E7",
        creme: "#FBF8F1",
        inkt: "#22302A",
        grijs: "#6B7A70",
        lijn: "#E4DCCB",
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
