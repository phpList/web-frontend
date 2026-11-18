<template>
  <div v-if="options.length > 1" class="relative flex items-center">
    <label class="sr-only" :for="selectId">{{ t('language.label') }}</label>
    <span
      class="sm:hidden flex items-center justify-center rounded-lg border border-slate-400/40 dark:border-slate-700 px-2 py-1.5 text-base leading-none"
      aria-hidden="true"
      data-testid="language-flag"
    >{{ currentFlag }}</span>
    <select
      :id="selectId"
      :value="locale"
      class="max-sm:absolute max-sm:inset-0 max-sm:h-full max-sm:w-full max-sm:opacity-0 appearance-none cursor-pointer rounded-lg bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-slate-100 hover:text-white dark:text-slate-350 dark:hover:text-white border border-slate-400/40 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
        {{ option.flag }} {{ option.name }}
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

// Language code => ISO country code of the flag shown for it.
const FLAG_COUNTRIES = {
  en: 'GB', es: 'ES', de: 'DE', fr: 'FR', it: 'IT', pt: 'PT', 'pt-br': 'BR', nl: 'NL', pl: 'PL',
  ru: 'RU', uk: 'UA', tr: 'TR', ja: 'JP', zh: 'CN', ko: 'KR', ar: 'SA', cs: 'CZ', sv: 'SE',
  da: 'DK', fi: 'FI', nb: 'NO', no: 'NO', el: 'GR', hu: 'HU', ro: 'RO', bg: 'BG', hr: 'HR',
  sk: 'SK', sl: 'SI', he: 'IL', hi: 'IN', id: 'ID', vi: 'VN', th: 'TH', ca: 'ES',
}

const flagFor = (code) => {
  const lower = code.toLowerCase()
  const country = FLAG_COUNTRIES[lower] || FLAG_COUNTRIES[lower.split(/[-_]/)[0]]
  if (!country) {
    return '\u{1F310}'
  }
  return [...country].map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65)).join('')
}

const options = computed(() =>
  Object.entries(readAvailableLocales()).map(([code, name]) => ({ code, name, flag: flagFor(code) }))
)

const currentFlag = computed(() => flagFor(locale.value))

let latestRequest = 0
const changeLocale = async (event) => {
  const next = event.target.value
  if (!next) {
    return
  }

  const request = ++latestRequest
  if (next === locale.value) {
    // Back to the active language: the ticket above already cancels any pending switch.
    return
  }

  // Switch in place: no page reload, every translated string re-renders reactively.
  const messages = await loadMessages(next)
  if (request !== latestRequest) {
    return
  }
  if (messages === null) {
    // The catalogue could not be loaded: keep the current language and catalogue, and show it again.
    event.target.value = locale.value
    return
  }
  setLocaleMessage(next, messages)
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
