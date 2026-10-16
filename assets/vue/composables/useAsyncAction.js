import { ref } from 'vue'

export function useAsyncAction(action, options = {}) {
  const {
    once = false,
    errorMessage = 'Something went wrong.',
    logLabel,
    onError,
    initialLoading = false,
  } = options

  const loading = ref(initialLoading)
  const error = ref('')
  const loaded = ref(false)
  const settled = ref(false)
  // Plain (non-reactive) re-entry guard, deliberately separate from `loading` - `loading`'s
  // initial value is caller-configurable display state, not "a run is already in flight".
  let inFlight = false

  const run = async (...args) => {
    if (inFlight || (once && loaded.value)) {
      return undefined
    }

    inFlight = true
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
      inFlight = false
      loading.value = false
      settled.value = true
    }
  }

  return { loading, error, loaded, settled, run }
}
