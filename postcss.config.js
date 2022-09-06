module.exports = {
    content: ['views/**/*.html'],
    css: ['public/tailwind.css'],
    extractors: [
        {
            extractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
            extensions: ['html']
        }
    ],
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
    ]
};