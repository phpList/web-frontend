import { ref } from 'vue'
import { statisticsClient } from '../api'
import { useAsyncAction } from './useAsyncAction'

const campaignStatistics = ref([])
const viewOpens = ref([])
const topDomains = ref([])
const domainConfirmation = ref(null)
const topLocalParts = ref([])

const analyticsAction = useAsyncAction(
  async () => {
    const [
      campaignResponse,
      viewOpensResponse,
      topDomainsResponse,
      domainConfirmationResponse,
      topLocalPartsResponse,
    ] = await Promise.all([
      statisticsClient.getCampaignStatistics(null, 100),
      statisticsClient.getStatisticsOfViewOpens(null, 100),
      statisticsClient.getTopDomains(20, 5),
      statisticsClient.getDomainConfirmationStatistics(50),
      statisticsClient.getTopLocalParts(25),
    ])

    campaignStatistics.value = campaignResponse?.items ?? []
    viewOpens.value = viewOpensResponse?.items ?? []
    topDomains.value = topDomainsResponse?.items ?? []
    domainConfirmation.value = domainConfirmationResponse ?? null
    topLocalParts.value = topLocalPartsResponse?.items ?? []
  },
  { once: true, errorMessage: 'Failed to load analytics.', logLabel: 'Failed to load analytics:' }
)

export function useAnalyticsData() {
  return {
    loading: analyticsAction.loading,
    hasLoaded: analyticsAction.settled,
    error: analyticsAction.error,
    campaignStatistics,
    viewOpens,
    topDomains,
    domainConfirmation,
    topLocalParts,
    loadAnalytics: analyticsAction.run,
  }
}