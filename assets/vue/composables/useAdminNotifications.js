import { ref } from 'vue'
import { backendFetch } from '../api'
import { useAsyncAction } from './useAsyncAction'
import { useCurrentAdmin } from './useCurrentAdmin'

const items = ref([])
const dismissed = ref(new Set())
const SEEN_KEY = 'phplist.seenNotifications'

// The backend has no read state, so "seen" codes are remembered per browser and per administrator.
const { adminData, loadCurrentAdmin } = useCurrentAdmin()

const seenKey = () => {
  const identity = adminData.value?.id ?? adminData.value?.login_name
  return identity === undefined || identity === null || identity === ''
    ? null
    : `${SEEN_KEY}.${identity}`
}

const loadSeen = () => {
  const key = seenKey()
  if (!key) return new Set()
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}
const seen = ref(new Set())

const action = useAsyncAction(
  async () => {
    // The backend rotates the session id on every request; wait for /admin-about to finish first.
    await loadCurrentAdmin()
    seen.value = loadSeen()

    const response = await backendFetch('/admin-notifications', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    })

    if (!response.ok) {
      throw new Error(`Notifications request failed with status ${response.status}`)
    }

    const data = await response.json()
    items.value = Array.isArray(data?.items) ? data.items : []
  },
  {
    once: true,
    logLabel: 'Failed to load admin notifications:',
  }
)

export function useAdminNotifications() {
  const visible = () => items.value.filter((item) => !dismissed.value.has(item.code))

  const dismiss = (code) => {
    dismissed.value = new Set([...dismissed.value, code])
  }

  const unreadCount = () => visible().filter((item) => !seen.value.has(item.code)).length

  const markAllRead = () => {
    seen.value = new Set([...seen.value, ...items.value.map((item) => item.code)])
    const key = seenKey()
    if (!key) return
    try {
      localStorage.setItem(key, JSON.stringify([...seen.value]))
    } catch {
      // storage unavailable; keep in-memory state only
    }
  }

  return { items, visible, dismiss, unreadCount, markAllRead, load: action.run }
}

// Test-only: clears module-level state.
export function __resetAdminNotificationsForTests() {
  action.loaded.value = false
  items.value = []
  dismissed.value = new Set()
  seen.value = new Set()
  try {
    const key = seenKey()
    if (key) localStorage.removeItem(key)
    localStorage.removeItem(SEEN_KEY)
  } catch {
    // ignore
  }
}
