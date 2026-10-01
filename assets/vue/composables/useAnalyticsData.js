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
      statisticsClient.getCampaignStatistics(null, 10),
      statisticsClient.getStatisticsOfViewOpens(null, 10),
      statisticsClient.getTopDomains(5, 5),
      statisticsClient.getDomainConfirmationStatistics(5),
      statisticsClient.getTopLocalParts(5),
    ])

    campaignStatistics.value = campaignResponse?.items ?? []
    viewOpens.value = viewOpensResponse?.items ?? []
    topDomains.value = topDomainsResponse?.items ?? []
    domainConfirmation.value = domainConfirmationResponse ?? null
    topLocalParts.value = topLocalPartsResponse?.items ?? []
  },
  {
    once: true,
    // Starts true: AnalyticsView only mounts its <VueApexCharts> once `loading` is false, and
    // vue3-apexcharts' own mount is async (awaits a tick before calling ApexCharts.render()).
    // If `loading` started false, the chart would mount on first paint, then immediately
    // unmount when this run() flips loading to true on the view's onMounted - tearing down its
    // DOM element while vue3-apexcharts' deferred render() is still in flight, which throws
    // "Element not found" as an unhandled rejection (same bug fixed for the dashboard chart).
    initialLoading: true,
    errorMessage: 'Failed to load analytics.',
    logLabel: 'Failed to load analytics:',
  }
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
