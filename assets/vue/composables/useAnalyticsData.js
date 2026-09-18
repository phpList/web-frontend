import { ref } from 'vue'
import { statisticsClient } from '../api'

const isLoading = ref(true)
const hasLoaded = ref(false)
const errorMessage = ref('')
const campaignStatistics = ref([])
const viewOpens = ref([])
const topDomains = ref([])
const domainConfirmation = ref(null)
const topLocalParts = ref([])
const loaded = ref(false)

const loadAnalytics = async () => {
  if (loaded.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
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
    loaded.value = true
  } catch (error) {
    errorMessage.value = 'Failed to load analytics.'
    console.error('Failed to load analytics:', error)
  } finally {
    isLoading.value = false
    hasLoaded.value = true
  }
}

export function useAnalyticsData() {
  return {
    isLoading,
    hasLoaded,
    errorMessage,
    campaignStatistics,
    viewOpens,
    topDomains,
    domainConfirmation,
    topLocalParts,
    loadAnalytics,
  }
}