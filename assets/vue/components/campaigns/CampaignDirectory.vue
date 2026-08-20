<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Campaigns</h2>

      <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900 w-full sm:w-auto">
        <button
          v-for="option in filterOptions"
          :key="option.id"
          type="button"
          class="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
          :class="statusFilter === option.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
          @click="setFilter(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <th class="px-6 py-4">Subject</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4">Lists</th>
          <th class="px-6 py-4">Processed</th>
          <th class="px-6 py-4" v-if="showStatistics">Statistics</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
        <tr v-if="isLoading">
          <td :colspan="showStatistics ? 6 : 5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading campaigns...</td>
        </tr>

        <tr v-else-if="errorMessage">
          <td :colspan="showStatistics ? 6 : 5" class="px-6 py-8 text-center text-red-600 dark:text-red-400">{{ errorMessage }}</td>
        </tr>

        <tr v-else-if="paginatedCampaigns.length === 0">
          <td :colspan="showStatistics ? 6 : 5" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No campaigns for this filter.</td>
        </tr>

        <tr
          v-for="campaign in paginatedCampaigns"
          :key="campaign.id"
          class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ campaign.subject }}</td>
          <td class="px-6 py-4">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusClasses[campaign.statusKey] || statusClasses.unknown"
            >
              {{ campaign.statusLabel }}
            </span>
          </td>
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300 align-top">
            <p v-if="isListsLoading(campaign.id)" class="text-xs">Loading lists...</p>
            <p v-else-if="campaign.lists.length === 0" class="text-xs">-</p>
            <template v-else-if="campaign.lists.length <= 3">
              <p
                  v-for="list in campaign.lists"
                  :key="`${campaign.id}-${list.id}`"
                  class="text-xs leading-5"
              >
                <router-link
                    :to="`/lists/${list.id}/subscribers`"
                    class="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ list.name }}
                </router-link>
              </p>
            </template>
            <template v-else>
              <button
                  type="button"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  @click="toggleListsExpanded(campaign.id)"
              >
                {{ isListsExpanded(campaign.id) ? '▼' : '▶' }} {{ campaign.lists.length }} lists
              </button>
              <p
                  v-if="isListsExpanded(campaign.id)"
                  v-for="list in campaign.lists"
                  :key="`${campaign.id}-${list.id}`"
                  class="text-xs leading-5"
              >
                - <router-link
                    :to="`/lists/${list.id}/subscribers`"
                    class="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ list.name }}
                </router-link>
              </p>
            </template>
          </td>
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300 align-top">
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Started:</span> {{ campaign.startedAt }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Time to send:</span> {{ campaign.timeToSend }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Total:</span> {{ campaign.processedTotal }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Text:</span> {{ campaign.processedText }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">HTML:</span> {{ campaign.processedHtml }}</p>
          </td>
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300 align-top" v-if="showStatistics">
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Total views:</span> {{ campaign.totalViews }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Unique views:</span> {{ campaign.uniqueViews }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">Bounced:</span> {{ campaign.bounced }}</p>
          </td>
          <td class="px-6 py-4 align-top text-right">
            <div class="inline-flex flex-wrap justify-end gap-2">
              <button
                v-if="campaign.statusKey === 'draft'"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleDelete(campaign)"
              >
                <BaseIcon name="delete" class="w-3.5 h-3.5" />
                Delete
              </button>
              <button
                v-else-if="campaign.statusKey === 'active'"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleSuspend(campaign.id)"
              >
                <BaseIcon name="pause" class="w-3.5 h-3.5" />
                Suspend
              </button>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleRequeue(campaign.id)"
              >
                <BaseIcon name="start" class="w-3.5 h-3.5" />
                Requeue
              </button>
              <button
                v-if="campaign.statusKey === 'sent'"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors"
                :disabled="isActionLoading(campaign.id)"
                @click="handleCopyToDraft(campaign.id)"
              >
                <BaseIcon name="copy" class="w-3.5 h-3.5" />
                Copy to draft
              </button>
              <button
                  v-if="campaign.statusKey === 'draft'"
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  :disabled="isActionLoading(campaign.id)"
                  @click="handleEdit(campaign.id)"
              >
                <BaseIcon name="edit" class="w-3.5 h-3.5" />
                Edit
              </button>
              <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  :disabled="isActionLoading(campaign.id)"
                  @click="handleView(campaign.id)"
              >
                <BaseIcon name="eye" class="w-3.5 h-3.5" />
                View
              </button>
            </div>
            <p
              v-if="getActionFeedback(campaign.id)"
              class="mt-2 text-xs"
              :class="{
                'text-emerald-700 dark:text-emerald-400': getActionFeedback(campaign.id)?.type === 'success',
                'text-red-700 dark:text-red-400': getActionFeedback(campaign.id)?.type === 'error',
                'text-slate-500 dark:text-slate-400': getActionFeedback(campaign.id)?.type === 'info'
              }"
            >
              {{ getActionFeedback(campaign.id)?.message }}
            </p>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="block md:hidden divide-y divide-slate-100 dark:divide-slate-700">
        <div
          v-if="isLoading"
          class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
        >
          Loading campaigns...
        </div>

        <div
          v-else-if="errorMessage"
          class="px-4 py-8 text-center text-red-600 dark:text-red-400 text-sm"
        >
          {{ errorMessage }}
        </div>

        <div
          v-else-if="paginatedCampaigns.length === 0"
          class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
        >
          No campaigns for this filter.
        </div>

        <div
          v-for="campaign in paginatedCampaigns"
          :key="`mobile-${campaign.id}`"
          class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-semibold text-slate-900 dark:text-slate-100">{{ campaign.subject }}</p>
            </div>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
              :class="statusClasses[campaign.statusKey] || statusClasses.unknown"
            >
              {{ campaign.statusLabel }}
            </span>
          </div>

          <div class="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <p>
              <span class="font-medium text-slate-700 dark:text-slate-200">Lists: </span>
              <template v-if="campaign.lists.length > 0">
                <span
                    v-for="(list, index) in campaign.lists"
                    :key="list.id"
                >
                  <router-link
                      :to="`/lists/${list.id}/subscribers`"
                      class="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {{ list.name }}
                  </router-link>
                  <span v-if="index < campaign.lists.length - 1">, </span>
                </span>
              </template>
            </p>
            <p><span class="font-medium text-slate-700 dark:text-slate-200">Started:</span> {{ campaign.startedAt }}</p>
            <p><span class="font-medium text-slate-700 dark:text-slate-200">Time to send:</span> {{ campaign.timeToSend }}</p>
            <p><span class="font-medium text-slate-700 dark:text-slate-200">Processed:</span> {{ campaign.processedTotal }} (Text: {{ campaign.processedText }}, HTML: {{ campaign.processedHtml }})</p>
            <p v-if="showStatistics">
              <span class="font-medium text-slate-700 dark:text-slate-200">Statistics:</span>
              Total views {{ campaign.totalViews }}, Unique views {{ campaign.uniqueViews }}, Bounced {{ campaign.bounced }}
            </p>
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button
              v-if="campaign.statusKey === 'draft'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleDelete(campaign)"
            >
              <BaseIcon name="delete" class="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              v-else-if="campaign.statusKey === 'active'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleSuspend(campaign.id)"
            >
              <BaseIcon name="pause" class="w-3.5 h-3.5" />
              Suspend
            </button>
            <button
              v-else
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleRequeue(campaign.id)"
            >
              <BaseIcon name="start" class="w-3.5 h-3.5" />
              Requeue
            </button>
            <button
              v-if="campaign.statusKey === 'sent'"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10 transition-colors disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleCopyToDraft(campaign.id)"
            >
              <BaseIcon name="copy" class="w-3.5 h-3.5" />
              Copy to draft
            </button>
            <button
                v-if="campaign.statusKey === 'draft'"
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleEdit(campaign.id)"
            >
              <BaseIcon name="edit" class="w-3.5 h-3.5" />
              Edit
            </button>
            <button
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                :disabled="isActionLoading(campaign.id)"
                @click="handleView(campaign.id)"
            >
              <BaseIcon name="eye" class="w-3.5 h-3.5" />
              View
            </button>
          </div>
          <p
            v-if="getActionFeedback(campaign.id)"
            class="text-xs"
            :class="{
              'text-emerald-700 dark:text-emerald-400': getActionFeedback(campaign.id)?.type === 'success',
              'text-red-700 dark:text-red-400': getActionFeedback(campaign.id)?.type === 'error',
              'text-slate-500 dark:text-slate-400': getActionFeedback(campaign.id)?.type === 'info'
            }"
          >
            {{ getActionFeedback(campaign.id)?.message }}
          </p>
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
      <div class="text-center sm:text-left">
        Showing <span class="font-medium text-slate-900 dark:text-slate-100">{{ rangeStart }}</span>-<span class="font-medium text-slate-900 dark:text-slate-100">{{ rangeEnd }}</span> of <span class="font-medium text-slate-900 dark:text-slate-100">{{ totalForFilter }}</span>
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          type="button"
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          :disabled="!canGoPrevious"
          @click="previousPage"
        >
          Previous
        </button>
        <button
          type="button"
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          :disabled="!canGoNext"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>

    <ViewCampaignModal
        :is-view-modal-open="isViewModalOpen"
        :campaign="selectedCampaign"
        :is-view-loading="isViewLoading"
        :view-error-message="viewErrorMessage"
        :mailing-lists="mailingLists"
        :is-resending="isResending"
        :resend-error-message="resendErrorMessage"
        @close="closeViewModal"
        @resend="handleResend"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { campaignClient, fetchAllLists, listMessagesClient, statisticsClient } from '../../api'
import ViewCampaignModal from "./ViewCampaignModal.vue";
import BaseIcon from '../base/BaseIcon.vue'

const pageSize = 5
const route = useRoute()
const router = useRouter()
const rawCampaignsByPage = ref(new Map())
const cursorsByPage = ref(new Map([[1, null]]))
const totalForFilter = ref(0)
const listsByCampaignId = ref({})
const expandedListsByCampaignId = ref({})
const statisticsByCampaignId = ref({})
const loadingListsByCampaignId = ref({})
const actionLoadingByCampaignId = ref({})
const actionFeedbackByCampaignId = ref({})
const isLoading = ref(false)
const errorMessage = ref('')
const mailingLists = ref([])

const allowedStatuses = ['all', 'sent', 'active', 'draft']

const parseStatusQuery = (statusQuery) => {
  const value = Array.isArray(statusQuery) ? statusQuery[0] : statusQuery
  return allowedStatuses.includes(value) ? value : 'all'
}

const parsePageQuery = (pageQuery) => {
  const queryValue = Array.isArray(pageQuery) ? pageQuery[0] : pageQuery
  const page = Number.parseInt(String(queryValue ?? ''), 10)
  return Number.isNaN(page) || page < 1 ? 1 : page
}

const statusFilter = computed({
  get() {
    return parseStatusQuery(route.query.status)
  },
  async set(value) {
    const normalized = allowedStatuses.includes(value) ? value : 'all'
    const nextQuery = { ...route.query }

    if (normalized === 'all') {
      delete nextQuery.status
    } else {
      nextQuery.status = normalized
    }

    delete nextQuery.page

    await router.replace({ query: nextQuery })
  }
})

const currentPage = ref(parsePageQuery(route.query.page))
const isViewModalOpen = ref(false)
const isViewLoading = ref(false)
const selectedCampaign = ref(null)
const viewErrorMessage = ref('')
const isResending = ref(false)
const resendErrorMessage = ref('')
const showStatistics = ref(true)

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' }
]

const statusClasses = {
  sent: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  active: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
  draft: 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
  unknown: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
}

const activeStatuses = new Set(['submitted', 'prepared', 'inprocess'])

const resolveStatusKey = (statusRaw) => {
  if (statusRaw === 'sent') return 'sent'
  if (statusRaw === 'draft') return 'draft'
  if (activeStatuses.has(statusRaw)) return 'active'
  return 'unknown'
}

const toStatusLabel = (statusKey, statusRaw) => {
  if (statusKey === 'active') return 'Active'
  if (statusKey === 'sent') return 'Sent'
  if (statusKey === 'draft') return 'Draft'
  return statusRaw ? statusRaw.replace(/_/g, ' ') : 'Unknown'
}

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

const formatDuration = (fromValue, toValue) => {
  if (!fromValue || !toValue) return 'Not sent yet'
  const from = new Date(fromValue)
  const to = new Date(toValue)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return 'Unknown'
  }

  const diffSeconds = Math.floor((to.getTime() - from.getTime()) / 1000)

  const hours = Math.floor(diffSeconds / 3600)
  const minutes = Math.floor((diffSeconds % 3600) / 60)
  const seconds = diffSeconds % 60

  if (hours === 0 && minutes === 0) {
    return `${seconds}s`
  }

  if (hours === 0) {
    return `${minutes}m ${seconds}s`
  }

  return `${hours}h ${minutes}m`
}

const getCampaignLists = (campaignId) => listsByCampaignId.value[campaignId] || []
const getCampaignStatistics = (campaignId) => statisticsByCampaignId.value[campaignId] || {
  bounces: 0,
  sent: 0,
  uniqueViews: 0,
}

const fetchMailingLists = async () => {
  try {
    mailingLists.value = await fetchAllLists()
  } catch (error) {
    console.error('Failed to fetch mailing lists:', error)
    mailingLists.value = []
  }
}

const isListsLoading = (campaignId) => loadingListsByCampaignId.value[campaignId] === true
const isListsExpanded = (campaignId) => expandedListsByCampaignId.value[campaignId] === true
const toggleListsExpanded = (campaignId) => {
  expandedListsByCampaignId.value = {
    ...expandedListsByCampaignId.value,
    [campaignId]: !isListsExpanded(campaignId)
  }
}
const isActionLoading = (campaignId) => actionLoadingByCampaignId.value[campaignId] === true
const getActionFeedback = (campaignId) => actionFeedbackByCampaignId.value[campaignId] || null

const setActionLoading = (campaignId, value) => {
  actionLoadingByCampaignId.value = { ...actionLoadingByCampaignId.value, [campaignId]: value }
}

const setActionFeedback = (campaignId, message, type = 'info') => {
  actionFeedbackByCampaignId.value = { ...actionFeedbackByCampaignId.value, [campaignId]: { message, type } }
}

const handleRequeue = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Requeueing campaign...')

  try {
    await campaignClient.updateCampaignStatus(campaignId, 'submitted')
    setActionFeedback(campaignId, 'Campaign requeued.', 'success')
    await refreshCurrentPage()
  } catch (error) {
    console.error(`Failed to requeue campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || 'Failed to requeue campaign.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const handleSuspend = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Suspending campaign...')

  try {
    await campaignClient.updateCampaignStatus(campaignId, 'suspended')
    setActionFeedback(campaignId, 'Campaign suspended.', 'success')
    await refreshCurrentPage()
  } catch (error) {
    console.error(`Failed to suspend campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || 'Failed to suspend campaign.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const handleEdit = async (campaignId) => {
  await router.push({ name: 'campaign-edit', params: { campaignId } })
}

const handleDelete = async (campaign) => {
  if (isActionLoading(campaign.id)) return
  const isConfirmed = window.confirm(`Delete draft campaign #${campaign.id} - ${campaign.subject}?`)
  if (!isConfirmed) return

  setActionLoading(campaign.id, true)
  setActionFeedback(campaign.id, 'Deleting campaign...')

  try {
    await campaignClient.deleteCampaign(campaign.id)
    setActionFeedback(campaign.id, 'Campaign deleted.', 'success')
    // Delay the refresh so the success feedback is visible before the row disappears.
    setTimeout(() => {
      refreshCurrentPage()
    }, 1500)
  } catch (error) {
    console.error(`Failed to delete campaign ${campaign.id}:`, error)
    setActionFeedback(campaign.id, error?.message || 'Failed to delete campaign.', 'error')
  } finally {
    setActionLoading(campaign.id, false)
  }
}

const handleView = async (campaignId) => {
  isViewModalOpen.value = true
  isViewLoading.value = true
  viewErrorMessage.value = ''
  isResending.value = false
  resendErrorMessage.value = ''
  selectedCampaign.value = null

  try {
    selectedCampaign.value = await campaignClient.getCampaign(campaignId)
  } catch (error) {
    console.error(`Failed to load campaign ${campaignId}:`, error)
    viewErrorMessage.value = error?.message || 'Failed to load campaign.'
  } finally {
    isViewLoading.value = false
  }
}

const closeViewModal = () => {
  isViewModalOpen.value = false
  isViewLoading.value = false
  viewErrorMessage.value = ''
  isResending.value = false
  resendErrorMessage.value = ''
  selectedCampaign.value = null
}

const handleResend = async (listIds) => {
  const campaignId = selectedCampaign.value?.id
  if (!campaignId || !Array.isArray(listIds) || listIds.length === 0 || isResending.value) return

  const normalizedListIds = listIds
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

  if (normalizedListIds.length === 0) return

  isResending.value = true
  resendErrorMessage.value = ''

  try {
    await campaignClient.resendCampaign(campaignId, normalizedListIds)
    closeViewModal()
  } catch (error) {
    console.error(`Failed to resend campaign ${campaignId}:`, error)
    resendErrorMessage.value = error?.message || 'Failed to resend campaign.'
  } finally {
    isResending.value = false
  }
}

const handleCopyToDraft = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Creating draft copy...')

  try {
    await campaignClient.copyCampaign(campaignId)
    await refreshCurrentPage()
    setActionFeedback(campaignId, 'Created draft copy')
  } catch (error) {
    console.error(`Failed to copy campaign ${campaignId} to draft:`, error)
    setActionFeedback(campaignId, error?.message || 'Failed to create draft copy.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

// Maps a UI filter tab to the server-side `status` query param. 'active' groups several
// raw statuses, sent as a comma-separated list the backend matches via IN(...).
const statusParamForFilter = (filterId) => ({
  sent: 'sent',
  draft: 'draft',
  active: Array.from(activeStatuses).join(','),
}[filterId] ?? null)

// Bumped whenever the filter resets pagination, so a slow response from a since-abandoned
// filter can never overwrite the current view after a newer request has already landed.
let paginationGeneration = 0
const pageRequestsInFlight = new Map()

const resetPagination = () => {
  paginationGeneration += 1
  pageRequestsInFlight.clear()
  rawCampaignsByPage.value = new Map()
  cursorsByPage.value = new Map([[1, null]])
}

// Fetches and caches one page (5 campaigns) at a time, newest-first, filtered server-side by the
// active status tab - no more draining the entire campaign list into memory up front. This only
// fetches/caches; it never touches `currentPage` itself, so walking through intermediate pages
// (see loadUpToPage) can't leak a transient wrong page number out to the URL-syncing watchers.
const loadPage = (page) => {
  if (rawCampaignsByPage.value.has(page)) {
    return Promise.resolve()
  }

  const inFlight = pageRequestsInFlight.get(page)
  if (inFlight) return inFlight

  const generation = paginationGeneration
  const request = (async () => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const afterId = cursorsByPage.value.get(page) ?? null
      const response = await campaignClient.getCampaigns(
        afterId,
        pageSize,
        null,
        statusParamForFilter(statusFilter.value),
        'desc'
      )
      if (generation !== paginationGeneration) return

      const items = Array.isArray(response?.items) ? response.items : []

      rawCampaignsByPage.value.set(page, items)
      totalForFilter.value = Number(response?.pagination?.total ?? 0)

      if (response?.pagination?.hasMore) {
        cursorsByPage.value.set(page + 1, response?.pagination?.nextCursor ?? null)
      }
    } catch (error) {
      if (generation === paginationGeneration) {
        console.error(`Failed to load campaigns page ${page}:`, error)
        errorMessage.value = 'Failed to load campaigns.'
      }
    } finally {
      isLoading.value = false
      pageRequestsInFlight.delete(page)
    }
  })()

  pageRequestsInFlight.set(page, request)
  return request
}

// Navigates to a page, fetching/caching every page from 1 up to it along the way (cursors for
// unvisited pages aren't known ahead of time), then commits currentPage exactly once at the end.
const loadUpToPage = async (targetPage) => {
  for (let page = 1; page <= targetPage; page += 1) {
    await loadPage(page)
  }
  currentPage.value = targetPage
}

// A mutation can shift which campaigns fall on the current page and every page after it
// (but never on earlier pages), so drop those from the cache and refetch just the current one.
const invalidateFromCurrentPage = () => {
  const page = currentPage.value
  for (const key of [...rawCampaignsByPage.value.keys()]) {
    if (key >= page) rawCampaignsByPage.value.delete(key)
  }
  for (const key of [...cursorsByPage.value.keys()]) {
    if (key > page) cursorsByPage.value.delete(key)
  }
}

const refreshCurrentPage = async () => {
  invalidateFromCurrentPage()
  await loadPage(currentPage.value)
}

// Expensive (date formatting, statistics/lists lookups) — run only for the page being rendered.
const normalizeCampaign = (campaign) => {
  const statusRaw = (campaign?.messageMetadata?.status || '').toLowerCase()
  const statusKey = resolveStatusKey(statusRaw)
  const subject = campaign?.messageContent?.subject || `Campaign #${campaign.id}`
  const enteredAt = campaign?.messageMetadata?.entered || null
  const sentAt = campaign?.messageMetadata?.sent || null
  const statistics = getCampaignStatistics(campaign.id)
  const processedTotal = Number(campaign?.messageMetadata?.processed ?? 0)
  const isTextFormat = (campaign?.messageFormat?.sendFormat || '').toLowerCase() === 'text'
  const processedText = isTextFormat ? processedTotal : 0
  const processedHtml = isTextFormat ? 0 : processedTotal
  const lists = getCampaignLists(campaign.id)
  const sendStart = campaign?.messageMetadata?.sendStart || null

  return {
    id: campaign.id,
    subject,
    statusKey,
    statusLabel: toStatusLabel(statusKey, statusRaw),
    startedAt: formatDate(enteredAt),
    timeToSend: formatDuration(sendStart, sentAt),
    processedTotal,
    processedText,
    processedHtml,
    totalViews: Number(campaign?.messageMetadata?.views ?? 0),
    uniqueViews: Number(statistics?.uniqueViews ?? 0),
    bounced: Number(statistics?.bounces ?? 0),
    lists,
    listSummary: lists.length > 0 ? lists.map((item) => item.name).join(', ') : '-'
  }
}

const paginatedCampaigns = computed(() => (rawCampaignsByPage.value.get(currentPage.value) ?? []).map(normalizeCampaign))

const totalPages = computed(() => Math.max(1, Math.ceil(totalForFilter.value / pageSize)))
const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)

const rangeStart = computed(() => {
  if (totalForFilter.value === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const rangeEnd = computed(() => {
  if (totalForFilter.value === 0) return 0
  return Math.min(currentPage.value * pageSize, totalForFilter.value)
})

const setFilter = (filterId) => {
  statusFilter.value = filterId
}

const previousPage = async () => {
  if (canGoPrevious.value) {
    const target = currentPage.value - 1
    await loadPage(target)
    currentPage.value = target
  }
}

const nextPage = async () => {
  if (canGoNext.value) {
    const target = currentPage.value + 1
    await loadPage(target)
    currentPage.value = target
  }
}

// maxPages is a safety net against runaway loops, not a functional cap - it's far above any
// realistic dataset size, and hitting it logs a warning instead of silently truncating results.
const drainPaginated = async (fetchPage, onItems, { limit = 100, maxPages = 500 } = {}) => {
  let cursor = null
  let pages = 0

  while (pages < maxPages) {
    const response = await fetchPage(cursor, limit)
    const items = Array.isArray(response?.items) ? response.items : []
    onItems(items)

    const hasMore = Boolean(response?.pagination?.hasMore)
    const nextCursor = response?.pagination?.nextCursor ?? null
    // A cursor that doesn't advance (server pagination bug) would otherwise spin until maxPages,
    // hammering the API with identical requests - bail out the moment it stops moving forward.
    if (!hasMore || nextCursor === null || nextCursor === cursor) break

    cursor = nextCursor
    pages += 1
  }

  if (pages >= maxPages) {
    console.warn('Pagination guard reached; results may be incomplete.')
  }
}

const fetchCampaignStatistics = async () => {
  try {
    // Independent endpoints - written into separate maps so they can be fetched concurrently
    // without one drain's pagination racing the other's, then merged once both are done.
    const campaignStatsMap = {}
    const viewOpensSentByCampaignId = {}

    await Promise.all([
      drainPaginated(
        (cursor, limit) => statisticsClient.getCampaignStatistics(cursor, limit),
        (items) => {
          items.forEach((item) => {
            campaignStatsMap[item.campaignId] = {
              bounces: Number(item.bounces ?? 0),
              sent: Number(item.sent ?? 0),
              uniqueViews: Number(item.uniqueViews ?? 0),
            }
          })
        },
        { limit: 100 }
      ),
      drainPaginated(
        (cursor, limit) => statisticsClient.getStatisticsOfViewOpens(cursor, limit),
        (items) => {
          items.forEach((item) => {
            viewOpensSentByCampaignId[item.campaignId] = Number(item.sent ?? 0)
          })
        },
        { limit: 100 }
      )
    ])

    const statisticsMap = { ...campaignStatsMap }
    Object.entries(viewOpensSentByCampaignId).forEach(([campaignId, sent]) => {
      const existing = statisticsMap[campaignId] ?? { bounces: 0, sent: 0, uniqueViews: 0 }
      statisticsMap[campaignId] = { ...existing, sent }
    })

    statisticsByCampaignId.value = statisticsMap
    showStatistics.value = true
  } catch (error) {
    if (
        error?.name === 'AuthorizationException' ||
        error?.code === 'AuthorizationException' ||
        error?.status === 403
    ) {
      showStatistics.value = false
      statisticsByCampaignId.value = {}
      return
    }

    throw error
  }
}

const fetchListsForVisibleCampaigns = async () => {
  const pending = paginatedCampaigns.value
    .map((campaign) => campaign.id)
    .filter((campaignId) => !(campaignId in listsByCampaignId.value) && !loadingListsByCampaignId.value[campaignId])

  if (pending.length === 0) return

  pending.forEach((campaignId) => {
    loadingListsByCampaignId.value = { ...loadingListsByCampaignId.value, [campaignId]: true }
  })

  const results = await Promise.allSettled(
    pending.map(async (campaignId) => {
      const response = await listMessagesClient.getListsByMessage(campaignId)
      return {
        campaignId,
        lists: Array.isArray(response?.items) ? response.items : []
      }
    })
  )

  const nextLists = { ...listsByCampaignId.value }
  const nextLoading = { ...loadingListsByCampaignId.value }

  results.forEach((result, index) => {
    const campaignId = pending[index]
    if (result.status === 'fulfilled') {
      nextLists[campaignId] = result.value.lists
    } else {
      nextLists[campaignId] = []
      console.error(`Failed to load lists for campaign ${campaignId}:`, result.reason)
    }
    nextLoading[campaignId] = false
  })

  listsByCampaignId.value = nextLists
  loadingListsByCampaignId.value = nextLoading
}

onMounted(() => {
  loadUpToPage(currentPage.value)
  fetchCampaignStatistics()
  fetchMailingLists()
})

watch(statusFilter, () => {
  resetPagination()
  loadPage(1).then(() => {
    currentPage.value = 1
  })
})

watch(totalPages, (pages) => {
  if (isLoading.value) return
  if (currentPage.value > pages) {
    loadPage(pages).then(() => {
      currentPage.value = pages
    })
  }
})

watch(() => route.query.page, (pageQuery) => {
  const nextPage = parsePageQuery(pageQuery)
  if (nextPage !== currentPage.value) {
    loadUpToPage(nextPage)
  }
})

watch(currentPage, async (page) => {
  const normalizedPage = isLoading.value
    ? Math.max(1, page)
    : Math.min(Math.max(1, page), totalPages.value)
  if (normalizedPage !== page) {
    currentPage.value = normalizedPage
    return
  }

  const currentQueryPage = Array.isArray(route.query.page) ? route.query.page[0] : route.query.page
  const desiredQueryPage = normalizedPage > 1 ? String(normalizedPage) : undefined
  if (currentQueryPage === desiredQueryPage) {
    return
  }

  const nextQuery = { ...route.query }
  if (desiredQueryPage !== undefined) {
    nextQuery.page = desiredQueryPage
  } else {
    delete nextQuery.page
  }

  await router.replace({
    query: nextQuery
  })
})

watch(paginatedCampaigns, () => {
  fetchListsForVisibleCampaigns()
}, { immediate: true })
</script>
