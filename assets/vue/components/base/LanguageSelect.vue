<template>
  <div v-if="options.length > 1" class="relative">
    <label class="sr-only" :for="selectId">{{ t('language.label') }}</label>
    <select
      :id="selectId"
      :value="locale"
      class="appearance-none cursor-pointer rounded-lg bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-100 hover:text-white dark:text-slate-350 dark:hover:text-white border border-slate-400/40 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
      :title="t('language.label')"
      data-testid="language-select"
      @change="changeLocale"
    >
      <option
        v-for="option in options"
        :key="option.code"
        :value="option.code"
        class="text-slate-900"
      >
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { backendFetch } from '../../api'
import { loadMessages, readAvailableLocales } from '../../i18n'

const { t, locale, setLocaleMessage } = useI18n()

const selectId = 'language-select'

const options = computed(() =>
  Object.entries(readAvailableLocales()).map(([code, name]) => ({ code, name }))
)

const changeLocale = async (event) => {
  const next = event.target.value
  if (!next || next === locale.value) {
    return
  }

  // Switch in place: no page reload, every translated string re-renders reactively.
  setLocaleMessage(next, await loadMessages(next))
  locale.value = next
  document.documentElement.setAttribute('lang', next)

  // Remember the choice for this administrator (a cookie set by the server), so it applies on every
  // page and at the next login in this browser.
  try {
    const response = await backendFetch('/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ locale: next }),
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
  } catch (error) {
    console.error('Failed to save the language choice:', error)
  }
}
</script>
