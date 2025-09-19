const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    devtool: false, // Disable source maps for production
    entry: {
        background: './src/background.ts',
        content: './src/content.ts',
        popup: './src/popup.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist-prod'), // Output to dist-prod folder
        filename: '[name].js',
        clean: true
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[path][name].[ext]',
                            outputPath: 'assets/icons/',
                            publicPath: 'assets/icons/'
                        }
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: 'manifest.json',
                    to: 'manifest.json'
                },
                {
                    from: 'src/popup.html',
                    to: 'popup.html'
                },
                {
                    from: 'src/content.css',
                    to: 'content.css'
                },
                {
                    from: 'src/popup.css',
                    to: 'popup.css'
                },
                {
                    from: 'src/assets/icons',
                    to: 'assets/icons'
                }
            ]
        })
    ],
    // Production optimizations
    optimization: {
        minimize: true // Enable minification
    }
};
