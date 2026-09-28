import { ref } from 'vue'
import { statisticsClient } from '../api'
import { useAsyncAction } from './useAsyncAction'

const defaultChart = () => ({
  labels: [],
  series: [
    { name: 'Opens', data: [] },
    { name: 'Clicks', data: [] },
  ],
})

const summary = ref(null)
const recentCampaigns = ref([])
const chart = ref(defaultChart())

const formatChartLabel = (dateValue) => {
  if (!dateValue) {
    return ''
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ? new Date(...dateValue.split('-').map((part, index) => (index === 1 ? Number(part) - 1 : Number(part))))
    : new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit' }).format(date)
}

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

const chartAction = useAsyncAction(
  async () => {
    const response = await statisticsClient.getCampaignPerformance()
    const points = response?.points ?? []
    chart.value = {
      labels: points.map((point) => formatChartLabel(point.date)),
      series: [
        { name: 'Opens', data: points.map((point) => point.opens) },
        { name: 'Clicks', data: points.map((point) => point.clicks) },
      ],
    }
  },
  { once: true, errorMessage: 'Unable to load campaign performance.', logLabel: 'Failed to load campaign performance:' }
)

const load = () => {
  summaryAction.run()
  recentCampaignsAction.run()
  chartAction.run()
}

export function useDashboardData() {
  return {
    summary,
    summaryLoading: summaryAction.loading,
    summaryError: summaryAction.error,
    recentCampaigns,
    recentCampaignsLoading: recentCampaignsAction.loading,
    recentCampaignsError: recentCampaignsAction.error,
    chart,
    chartLoading: chartAction.loading,
    chartError: chartAction.error,
    load,
  }
}