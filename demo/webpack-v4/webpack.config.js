const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const distDir = path.join(__dirname, 'dist');
const rootDir = path.join(__dirname, '../..');

module.exports = {
    entry: './src/index.jsx',
    output: {
        path: distDir,
        filename: '[name].[hash].js',
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    'css-loader',
                ],
            },
            {
                test: /\.(j|t)s(x?)$/,
                // The latest version of `pdfjs-dist` uses some special syntax such as the ?? operator.
                // It has to be transpiled by babel
                exclude: /node_modules\/(?!(pdfjs-dist)\/).*/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
                    },
                },
            },
            {
                test: /\.s[ac]ss$/i,
                use: ['style-loader', 'css-loader', 'sass-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        alias: {
            // We need it because we use the local development version of `@react-pdf-viewer/xxx`
            // Otherwise, we will see "Invalid hook call" error
            react: path.join(rootDir, 'node_modules/react'),
        },
    },
    devServer: {
        static: [
            {
                directory: distDir,
            },
            // Serve the local PDF documents
            {
                directory: path.join(rootDir, 'samples'),
            },
        ],
        historyApiFallback: true,
        port: 8001,
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: './src/index.html',
            filename: './index.html',
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css',
            ignoreOrder: false,
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: path.join(rootDir, 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.js'),
                    to: distDir,
                },
            ],
        }),
        new webpack.NormalModuleReplacementPlugin(
            // The pattern covers the package and its CSS
            // @react-pdf-viewer/core
            // @react-pdf-viewer/core/lib/styles/index.css
            /^@react-pdf-viewer\/[a-z-]+[\/lib\/styles]*[\/index.(css)]*$/,
            (resource) => {
                const request = resource.request;
                const pkgName = request.split('/')[1];

                switch (true) {
                    case request.endsWith('.css'):
                        resource.request = path.join(rootDir, `packages/${pkgName}/src/styles/index.scss`);
                        break;

                    default:
                        resource.request = path.join(rootDir, `packages/${pkgName}/src`);
                        break;
                }
            },
        ),
    ],
};
