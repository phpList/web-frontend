<template>
  <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ t('stuck_campaigns.title') }}</h2>
        <p class="text-sm text-slate-500 dark:text-slate-350 mt-1">
          {{ t('stuck_campaigns.description') }}
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        :disabled="isLoading"
        @click="loadStuckCampaigns"
      >
        <BaseIcon name="repeat" class="w-3.5 h-3.5" />
        {{ t('stuck_campaigns.refresh') }}
      </button>
    </div>

    <BaseDataTable
        :items="campaigns"
        :is-loading="isLoading"
        :load-error="errorMessage"
        :loading-message="t('stuck_campaigns.loading')"
        :empty-message="t('stuck_campaigns.empty')"
        :colspan="4"
    >
      <template #head>
        <th class="px-6 py-4">{{ t('campaigns.table.subject') }}</th>
        <th class="px-6 py-4">{{ t('campaigns.table.status') }}</th>
        <th class="px-6 py-4">{{ t('stuck_campaigns.stuck_for') }}</th>
        <th class="px-6 py-4 text-right">{{ t('campaigns.table.actions') }}</th>
      </template>

      <template #row="{ item: campaign }">
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
          <router-link
            :to="`/campaigns/${campaign.id}/edit`"
            class="hover:underline"
          >
            {{ campaign.subject || t('campaigns.fallback_subject', { id: campaign.id }) }}
          </router-link>
        </td>
        <td class="px-6 py-4">
          <BaseBadge variant="warning">
            {{ campaign.statusLabel }}
          </BaseBadge>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350">{{ campaign.stuckFor }}</td>
        <td class="px-6 py-4 text-right">
          <div class="inline-flex justify-end">
            <ActionButton
              variant="warning"
              icon="start"
              :disabled="isActionLoading(campaign.id)"
              @click="handleResume(campaign.id)"
            >
              {{ t('stuck_campaigns.resume') }}
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
          <router-link
            :to="`/campaigns/${campaign.id}/edit`"
            class="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
          >
            {{ campaign.subject || t('campaigns.fallback_subject', { id: campaign.id }) }}
          </router-link>
          <BaseBadge class="whitespace-nowrap" variant="warning">
            {{ campaign.statusLabel }}
          </BaseBadge>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-350">
          <span class="font-medium text-slate-700 dark:text-slate-200">{{ t('stuck_campaigns.stuck_for_label') }}</span> {{ campaign.stuckFor }}
        </p>

        <div class="pt-2 flex flex-wrap gap-2">
          <ActionButton
            variant="warning"
            icon="start"
            :disabled="isActionLoading(campaign.id)"
            @click="handleResume(campaign.id)"
          >
            {{ t('stuck_campaigns.resume') }}
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
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { campaignClient } from '../../api'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'
import ActionButton from '../base/ActionButton.vue'
import BaseDataTable from '../base/BaseDataTable.vue'

const { t } = useI18n()

const campaigns = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const actionLoadingByCampaignId = ref({})
const actionFeedbackByCampaignId = ref({})

const toStatusLabel = (statusRaw) => (statusRaw ? statusRaw.replace(/_/g, ' ') : t('campaigns.status.unknown'))

const formatStuckDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) return t('campaigns.status.unknown')
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (days === 0 && hours === 0 && minutes === 0) return `${secs}s`
  if (days === 0 && hours === 0) return `${minutes}m ${secs}s`
  if (days === 0) return `${hours}h ${minutes}m`
  return `${days}d ${hours}h ${minutes}m`
}

const isActionLoading = (campaignId) => actionLoadingByCampaignId.value[campaignId] === true
const getActionFeedback = (campaignId) => actionFeedbackByCampaignId.value[campaignId] || null

const setActionLoading = (campaignId, value) => {
  actionLoadingByCampaignId.value = { ...actionLoadingByCampaignId.value, [campaignId]: value }
}

const setActionFeedback = (campaignId, message, type = 'info') => {
  actionFeedbackByCampaignId.value = { ...actionFeedbackByCampaignId.value, [campaignId]: { message, type } }
}

const loadStuckCampaigns = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await campaignClient.getStuckCampaigns()
    const items = Array.isArray(response?.items) ? response.items : []
    campaigns.value = items.map((item) => ({
      id: item.id,
      subject: item.subject,
      statusLabel: toStatusLabel(item.status),
      stuckFor: formatStuckDuration(item.stuckSeconds),
    }))
  } catch (error) {
    console.error('Failed to load stuck campaigns:', error)
    errorMessage.value = error?.message || t('stuck_campaigns.errors.load_failed')
  } finally {
    isLoading.value = false
  }
}

const handleResume = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, t('stuck_campaigns.feedback.resuming'))

  try {
    await campaignClient.resumeCampaign(campaignId)
    setActionFeedback(campaignId, t('stuck_campaigns.feedback.resumed'), 'success')
    setTimeout(() => {
      loadStuckCampaigns()
    }, 1500)
  } catch (error) {
    console.error(`Failed to resume campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || t('stuck_campaigns.feedback.resume_failed'), 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

onMounted(loadStuckCampaigns)
</script>
