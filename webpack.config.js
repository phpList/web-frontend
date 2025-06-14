const Encore = require('@symfony/webpack-encore');

Encore
    .setOutputPath('public/build/')
    .setPublicPath('/build')
    .addEntry('app', './assets/app.js')
    .enableVueLoader()
    .enableSingleRuntimeChunk()
;

module.exports = Encore.getWebpackConfig();
