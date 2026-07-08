import { ButtonView, Plugin } from 'ckeditor5';

export default class AssetBrowserPlugin extends Plugin {
  init() {
    const editor = this.editor;

    editor.ui.componentFactory.add('assetBrowser', (locale) => {
      const view = new ButtonView(locale);
      const openAssetPicker = editor.config.get('openAssetPicker');

      view.set({
        label: 'Browse files',
        tooltip: true,
        withText: true,
      });

      view.on('execute', () => {
        if (typeof openAssetPicker === 'function') {
          openAssetPicker(editor);
        }
      });

      return view;
    });
  }
}
