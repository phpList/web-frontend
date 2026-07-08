import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import EditorUploadAdapter from '../../../../assets/editor/uploadAdapter.ts'

const originalXhr = global.XMLHttpRequest

describe('EditorUploadAdapter', () => {
  let listeners
  let sendMock

  beforeEach(() => {
    listeners = {}
    sendMock = vi.fn()

    global.XMLHttpRequest = class {
      constructor() {
        this.upload = {
          addEventListener: (event, handler) => {
            listeners[`upload:${event}`] = handler
          },
        }
        this.addEventListener = (event, handler) => {
          listeners[event] = handler
        }
        this.open = vi.fn()
        this.setRequestHeader = vi.fn()
        this.send = sendMock
        this.abort = vi.fn()
        this.response = null
        this.responseText = ''
        this.responseType = ''
        this.withCredentials = false
      }
    }
  })

  afterEach(() => {
    global.XMLHttpRequest = originalXhr
  })

  it('uploads files and resolves the returned URL', async () => {
    const loader = {
      file: Promise.resolve(new File(['image'], 'banner.png', { type: 'image/png' })),
    }

    const adapter = new EditorUploadAdapter(loader, {
      endpoint: '/editor/upload',
    })

    const uploadPromise = adapter.upload()
    await Promise.resolve()
    const xhr = adapter.xhr

    xhr.response = { url: '/uploadimages/ckeditor5/banner.png' }
    listeners.load()

    await expect(uploadPromise).resolves.toEqual({
      default: '/uploadimages/ckeditor5/banner.png',
    })

    expect(sendMock).toHaveBeenCalledOnce()
    expect(xhr.open).toHaveBeenCalledWith('POST', '/editor/upload', true)
  })

  it('rejects when the backend returns an error message', async () => {
    const loader = {
      file: Promise.resolve(new File(['image'], 'banner.png', { type: 'image/png' })),
    }

    const adapter = new EditorUploadAdapter(loader)
    const uploadPromise = adapter.upload()
    await Promise.resolve()

    adapter.xhr.response = { error: { message: 'Upload failed.' } }
    listeners.load()

    await expect(uploadPromise).rejects.toBe('Upload failed.')
  })
})
