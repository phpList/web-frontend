<template>
  <div class="bg-white p-6 rounded-xl border border-slate-200  shadow-sm">
    <h3 class="text-lg font-semibold mb-4 text-slate-900">Recent Activity</h3>
    <div class="space-y-4">
      <div
        v-for="(activity, index) in activities"
        :key="index"
        class="flex items-start gap-3 pb-3 border-b border-slate-100  last:border-0"
      >
        <BaseIcon :name="activity.icon" class="w-4 h-4 mt-0.5" :class="activity.iconClass" />
        <div class="flex-1">
          <p class="text-sm font-medium text-slate-900">{{ activity.title }}</p>
          <p class="text-xs text-slate-500 font-mono">{{ activity.subtitle }}</p>
        </div>
        <span class="text-xs text-slate-400">{{ activity.time }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'

const activities = [
  {
    title: 'New subscriber',
    subtitle: 'alice.johnson@example.com',
    time: '5 minutes ago',
    icon: 'addUser',
    iconClass: 'text-emerald-600',
  },
  {
    title: 'Unsubscribed',
    subtitle: 'bob.smith@example.com',
    time: '1 hour ago',
    icon: 'removeUser',
    iconClass: 'text-red-600',
  },
  {
    title: 'Confirmed subscription',
    subtitle: 'carol.williams@example.com',
    time: '3 hours ago',
    icon: 'v',
    iconClass: 'text-blue-600',
  },
  {
    title: 'Bounced',
    subtitle: 'david.brown@example.com',
    time: '5 hours ago',
    icon: 'warning',
    iconClass: 'text-amber-600',
  },
]
</script>
