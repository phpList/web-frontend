<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Settings</h2>
        <p class="mt-0.5 text-sm text-slate-500">Application configuration and admin management</p>
      </div>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0"
        :class="activeTab === tab.id
          ? 'bg-white text-slate-900 shadow-sm border border-slate-300'
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'"
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

    <template v-else>
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h3 class="text-base font-semibold text-slate-900">{{ currentTabLabel }}</h3>
        <p class="mt-1 text-sm text-slate-500">This panel is under construction.</p>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsConfigs from './SettingsConfigs.vue'
import SettingsAdmins from './SettingsAdmins.vue'
import SettingsAdminAttributes from './SettingsAdminAttributes.vue'

const tabs = [
  { id: 'configs', label: 'Configs' },
  { id: 'admins', label: 'Admins' },
  { id: 'admin_attributes', label: 'Admin Attributes' },
]

const route = useRoute()
const router = useRouter()

const defaultTabId = 'configs'
const tabIds = new Set(tabs.map((tab) => tab.id))

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

const currentTabLabel = computed(() => tabs.find((tab) => tab.id === activeTab.value)?.label || 'Panel')
</script>

