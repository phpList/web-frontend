<template>
  <BaseCard>
    <header class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0 dark:text-slate-100">
        phpList community news
      </h2>
      <a
        :href="allNewsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs font-semibold text-ext-wf3 dark:text-indigo-400 no-underline hover:underline"
      >
        All news
      </a>
    </header>

    <div v-if="loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>

    <div
      v-else-if="error"
      class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
      role="alert"
    >
      {{ error }}
    </div>

    <p v-else-if="!items.length" class="py-4 text-sm text-slate-500 dark:text-slate-400">
      No news available right now.
    </p>

    <ul v-else class="space-y-3 list-none p-0 m-0">
      <li v-for="item in items" :key="item.link">
        <a
          :href="item.link"
          target="_blank"
          rel="noopener noreferrer"
          class="block rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 no-underline transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100">{{ item.title }}</span>
          <span v-if="formatDate(item.date)" class="block text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {{ formatDate(item.date) }}
          </span>
          <span v-if="item.summary" class="block text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.summary }}</span>
        </a>
      </li>
    </ul>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../base/BaseCard.vue'

defineProps({
  items: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const allNewsUrl = 'https://www.phplist.org/newslist/'

const formatDate = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).format(date)
}
</script>
