module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f2fbf3',
          100: '#dbf1df',
          200: '#b9e3c0',
          300: '#8fd296',
          400: '#61b96d',
          500: '#3BA04C',
          600: '#348f45',
          700: '#2F7D3A',
          800: '#2a6533',
          900: '#24542c'
        },
        accent: {
          50: '#fffaf0',
          100: '#fdf0c9',
          200: '#f8df8c',
          300: '#f1ca52',
          400: '#E3B129',
          500: '#cf9a18',
          600: '#b17f12'
        }
      },
      boxShadow: {
        panel: '0 24px 60px rgba(15, 23, 42, 0.08), 0 10px 24px rgba(59, 160, 76, 0.06)'
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Trebuchet MS', 'Segoe UI', 'Verdana', 'sans-serif']
      }
    }
  },
  plugins: []
};
