import { ref } from 'vue'

const STORAGE_KEY = 'sidebar-collapsed'

const readCollapsed = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

const isSidebarOpen = ref(false)
// Desktop-only: shrink the sidebar to icons.
const isSidebarCollapsed = ref(readCollapsed())

export function useSidebar() {
  const toggleSidebar = () => {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  const toggleCollapsed = () => {
    isSidebarCollapsed.value = !isSidebarCollapsed.value
    try {
      localStorage.setItem(STORAGE_KEY, isSidebarCollapsed.value ? '1' : '0')
    } catch {
      // ignore storage errors
    }
  }

  const closeSidebar = () => {
    isSidebarOpen.value = false
  }

  const openSidebar = () => {
    isSidebarOpen.value = true
  }

  return {
    isSidebarOpen,
    isSidebarCollapsed,
    toggleCollapsed,
    toggleSidebar,
    closeSidebar,
    openSidebar,
  }
}
