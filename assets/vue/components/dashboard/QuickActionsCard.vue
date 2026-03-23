<template>
  <BaseCard class="h-full">
    <header class="mb-4">
      <h2 class="text-sm font-bold text-gray-900 mb-0">
        Quick Actions
      </h2>
    </header>

    <div class="grid grid-cols-2 gap-3">
      <a
        v-for="action in quickActions"
        :key="action.id"
        :href="action.href"
        class="rounded-xl border border-gray-200 bg-gray-100/70 px-4 py-4 text-center transition-colors hover:bg-gray-100"
      >
        <div class="mb-2 flex justify-center">
          <span class="inline-flex items-center justify-center">
            <svg
              v-if="action.id === 'campaign'"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
            <svg
              v-else-if="action.id === 'subscribers'"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 8v6m-3-3h6" />
            </svg>
            <svg
              v-else-if="action.id === 'import'"
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16V8m0 0-3 3m3-3 3 3" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 16.6A5 5 0 0 0 18 7H6a5 5 0 0 0-2 9.6" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M14 2v5h5M9 15l2 2 4-4" />
            </svg>
          </span>
        </div>
        <p class="m-0 text-sm font-semibold text-slate-800">
          {{ action.label }}
        </p>
      </a>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '../../components/base/BaseCard.vue'

const quickActions = [
  { id: 'campaign', label: 'New Campaign', href: '/campaigns' },
  { id: 'subscribers', label: 'Add Subscribers', href: '/subscribers' },
  { id: 'import', label: 'Import List', href: '/subscribers' },
  { id: 'templates', label: 'Manage Templates', href: '/templates' },
]
</script>
