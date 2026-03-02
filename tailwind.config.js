/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx}",
  ],
  // theme: {
  //   extend: {
  //     colors: {
  //       navy: {
  //         800:  "#0e1d30",
  //         900:  "#091525",
  //         950:  "#060f1a",
  //       },
  //     },
  //     fontFamily: {
  //       display: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
  //       mono:    ["var(--font-geist-mono)", "monospace"],
  //     },
  //     keyframes: {
  //       "fade-up": {
  //         "0%":   { opacity: "0", transform: "translateY(12px)" },
  //         "100%": { opacity: "1", transform: "translateY(0)" },
  //       },
  //     },
  //     animation: {
  //       "fade-up": "fade-up 0.4s ease-out both",
  //     },
  //   },
  // },
  plugins: [],
};
