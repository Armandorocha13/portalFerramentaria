/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Cor primária: azul-ardósia corporativo (neutro, sóbrio)
                brand: {
                    50: '#f1f4f9',
                    100: '#e2e8f0',
                    200: '#c8d4e3',
                    300: '#a0b3c9',
                    400: '#7490ab',
                    500: '#537290',
                    600: '#3f5a74',
                    700: '#2e4259',  // primário principal
                    800: '#1e2d3e',
                    900: '#141e2a',
                },
                // Neutros refinados (base do layout)
                surface: {
                    0: '#ffffff',
                    50: '#f8f9fb',
                    100: '#f1f3f6',
                    200: '#e4e8ed',
                    300: '#cdd3da',
                    400: '#9aa5b1',
                    500: '#6e7d8c',
                    600: '#4a5568',
                    700: '#2d3748',
                    800: '#1a202c',
                    900: '#0f141a',
                },
                // Status — tons pastéis desaturados
                status: {
                    'pending-bg': '#f0f4f8',
                    'pending-text': '#374a5e',
                    'pending-border': '#c8d4e3',
                    'nostock-bg': '#fdf0f0',
                    'nostock-text': '#7a3535',
                    'nostock-border': '#e8c5c5',
                    'ready-bg': '#f0f7f1',
                    'ready-text': '#2d5a35',
                    'ready-border': '#b6d9bb',
                    'done-bg': '#f5f0fb',
                    'done-text': '#4a3470',
                    'done-border': '#c8b8e8',
                    'expired-bg': '#fdf6ee',
                    'expired-text': '#7a4d19',
                    'expired-border': '#e8c89a',
                },
                // Herança de woodsmoke (mantém compatibilidade)
                woodsmoke: {
                    50: '#f8f9fb',
                    100: '#f1f3f6',
                    200: '#e4e8ed',
                    300: '#cdd3da',
                    400: '#9aa5b1',
                    500: '#6e7d8c',
                    600: '#4a5568',
                    700: '#2d3748',
                    800: '#1a202c',
                    900: '#0f141a',
                    950: '#070b10',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
                'card-md': '0 4px 12px 0 rgba(0,0,0,0.07), 0 1px 3px -1px rgba(0,0,0,0.04)',
                'panel': '0 0 0 1px rgba(0,0,0,0.06), 0 2px 8px 0 rgba(0,0,0,0.05)',
            },
        },
    },
    plugins: [],
}
