<template>
  <div class="overflow-x-auto">
    <!-- Desktop Table -->
    <table class="w-full text-left text-sm hidden md:table">
      <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <th class="px-6 py-4">ID</th>
          <th class="px-6 py-4">Email</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4 text-right">Lists</th>
          <th class="px-6 py-4">Created</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
        <tr
          v-for="subscriber in props.subscribers"
          :key="subscriber.id"
          class="hover:bg-slate-50 dark:hover:bg-slate-800  transition-colors group"
        >
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300 ">
            {{ subscriber.id }}
          </td>
          <td class="px-6 py-4 font-mono text-sm text-slate-900 dark:text-slate-100">
            {{ subscriber.email }}
          </td>
          <td class="px-6 py-4">
            <div class="flex flex-wrap gap-2">
              <BaseBadge :variant="subscriber.confirmed ? 'success' : 'warning'">
                {{ subscriber.confirmed ? 'Confirmed' : 'Unconfirmed' }}
              </BaseBadge>
              <BaseBadge v-if="subscriber.blacklisted" variant="danger">
                Blacklisted
              </BaseBadge>
            </div>
          </td>
          <td class="px-6 py-4 text-right text-slate-600 dark:text-slate-300">
            {{ subscriber.listCount }}
          </td>
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
            {{ subscriber.createdAt }}
          </td>
          <td class="px-6 py-4 text-right">
            <ActionButton icon="eye" @click="emit('view', subscriber.id)">
              View
            </ActionButton>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Mobile Card View -->
    <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
      <div
        v-for="subscriber in props.subscribers"
        :key="subscriber.id"
        class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <div class="flex justify-between items-center mb-1">
          <span class="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
            {{ subscriber.email.split('@')[0] }}
          </span>
          <div class="flex items-center gap-2">
            <BaseBadge :variant="subscriber.confirmed ? 'success' : 'warning'">
              {{ subscriber.confirmed ? 'active' : 'unconfirmed' }}
            </BaseBadge>
            <BaseBadge v-if="subscriber.blacklisted" variant="danger">
              blacklisted
            </BaseBadge>
            <ActionButton icon="eye" @click="emit('view', subscriber.id)">
              View
            </ActionButton>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <p class="text-xs font-mono text-slate-500 dark:text-slate-400 break-all">{{ subscriber.email }}</p>
          <div class="flex items-center gap-4 mt-2 text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-tight">
            <span class="flex items-center gap-1">
              <BaseIcon name="list" class="w-3 h-3" />
              {{ subscriber.listCount }} Lists
            </span>
            <span class="ml-auto">
              {{ subscriber.createdAt }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'
import ActionButton from '../base/ActionButton.vue'

const props = defineProps({
  subscribers: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['view'])
</script>
