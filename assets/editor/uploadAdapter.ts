export default class EditorUploadAdapter {
  constructor(loader, options = {}) {
    this.loader = loader;
    this.endpoint = options.endpoint || '/editor/upload';
    this.headers = options.headers || {};
    this.withCredentials = options.withCredentials !== false;
    this.xhr = null;
  }

  upload() {
    return this.loader.file.then((file) => new Promise((resolve, reject) => {
      const xhr = this.xhr = new XMLHttpRequest();
      const formData = new FormData();

      xhr.open('POST', this.endpoint, true);
      xhr.responseType = 'json';
      xhr.withCredentials = this.withCredentials;
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

      Object.entries(this.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable) {
          return;
        }

        this.loader.uploadTotal = event.total;
        this.loader.uploaded = event.loaded;
      });

      xhr.addEventListener('error', () => {
        reject('The file could not be uploaded.');
      });

      xhr.addEventListener('abort', () => {
        reject('The upload was aborted.');
      });

      xhr.addEventListener('load', () => {
        const response = xhr.response || parseResponse(xhr.responseText);

        if (!response) {
          reject('The upload response was empty.');
          return;
        }

        if (response.error?.message) {
          reject(response.error.message);
          return;
        }

        if (typeof response.url === 'string' && response.url.length > 0) {
          resolve({
            default: response.url,
          });
          return;
        }

        reject('The upload response did not include a file URL.');
      });

      formData.append('upload', file);
      formData.append('fileName', file.name);

      xhr.send(formData);
    }));
  }

  abort() {
    if (this.xhr) {
      this.xhr.abort();
    }
  }
}

function parseResponse(responseText) {
  if (typeof responseText !== 'string' || responseText.trim() === '') {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch (_error) {
    return null;
  }
}
