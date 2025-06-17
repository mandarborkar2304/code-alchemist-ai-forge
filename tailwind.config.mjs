import { join } from 'path';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        join(__dirname, 'src/**/*.{ts,tsx,js,jsx,html}'),
    ],
    theme: {
        extend: {
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                border: 'hsl(240, 5%, 84%)',
                primary: 'hsl(262, 83%, 58%)',
                muted: 'hsl(240, 6%, 90%)',
            },
        },
    },
    plugins: [],
};
