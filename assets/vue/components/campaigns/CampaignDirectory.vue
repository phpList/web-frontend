<template>
  <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ t('campaigns.title') }}</h2>

      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-900 w-full sm:w-auto">
          <button
            v-for="option in filterOptions"
            :key="option.id"
            type="button"
            class="flex-1 sm:flex-none px-3 py-1.5 text-xs font-semibold rounded-md transition-colors"
            :class="statusFilter === option.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-350 hover:text-slate-700 dark:hover:text-slate-300'"
            @click="setFilter(option.id)"
          >
            {{ option.label }}
          </button>
        </div>
        <RouterLink
          to="/campaigns/create"
          class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <BaseIcon name="plus" class="w-4 h-4" inherit-color />
          {{ t('campaigns.create') }}
        </RouterLink>
      </div>
    </div>

    <BaseDataTable
        :items="paginatedCampaigns"
        :is-loading="loading"
        :load-error="error"
        :loading-message="t('campaigns.loading')"
        :empty-message="t('campaigns.empty')"
        :colspan="showStatistics ? 6 : 5"
    >
      <template #head>
        <th class="px-6 py-4">{{ t('campaigns.table.subject') }}</th>
        <th class="px-6 py-4">{{ t('campaigns.table.status') }}</th>
        <th class="px-6 py-4">{{ t('campaigns.table.lists') }}</th>
        <th class="px-6 py-4">{{ t('campaigns.table.processed') }}</th>
        <th class="px-6 py-4" v-if="showStatistics">{{ t('campaigns.table.statistics') }}</th>
        <th class="px-6 py-4 text-right">{{ t('campaigns.table.actions') }}</th>
      </template>

      <template #row="{ item: campaign }">
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ campaign.subject }}</td>
        <td class="px-6 py-4">
          <BaseBadge :variant="statusVariants[campaign.statusKey] || statusVariants.unknown">
            {{ campaign.statusLabel }}
          </BaseBadge>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350 align-top">
          <p v-if="isListsLoading(campaign.id)" class="text-xs">{{ t('campaigns.lists_loading') }}</p>
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
              {{ isListsExpanded(campaign.id) ? '▼' : '▶' }} {{ t('campaigns.lists_count', { count: campaign.lists.length }) }}
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
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350 align-top">
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.started') }}</span> {{ campaign.startedAt }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.time_to_send') }}</span> {{ campaign.timeToSend }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.total') }}</span> {{ campaign.processedTotal }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.text') }}</span> {{ campaign.processedText }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.html') }}</span> {{ campaign.processedHtml }}</p>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350 align-top" v-if="showStatistics">
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.total_views') }}</span> {{ campaign.totalViews }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.unique_views') }}</span> {{ campaign.uniqueViews }}</p>
          <p class="text-xs leading-5"><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.bounced') }}</span> {{ campaign.bounced }}</p>
        </td>
        <td class="px-6 py-4 align-top text-right">
          <div class="inline-flex flex-wrap justify-end gap-2">
            <ActionButton
                v-if="campaign.statusKey === 'draft'"
                variant="danger"
                icon="delete"
                :disabled="isActionLoading(campaign.id)"
                @click="handleDelete(campaign)"
            >
              {{ t('campaigns.actions.delete') }}
            </ActionButton>
            <ActionButton
                v-else-if="campaign.statusKey === 'active'"
                variant="danger"
                icon="pause"
                :disabled="isActionLoading(campaign.id)"
                @click="handleSuspend(campaign.id)"
            >
              {{ t('campaigns.actions.suspend') }}
            </ActionButton>
            <ActionButton
                v-else
                variant="warning"
                icon="start"
                :disabled="isActionLoading(campaign.id)"
                @click="handleRequeue(campaign.id)"
            >
              {{ t('campaigns.actions.requeue') }}
            </ActionButton>
            <ActionButton
                v-if="campaign.statusKey === 'sent'"
                variant="success"
                icon="copy"
                :disabled="isActionLoading(campaign.id)"
                @click="handleCopyToDraft(campaign.id)"
            >
              {{ t('campaigns.actions.copy_to_draft') }}
            </ActionButton>
            <ActionButton
                v-if="campaign.statusKey === 'draft'"
                icon="edit"
                :disabled="isActionLoading(campaign.id)"
                @click="handleEdit(campaign.id)"
            >
              {{ t('campaigns.actions.edit') }}
            </ActionButton>
            <ActionButton
                icon="eye"
                :disabled="isActionLoading(campaign.id)"
                @click="handleView(campaign.id)"
            >
              {{ t('campaigns.actions.view') }}
            </ActionButton>
          </div>
          <p
            v-if="getActionFeedback(campaign.id)"
            class="mt-2 text-xs"
            :class="{
              'text-emerald-700 dark:text-emerald-400': getActionFeedback(campaign.id)?.type === 'success',
              'text-red-700 dark:text-red-400': getActionFeedback(campaign.id)?.type === 'error',
              'text-slate-500 dark:text-slate-350': getActionFeedback(campaign.id)?.type === 'info'
            }"
          >
            {{ getActionFeedback(campaign.id)?.message }}
          </p>
        </td>
      </template>

      <template #card="{ item: campaign }">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="font-semibold text-slate-900 dark:text-slate-100">{{ campaign.subject }}</p>
          </div>
          <BaseBadge class="whitespace-nowrap" :variant="statusVariants[campaign.statusKey] || statusVariants.unknown">
            {{ campaign.statusLabel }}
          </BaseBadge>
        </div>

        <div class="text-xs text-slate-600 dark:text-slate-350 space-y-1">
          <p>
            <span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.lists') }} </span>
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
          <p><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.started') }}</span> {{ campaign.startedAt }}</p>
          <p><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.time_to_send') }}</span> {{ campaign.timeToSend }}</p>
          <p><span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.processed') }}</span> {{ t('campaigns.card.processed_summary', { total: campaign.processedTotal, text: campaign.processedText, html: campaign.processedHtml }) }}</p>
          <p v-if="showStatistics">
            <span class="font-medium text-slate-700 dark:text-slate-200">{{ t('campaigns.fields.statistics') }}</span>
            {{ t('campaigns.card.statistics_summary', { total: campaign.totalViews, unique: campaign.uniqueViews, bounced: campaign.bounced }) }}
          </p>
        </div>

        <div class="pt-2 flex flex-wrap gap-2">
          <ActionButton
              v-if="campaign.statusKey === 'draft'"
              variant="danger"
              icon="delete"
              :disabled="isActionLoading(campaign.id)"
              @click="handleDelete(campaign)"
          >
            {{ t('campaigns.actions.delete') }}
          </ActionButton>
          <ActionButton
              v-else-if="campaign.statusKey === 'active'"
              variant="danger"
              icon="pause"
              :disabled="isActionLoading(campaign.id)"
              @click="handleSuspend(campaign.id)"
          >
            {{ t('campaigns.actions.suspend') }}
          </ActionButton>
          <ActionButton
              v-else
              variant="warning"
              icon="start"
              :disabled="isActionLoading(campaign.id)"
              @click="handleRequeue(campaign.id)"
          >
            {{ t('campaigns.actions.requeue') }}
          </ActionButton>
          <ActionButton
              v-if="campaign.statusKey === 'sent'"
              variant="success"
              icon="copy"
              :disabled="isActionLoading(campaign.id)"
              @click="handleCopyToDraft(campaign.id)"
          >
            {{ t('campaigns.actions.copy_to_draft') }}
          </ActionButton>
          <ActionButton
              v-if="campaign.statusKey === 'draft'"
              icon="edit"
              :disabled="isActionLoading(campaign.id)"
              @click="handleEdit(campaign.id)"
          >
            {{ t('campaigns.actions.edit') }}
          </ActionButton>
          <ActionButton
              icon="eye"
              :disabled="isActionLoading(campaign.id)"
              @click="handleView(campaign.id)"
          >
            {{ t('campaigns.actions.view') }}
          </ActionButton>
        </div>
        <p
          v-if="getActionFeedback(campaign.id)"
          class="text-xs"
          :class="{
            'text-emerald-700 dark:text-emerald-400': getActionFeedback(campaign.id)?.type === 'success',
            'text-red-700 dark:text-red-400': getActionFeedback(campaign.id)?.type === 'error',
            'text-slate-500 dark:text-slate-350': getActionFeedback(campaign.id)?.type === 'info'
          }"
        >
          {{ getActionFeedback(campaign.id)?.message }}
        </p>
      </template>
    </BaseDataTable>

    <div class="p-4 sm:p-6 border-t border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-350">
      <div class="text-center sm:text-left">
        {{ t('campaigns.showing', { start: rangeStart, end: rangeEnd, total: totalForFilter }) }}
      </div>
      <div class="flex gap-2 w-full sm:w-auto">
        <button
          type="button"
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          :disabled="!canGoPrevious"
          @click="previousPage"
        >
          {{ t('common.previous') }}
        </button>
        <button
          type="button"
          class="flex-1 sm:flex-none px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          :disabled="!canGoNext"
          @click="nextPage"
        >
          {{ t('common.next') }}
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
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import { campaignClient, fetchAllLists, listMessagesClient, statisticsClient } from '../../api'
import ViewCampaignModal from "./ViewCampaignModal.vue";
import ActionButton from '../base/ActionButton.vue'
import BaseBadge from '../base/BaseBadge.vue'
import BaseDataTable from '../base/BaseDataTable.vue'
import { useCampaignPagination } from '../../composables/useCampaignPagination'
import { useCampaignStatistics } from '../../composables/useCampaignStatistics'
import { useCampaignLists } from '../../composables/useCampaignLists'
import { useApiValidationErrors } from '../../composables/useApiValidationErrors'

const { t, locale } = useI18n()

const pageSize = 5
const route = useRoute()
const router = useRouter()
const { formatValidationErrors } = useApiValidationErrors()

const allowedStatuses = ['all', 'sent', 'active', 'draft']
const activeStatuses = new Set(['submitted', 'prepared', 'inprocess'])

// Maps a UI filter tab to the server-side `status` query param. 'active' groups several
// raw statuses, sent as a comma-separated list the backend matches via IN(...).
const statusParamForFilter = (filterId) => ({
  sent: 'sent',
  draft: 'draft',
  active: Array.from(activeStatuses).join(','),
}[filterId] ?? null)

const {
  statusFilter,
  currentPage,
  rawItems: rawCampaigns,
  total: totalForFilter,
  loading,
  error,
  canGoPrevious,
  canGoNext,
  rangeStart,
  rangeEnd,
  setFilter,
  previousPage,
  nextPage,
  loadUpToPage,
  refreshCurrentPage,
} = useCampaignPagination({
  route,
  router,
  pageSize,
  allowedStatuses,
  fetchPage: (afterId, limit, status) =>
      campaignClient.getCampaigns(afterId, limit, null, statusParamForFilter(status), 'desc'),
})

const {
  showStatistics,
  getCampaignStatistics,
  fetchCampaignStatistics,
} = useCampaignStatistics(statisticsClient)

const {
  getCampaignLists,
  isListsLoading,
  isListsExpanded,
  toggleListsExpanded,
  fetchListsForVisibleCampaigns,
} = useCampaignLists(listMessagesClient)

const mailingLists = ref([])
const actionLoadingByCampaignId = ref({})
const actionFeedbackByCampaignId = ref({})

const isViewModalOpen = ref(false)
const isViewLoading = ref(false)
const selectedCampaign = ref(null)
const viewErrorMessage = ref('')
const isResending = ref(false)
const resendErrorMessage = ref('')

const filterOptions = computed(() => [
  { id: 'all', label: t('campaigns.filters.all') },
  { id: 'sent', label: t('campaigns.filters.sent') },
  { id: 'active', label: t('campaigns.filters.active') },
  { id: 'draft', label: t('campaigns.filters.draft') }
])

const statusVariants = {
  sent: 'success',
  active: 'info',
  draft: 'neutral',
  unknown: 'warning'
}

const resolveStatusKey = (statusRaw) => {
  if (statusRaw === 'sent') return 'sent'
  if (statusRaw === 'draft') return 'draft'
  if (activeStatuses.has(statusRaw)) return 'active'
  return 'unknown'
}

const toStatusLabel = (statusKey, statusRaw) => {
  if (statusKey === 'active') return t('campaigns.status.active')
  if (statusKey === 'sent') return t('campaigns.status.sent')
  if (statusKey === 'draft') return t('campaigns.status.draft')
  return statusRaw ? statusRaw.replace(/_/g, ' ') : t('campaigns.status.unknown')
}

const formatDate = (dateValue) => {
  if (!dateValue) return t('campaigns.no_date')
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return t('campaigns.no_date')

  return new Intl.DateTimeFormat(locale.value, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatDuration = (fromValue, toValue) => {
  if (!fromValue || !toValue) return t('campaigns.not_sent_yet')
  const from = new Date(fromValue)
  const to = new Date(toValue)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) {
    return t('campaigns.status.unknown')
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

const fetchMailingLists = async () => {
  try {
    mailingLists.value = await fetchAllLists()
  } catch (error) {
    console.error('Failed to fetch mailing lists:', error)
    mailingLists.value = []
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
  setActionFeedback(campaignId, t('campaigns.feedback.requeueing'))

  try {
    await campaignClient.updateCampaignStatus(campaignId, 'submitted')
    setActionFeedback(campaignId, t('campaigns.feedback.requeued'), 'success')
    await refreshCurrentPage()
  } catch (error) {
    console.error(`Failed to requeue campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || t('campaigns.feedback.requeue_failed'), 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const handleSuspend = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, t('campaigns.feedback.suspending'))

  try {
    await campaignClient.updateCampaignStatus(campaignId, 'suspended')
    setActionFeedback(campaignId, t('campaigns.feedback.suspended'), 'success')
    await refreshCurrentPage()
  } catch (error) {
    console.error(`Failed to suspend campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || t('campaigns.feedback.suspend_failed'), 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

const handleEdit = async (campaignId) => {
  await router.push({ name: 'campaign-edit', params: { campaignId } })
}

const handleDelete = async (campaign) => {
  if (isActionLoading(campaign.id)) return
  const isConfirmed = window.confirm(t('campaigns.delete_confirm', { id: campaign.id, subject: campaign.subject }))
  if (!isConfirmed) return

  setActionLoading(campaign.id, true)
  setActionFeedback(campaign.id, t('campaigns.feedback.deleting'))

  try {
    await campaignClient.deleteCampaign(campaign.id)
    setActionFeedback(campaign.id, t('campaigns.feedback.deleted'), 'success')
    // Delay the refresh so the success feedback is visible before the row disappears.
    setTimeout(() => {
      refreshCurrentPage()
    }, 1500)
  } catch (error) {
    console.error(`Failed to delete campaign ${campaign.id}:`, error)
    setActionFeedback(campaign.id, error?.message || t('campaigns.feedback.delete_failed'), 'error')
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
    viewErrorMessage.value = error?.message || t('campaigns.errors.load_failed')
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
    const validationErrors = formatValidationErrors(error)
    if (validationErrors.length > 0) {
      closeViewModal()
      await router.push({ name: 'campaign-edit', params: { campaignId }, state: { validationErrors } })
      return
    }
    resendErrorMessage.value = error?.message || t('campaigns.errors.resend_failed')
  } finally {
    isResending.value = false
  }
}

const handleCopyToDraft = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, t('campaigns.feedback.copying'))

  try {
    await campaignClient.copyCampaign(campaignId)
    await refreshCurrentPage()
    setActionFeedback(campaignId, t('campaigns.feedback.copied'))
  } catch (error) {
    console.error(`Failed to copy campaign ${campaignId} to draft:`, error)
    setActionFeedback(campaignId, error?.message || t('campaigns.feedback.copy_failed'), 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

// Expensive (date formatting, statistics/lists lookups) — run only for the page being rendered.
const normalizeCampaign = (campaign) => {
  const statusRaw = (campaign?.messageMetadata?.status || '').toLowerCase()
  const statusKey = resolveStatusKey(statusRaw)
  const subject = campaign?.messageContent?.subject || t('campaigns.fallback_subject', { id: campaign.id })
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

const paginatedCampaigns = computed(() => rawCampaigns.value.map(normalizeCampaign))

onMounted(() => {
  loadUpToPage(currentPage.value)
  fetchCampaignStatistics()
  fetchMailingLists()
})

watch(paginatedCampaigns, () => {
  fetchListsForVisibleCampaigns(paginatedCampaigns.value.map((campaign) => campaign.id))
}, { immediate: true })
</script>
