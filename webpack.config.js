const Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')
    .addEntry('app', './assets/app.js')
    .enableVueLoader(() => {}, { version: 3 })
    .enableSingleRuntimeChunk()
    .enablePostCssLoader()
    .copyFiles({
        from: './assets/images',
        to: 'images/[path][name].[hash:8].[ext]',
    })
;

module.exports = Encore.getWebpackConfig();
