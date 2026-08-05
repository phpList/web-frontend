import { ref } from 'vue'

const STORAGE_KEY = 'color-scheme'

const isDark = ref(false)

const applyDarkMode = (value) => {
  isDark.value = value
  document.documentElement.classList.toggle('dark', value)
}

const initDarkMode = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyDarkMode(stored ? stored === 'dark' : prefersDark)
}

export function useDarkMode() {
  const toggleDarkMode = () => {
    applyDarkMode(!isDark.value)
    localStorage.setItem(STORAGE_KEY, isDark.value ? 'dark' : 'light')
  }

  return {
    isDark,
    initDarkMode,
    toggleDarkMode,
  }
}