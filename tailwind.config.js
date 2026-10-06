/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{svelte,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae5ff",
          200: "#bdd0ff",
          300: "#90b1ff",
          400: "#5c85fb",
          500: "#365ef2",
          600: "#203ddb",
          700: "#1b2eb2",
          800: "#1b2a8d",
          900: "#1c2a70",
          950: "#111a45",
        },
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d3a1",
          500: "#10b98a",
          600: "#05976f",
          700: "#047959",
          800: "#076049",
          900: "#064e3b",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b0b8c9",
          400: "#8591aa",
          500: "#66738f",
          600: "#515c76",
          700: "#424b60",
          800: "#394051",
          900: "#232833",
          950: "#15181f",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      spacing: {
        touch: "44px",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(17 26 69 / 0.04), 0 6px 16px -6px rgb(17 26 69 / 0.10)",
        raised:
          "0 2px 4px -1px rgb(17 26 69 / 0.08), 0 16px 32px -12px rgb(17 26 69 / 0.18)",
        foco: "0 0 0 4px rgb(54 94 242 / 0.18)",
      },
      backgroundImage: {
        "marca-gradiente":
          "linear-gradient(135deg, #111a45 0%, #1b2eb2 55%, #365ef2 100%)",
        "acento-gradiente": "linear-gradient(135deg, #10b98a 0%, #047959 100%)",
        vidrio:
          "linear-gradient(180deg, rgb(255 255 255 / 0.92), rgb(255 255 255 / 0.78))",
      },
      keyframes: {
        entrar: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        subir: {
          from: { opacity: "0.4", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        brillo: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        entrar: "entrar 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        subir: "subir 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
        brillo: "brillo 1.6s infinite",
      },
      screens: {
        xs: "380px",
      },
    },
  },
  plugins: [],
};
