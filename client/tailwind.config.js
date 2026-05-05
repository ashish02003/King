/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    dark: '#0F0B1F',
                    DEFAULT: '#1A1333',
                    light: '#241D3A',
                },
                gold: {
                    dark: '#8B7230',
                    DEFAULT: '#C9A14A',
                    light: '#E6C77B',
                },
                accent: {
                    soft: '#B8B8C0',
                    purple: '#422D6B',
                },
                luxury: {
                    cream: '#FAF9F6',
                    purple: {
                        dark: '#0F0B1F',
                        DEFAULT: '#1A1333',
                        light: '#B8B8C0',
                    },
                },
            },
            fontFamily: {
                'sans': ['Inter', 'Plus Jakarta Sans', 'sans-serif'],
                'serif': ['Fraunces', 'serif'],
                'display': ['Plus Jakarta Sans', 'sans-serif'],
            },
            borderRadius: {
                'luxury': '12px',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(201, 161, 74, 0.15)',
                'glow-lg': '0 0 40px rgba(201, 161, 74, 0.1)',
                'glow-purple': '0 0 20px rgba(66, 45, 107, 0.2)',
                'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
                'card-hover': '0 8px 40px rgba(0, 0, 0, 0.4)',
            },
        },
    },
    plugins: [],
}
