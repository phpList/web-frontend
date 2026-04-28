<template>
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

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="hidden md:grid px-5 py-3.5 border-b border-slate-100 grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span class="col-span-1 hidden md:block">#</span>
        <span class="col-span-4 md:col-span-3">Rule</span>
        <span class="col-span-4 md:col-span-3">Pattern</span>
        <span class="col-span-4 md:col-span-2">Action</span>
        <span class="col-span-1 hidden md:block text-right">Hits</span>
        <span class="col-span-4 md:col-span-2 text-right">Status</span>
      </div>

      <div
          v-for="rule in allBounceRules"
          :key="rule.id"
          class="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
      >
        <div class="md:hidden px-5 py-4 space-y-1.5 text-sm">
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Rule -</span> <span class="text-slate-900 min-w-0 break-words">{{ rule.comment }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Pattern -</span> <span class="font-mono text-xs text-slate-500 min-w-0 break-all">{{ rule.regex }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Action -</span> <span :class="rule.actionClass" class="text-xs font-medium min-w-0 break-words">{{ rule.action }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Hits -</span> <span class="text-slate-700 min-w-0 break-words">{{ rule.count }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Status -</span> <span class="capitalize min-w-0 break-words">{{ rule.status }}</span></p>
        </div>

        <div class="hidden md:grid md:grid-cols-12 md:gap-4 px-5 py-4 items-center">
          <span class="col-span-1 text-xs font-mono text-slate-400">{{ rule.list_order }}</span>
          <div class="col-span-3">
          <p class="text-sm font-medium text-slate-900">{{ rule.comment }}</p>
          </div>
          <p class="col-span-3 text-xs font-mono text-slate-500" :title="rule.pattern">{{ rule.regex }}</p>
          <span class="col-span-2">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="rule.actionClass">{{ rule.action }}</span>
          </span>
          <span class="col-span-1 text-right text-sm font-semibold text-slate-700">{{ rule.count }}</span>
          <div class="col-span-2 flex justify-end items-center gap-2">
            <button
                type="button"
                class="text-xs px-2 py-1 rounded-md"
                :class="rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ rule.status }}
            </button>
          </div>
        </div>
      </div>

<!--      <div class="px-5 py-3.5 flex items-center justify-between text-xs text-slate-500">-->
<!--        <span>{{ activeRulesCount }} of {{ bounceRules.length }} rules active</span>-->
<!--        <button type="button" class="hover:text-slate-700 transition-colors">Export Rules</button>-->
<!--      </div>-->
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import { bouncesClient} from "../../api";

const allBounceRules = ref([])

const loadBounceRules = async () => {
  const bounceRules = await bouncesClient.listRegex()
  if (!bounceRules) {
    console.error('Failed to fetch bounce rules')
  }
  allBounceRules.value = bounceRules
}

onMounted(() => {
  loadBounceRules()
})
</script>
