/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{svelte,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf2f8",
          100: "#fce7f3",
          200: "#fbcfe8",
          300: "#f9a8d4",
          400: "#f472b6",
          500: "#ec4899",
          600: "#db2777",
          700: "#be185d",
          800: "#9d174d",
          900: "#831843",
        },
        ink: {
          50: "#f6f6f7",
          100: "#ebebed",
          200: "#d3d4d8",
          300: "#adaeb6",
          400: "#81838f",
          500: "#636674",
          600: "#4d4e5c",
          700: "#40414d",
          800: "#373842",
          900: "#20212b",
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
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 4px 12px -2px rgb(0 0 0 / 0.06)",
        raised: "0 2px 4px -1px rgb(0 0 0 / 0.06), 0 12px 24px -6px rgb(0 0 0 / 0.1)",
      },
      screens: {
        xs: "380px",
      },
    },
  },
  plugins: [],
};
