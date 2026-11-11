<template>
  <div ref="root" class="relative" data-testid="admin-notifications">
    <button
      type="button"
      class="relative p-2 text-slate-100 hover:text-white dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      :aria-label="unread ? `Notifications (${unread} unread)` : 'Notifications'"
      aria-haspopup="true"
      :aria-expanded="open"
      data-testid="notifications-bell"
      @click="toggle"
    >
      <BaseIcon name="notification" inherit-color />
      <span
        v-if="unread"
        class="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-500 dark:ring-slate-950"
        data-testid="notifications-unread"
      />
    </button>

    <div
      v-if="open"
      class="fixed left-4 right-4 top-16 mt-2 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:w-96 max-h-[70vh] overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50"
      data-testid="notifications-dropdown"
    >
      <div class="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
        Notifications
      </div>
      <div v-if="!notifications.length" class="px-4 py-6 text-sm text-center text-slate-500 dark:text-slate-400">
        No notifications
      </div>
      <div v-else class="p-2 space-y-2">
        <div
          v-for="notification in notifications"
          :key="notification.code"
          :class="levelClasses[notification.level] || levelClasses.info"
          class="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
          role="alert"
        >
          <span>{{ notification.message }}</span>
          <button
            type="button"
            class="shrink-0 font-bold leading-none opacity-70 hover:opacity-100"
            aria-label="Dismiss notification"
            @click="dismiss(notification.code)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseIcon from '../base/BaseIcon.vue'
import { useAdminNotifications } from '../../composables/useAdminNotifications'

const { visible, dismiss, unreadCount, markAllRead, load } = useAdminNotifications()
const notifications = computed(() => visible())
const unread = computed(() => unreadCount())

const open = ref(false)
const root = ref(null)

const toggle = () => {
  open.value = !open.value
  if (open.value) {
    markAllRead()
  }
}

const closeOnOutsideClick = (event) => {
  if (root.value && !root.value.contains(event.target)) {
    open.value = false
  }
}

const closeOnEscape = (event) => {
  if (event.key === 'Escape') {
    open.value = false
  }
}

const levelClasses = {
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400',
  error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400',
}

onMounted(() => {
  document.addEventListener('click', closeOnOutsideClick)
  document.addEventListener('keydown', closeOnEscape)
  load()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', closeOnOutsideClick)
  document.removeEventListener('keydown', closeOnEscape)
})
</script>
