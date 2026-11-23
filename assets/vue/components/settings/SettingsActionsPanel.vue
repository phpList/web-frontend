<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ t('settings.title') }}</h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-350">{{ t('settings.subtitle') }}</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0"
        :class="activeTab === tab.id
          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-300 dark:border-slate-600'
          : 'text-slate-500 dark:text-slate-350 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'"
        @click="setActiveTab(tab.id)"
      >
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <template v-if="activeTab === 'configs'">
      <SettingsConfigs />
    </template>

    <template v-else-if="activeTab === 'admins'">
      <SettingsAdmins />
    </template>

    <template v-else-if="activeTab === 'admin_attributes'">
      <SettingsAdminAttributes />
    </template>

    <template v-else-if="activeTab === 'subscriber_attributes'">
      <SettingsSubscriberAttributes />
    </template>

    <template v-else>
      <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 p-6">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ currentTabLabel }}</h3>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-350">{{ t('settings.under_construction') }}</p>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import SettingsConfigs from './SettingsConfigs.vue'
import SettingsAdmins from './SettingsAdmins.vue'
import SettingsAdminAttributes from './SettingsAdminAttributes.vue'
import SettingsSubscriberAttributes from "./SettingsSubscriberAttributes.vue";

const { t } = useI18n()

const tabs = computed(() => [
  { id: 'configs', label: t('settings.tabs.configs') },
  { id: 'admins', label: t('settings.tabs.admins') },
  { id: 'admin_attributes', label: t('settings.tabs.admin_attributes') },
  { id: 'subscriber_attributes', label: t('settings.tabs.subscriber_attributes') },
])

const route = useRoute()
const router = useRouter()

const defaultTabId = 'configs'
const tabIds = new Set(tabs.value.map((tab) => tab.id))

const normalizeTabId = (tabId) => (typeof tabId === 'string' && tabIds.has(tabId) ? tabId : defaultTabId)

const activeTab = ref(normalizeTabId(route.query.tab))

const setActiveTab = (tabId) => {
  activeTab.value = normalizeTabId(tabId)
}

watch(
  () => route.query.tab,
  (tabId) => {
    const normalizedTabId = normalizeTabId(tabId)
    if (activeTab.value !== normalizedTabId) {
      activeTab.value = normalizedTabId
    }
  }
)

watch(
  activeTab,
  (tabId) => {
    if (route.query.tab === tabId) {
      return
    }

    router.replace({
      query: {
        ...route.query,
        tab: tabId,
      },
    })
  },
  { immediate: true }
)

const currentTabLabel = computed(() => tabs.value.find((tab) => tab.id === activeTab.value)?.label || t('settings.panel'))
</script>

