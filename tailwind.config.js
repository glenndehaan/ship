module.exports = {
    mode: 'jit',
    content: ["./src/template/**/*.{html,js,ejs}"],
    darkMode: 'media',
    theme: {
        screens: {
            'sm': '640px',
            // => @media (min-width: 640px) { ... }

            'md': '768px',
            // => @media (min-width: 768px) { ... }

            'lg': '1224px',
            // => @media (min-width: 1124px) { ... }

            'xl': '1280px',
            // => @media (min-width: 1280px) { ... }

            '2xl': '1536px',
            // => @media (min-width: 1536px) { ... }
        },
        extend: {}
    },
    variants: {
        extend: {}
    },
    plugins: []
};
