<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Bounce Management</h2>
        <p class="mt-0.5 text-sm text-slate-500">
          Monitor, process and automate bounce handling across all campaigns
        </p>
      </div>
<!--      <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">-->
<!--        <span class="w-2 h-2 rounded-full bg-emerald-500" />-->
<!--        <span class="text-xs font-medium text-emerald-700">0.8% Bounce Rate</span>-->
<!--      </div>-->
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === tab.id
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'"
        @click="setActiveTab(tab.id)"
      >
        <span>{{ tab.label }}</span>
        <span
          v-if="tab.count"
          class="ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
          :class="activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'"
        >
          {{ tab.count }}
        </span>
      </button>
    </div>

    <template v-if="activeTab === 'overview'">
      <BounceOverview />
    </template>

    <template v-else-if="activeTab === 'rules'">
      <BounceRules />
    </template>

    <template v-else-if="activeTab === 'per'">
      <BouncePer />
    </template>

    <template v-else>
      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h3 class="text-base font-semibold text-slate-900">{{ currentTabLabel }}</h3>
        <p class="mt-1 text-sm text-slate-500">This panel matches the template navigation and can be expanded next.</p>
      </div>
    </template>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BounceOverview from './BounceOverview.vue'
import BounceRules from './BounceRules.vue'
import BouncePer from "./BouncePer.vue";

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'rules', label: 'Rules' },
  { id: 'per', label: 'Per List/Campaign' },
  { id: 'processing', label: 'Processing' },
  // { id: 'per_list', label: 'Per List' },
  // { id: 'per_campaign', label: 'Per Campaign' },
]

const route = useRoute()
const router = useRouter()

const defaultTabId = 'overview'
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
