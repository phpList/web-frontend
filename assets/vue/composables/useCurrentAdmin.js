import { ref } from 'vue'
import { backendFetch } from '../api'

const adminData = ref({})
let loadPromise = null

const loadCurrentAdmin = () => {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    try {
      const response = await backendFetch('/admin-about', {
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })

      if (response.ok) {
        adminData.value = await response.json()
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    }
  })()

  return loadPromise
}

export function useCurrentAdmin() {
  const hasPrivilege = (privilege) => {
    if (!privilege) return true
    return !!adminData.value?.privileges?.[privilege]
  }

  return {
    adminData,
    loadCurrentAdmin,
    hasPrivilege,
  }
}

// Test-only: clears the module-level cache so each test starts from a fresh fetch.
export function __resetCurrentAdminForTests() {
  adminData.value = {}
  loadPromise = null
}
