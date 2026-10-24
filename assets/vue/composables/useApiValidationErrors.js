import { ref, computed } from 'vue'

const ERROR_BORDER_CLASSES = 'border border-red-300 dark:border-red-500/40 focus:ring-red-500 focus:border-red-500'
const NORMAL_BORDER_CLASSES = 'border border-slate-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500'

export function useApiValidationErrors(fieldLabels = {}) {
  const normalizeFieldName = (fieldPath = '') => {
    if (fieldLabels[fieldPath]) return fieldLabels[fieldPath]

    const fallback = String(fieldPath)
      .split('.')
      .pop()
      ?.replace(/\[\d+]/g, '')
      ?.replace(/_/g, ' ')
      ?.replace(/([a-z])([A-Z])/g, '$1 $2')
      ?.trim()

    if (!fallback) return 'Field'
    return fallback.charAt(0).toUpperCase() + fallback.slice(1)
  }

  const extractErrorMap = (error) => {
    const responseData = error?.responseData
    if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
      return {}
    }

    const sourceErrors =
      responseData.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)
        ? responseData.errors
        : responseData

    const normalized = {}
    Object.entries(sourceErrors).forEach(([field, messages]) => {
      if (!field || messages === null || messages === undefined) return
      const list = Array.isArray(messages) ? messages : [messages]
      const textMessages = list.map((message) => String(message).trim()).filter(Boolean)
      if (textMessages.length > 0) normalized[String(field)] = textMessages
    })
    return normalized
  }

  const formatValidationErrors = (error) => {
    const errorMap = extractErrorMap(error)
    const messages = Object.entries(errorMap).map(
      ([field, messages]) => `${normalizeFieldName(field)}: ${messages.join(' ')}`
    )
    return [...new Set(messages)]
  }

  const fieldErrorsMap = ref({})

  const setErrorsFromError = (error) => {
    fieldErrorsMap.value = extractErrorMap(error)
    return fieldErrorsMap.value
  }

  const clearErrors = () => {
    fieldErrorsMap.value = {}
  }

  const fieldErrors = (field) => {
    const messages = fieldErrorsMap.value?.[field]
    return Array.isArray(messages) ? messages : []
  }

  const fieldHasError = (field) => fieldErrors(field).length > 0

  const hasFieldErrors = computed(() => Object.keys(fieldErrorsMap.value).length > 0)

  const generalErrors = (knownFields = []) =>
    Object.entries(fieldErrorsMap.value)
      .filter(([field]) => !knownFields.includes(field))
      .flatMap(([, messages]) => messages)

  const fieldInputClass = (field, baseClasses = '') => [
    baseClasses,
    fieldHasError(field) ? ERROR_BORDER_CLASSES : NORMAL_BORDER_CLASSES
  ]

  return {
    normalizeFieldName,
    formatValidationErrors,
    fieldErrorsMap,
    setErrorsFromError,
    clearErrors,
    fieldErrors,
    fieldHasError,
    hasFieldErrors,
    generalErrors,
    fieldInputClass,
  }
}