<template>
  <section class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-xl font-bold text-slate-900">Bounce Management</h2>
        <p class="mt-0.5 text-sm text-slate-500">
          Monitor, process and automate bounce handling across all campaigns
        </p>
      </div>
      <div class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
        <span class="w-2 h-2 rounded-full bg-emerald-500" />
        <span class="text-xs font-medium text-emerald-700">0.8% Bounce Rate</span>
      </div>
    </div>

    <div class="flex gap-1.5 overflow-x-auto no-scrollbar bg-slate-100/80 p-1.5 rounded-xl">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap flex-shrink-0"
        :class="activeTab === tab.id
          ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
          : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'"
        @click="activeTab = tab.id"
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
      <div class="space-y-6 pb-4">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-semibold text-slate-900">Bounce Rules</h3>
            <p class="text-xs text-slate-500 mt-0.5">
              Rules are evaluated top-to-bottom. Drag to reorder priority.
            </p>
          </div>
          <button type="button" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            New Rule
          </button>
        </div>

        <div class="bg-white rounded-xl border border-blue-200 shadow-sm p-6">
          <h4 class="font-semibold text-slate-900">Rule Builder</h4>
          <p class="text-xs text-slate-500 mt-1 mb-4">Start from a template</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="template in ruleTemplates"
              :key="template"
              type="button"
              class="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-slate-700"
            >
              {{ template }}
            </button>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="px-5 py-3.5 border-b border-slate-100 grid grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            <span class="col-span-1 hidden md:block">#</span>
            <span class="col-span-4 md:col-span-3">Rule</span>
            <span class="col-span-4 md:col-span-3">Pattern</span>
            <span class="col-span-4 md:col-span-2">Action</span>
            <span class="col-span-1 hidden md:block text-right">Hits</span>
            <span class="col-span-4 md:col-span-2 text-right">Status</span>
          </div>

          <div
            v-for="rule in bounceRules"
            :key="rule.id"
            class="grid grid-cols-12 gap-4 px-5 py-4 border-b last:border-b-0 border-slate-100 items-center hover:bg-slate-50"
          >
            <span class="col-span-1 hidden md:block text-xs font-mono text-slate-400">{{ rule.priority }}</span>
            <div class="col-span-4 md:col-span-3">
              <p class="text-sm font-medium text-slate-900">{{ rule.name }}</p>
              <p class="text-[10px] text-slate-400">{{ rule.type }}</p>
            </div>
            <p class="col-span-4 md:col-span-3 text-xs font-mono text-slate-500 truncate" :title="rule.pattern">{{ rule.pattern }}</p>
            <span class="col-span-4 md:col-span-2">
              <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="rule.actionClass">{{ rule.action }}</span>
            </span>
            <span class="col-span-1 hidden md:block text-right text-sm font-semibold text-slate-700">{{ rule.hits }}</span>
            <div class="col-span-4 md:col-span-2 flex justify-end items-center gap-2">
              <button
                type="button"
                class="text-xs px-2 py-1 rounded-md"
                :class="rule.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
              >
                {{ rule.enabled ? 'Enabled' : 'Disabled' }}
              </button>
            </div>
          </div>

          <div class="px-5 py-3.5 flex items-center justify-between text-xs text-slate-500">
            <span>{{ activeRulesCount }} of {{ bounceRules.length }} rules active</span>
            <button type="button" class="hover:text-slate-700 transition-colors">Export Rules</button>
          </div>
        </div>
      </div>
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
import { computed, ref } from 'vue'
import BounceOverview from './BounceOverview.vue'

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'processing', label: 'Processing' },
  { id: 'rules', label: 'Rules', count: 6 },
  { id: 'explorer', label: 'Explorer', count: 6 },
  { id: 'simulator', label: 'Simulator' },
]

const activeTab = ref('overview')

const currentTabLabel = computed(() => tabs.find((tab) => tab.id === activeTab.value)?.label || 'Panel')

const ruleTemplates = ['Mailbox Full', 'Invalid User', 'Domain Error', 'Spam Rejection', 'Vacation Reply']

const bounceRules = [
  {
    id: 1,
    priority: 1,
    name: 'Invalid User',
    type: 'Hard Bounce',
    pattern: 'user unknown|no such user|mailbox not found',
    action: 'unsubscribe',
    actionClass: 'bg-orange-100 text-orange-700',
    hits: 412,
    enabled: true,
  },
  {
    id: 2,
    priority: 2,
    name: 'Mailbox Full',
    type: 'Soft Bounce',
    pattern: 'mailbox full|over quota|storage limit',
    action: 'mark',
    actionClass: 'bg-blue-100 text-blue-700',
    hits: 289,
    enabled: true,
  },
  {
    id: 3,
    priority: 3,
    name: 'Spam Block',
    type: 'Hard Bounce',
    pattern: 'blocked|spam|blacklist',
    action: 'unsubscribe',
    actionClass: 'bg-orange-100 text-orange-700',
    hits: 178,
    enabled: true,
  },
  {
    id: 4,
    priority: 4,
    name: 'Domain Not Found',
    type: 'Hard Bounce',
    pattern: 'domain.* not found|no mx record',
    action: 'delete',
    actionClass: 'bg-red-100 text-red-700',
    hits: 94,
    enabled: true,
  },
  {
    id: 5,
    priority: 5,
    name: 'Temp Server Error',
    type: 'Soft Bounce',
    pattern: 'try again|temporary|service unavailable',
    action: 'mark',
    actionClass: 'bg-blue-100 text-blue-700',
    hits: 156,
    enabled: false,
  },
  {
    id: 6,
    priority: 6,
    name: 'Vacation Auto-reply',
    type: 'Auto-reply',
    pattern: 'out of office|on vacation|auto.reply',
    action: 'mark',
    actionClass: 'bg-blue-100 text-blue-700',
    hits: 43,
    enabled: true,
  },
]

const activeRulesCount = computed(() => bounceRules.filter((rule) => rule.enabled).length)
</script>
