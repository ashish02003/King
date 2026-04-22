/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                luxury: {
                    green: {
                        dark: '#2D3A2B',
                        DEFAULT: '#4A5D48',
                        light: '#8A9A83'
                    },
                    blue: {
                        dark: '#0A1128',
                        DEFAULT: '#1B2B52',
                        light: '#4B6594'
                    },
                    red: {
                        dark: '#4D0A11',
                        DEFAULT: '#720E17',
                        light: '#A1515B'
                    },
                    gold: {
                        dark: '#5E4B3C',
                        DEFAULT: '#A68A56',
                        light: '#D4C19C'
                    },
                    purple: {
                        dark: '#30174D',
                        DEFAULT: '#563C8C',
                        light: '#A189CC'
                    },
                    charcoal: '#0F172A',
                    slate: '#1E293B',
                    cream: '#FAF9F6',
                    pearl: '#FFFFFF',
                }
            },
            fontFamily: {
                'sans': ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
                'serif': ['Fraunces', 'serif'],
                'premium': ['Plus Jakarta Sans', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
