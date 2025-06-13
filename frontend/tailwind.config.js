const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './pages/**/*.{js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--color-primary))',
        secondary: 'hsl(var(--color-secondary))',
        destructive: 'hsl(var(--color-destructive))',
        success: 'hsl(var(--color-success))',
        warning: 'hsl(var(--color-warning))',
        muted: 'hsl(var(--color-muted))',
        ring: 'hsl(var(--color-ring))',
        border: 'hsl(var(--color-border))',
        card: 'hsl(var(--color-card))',
        popover: 'hsl(var(--color-popover))',
        background: 'hsl(var(--color-bg))',
        foreground: 'hsl(var(--color-fg))'
      },
      fontFamily: {
        sans: ['Inter', ...fontFamily.sans]
      }
    }
  },
  plugins: []
};
