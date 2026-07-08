# phpList 4 web frontend

[![Build Status](https://github.com/phpList/web-frontend/workflows/phpList%20Web%20Frontend%20Build/badge.svg)](https://github.com/phpList/web-frontend/actions)
[![Latest Stable Version](https://poser.pugx.org/phplist/web-frontend/v/stable.svg)](https://packagist.org/packages/phpList/web-frontend)
[![Total Downloads](https://poser.pugx.org/phplist/web-frontend/downloads.svg)](https://packagist.org/packages/phpList/web-frontend)
[![Latest Unstable Version](https://poser.pugx.org/phplist/web-frontend/v/unstable.svg)](https://packagist.org/packages/phpList/web-frontend)
[![License](https://poser.pugx.org/phplist/web-frontend/license.svg)](https://packagist.org/packages/phpList/web-frontend)


## About phpList

phpList is an open source newsletter manager.


## About this package

This module will contain the web frontend for phpList 4. It will not have any
SQL queries but use functionality from the phpList 4 core for DB access.

This module is optional, i.e., it will be possible to run phpList 4 without a
web frontend.


## Installation

Please install this package via Composer from within the
[phpList base distribution](https://github.com/phpList/base-distribution),
which also has more detailed installation instructions in the README.


### When this module is installed as a dependency, publish bundle assets to the host application's `public/` directory:
```bash
php bin/console assets:install public --symlink --relative
```

This module serves its frontend files from `/`.


## Contributing to this package

Please read the [contribution guide](.github/CONTRIBUTING.md) on how to
contribute and how to run the unit tests and style checks locally.

### Code of Conduct

This project adheres to a [Contributor Code of Conduct](CODE_OF_CONDUCT.md).
By participating in this project and its community, you are expected to uphold
this code.

## Commands for running this project for local testing
```bash
# Start the Symfony local server
symfony local:server:start
```

```bash
# Compile and watch assets (including Vue.js components)
yarn encore dev --watch
```

## Vue.js Integration
This project uses Vue.js for interactive UI components. Vue components are located in the `assets/vue/` directory and are mounted to specific DOM elements:

- `App.vue` is mounted to the element with ID `vue-app`

To add new Vue components:
1. Create the component in the `assets/vue/` directory
2. Import and mount it in `assets/app.js`
3. Add a mount point in the appropriate template

## CKEditor 5 Integration

The rich text editor lives in `assets/editor/` and is exposed to the existing forms through `assets/vue/components/base/CkEditorField.vue`.

### Architecture

- `assets/editor/CkEditor.vue` is the reusable Vue 3 editor component.
- `assets/editor/uploadAdapter.ts` provides CKEditor upload support against a Symfony endpoint.
- `assets/editor/plugins.ts` and `assets/editor/toolbar.ts` keep the editor configuration isolated and reusable.
- `src/Service/EditorUploadService.php` stores uploads in the public filesystem and returns a browser URL.
- `src/Controller/EditorUploadController.php` accepts authenticated uploads and returns CKEditor-compatible JSON.

### Reused from the legacy plugin

- upload path conventions
- image validation rules
- public-file URL generation strategy
- file storage separation for editor content

### New behavior

- Vue component with `v-model`
- configurable toolbar and CKEditor options
- upload adapter with progress support
- cleanup on unmount
- read-only mode support

### Build and test

```bash
yarn encore dev
composer test
yarn test:vue
```

### Configuration

The backend uses the existing phpList upload directory parameters:

- `phplist.upload_images_dir`
- `phplist.editor_images_dir`

Uploads are stored below `public/<phplist.editor_images_dir>/ckeditor5/`.

### Limitations

- This integration only covers image uploads from CKEditor.
- elFinder is not embedded in the frontend UI; only the storage model and upload flow are reused.
- Existing legacy HTML content is preserved as-is, but custom HTML support still depends on CKEditor 5 output rules.
