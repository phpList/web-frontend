<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div
        v-if="error"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
        role="alert"
      >
        {{ error }}
      </div>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BaseCard v-for="metric in metrics" :key="metric.id" class="h-full">
          <header class="mb-2 flex items-center gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              <BaseIcon :name="metric.icon" />
            </span>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {{ metric.label }}
            </p>
          </header>
          <p class="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ metric.value }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            {{ metric.description }}
          </p>
        </BaseCard>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BaseCard class="xl:col-span-2">
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Campaign performance</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Top campaigns ranked by unique views and click volume.
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ formatCount(campaignStatistics.length) }} campaigns
            </p>
          </header>

          <div v-if="loading" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            Loading analytics...
          </div>

          <div v-else-if="hasLoaded && campaignChartItems.length === 0" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No campaign statistics found.
          </div>

          <div v-else class="min-h-[260px]">
            <VueApexCharts
              type="bar"
              height="320"
              :options="campaignChartOptions"
              :series="campaignChartSeries"
            />
          </div>
        </BaseCard>

        <BaseCard>
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Domain confirmation</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Confirmation coverage by sending domain.
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ formatCount(domainConfirmationItems.length) }} domains
            </p>
          </header>

          <div v-if="domainConfirmationItems.length" class="space-y-5">
            <div v-for="item in domainConfirmationItems" :key="item.domain" class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <p class="break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {{ item.domain || 'Unknown domain' }}
                </p>
                <p class="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                  {{ formatCount(item.total?.count) }} total
                </p>
              </div>

              <div class="flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                <div
                  class="h-full bg-emerald-500"
                  :style="{ width: `${clampPercentage(item.confirmed?.percentage)}%` }"
                />
                <div
                  class="h-full bg-amber-500"
                  :style="{ width: `${clampPercentage(item.unconfirmed?.percentage)}%` }"
                />
                <div
                  class="h-full bg-rose-500"
                  :style="{ width: `${clampPercentage(item.blacklisted?.percentage)}%` }"
                />
              </div>

              <div class="grid grid-cols-3 gap-2 text-xs">
                <div class="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-2 py-2">
                  <p class="uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Confirmed</p>
                  <p class="mt-1 font-semibold text-emerald-900 dark:text-emerald-400">
                    {{ formatCount(item.confirmed?.count) }}
                  </p>
                  <p class="text-emerald-700/70 dark:text-emerald-400/70">
                    {{ formatPercentage(item.confirmed?.percentage) }}
                  </p>
                </div>
                <div class="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2 py-2">
                  <p class="uppercase tracking-wide text-amber-700 dark:text-amber-400">Unconfirmed</p>
                  <p class="mt-1 font-semibold text-amber-900 dark:text-amber-400">
                    {{ formatCount(item.unconfirmed?.count) }}
                  </p>
                  <p class="text-amber-700/70 dark:text-amber-400/70">
                    {{ formatPercentage(item.unconfirmed?.percentage) }}
                  </p>
                </div>
                <div class="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2 py-2">
                  <p class="uppercase tracking-wide text-rose-700 dark:text-rose-400">Blacklisted</p>
                  <p class="mt-1 font-semibold text-rose-900 dark:text-rose-400">
                    {{ formatCount(item.blacklisted?.count) }}
                  </p>
                  <p class="text-rose-700/70 dark:text-rose-400/70">
                    {{ formatPercentage(item.blacklisted?.percentage) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="hasLoaded" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            No confirmation data found.
          </div>
        </BaseCard>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BaseCard>
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Top domains</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Subscriber counts by email domain.
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ formatCount(topDomains.length) }} domains
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th class="px-4 py-3">Domain</th>
                  <th class="px-4 py-3 text-right">Subscribers</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="hasLoaded && topDomains.length === 0">
                  <td colspan="2" class="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No domain statistics found.
                  </td>
                </tr>
                <tr v-for="domain in topDomains" :key="domain.domain">
                  <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {{ domain.domain || 'Unknown domain' }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                    {{ formatCount(domain.subscribers) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>

        <BaseCard>
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Top local parts</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Most common subscriber usernames.
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ formatCount(topLocalParts.length) }} values
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <tr>
                  <th class="px-4 py-3">Local part</th>
                  <th class="px-4 py-3 text-right">Count</th>
                  <th class="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="hasLoaded && topLocalParts.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                    No local-part statistics found.
                  </td>
                </tr>
                <tr v-for="part in topLocalParts" :key="part.localPart">
                  <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {{ part.localPart || 'Unknown' }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                    {{ formatCount(part.count) }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                    {{ formatPercentage(part.percentage) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </section>

      <BaseCard>
        <header class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">Campaign breakdown</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Open and click activity by campaign.
            </p>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ formatCount(campaignStatistics.length) }} records
          </p>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <tr>
                <th class="px-4 py-3">Campaign</th>
                <th class="px-4 py-3 text-right">Sent</th>
                <th class="px-4 py-3 text-right">Views</th>
                <th class="px-4 py-3 text-right">Open rate</th>
                <th class="px-4 py-3 text-right">Clicks</th>
                <th class="px-4 py-3 text-right">Bounce</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-if="hasLoaded && campaignStatistics.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                  No campaign statistics found.
                </td>
              </tr>
              <tr v-for="campaign in campaignStatistics" :key="campaign.campaignId">
                <td class="px-4 py-3">
                  <div class="font-medium text-slate-900 dark:text-slate-100">
                    {{ campaign.subject || `Campaign #${campaign.campaignId}` }}
                  </div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Sent {{ campaign.dateSent ? formatDate(campaign.dateSent) : 'unknown date' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                  {{ formatCount(campaign.sent) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                  {{ formatCount(campaign.uniqueViews) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                  {{ formatPercentage(calcRate(campaign.uniqueViews, campaign.sent)) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                  {{ formatCount(campaign.totalClicks) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                  {{ formatCount(campaign.bounces) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </BaseCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '../layouts/AdminLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseIcon from '../components/base/BaseIcon.vue'
import { useDarkMode } from '../composables/useDarkMode'
import { useAnalyticsData } from '../composables/useAnalyticsData'

const { isDark } = useDarkMode()

const {
  loading,
  hasLoaded,
  error,
  campaignStatistics,
  viewOpens,
  topDomains,
  domainConfirmation,
  topLocalParts,
  loadAnalytics,
} = useAnalyticsData()

const formatCount = (value) => new Intl.NumberFormat().format(Number(value) || 0)

const toPercent = (value) => {
  const numericValue = Number(value) || 0
  return numericValue <= 1 ? numericValue * 100 : numericValue
}

const formatPercentage = (value) => `${toPercent(value).toFixed(1)}%`

const clampPercentage = (value) => Math.max(0, Math.min(100, toPercent(value)))

const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Unknown date'
  }

  let date

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(dateValue)
  }

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date'
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(date)
}

const calcRate = (numerator, denominator) => {
  const total = Number(denominator) || 0
  if (total <= 0) {
    return 0
  }

  return ((Number(numerator) || 0) / total) * 100
}

const averageOpenRate = computed(() => {
  if (!viewOpens.value.length) {
    return 0
  }

  const totalRate = viewOpens.value.reduce((sum, item) => sum + (Number(item.rate) || 0), 0)
  return totalRate / viewOpens.value.length
})

const metrics = computed(() => {
  const totalCampaigns = campaignStatistics.value.length
  const totalSent = campaignStatistics.value.reduce((sum, item) => sum + (Number(item.sent) || 0), 0)
  const totalViews = campaignStatistics.value.reduce((sum, item) => sum + (Number(item.uniqueViews) || 0), 0)
  const totalClicks = campaignStatistics.value.reduce((sum, item) => sum + (Number(item.totalClicks) || 0), 0)
  const totalBounces = campaignStatistics.value.reduce((sum, item) => sum + (Number(item.bounces) || 0), 0)

  return [
    {
      id: 'campaigns',
      label: 'Campaigns tracked',
      value: formatCount(totalCampaigns),
      description: 'Campaign records returned by the analytics service.',
      icon: 'plane',
    },
    {
      id: 'sent',
      label: 'Messages sent',
      value: formatCount(totalSent),
      description: 'Total messages represented in the campaign stats feed.',
      icon: 'time',
    },
    {
      id: 'views',
      label: 'Unique views',
      value: formatCount(totalViews),
      description: `Average ${formatPercentage(averageOpenRate.value)} across view-open analytics rows.`,
      icon: 'rate',
    },
    {
      id: 'clicks',
      label: 'Total clicks',
      value: formatCount(totalClicks),
      description: `Bounces recorded: ${formatCount(totalBounces)}.`,
      icon: 'chart',
    },
  ]
})

const domainConfirmationItems = computed(() => domainConfirmation.value?.items ?? [])

const campaignChartItems = computed(() =>
  [...campaignStatistics.value]
    .sort((left, right) => (Number(right.uniqueViews) || 0) - (Number(left.uniqueViews) || 0))
    .slice(0, 8)
)

const campaignChartSeries = computed(() => [
  {
    name: 'Unique views',
    data: campaignChartItems.value.map((item) => Number(item.uniqueViews) || 0),
  },
  {
    name: 'Clicks',
    data: campaignChartItems.value.map((item) => Number(item.totalClicks) || 0),
  },
])

const campaignChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    zoom: { enabled: false },
    fontFamily: 'inherit',
  },
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '44%',
      borderRadius: 4,
    },
  },
  dataLabels: {
    enabled: false,
  },
  colors: ['#2563eb', '#10b981'],
  grid: {
    borderColor: isDark.value ? '#334155' : '#e5e7eb',
    strokeDashArray: 4,
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    labels: {
      colors: isDark.value ? '#cbd5e1' : '#374151',
    },
  },
  xaxis: {
    categories: campaignChartItems.value.map((item) => item.subject || `#${item.campaignId}`),
    labels: {
      rotate: -30,
      trim: true,
      style: {
        colors: '#64748b',
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: '#64748b',
        fontSize: '12px',
      },
      formatter: (value) => Math.round(value).toLocaleString(),
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    theme: isDark.value ? 'dark' : 'light',
    y: {
      formatter: (value) => new Intl.NumberFormat().format(Number(value) || 0),
    },
  },
}))

onMounted(loadAnalytics)
</script>
