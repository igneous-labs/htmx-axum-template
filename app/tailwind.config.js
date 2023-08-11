/** @type {import("tailwindcss").Config} */
module.exports = {
  // dont use overly-broad patterns like ./**/*.{js,css,html}
  // since this has no exclude option
  content: ["./index.html", "./404.html", "./css/**/*.css", "./js/**/*.js"],
  plugins: [],
  darkMode: "class",
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
};
