/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        evn: {
          blue: "#004B93",
          lightBlue: "#0072CE",
          orange: "#EE3124",
          dark: "#0F172A",
          cardDark: "#1E293B",
          accent: "#38BDF8"
        }
      }
    },
  },
  plugins: [],
}
