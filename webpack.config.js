const Encore = require('@symfony/webpack-encore');
const path = require('path');

// `dist/` is a git-tracked, pre-built bundle published for consumers (e.g.
// phplist/base-distribution) so they don't need Node.js/Yarn or a duplicated
// dependency list to use this package's frontend assets. `public/build/` stays
// the untracked output used for local development of this package itself.
const isDistBuild = process.env.BUILD_TARGET === 'dist';

Encore
    .setOutputPath(isDistBuild ? 'dist/' : 'public/build/')
    .setPublicPath('/build')
    .setManifestKeyPrefix('build/')
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
