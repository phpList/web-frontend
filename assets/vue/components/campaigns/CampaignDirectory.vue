<template>
  <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-xl font-bold text-slate-900">Campaigns</h2>

      <div class="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 w-full sm:w-auto">
        <button
          v-for="option in filterOptions"
          :key="option.id"
          type="button"
          class="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
          :class="statusFilter === option.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="setFilter(option.id)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 text-slate-500 font-medium">
        <tr>
          <th class="px-6 py-4">Subject</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4">Lists</th>
          <th class="px-6 py-4">Processed</th>
          <th class="px-6 py-4">Statistics</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>

        <tbody class="divide-y divide-slate-200">
        <tr v-if="isLoading">
          <td colspan="6" class="px-6 py-8 text-center text-slate-500">Loading campaigns...</td>
        </tr>

        <tr v-else-if="errorMessage">
          <td colspan="6" class="px-6 py-8 text-center text-red-600">{{ errorMessage }}</td>
        </tr>

        <tr v-else-if="paginatedCampaigns.length === 0">
          <td colspan="6" class="px-6 py-8 text-center text-slate-500">No campaigns for this filter.</td>
        </tr>

        <tr
          v-for="campaign in paginatedCampaigns"
          :key="campaign.id"
          class="hover:bg-slate-50 transition-colors"
        >
          <td class="px-6 py-4 font-medium text-slate-900">{{ campaign.subject }}</td>
          <td class="px-6 py-4">
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium"
              :class="statusClasses[campaign.statusKey] || statusClasses.unknown"
            >
              {{ campaign.statusLabel }}
            </span>
          </td>
          <td class="px-6 py-4 text-slate-600 align-top">
            <p v-if="isListsLoading(campaign.id)" class="text-xs">Loading lists...</p>
            <p v-else-if="campaign.lists.length === 0" class="text-xs">-</p>
            <p
                v-for="list in campaign.lists"
                :key="`${campaign.id}-${list.id}`"
                class="text-xs leading-5"
            >
              <router-link
                  :to="`/lists/${list.id}/subscribers`"
                  class="text-blue-600 hover:underline"
              >
                {{ list.name }}
              </router-link>
            </p>
          </td>
          <td class="px-6 py-4 text-slate-600 align-top">
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Started:</span> {{ campaign.startedAt }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Time to send:</span> {{ campaign.timeToSend }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Total:</span> {{ campaign.processedTotal }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Text:</span> {{ campaign.processedText }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">HTML:</span> {{ campaign.processedHtml }}</p>
          </td>
          <td class="px-6 py-4 text-slate-600 align-top">
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Total views:</span> {{ campaign.totalViews }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Unique views:</span> {{ campaign.uniqueViews }}</p>
            <p class="text-xs leading-5"><span class="font-medium text-slate-700">Bounced:</span> {{ campaign.bounced }}</p>
          </td>
          <td class="px-6 py-4 align-top text-right">
            <div class="inline-flex flex-wrap justify-end gap-2">
              <button
                v-if="campaign.statusKey === 'draft'"
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleDelete(campaign)"
              >
                Delete
              </button>
              <button
                v-else-if="campaign.statusKey === 'active'"
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleSuspend(campaign.id)"
              >
                Suspend
              </button>
              <button
                v-else
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleRequeue(campaign.id)"
              >
                Requeue
              </button>
              <button
                v-if="campaign.statusKey === 'sent'"
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleCopyToDraft(campaign.id)"
              >
                Copy to draft
              </button>
              <button
                  v-if="campaign.statusKey === 'draft'"
                  type="button"
                  class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 disabled:opacity-50"
                  :disabled="isActionLoading(campaign.id)"
                  @click="handleEdit(campaign.id)"
              >
                Edit
              </button>
              <button
                  type="button"
                  class="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                  :disabled="isActionLoading(campaign.id)"
                  @click="handleView(campaign.id)"
              >
                View
              </button>
            </div>
            <p
              v-if="getActionFeedback(campaign.id)"
              class="mt-2 text-xs"
              :class="{
                'text-emerald-700': getActionFeedback(campaign.id)?.type === 'success',
                'text-red-700': getActionFeedback(campaign.id)?.type === 'error',
                'text-slate-500': getActionFeedback(campaign.id)?.type === 'info'
              }"
            >
              {{ getActionFeedback(campaign.id)?.message }}
            </p>
          </td>
        </tr>
        </tbody>
      </table>

      <div class="block md:hidden divide-y divide-slate-100">
        <div
          v-if="isLoading"
          class="px-4 py-8 text-center text-slate-500 text-sm"
        >
          Loading campaigns...
        </div>

        <div
          v-else-if="errorMessage"
          class="px-4 py-8 text-center text-red-600 text-sm"
        >
          {{ errorMessage }}
        </div>

        <div
          v-else-if="paginatedCampaigns.length === 0"
          class="px-4 py-8 text-center text-slate-500 text-sm"
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
              <p class="font-semibold text-slate-900">{{ campaign.subject }}</p>
            </div>
            <span
              class="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
              :class="statusClasses[campaign.statusKey] || statusClasses.unknown"
            >
              {{ campaign.statusLabel }}
            </span>
          </div>

          <div class="text-xs text-slate-600 space-y-1">
            <p>
              <span class="font-medium text-slate-700">Lists: </span>
              <template v-if="campaign.lists.length > 0">
                <span
                    v-for="(list, index) in campaign.lists"
                    :key="list.id"
                >
                  <router-link
                      :to="`/lists/${list.id}/subscribers`"
                      class="text-blue-600 hover:underline"
                  >
                    {{ list.name }}
                  </router-link>
                  <span v-if="index < campaign.lists.length - 1">, </span>
                </span>
              </template>
            </p>
            <p><span class="font-medium text-slate-700">Started:</span> {{ campaign.startedAt }}</p>
            <p><span class="font-medium text-slate-700">Time to send:</span> {{ campaign.timeToSend }}</p>
            <p><span class="font-medium text-slate-700">Processed:</span> {{ campaign.processedTotal }} (Text: {{ campaign.processedText }}, HTML: {{ campaign.processedHtml }})</p>
            <p><span class="font-medium text-slate-700">Statistics:</span> Total views {{ campaign.totalViews }}, Unique views {{ campaign.uniqueViews }}, Bounced {{ campaign.bounced }}</p>
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button
              v-if="campaign.statusKey === 'draft'"
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleDelete(campaign)"
            >
              Delete
            </button>
            <button
              v-else-if="campaign.statusKey === 'active'"
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-md hover:bg-rose-100 disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleSuspend(campaign.id)"
            >
              Suspend
            </button>
            <button
              v-else
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleRequeue(campaign.id)"
            >
              Requeue
            </button>
            <button
              v-if="campaign.statusKey === 'set'"
              type="button"
              class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:bg-slate-200 disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleCopyToDraft(campaign.id)"
            >
              Copy to draft
            </button>
            <button
                v-if="campaign.statusKey === 'draft'"
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleEdit(campaign.id)"
            >
              Edit
            </button>
            <button
                type="button"
                class="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleView(campaign.id)"
            >
              View
            </button>
          </div>
          <p
            v-if="getActionFeedback(campaign.id)"
            class="text-xs"
            :class="{
              'text-emerald-700': getActionFeedback(campaign.id)?.type === 'success',
              'text-red-700': getActionFeedback(campaign.id)?.type === 'error',
              'text-slate-500': getActionFeedback(campaign.id)?.type === 'info'
            }"
          >
            {{ getActionFeedback(campaign.id)?.message }}
          </p>
        </div>
      </div>
    </div>

    <div class="p-4 sm:p-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
      <div class="text-center sm:text-left">
        Showing <span class="font-medium text-slate-900">{{ rangeStart }}</span>-<span class="font-medium text-slate-900">{{ rangeEnd }}</span> of <span class="font-medium text-slate-900">{{ filteredCampaigns.length }}</span>
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

    <ViewCampaignModal
        :is-view-modal-open="isViewModalOpen"
        :campaign="selectedCampaign"
        :is-view-loading="isViewLoading"
        :view-error-message="viewErrorMessage"
        :mailing-lists="mailingLists"
        @close="closeViewModal"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import apiClient, {campaignClient, listClient, listMessagesClient, statisticsClient} from '../../api'
import ViewCampaignModal from "./ViewCampaignModal.vue";

const pageSize = 5
const route = useRoute()
const router = useRouter()
const allCampaigns = ref([])
const listsByCampaignId = ref({})
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
  const page = Number.parseInt(String(queryValue ?? ''), pageSize)
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

const filterOptions = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' }
]

const statusClasses = {
  sent: 'bg-emerald-100 text-emerald-700',
  active: 'bg-blue-100 text-blue-700',
  draft: 'bg-slate-100 text-slate-700',
  unknown: 'bg-amber-100 text-amber-700'
}

const activeStatuses = new Set(['active', 'submitted', 'prepared', 'inprocess', 'requeued', 'scheduled'])

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
    const response = await listClient.getLists(0, 1000)
    mailingLists.value = Array.isArray(response?.items) ? response.items : []
  } catch (error) {
    console.error('Failed to fetch mailing lists:', error)
    mailingLists.value = []
  } finally {
    isLoading.value = false
  }
}

const isListsLoading = (campaignId) => loadingListsByCampaignId.value[campaignId] === true
const isActionLoading = (campaignId) => actionLoadingByCampaignId.value[campaignId] === true
const getActionFeedback = (campaignId) => actionFeedbackByCampaignId.value[campaignId] || null

const setActionLoading = (campaignId, value) => {
  actionLoadingByCampaignId.value = { ...actionLoadingByCampaignId.value, [campaignId]: value }
}

const setActionFeedback = (campaignId, message, type = 'info') => {
  actionFeedbackByCampaignId.value = { ...actionFeedbackByCampaignId.value, [campaignId]: { message, type } }
}

const isAuthenticationError = (error) => error?.name === 'AuthenticationException' || error?.status === 401

const buildCampaignPayload = (campaign, status = 'draft') => {
  const schedule = campaign?.messageSchedule || {}
  const format = campaign?.messageFormat || {}
  const options = campaign?.messageOptions || {}

  const payload = {
    content: {
      subject: campaign?.messageContent?.subject || `Copy of campaign #${campaign.id}`,
      text: campaign?.messageContent?.text || '',
      text_message: campaign?.messageContent?.textMessage || '',
      footer: campaign?.messageContent?.footer || ''
    },
    format: {
      html_formated: Boolean(format?.htmlFormated),
      send_format: format?.sendFormat || 'html',
      format_options: Array.isArray(format?.formatOptions) && format.formatOptions.length > 0
        ? format.formatOptions
        : [format?.sendFormat || 'html']
    },
    metadata: {
      status
    },
    schedule: {
      embargo: schedule?.embargo || new Date().toISOString()
    },
    options: {
      from_field: options?.fromField || '',
      to_field: options?.toField || '',
      reply_to: options?.replyTo || '',
      user_selection: options?.userSelection || ''
    }
  }

  if (campaign?.template?.id) payload.template_id = campaign.template.id
  if (schedule?.repeatInterval !== null && schedule?.repeatInterval !== undefined) {
    payload.schedule.repeat_interval = Number(schedule.repeatInterval)
  }
  if (schedule?.repeatUntil) payload.schedule.repeat_until = schedule.repeatUntil
  if (schedule?.requeueInterval !== null && schedule?.requeueInterval !== undefined) {
    payload.schedule.requeue_interval = Number(schedule.requeueInterval)
  }
  if (schedule?.requeueUntil) payload.schedule.requeue_until = schedule.requeueUntil

  return payload
}

const handleRequeue = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Requeueing campaign...')

  try {
    await apiClient.post(`campaigns/${campaignId}/send`)
    setActionFeedback(campaignId, 'Campaign requeued.', 'success')
    await fetchCampaigns()
  } catch (error) {
    console.error(`Failed to requeue campaign ${campaignId}:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
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
    const sourceCampaign = await campaignClient.getCampaign(campaignId)
    await campaignClient.updateCampaign(campaignId, buildCampaignPayload(sourceCampaign, 'suspended'))
    setActionFeedback(campaignId, 'Campaign suspended.', 'success')
    await fetchCampaigns()
  } catch (error) {
    console.error(`Failed to suspend campaign ${campaignId}:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    setActionFeedback(campaignId, error?.message || 'Failed to suspend campaign.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const handleEdit = async (campaignId) => {
  await handleView(campaignId)
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
    await fetchCampaigns()
  } catch (error) {
    console.error(`Failed to delete campaign ${campaign.id}:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    setActionFeedback(campaign.id, error?.message || 'Failed to delete campaign.', 'error')
  } finally {
    setActionLoading(campaign.id, false)
  }
}

const handleView = async (campaignId) => {
  isViewModalOpen.value = true
  isViewLoading.value = true
  viewErrorMessage.value = ''
  selectedCampaign.value = null

  try {
    selectedCampaign.value = await campaignClient.getCampaign(campaignId)
  } catch (error) {
    console.error(`Failed to load campaign ${campaignId}:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    viewErrorMessage.value = error?.message || 'Failed to load campaign.'
  } finally {
    isViewLoading.value = false
  }
}

const closeViewModal = () => {
  isViewModalOpen.value = false
  isViewLoading.value = false
  viewErrorMessage.value = ''
  selectedCampaign.value = null
}

const handleCopyToDraft = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Creating draft copy...')

  try {
    const sourceCampaign = await campaignClient.getCampaign(campaignId)
    const sourceListsResponse = await listMessagesClient.getListsByMessage(campaignId)
    const sourceLists = Array.isArray(sourceListsResponse?.items) ? sourceListsResponse.items : []

    const createdCampaign = await campaignClient.createCampaign(buildCampaignPayload(sourceCampaign, 'draft'))
    const createdCampaignId = createdCampaign?.id
    if (!createdCampaignId) {
      throw new Error('Draft campaign was created without an id.')
    }

    let failedAssociations = 0
    if (createdCampaignId && sourceLists.length > 0) {
      const associationResults = await Promise.allSettled(
        sourceLists
          .filter((list) => list?.id)
          .map((list) => listMessagesClient.associateMessageWithList(createdCampaignId, list.id))
      )
      failedAssociations = associationResults.filter((result) => result.status === 'rejected').length
    }

    if (failedAssociations > 0) {
      setActionFeedback(
        campaignId,
        `Draft copy created (#${createdCampaignId}), but ${failedAssociations} list association(s) failed.`,
        'info'
      )
    } else {
      setActionFeedback(campaignId, `Draft copy created (#${createdCampaignId}).`, 'success')
    }
    await fetchCampaigns()
  } catch (error) {
    console.error(`Failed to copy campaign ${campaignId} to draft:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    setActionFeedback(campaignId, error?.message || 'Failed to create draft copy.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const normalizedCampaigns = computed(() =>
    allCampaigns.value.map((campaign) => {
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
    })
)

const filteredCampaigns = computed(() => {
  if (statusFilter.value === 'all') return normalizedCampaigns.value
  return normalizedCampaigns.value.filter((campaign) => campaign.statusKey === statusFilter.value)
})

const totalPages = computed(() => {
  const pages = Math.ceil(filteredCampaigns.value.length / pageSize)
  return Math.max(1, pages)
})

const paginatedCampaigns = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredCampaigns.value.slice(start, end)
})

const canGoPrevious = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)

const rangeStart = computed(() => {
  if (filteredCampaigns.value.length === 0) return 0
  return (currentPage.value - 1) * pageSize + 1
})

const rangeEnd = computed(() => {
  if (filteredCampaigns.value.length === 0) return 0
  return Math.min(currentPage.value * pageSize, filteredCampaigns.value.length)
})

const setFilter = async (filterId) => {
  currentPage.value = 1
  statusFilter.value = filterId
}

const previousPage = () => {
  if (canGoPrevious.value) {
    currentPage.value -= 1
  }
}

const nextPage = () => {
  if (canGoNext.value) {
    currentPage.value += 1
  }
}

const fetchAllCampaigns = async () => {
  let cursor = null
  let guard = 0
  const campaigns = []

  while (guard < 200) {
    const response = await campaignClient.getCampaigns(cursor, 50)
    const items = Array.isArray(response?.items) ? response.items : []
    campaigns.push(...items)

    const hasMore = Boolean(response?.pagination?.hasMore)
    const nextCursor = response?.pagination?.nextCursor ?? null
    if (!hasMore || nextCursor === null) {
      break
    }

    cursor = nextCursor
    guard += 1
  }

  campaigns.sort((a, b) => Number(b.id) - Number(a.id))
  return campaigns
}

const fetchCampaignStatistics = async () => {
  const statisticsMap = {}

  let cursor = null
  let guard = 0

  // Base campaign statistics
  while (guard < 200) {
    const response = await statisticsClient.getCampaignStatistics(cursor, 100)
    const items = Array.isArray(response?.items) ? response.items : []

    items.forEach((item) => {
      statisticsMap[item.campaignId] = {
        bounces: Number(item.bounces ?? 0),
        sent: Number(item.sent ?? 0),
        uniqueViews: Number(item.uniqueViews ?? 0),
      }
    })

    const hasMore = Boolean(response?.pagination?.hasMore)
    const nextCursor = response?.pagination?.nextCursor ?? null
    if (!hasMore || nextCursor === null) break

    cursor = nextCursor
    guard += 1
  }

  cursor = null
  guard = 0

  // View-open statistics
  while (guard < 200) {
    const response = await statisticsClient.getStatisticsOfViewOpens(cursor, 100)
    const items = Array.isArray(response?.items) ? response.items : []

    items.forEach((item) => {
      const existing = statisticsMap[item.campaignId] || {
        bounces: 0,
        sent: 0,
        uniqueViews: 0,
      }

      statisticsMap[item.campaignId] = {
        ...existing,
        // only merge fields that really belong here
        sent: Number(item.sent ?? existing.sent),
      }
    })

    const hasMore = Boolean(response?.pagination?.hasMore)
    const nextCursor = response?.pagination?.nextCursor ?? null
    if (!hasMore || nextCursor === null) break

    cursor = nextCursor
    guard += 1
  }

  statisticsByCampaignId.value = statisticsMap
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

const fetchCampaigns = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [campaigns] = await Promise.all([
      fetchAllCampaigns(),
      fetchCampaignStatistics()
    ])
    allCampaigns.value = campaigns
  } catch (error) {
    console.error('Failed to load campaigns:', error)
    if (error?.name === 'AuthenticationException' || error?.status === 401) {
      window.location.href = '/login'
      return
    }
    errorMessage.value = 'Failed to load campaigns.'
    allCampaigns.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchCampaigns()
  fetchMailingLists()
})

watch(totalPages, (pages) => {
  if (isLoading.value) return
  if (currentPage.value > pages) {
    currentPage.value = pages
  }
})

watch(() => route.query.page, (pageQuery) => {
  const nextPage = parsePageQuery(pageQuery)
  if (nextPage !== currentPage.value) {
    currentPage.value = nextPage
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
