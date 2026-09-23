<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Stuck Campaigns</h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Campaigns still in Prepared/InProcess status with no progress for a while. No action is taken
          automatically - review each one and resume it if it should still be sending.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        :disabled="isLoading"
        @click="loadStuckCampaigns"
      >
        <BaseIcon name="repeat" class="w-3.5 h-3.5" />
        Refresh
      </button>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-left text-sm hidden md:table">
        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
        <tr>
          <th class="px-6 py-4">Subject</th>
          <th class="px-6 py-4">Status</th>
          <th class="px-6 py-4">Stuck for</th>
          <th class="px-6 py-4 text-right">Actions</th>
        </tr>
        </thead>

        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
        <tr v-if="isLoading">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">Loading stuck campaigns...</td>
        </tr>

        <tr v-else-if="errorMessage">
          <td colspan="4" class="px-6 py-8 text-center text-red-600 dark:text-red-400">{{ errorMessage }}</td>
        </tr>

        <tr v-else-if="campaigns.length === 0">
          <td colspan="4" class="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No stuck campaigns right now.</td>
        </tr>

        <tr
          v-for="campaign in campaigns"
          :key="campaign.id"
          class="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
            <router-link
              :to="`/campaigns/${campaign.id}/edit`"
              class="hover:underline"
            >
              {{ campaign.subject || `Campaign #${campaign.id}` }}
            </router-link>
          </td>
          <td class="px-6 py-4">
            <BaseBadge variant="warning">
              {{ campaign.statusLabel }}
            </BaseBadge>
          </td>
          <td class="px-6 py-4 text-slate-600 dark:text-slate-300">{{ campaign.stuckFor }}</td>
          <td class="px-6 py-4 text-right">
            <div class="inline-flex justify-end">
              <button
                type="button"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                :disabled="isActionLoading(campaign.id)"
                @click="handleResume(campaign.id)"
              >
                <BaseIcon name="start" class="w-3.5 h-3.5" />
                Resume
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
          Loading stuck campaigns...
        </div>

        <div
          v-else-if="errorMessage"
          class="px-4 py-8 text-center text-red-600 dark:text-red-400 text-sm"
        >
          {{ errorMessage }}
        </div>

        <div
          v-else-if="campaigns.length === 0"
          class="px-4 py-8 text-center text-slate-500 dark:text-slate-400 text-sm"
        >
          No stuck campaigns right now.
        </div>

        <div
          v-for="campaign in campaigns"
          :key="`mobile-${campaign.id}`"
          class="p-4 space-y-3"
        >
          <div class="flex items-start justify-between gap-3">
            <router-link
              :to="`/campaigns/${campaign.id}/edit`"
              class="font-semibold text-slate-900 dark:text-slate-100 hover:underline"
            >
              {{ campaign.subject || `Campaign #${campaign.id}` }}
            </router-link>
            <BaseBadge class="whitespace-nowrap" variant="warning">
              {{ campaign.statusLabel }}
            </BaseBadge>
          </div>

          <p class="text-xs text-slate-600 dark:text-slate-300">
            <span class="font-medium text-slate-700 dark:text-slate-200">Stuck for:</span> {{ campaign.stuckFor }}
          </p>

          <div class="pt-2 flex flex-wrap gap-2">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors disabled:opacity-50"
              :disabled="isActionLoading(campaign.id)"
              @click="handleResume(campaign.id)"
            >
              <BaseIcon name="start" class="w-3.5 h-3.5" />
              Resume
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
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { campaignClient } from '../../api'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'

const campaigns = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const actionLoadingByCampaignId = ref({})
const actionFeedbackByCampaignId = ref({})

const toStatusLabel = (statusRaw) => (statusRaw ? statusRaw.replace(/_/g, ' ') : 'Unknown')

const formatStuckDuration = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(totalSeconds)) return 'Unknown'
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours === 0 && minutes === 0) return `${secs}s`
  if (hours === 0) return `${minutes}m ${secs}s`
  return `${hours}h ${minutes}m`
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
    errorMessage.value = error?.message || 'Failed to load stuck campaigns.'
  } finally {
    isLoading.value = false
  }
}

const handleResume = async (campaignId) => {
  if (isActionLoading(campaignId)) return
  setActionLoading(campaignId, true)
  setActionFeedback(campaignId, 'Resuming campaign...')

  try {
    await campaignClient.resumeCampaign(campaignId)
    setActionFeedback(campaignId, 'Campaign resumed.', 'success')
    setTimeout(() => {
      loadStuckCampaigns()
    }, 1500)
  } catch (error) {
    console.error(`Failed to resume campaign ${campaignId}:`, error)
    setActionFeedback(campaignId, error?.message || 'Failed to resume campaign.', 'error')
  } finally {
    setActionLoading(campaignId, false)
  }
}

onMounted(loadStuckCampaigns)
</script>