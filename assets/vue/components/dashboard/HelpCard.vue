<template>
  <BaseCard>
    <header class="mb-3">
      <h2 class="text-sm font-bold text-gray-900 mb-0 dark:text-slate-100">
        {{ t('dashboard.help.title') }}
      </h2>
      <p class="text-gray-500 text-xs mt-1 mb-0 dark:text-slate-350">
        {{ t('dashboard.help.subtitle') }}
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
          <span class="block text-xs text-slate-500 dark:text-slate-350 mt-0.5">{{ link.description }}</span>
        </a>
      </li>
    </ul>
  </BaseCard>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseCard from '../base/BaseCard.vue'

const { t } = useI18n()

const MANUAL = 'https://www.phplist.org/manual/books/phplist-manual/page'

const links = computed(() => [
  {
    label: t('dashboard.help.first_campaign.label'),
    description: t('dashboard.help.first_campaign.description'),
    href: `${MANUAL}/composing-your-first-campaign`,
  },
  // {
  //   label: 'Basic campaign statistics',
  //   description: 'Understand opens, clicks and bounces.',
  //   href: `${MANUAL}/basic-campaign-statistics`,
  // },
  {
    label: t('dashboard.help.system_overview.label'),
    description: t('dashboard.help.system_overview.description'),
    href: `${MANUAL}/system-overview`,
  },
  {
    label: t('dashboard.help.forum.label'),
    description: t('dashboard.help.forum.description'),
    href: 'https://discuss.phplist.org/latest',
  },
])
</script>
