/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
  theme: {
    extend: {
        fontFamily: {
            'mainFont': ['Poppins', 'sans-serif'],
        }
        ,
        colors: {
            'mainColor': '#BE6447',
        }
    },
  },
  plugins: [],
}

