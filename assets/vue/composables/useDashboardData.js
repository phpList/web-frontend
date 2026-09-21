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
const summaryLoading = ref(true)
const summaryError = ref('')
const summaryLoaded = ref(false)
let summaryPromise = null

const recentCampaigns = ref([])
const recentCampaignsLoading = ref(true)
const recentCampaignsError = ref('')
const recentCampaignsLoaded = ref(false)
let recentCampaignsPromise = null

const chart = ref(defaultChart())
const chartLoading = ref(true)
const chartError = ref('')
const chartLoaded = ref(false)
let chartPromise = null

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

const loadSummary = () => {
  if (summaryLoaded.value) {
    return summaryPromise
  }

  if (summaryPromise) {
    return summaryPromise
  }

  summaryLoading.value = true
  summaryError.value = ''

  summaryPromise = (async () => {
    try {
      summary.value = await statisticsClient.getDashboardSummary()
      summaryLoaded.value = true
    } catch (err) {
      summaryError.value = 'Unable to load dashboard summary.'
      console.error('Failed to load dashboard summary:', err)
    } finally {
      summaryLoading.value = false
    }
  })()

  return summaryPromise
}

const loadRecentCampaigns = () => {
  if (recentCampaignsLoaded.value) {
    return recentCampaignsPromise
  }

  if (recentCampaignsPromise) {
    return recentCampaignsPromise
  }

  recentCampaignsLoading.value = true
  recentCampaignsError.value = ''

  recentCampaignsPromise = (async () => {
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
  })()

  return recentCampaignsPromise
}

const loadChart = () => {
  if (chartLoaded.value) {
    return chartPromise
  }

  if (chartPromise) {
    return chartPromise
  }

  chartLoading.value = true
  chartError.value = ''

  chartPromise = (async () => {
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
  })()

  return chartPromise
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