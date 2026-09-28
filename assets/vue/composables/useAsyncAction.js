import { ref } from 'vue'

export function useAsyncAction(action, options = {}) {
  const {
    once = false,
    errorMessage = 'Something went wrong.',
    logLabel,
    onError,
  } = options

  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)
  const settled = ref(false)

  const run = async (...args) => {
    if (loading.value || (once && loaded.value)) {
      return undefined
    }

    loading.value = true
    error.value = ''

    try {
      const result = await action(...args)
      loaded.value = true
      return result
    } catch (err) {
      if (logLabel) {
        console.error(logLabel, err)
      }
      error.value = typeof errorMessage === 'function' ? errorMessage(err) : errorMessage
      onError?.(err)
      return undefined
    } finally {
      loading.value = false
      settled.value = true
    }
  }

  return { loading, error, loaded, settled, run }
}
