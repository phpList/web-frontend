<template>
  <div class="bg-white rounded-xl border border-slate-200  shadow-sm overflow-hidden">
    <div class="p-6 border-b border-slate-200 ">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 class="text-xl font-bold text-slate-900 ">Subscriber Directory</h2>
        <div class="flex gap-2 w-full sm:w-auto">
          <div class="relative flex-1 sm:w-64">
            <BaseIcon name="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              placeholder="Search subscribers..."
              class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200  rounded-lg bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              type="text"
            >
          </div>
          <button class="p-2 border border-slate-200  rounded-lg hover:bg-slate-50 transition-colors">
            <BaseIcon name="filter" class="w-4 h-4 text-slate-500" />
          </button>
          <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
            <BaseIcon name="upload" class="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>
      <SubscriberFilters />
    </div>
    <SubscriberTable />
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import SubscriberFilters from './SubscriberFilters.vue'
import SubscriberTable from './SubscriberTable.vue'
</script>
