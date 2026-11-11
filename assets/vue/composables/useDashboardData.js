import { ref } from 'vue'
import { statisticsClient } from '../api'
import { useAsyncAction } from './useAsyncAction'

const summary = ref(null)
const recentCampaigns = ref([])

const summaryAction = useAsyncAction(
  async () => {
    summary.value = await statisticsClient.getDashboardSummary()
  },
  { once: true, errorMessage: 'Unable to load dashboard summary.', logLabel: 'Failed to load dashboard summary:' }
)

const recentCampaignsAction = useAsyncAction(
  async () => {
    const response = await statisticsClient.getRecentCampaigns()
    recentCampaigns.value = response?.campaigns ?? []
  },
  { once: true, errorMessage: 'Unable to load recent campaigns.', logLabel: 'Failed to load recent campaigns:' }
)

const load = () => {
  summaryAction.run()
  recentCampaignsAction.run()
}

export function useDashboardData() {
  return {
    summary,
    summaryLoading: summaryAction.loading,
    summaryError: summaryAction.error,
    recentCampaigns,
    recentCampaignsLoading: recentCampaignsAction.loading,
    recentCampaignsError: recentCampaignsAction.error,
    load,
  }
}