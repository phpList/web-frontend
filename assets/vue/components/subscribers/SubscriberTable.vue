<template>
  <div class="overflow-x-auto">
    <!-- Desktop Table -->
    <table class="w-full text-left text-sm hidden md:table">
      <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Email</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Lists</th>
          <th class="px-6 py-4">Created</th>
          <th class="px-6 py-4 w-10"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200">
        <tr
          v-for="subscriber in props.subscribers"
          :key="subscriber.id"
          class="hover:bg-slate-50  transition-colors group"
        >
          <td class="px-6 py-4 text-slate-600 ">
            {{ subscriber.id }}
          </td>
          <td class="px-6 py-4 font-mono text-sm text-slate-900">
            {{ subscriber.email }}
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-wrap gap-2">
              <span
                class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="subscriber.confirmed ? statusClasses.active : statusClasses.unconfirmed"
              >
                {{ subscriber.confirmed ? 'Confirmed' : 'Unconfirmed' }}
              </span>
              <span
                v-if="subscriber.blacklisted"
                class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
              >
                Blacklisted
              </span>
            </div>
          </td>
          <td class="px-6 py-4 text-right text-slate-600">
            {{ subscriber.listCount }}
          </td>
          <td class="px-6 py-4 text-slate-600">
            {{ formatDate(subscriber.createdAt?.date) }}
          </td>
          <td class="px-6 py-4 text-right">
            <button class="text-slate-400 hover:text-slate-600">
              <BaseIcon name="eye" class="w-4 h-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile Card View -->
    <div class="block md:hidden divide-y divide-slate-100">
      <div
        v-for="subscriber in props.subscribers"
        :key="subscriber.id"
        class="p-4 hover:bg-slate-50 transition-colors"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium text-slate-900 truncate max-w-[180px]">
            {{ subscriber.email.split('@')[0] }}
          </span>
          <div class="flex gap-2">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="subscriber.confirmed ? statusClasses.active : statusClasses.unconfirmed"
            >
              {{ subscriber.confirmed ? 'active' : 'unconfirmed' }}
            </span>
            <span
              v-if="subscriber.blacklisted"
              class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
            >
              blacklisted
            </span>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs font-mono text-slate-500 break-all">{{ subscriber.email }}</p>
          <div class="flex items-center gap-4 mt-2 text-[11px] text-slate-400 uppercase tracking-tight">
            <span class="flex items-center gap-1">
              <BaseIcon name="list" class="w-3 h-3" />
              {{ subscriber.listCount }} Lists
            </span>
            <span class="flex items-center gap-1">
              <BaseIcon name="eye" class="w-3 h-3" />
              {{ subscriber.openCount || 0 }} Opens
            </span>
            <span class="ml-auto">
              {{ formatDate(subscriber.createdAt?.date, true) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import { inject } from 'vue'

const statusClasses = {
  active: 'bg-emerald-100 text-emerald-700',
  unconfirmed: 'bg-amber-100 text-amber-700',
  bounced: 'bg-red-100 text-red-700',
  unsubscribed: 'bg-slate-100 text-slate-600',
}

const props = defineProps({
  subscribers: {
    type: Array,
    required: true
  }
})

const formatDate = (dateString, isIso = false) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return '-'
  
  if (isIso) {
    return date.toISOString().split('T')[0]
  }
  return date.toLocaleDateString()
}
</script>
