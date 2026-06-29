<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div
        v-if="errorMessage"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        role="alert"
      >
        {{ errorMessage }}
      </div>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <BaseCard v-for="metric in metrics" :key="metric.id" class="h-full">
          <header class="mb-2 flex items-center gap-3">
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
              <BaseIcon :name="metric.icon" />
            </span>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {{ metric.label }}
            </p>
          </header>
          <p class="mb-1 text-2xl font-bold text-slate-900">
            {{ metric.value }}
          </p>
          <p class="text-sm text-slate-500">
            {{ metric.description }}
          </p>
        </BaseCard>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BaseCard class="xl:col-span-2">
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Campaign performance</h2>
              <p class="mt-1 text-xs text-slate-500">
                Top campaigns ranked by unique views and click volume.
              </p>
            </div>
            <p class="text-xs text-slate-400">
              {{ formatCount(campaignStatistics.length) }} campaigns
            </p>
          </header>

          <div v-if="isLoading" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
            Loading analytics...
          </div>

          <div v-else-if="campaignChartItems.length === 0" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
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
          <header class="mb-4">
            <h2 class="text-sm font-bold text-slate-900">Domain confirmation</h2>
            <p class="mt-1 text-xs text-slate-500">
              Confirmation coverage for the configured sending domain.
            </p>
          </header>

          <div v-if="domainConfirmation" class="space-y-4">
            <div>
              <p class="text-xs uppercase tracking-wide text-slate-500">Domain</p>
              <p class="mt-1 break-all text-sm font-semibold text-slate-900">
                {{ domainConfirmation.domain || 'Unknown domain' }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="rounded-lg bg-emerald-50 px-3 py-3">
                <p class="text-xs uppercase tracking-wide text-emerald-700">Confirmed</p>
                <p class="mt-1 text-lg font-bold text-emerald-900">
                  {{ formatCount(domainConfirmation.confirmed) }}
                </p>
              </div>
              <div class="rounded-lg bg-amber-50 px-3 py-3">
                <p class="text-xs uppercase tracking-wide text-amber-700">Unconfirmed</p>
                <p class="mt-1 text-lg font-bold text-amber-900">
                  {{ formatCount(domainConfirmation.unconfirmed) }}
                </p>
              </div>
            </div>

            <div>
              <div class="mb-2 flex items-center justify-between text-xs text-slate-500">
                <span>Confirmation rate</span>
                <span>{{ formatPercentage(domainConfirmation.confirmationRate) }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-emerald-500"
                  :style="{ width: `${clampPercentage(domainConfirmation.confirmationRate)}%` }"
                />
              </div>
            </div>

            <dl class="grid grid-cols-3 gap-3 text-sm">
              <div class="rounded-lg bg-slate-50 px-3 py-3">
                <dt class="text-xs uppercase tracking-wide text-slate-500">Total</dt>
                <dd class="mt-1 font-semibold text-slate-900">{{ formatCount(domainConfirmation.total) }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 px-3 py-3">
                <dt class="text-xs uppercase tracking-wide text-slate-500">Confirmed</dt>
                <dd class="mt-1 font-semibold text-slate-900">{{ formatCount(domainConfirmation.confirmed) }}</dd>
              </div>
              <div class="rounded-lg bg-slate-50 px-3 py-3">
                <dt class="text-xs uppercase tracking-wide text-slate-500">Unconfirmed</dt>
                <dd class="mt-1 font-semibold text-slate-900">{{ formatCount(domainConfirmation.unconfirmed) }}</dd>
              </div>
            </dl>
          </div>

          <div v-else class="flex min-h-[260px] items-center justify-center text-sm text-slate-500">
            No confirmation data found.
          </div>
        </BaseCard>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BaseCard>
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Top domains</h2>
              <p class="mt-1 text-xs text-slate-500">
                Subscriber counts by email domain.
              </p>
            </div>
            <p class="text-xs text-slate-400">
              {{ formatCount(topDomains.length) }} domains
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Domain</th>
                  <th class="px-4 py-3 text-right">Subscribers</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="!isLoading && topDomains.length === 0">
                  <td colspan="2" class="px-4 py-6 text-center text-slate-500">
                    No domain statistics found.
                  </td>
                </tr>
                <tr v-for="domain in topDomains" :key="domain.domain">
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ domain.domain || 'Unknown domain' }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700">
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
              <h2 class="text-sm font-bold text-slate-900">Top local parts</h2>
              <p class="mt-1 text-xs text-slate-500">
                Most common subscriber usernames.
              </p>
            </div>
            <p class="text-xs text-slate-400">
              {{ formatCount(topLocalParts.length) }} values
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-4 py-3">Local part</th>
                  <th class="px-4 py-3 text-right">Count</th>
                  <th class="px-4 py-3 text-right">Share</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr v-if="!isLoading && topLocalParts.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-slate-500">
                    No local-part statistics found.
                  </td>
                </tr>
                <tr v-for="part in topLocalParts" :key="part.localPart">
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ part.localPart || 'Unknown' }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700">
                    {{ formatCount(part.count) }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600">
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
            <h2 class="text-sm font-bold text-slate-900">Campaign breakdown</h2>
            <p class="mt-1 text-xs text-slate-500">
              Open and click activity by campaign.
            </p>
          </div>
          <p class="text-xs text-slate-400">
            {{ formatCount(campaignStatistics.length) }} records
          </p>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th class="px-4 py-3">Campaign</th>
                <th class="px-4 py-3 text-right">Sent</th>
                <th class="px-4 py-3 text-right">Views</th>
                <th class="px-4 py-3 text-right">Open rate</th>
                <th class="px-4 py-3 text-right">Clicks</th>
                <th class="px-4 py-3 text-right">Bounce</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="!isLoading && campaignStatistics.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-slate-500">
                  No campaign statistics found.
                </td>
              </tr>
              <tr v-for="campaign in campaignStatistics" :key="campaign.campaignId">
                <td class="px-4 py-3">
                  <div class="font-medium text-slate-900">
                    {{ campaign.subject || `Campaign #${campaign.campaignId}` }}
                  </div>
                  <div class="mt-1 text-xs text-slate-500">
                    Sent {{ campaign.dateSent ? formatDate(campaign.dateSent) : 'unknown date' }}
                  </div>
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatCount(campaign.sent) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatCount(campaign.uniqueViews) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatPercentage(calcRate(campaign.uniqueViews, campaign.sent)) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatCount(campaign.totalClicks) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
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
import { computed, onMounted, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '../layouts/AdminLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseIcon from '../components/base/BaseIcon.vue'
import { statisticsClient } from '../api'

const isLoading = ref(false)
const errorMessage = ref('')
const campaignStatistics = ref([])
const viewOpens = ref([])
const topDomains = ref([])
const domainConfirmation = ref(null)
const topLocalParts = ref([])

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

  const date = new Date(dateValue)
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
    borderColor: '#e5e7eb',
    strokeDashArray: 4,
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
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
    y: {
      formatter: (value) => new Intl.NumberFormat().format(Number(value) || 0),
    },
  },
}))

const loadAnalytics = async () => {
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
  } catch (error) {
    errorMessage.value = 'Failed to load analytics.'
    console.error('Failed to load analytics:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(loadAnalytics)
</script>
