import { ref } from 'vue'
import { backendFetch } from '../api'
import { useAsyncAction } from './useAsyncAction'
import { useCurrentAdmin } from './useCurrentAdmin'

const items = ref([])
const { loadCurrentAdmin } = useCurrentAdmin()

const action = useAsyncAction(
  async () => {
    // The backend rotates the session id on every request, so two simultaneous requests to it
    // can invalidate each other's session. Wait for the layout's /admin-about call to finish first.
    await loadCurrentAdmin()

    const response = await backendFetch('/dashboard/community-news', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (!response.ok) {
      throw new Error(`Community news request failed with status ${response.status}`)
    }

    const data = await response.json()
    items.value = Array.isArray(data?.items) ? data.items : []
  },
  {
    once: true,
    // Starts true so the card shows its spinner instead of flashing the empty state.
    initialLoading: true,
    errorMessage: 'Unable to load community news.',
    logLabel: 'Failed to load community news:',
  }
)

export function useCommunityNews() {
  return {
    items,
    loading: action.loading,
    error: action.error,
    load: action.run,
  }
}
