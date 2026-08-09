const Encore = require('@symfony/webpack-encore');
const path = require('path');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')
    .addEntry('app', './assets/app.js')
    .addStyleEntry('styles', './assets/styles/app.css')
    .addStyleEntry('color', './assets/styles/color.css')
    .addStyleEntry('subscribe', './assets/styles/subscribe.css')
    .enableVueLoader(() => {}, { version: 3 })
    .enableSingleRuntimeChunk()
    .enablePostCssLoader()
    .enableVersioning(Encore.isProduction())
    .copyFiles({
        from: './assets/images',
        to: 'images/[path][name].[hash:8].[ext]',
    })
    .addAliases({
        '@': path.resolve(__dirname, 'assets'),
        '@images': path.resolve(__dirname, 'assets/images'),
    })
;

module.exports = Encore.getWebpackConfig();
