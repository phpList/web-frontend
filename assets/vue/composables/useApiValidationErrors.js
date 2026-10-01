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

  const formatValidationErrors = (error) => {
    const responseData = error?.responseData
    const messages = []

    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      Object.entries(responseData).forEach(([field, rawMessage]) => {
        if (!rawMessage) return
        const text = Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage)
        messages.push(`${normalizeFieldName(field)}: ${text}`)
      })
    }

    return [...new Set(messages)]
  }

  return {
    normalizeFieldName,
    formatValidationErrors,
  }
}