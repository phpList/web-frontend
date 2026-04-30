<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 class="text-base font-semibold text-slate-900">Bounces</h3>
        <div class="flex items-center gap-2">
          <label class="text-sm text-slate-600" for="bounce-status-filter">Status</label>
          <select
            id="bounce-status-filter"
            v-model="statusFilter"
            class="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            :disabled="isLoading"
          >
            <option value="identified">Processed</option>
            <option value="unidentified">Unidentified</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm hidden md:table">
          <thead class="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th class="px-6 py-4">ID</th>
              <th class="px-6 py-4">Date</th>
              <th class="px-6 py-4">Subscriber</th>
              <th class="px-6 py-4">Campaign</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Comment</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoading">
              <td colspan="6" class="px-6 py-8 text-center text-slate-500">Loading bounces...</td>
            </tr>
            <tr v-else-if="errorMessage">
              <td colspan="6" class="px-6 py-8 text-center text-red-600">{{ errorMessage }}</td>
            </tr>
            <tr v-else-if="paginatedBounces.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-slate-500">No bounces found.</td>
            </tr>
            <tr
              v-for="bounce in paginatedBounces"
              :key="bounce.id"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 text-slate-700 font-mono">#{{ bounce.id }}</td>
              <td class="px-6 py-4 text-slate-600">{{ bounce.formattedDate }}</td>
              <td class="px-6 py-4 text-slate-900 font-medium">{{ bounce.email }}</td>
              <td class="px-6 py-4 text-slate-700">{{ bounce.subject }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" :class="bounce.statusClass">
                  {{ bounce.status }}
                </span>
              </td>
              <td class="px-6 py-4 text-slate-600">{{ bounce.comment }}</td>
            </tr>
          </tbody>
        </table>

        <div class="block md:hidden divide-y divide-slate-100">
          <div
            v-if="isLoading"
            class="px-4 py-8 text-center text-slate-500 text-sm"
          >
            Loading bounces...
          </div>
          <div
            v-else-if="errorMessage"
            class="px-4 py-8 text-center text-red-600 text-sm"
          >
            {{ errorMessage }}
          </div>
          <div
            v-else-if="paginatedBounces.length === 0"
            class="px-4 py-8 text-center text-slate-500 text-sm"
          >
            No bounces found.
          </div>
          <div
            v-for="bounce in paginatedBounces"
            :key="`mobile-${bounce.id}`"
            class="p-4 space-y-2.5"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-slate-900">#{{ bounce.id }}</p>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-medium capitalize" :class="bounce.statusClass">
                {{ bounce.status }}
              </span>
            </div>
            <p class="text-xs text-slate-500">{{ bounce.formattedDate }}</p>
            <p class="text-sm font-medium text-slate-800">{{ bounce.email }}</p>
            <p class="text-sm text-slate-700">{{ bounce.subject }}</p>
            <p class="text-xs text-slate-600">{{ bounce.comment }}</p>
          </div>
        </div>
      </div>

      <div class="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
        <div class="text-center sm:text-left">
          Page <span class="font-medium text-slate-900">{{ currentPage }}</span>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
          <button
            type="button"
            class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            :disabled="!canGoPrevious"
            @click="previousPage"
          >
            Previous
          </button>
          <button
            type="button"
            class="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            :disabled="!canGoNext"
            @click="nextPage"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { bouncesClient } from '../../api'

const pageSize = 5
const currentPage = ref(1)
const currentCursor = ref(null)
const pageCursors = ref([null])
const bounces = ref([])
const hasMore = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const statusFilter = ref('identified')

const formatDate = (dateValue) => {
  if (!dateValue) return 'No date'

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return 'No date'

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

const getStatusClass = (status) => {
  const normalized = String(status ?? '').toLowerCase()

  if (normalized.includes('blacklist')) {
    return 'bg-purple-100 text-purple-700'
  }

  if (normalized.includes('retry') || normalized.includes('soft')) {
    return 'bg-amber-100 text-amber-700'
  }

  if (normalized.includes('process')) {
    return 'bg-emerald-100 text-emerald-700'
  }

  return 'bg-slate-100 text-slate-700'
}

const normalizedBounces = computed(() =>
    bounces.value.map((item) => ({
      id: item.id,
      formattedDate: formatDate(item.date),
      email: item.subscriber_email ?? 'Unknown email',
      subject: item.message_subject ?? 'No subject',
      comment: item.comment ?? 'No comment',
      status: item.status ?? 'unknown',
      statusClass: getStatusClass(item.status),
    }))
)

const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => hasMore.value)

const paginatedBounces = computed(() => normalizedBounces.value)

const previousPage = () => {
  if (!canGoPrevious.value) return

  currentPage.value -= 1
  currentCursor.value = pageCursors.value[currentPage.value - 1] ?? null
  loadBounces()
}

const nextPage = () => {
  if (!canGoNext.value) return

  currentPage.value += 1
  currentCursor.value = pageCursors.value[currentPage.value - 1] ?? null
  loadBounces()
}

const selectedStatus = computed(() => (
  statusFilter.value === 'unidentified' ? 'unidentified bounce' : 'identified-bounces'
))

const latestRequestId = ref(0)
const loadBounces = async () => {
  const requestId = ++latestRequestId.value
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await bouncesClient.list(
        currentCursor.value,
        pageSize,
        selectedStatus.value
    )

    if (requestId !== latestRequestId.value) {
      return
    }

    bounces.value = Array.isArray(response?.items) ? response.items : []
    hasMore.value = response?.pagination?.hasMore === true

    const nextCursor = response?.pagination?.nextCursor

    if (
        hasMore.value &&
        Number.isFinite(nextCursor) &&
        pageCursors.value[currentPage.value] === undefined
    ) {
      pageCursors.value[currentPage.value] = nextCursor
    }
  } catch (error) {
    if (requestId !== latestRequestId.value) {
      return
    }

    errorMessage.value = error?.message ?? 'Failed to load bounces.'
    bounces.value = []
    hasMore.value = false
  } finally {
    if (requestId === latestRequestId.value) {
      isLoading.value = false
    }
  }
}

watch(statusFilter, () => {
  currentPage.value = 1
  currentCursor.value = null
  pageCursors.value = [null]
  bounces.value = []
  hasMore.value = false
  loadBounces()
})

onMounted(() => {
  loadBounces()
})
</script>
