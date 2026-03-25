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
                        dark: '#2D5A27',
                        DEFAULT: '#4C7B47',
                        light: '#7A9E72'
                    },
                    blue: {
                        dark: '#001F3F',
                        DEFAULT: '#1E3A5F',
                        light: '#4A6A8A'
                    },
                    red: {
                        dark: '#700000',
                        DEFAULT: '#9A1F40',
                        light: '#C26B7D'
                    },
                    gold: {
                        dark: '#7E6B4E',
                        DEFAULT: '#BFA75D',
                        light: '#D9C5A3'
                    },
                    purple: {
                        dark: '#3A1F40',
                        DEFAULT: '#5B3A7B',
                        light: '#9E7BBD'
                    },
                    charcoal: '#0F172A',
                    slate: '#1E293B',
                    cream: '#F8F5F0',
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
