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
const summaryLoading = ref(false)
const summaryError = ref('')
const summaryLoaded = ref(false)

const recentCampaigns = ref([])
const recentCampaignsLoading = ref(false)
const recentCampaignsError = ref('')
const recentCampaignsLoaded = ref(false)

const chart = ref(defaultChart())
const chartLoading = ref(false)
const chartError = ref('')
const chartLoaded = ref(false)

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

const loadSummary = async () => {
  if (summaryLoaded.value || summaryLoading.value) {
    return
  }

  summaryLoading.value = true
  summaryError.value = ''

  try {
    summary.value = await statisticsClient.getDashboardSummary()
    summaryLoaded.value = true
  } catch (err) {
    summaryError.value = 'Unable to load dashboard summary.'
    console.error('Failed to load dashboard summary:', err)
  } finally {
    summaryLoading.value = false
  }
}

const loadRecentCampaigns = async () => {
  if (recentCampaignsLoaded.value || recentCampaignsLoading.value) {
    return
  }

  recentCampaignsLoading.value = true
  recentCampaignsError.value = ''

  try {
    const response = await statisticsClient.getRecentCampaigns()
    recentCampaigns.value = response?.campaigns ?? []
    recentCampaignsLoaded.value = true
  } catch (err) {
    recentCampaignsError.value = 'Unable to load recent campaigns.'
    console.error('Failed to load recent campaigns:', err)
  } finally {
    recentCampaignsLoading.value = false
  }
}

const loadChart = async () => {
  if (chartLoaded.value || chartLoading.value) {
    return
  }

  chartLoading.value = true
  chartError.value = ''

  try {
    const response = await statisticsClient.getCampaignPerformance()
    const points = response?.points ?? []
    chart.value = {
      labels: points.map((point) => formatChartLabel(point.date)),
      series: [
        { name: 'Opens', data: points.map((point) => point.opens) },
        { name: 'Clicks', data: points.map((point) => point.clicks) },
      ],
    }
    chartLoaded.value = true
  } catch (err) {
    chartError.value = 'Unable to load campaign performance.'
    console.error('Failed to load campaign performance:', err)
  } finally {
    chartLoading.value = false
  }
}

const load = () => {
  loadSummary()
  loadRecentCampaigns()
  loadChart()
}

export function useDashboardData() {
  return {
    summary,
    summaryLoading,
    summaryError,
    recentCampaigns,
    recentCampaignsLoading,
    recentCampaignsError,
    chart,
    chartLoading,
    chartError,
    load,
  }
}