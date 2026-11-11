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
  {
    once: true,
    // Starts true (unlike the other two actions): PerformanceChartCard only mounts the
    // <apexchart> child once `loading` is false, and vue3-apexcharts' own mount is async
    // (awaits a tick before calling ApexCharts.render()). If `loading` started false, the
    // chart would mount on first paint, then immediately unmount when this run() flips
    // loading to true on DashboardView's onMounted - tearing down its DOM element while
    // vue3-apexcharts' deferred render() is still in flight, which throws "Element not
    // found" as an unhandled rejection. Starting true means <apexchart> is never created
    // until data has actually loaded, so there is no mount/unmount race.
    initialLoading: true,
    errorMessage: 'Unable to load campaign performance.',
    logLabel: 'Failed to load campaign performance:',
  }
)

export function useCampaignPerformance() {
  return {
    chart,
    chartLoading: chartAction.loading,
    chartError: chartAction.error,
    load: chartAction.run,
  }
}
