const path = require('path');

module.exports = {
    entry: {
        account: './client/account.jsx',
        login: './client/login.jsx',
        homepage: './client/homepage.jsx',
        generic: './client/genericElements.jsx',
        notFound: './client/notFound.jsx'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
            },
        ],
    },
    mode: 'production',
    watchOptions: {
        aggregateTimeout: 200,
    },
    output: {
        path: path.resolve(__dirname, 'hosted'),
        filename: '[name]Bundle.js',
    },
};