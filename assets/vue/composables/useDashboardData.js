import { ref } from 'vue'
import { statisticsClient } from '../api'

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
const error = ref('')
const loaded = ref(false)

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

const load = async () => {
  if (loaded.value) {
    return
  }

  error.value = ''

  try {
    const [summaryResponse, recentCampaignsResponse, performanceResponse] = await Promise.all([
      statisticsClient.getDashboardSummary(),
      statisticsClient.getRecentCampaigns(),
      statisticsClient.getCampaignPerformance(),
    ])

    summary.value = summaryResponse
    recentCampaigns.value = recentCampaignsResponse?.campaigns ?? []

    const points = performanceResponse?.points ?? []
    chart.value = {
      labels: points.map((point) => formatChartLabel(point.date)),
      series: [
        { name: 'Opens', data: points.map((point) => point.opens) },
        { name: 'Clicks', data: points.map((point) => point.clicks) },
      ],
    }

    loaded.value = true
  } catch (err) {
    error.value = 'Unable to load dashboard statistics.'
    console.error('Failed to load dashboard statistics:', err)
  }
}

export function useDashboardData() {
  return {
    summary,
    recentCampaigns,
    chart,
    error,
    loaded,
    load,
  }
}
