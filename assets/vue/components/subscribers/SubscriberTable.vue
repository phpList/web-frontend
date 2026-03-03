<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-sm">
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
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="subscriber.confirmed ? statusClasses.active : statusClasses.unconfirmed"
            >
              {{ subscriber.confirmed ? 'Confirmed' : 'Unconfirmed' }}
            </span>
            <span
              v-if="subscriber.blacklisted"
              class="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
            >
              Blacklisted
            </span>
          </td>
          <td class="px-6 py-4 text-right text-slate-600">
            {{ subscriber.listCount }}
          </td>
          <td class="px-6 py-4 text-slate-600">
            {{ new Date(subscriber.createdAt.date).toLocaleDateString() }}
          </td>
          <td class="px-6 py-4 text-right">
            <button class="text-slate-400 hover:text-slate-600">
              <BaseIcon name="eye" class="w-4 h-4" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>
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
</script>
