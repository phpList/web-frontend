<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0 dark:text-slate-100">
        Help
      </h2>
      <p class="text-gray-500 text-xs mt-1 mb-0 dark:text-slate-400">
        Useful pages from the phpList manual
      </p>
    </header>

    <ul class="space-y-2 list-none p-0 m-0">
      <li v-for="link in links" :key="link.href">
        <a
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
          class="block rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 no-underline transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <span class="block text-sm font-semibold text-slate-900 dark:text-slate-100">{{ link.label }}</span>
          <span class="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ link.description }}</span>
        </a>
      </li>
    </ul>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../base/BaseCard.vue'

const MANUAL = 'https://www.phplist.org/manual/books/phplist-manual/page'

const links = [
  {
    label: 'Composing your first campaign',
    description: 'Create, preview and send your first message.',
    href: `${MANUAL}/composing-your-first-campaign`,
  },
  {
    label: 'Basic campaign statistics',
    description: 'Understand opens, clicks and bounces.',
    href: `${MANUAL}/basic-campaign-statistics`,
  },
  {
    label: 'System overview',
    description: 'How the pieces of phpList fit together.',
    href: `${MANUAL}/system-overview`,
  },
]
</script>
