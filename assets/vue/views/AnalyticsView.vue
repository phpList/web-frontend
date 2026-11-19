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
            <span class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-350">
              <BaseIcon :name="metric.icon" />
            </span>
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-350">
              {{ metric.label }}
            </p>
          </header>
          <p class="mb-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {{ metric.value }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-350">
            {{ metric.description }}
          </p>
        </BaseCard>
      </section>

      <PerformanceChartCard
        :chart="performanceChart"
        :loading="performanceLoading"
        :error="performanceError"
      />

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <BaseCard class="xl:col-span-2">
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">
                {{ t('analytics.top_campaigns') }}
              </h2>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ t('analytics.count_campaigns', { count: campaignStatistics.length, formatted: formatCount(campaignStatistics.length) }) }}
            </p>
          </header>

          <div v-if="loading" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-350">
            {{ t('analytics.loading') }}
          </div>

          <div v-else-if="hasLoaded && campaignChartItems.length === 0" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-350">
            {{ t('analytics.empty.campaigns') }}
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
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ t('analytics.domain_confirmation.title') }}</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-350">
                {{ t('analytics.domain_confirmation.description') }}
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ t('analytics.count_domains', { count: domainConfirmationItems.length, formatted: formatCount(domainConfirmationItems.length) }) }}
            </p>
          </header>

          <div v-if="domainConfirmationItems.length" class="space-y-5">
            <div v-for="item in domainConfirmationItems" :key="item.domain" class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <p class="break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {{ item.domain || t('analytics.unknown_domain') }}
                </p>
                <p class="whitespace-nowrap text-xs text-slate-400 dark:text-slate-500">
                  {{ t('analytics.domain_confirmation.total', { count: formatCount(item.total?.count) }) }}
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
                  <p class="uppercase tracking-wide text-emerald-900 dark:text-emerald-400">{{ t('analytics.domain_confirmation.confirmed') }}</p>
                  <p class="mt-1 font-semibold text-emerald-900 dark:text-emerald-400">
                    {{ formatCount(item.confirmed?.count) }}
                  </p>
                  <p class="text-emerald-700/70 dark:text-emerald-400/70">
                    {{ formatPercentage(item.confirmed?.percentage) }}
                  </p>
                </div>
                <div class="rounded-lg bg-amber-50 dark:bg-amber-500/10 px-2 py-2">
                  <p class="uppercase tracking-wide text-amber-900 dark:text-amber-400">{{ t('analytics.domain_confirmation.unconfirmed') }}</p>
                  <p class="mt-1 font-semibold text-amber-900 dark:text-amber-400">
                    {{ formatCount(item.unconfirmed?.count) }}
                  </p>
                  <p class="text-amber-700/70 dark:text-amber-400/70">
                    {{ formatPercentage(item.unconfirmed?.percentage) }}
                  </p>
                </div>
                <div class="rounded-lg bg-rose-50 dark:bg-rose-500/10 px-2 py-2">
                  <p class="uppercase tracking-wide text-rose-700 dark:text-rose-400">{{ t('analytics.domain_confirmation.blacklisted') }}</p>
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

          <div v-else-if="hasLoaded" class="flex min-h-[260px] items-center justify-center text-sm text-slate-500 dark:text-slate-350">
            {{ t('analytics.empty.confirmation') }}
          </div>
        </BaseCard>
      </section>

      <section class="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <BaseCard>
          <header class="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ t('analytics.top_domains.title') }}</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-350">
                {{ t('analytics.top_domains.description') }}
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ t('analytics.count_domains', { count: topDomains.length, formatted: formatCount(topDomains.length) }) }}
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-350">
                <tr>
                  <th class="px-4 py-3">{{ t('analytics.top_domains.domain') }}</th>
                  <th class="px-4 py-3 text-right">{{ t('analytics.top_domains.subscribers') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="hasLoaded && topDomains.length === 0">
                  <td colspan="2" class="px-4 py-6 text-center text-slate-500 dark:text-slate-350">
                    {{ t('analytics.empty.domains') }}
                  </td>
                </tr>
                <tr v-for="domain in topDomains" :key="domain.domain">
                  <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {{ domain.domain || t('analytics.unknown_domain') }}
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
              <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ t('analytics.local_parts.title') }}</h2>
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-350">
                {{ t('analytics.local_parts.description') }}
              </p>
            </div>
            <p class="text-xs text-slate-400 dark:text-slate-500">
              {{ t('analytics.count_values', { count: topLocalParts.length, formatted: formatCount(topLocalParts.length) }) }}
            </p>
          </header>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-350">
                <tr>
                  <th class="px-4 py-3">{{ t('analytics.local_parts.local_part') }}</th>
                  <th class="px-4 py-3 text-right">{{ t('analytics.local_parts.count') }}</th>
                  <th class="px-4 py-3 text-right">{{ t('analytics.local_parts.share') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-if="hasLoaded && topLocalParts.length === 0">
                  <td colspan="3" class="px-4 py-6 text-center text-slate-500 dark:text-slate-350">
                    {{ t('analytics.empty.local_parts') }}
                  </td>
                </tr>
                <tr v-for="part in topLocalParts" :key="part.localPart">
                  <td class="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {{ part.localPart || t('analytics.unknown') }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-700 dark:text-slate-200">
                    {{ formatCount(part.count) }}
                  </td>
                  <td class="px-4 py-3 text-right text-slate-600 dark:text-slate-350">
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
            <h2 class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ t('analytics.breakdown.title') }}</h2>
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-350">
              {{ t('analytics.breakdown.description') }}
            </p>
          </div>
          <p class="text-xs text-slate-400 dark:text-slate-500">
            {{ t('analytics.count_records', { count: campaignStatistics.length, formatted: formatCount(campaignStatistics.length) }) }}
          </p>
        </header>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-350">
              <tr>
                <th class="px-4 py-3">{{ t('analytics.breakdown.campaign') }}</th>
                <th class="px-4 py-3 text-right">{{ t('analytics.breakdown.sent') }}</th>
                <th class="px-4 py-3 text-right">{{ t('analytics.breakdown.views') }}</th>
                <th class="px-4 py-3 text-right">{{ t('analytics.breakdown.open_rate') }}</th>
                <th class="px-4 py-3 text-right">{{ t('analytics.breakdown.clicks') }}</th>
                <th class="px-4 py-3 text-right">{{ t('analytics.breakdown.bounce') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-if="hasLoaded && campaignStatistics.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-slate-500 dark:text-slate-350">
                  {{ t('analytics.empty.campaigns') }}
                </td>
              </tr>
              <tr v-for="campaign in campaignStatistics" :key="campaign.campaignId">
                <td class="px-4 py-3">
                  <div class="font-medium text-slate-900 dark:text-slate-100">
                    {{ campaign.subject || t('analytics.fallback_subject', { id: campaign.campaignId }) }}
                  </div>
                  <div class="mt-1 text-xs text-slate-500 dark:text-slate-350">
                    {{ t('analytics.breakdown.sent_on', { date: campaign.dateSent ? formatDate(campaign.dateSent) : t('analytics.unknown_date_lower') }) }}
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
import { useI18n } from 'vue-i18n'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '../layouts/AdminLayout.vue'
import BaseCard from '../components/base/BaseCard.vue'
import BaseIcon from '../components/base/BaseIcon.vue'
import PerformanceChartCard from '../components/dashboard/PerformanceChartCard.vue'
import { useDarkMode } from '../composables/useDarkMode'
import { useAnalyticsData } from '../composables/useAnalyticsData'
import { useCampaignPerformance } from '../composables/useCampaignPerformance'

const { t, locale } = useI18n()
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

const {
  chart: performanceChart,
  chartLoading: performanceLoading,
  chartError: performanceError,
  load: loadPerformance,
} = useCampaignPerformance()

const formatCount = (value) => new Intl.NumberFormat(locale.value).format(Number(value) || 0)

const toPercent = (value) => {
  const numericValue = Number(value) || 0
  return numericValue <= 1 ? numericValue * 100 : numericValue
}

const formatPercentage = (value) => `${new Intl.NumberFormat(locale.value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(toPercent(value))}%`

const clampPercentage = (value) => Math.max(0, Math.min(100, toPercent(value)))

const formatDate = (dateValue) => {
  if (!dateValue) {
    return t('analytics.unknown_date')
  }

  let date

  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    date = new Date(dateValue)
  }

  if (Number.isNaN(date.getTime())) {
    return t('analytics.unknown_date')
  }

  return new Intl.DateTimeFormat(locale.value, {
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
      label: t('analytics.metrics.campaigns.label'),
      value: formatCount(totalCampaigns),
      description: t('analytics.metrics.campaigns.description'),
      icon: 'plane',
    },
    {
      id: 'sent',
      label: t('analytics.metrics.sent.label'),
      value: formatCount(totalSent),
      description: t('analytics.metrics.sent.description'),
      icon: 'time',
    },
    {
      id: 'views',
      label: t('analytics.metrics.views.label'),
      value: formatCount(totalViews),
      description: t('analytics.metrics.views.description', { rate: formatPercentage(averageOpenRate.value) }),
      icon: 'rate',
    },
    {
      id: 'clicks',
      label: t('analytics.metrics.clicks.label'),
      value: formatCount(totalClicks),
      description: t('analytics.metrics.clicks.description', { count: formatCount(totalBounces) }),
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
    name: t('analytics.chart.unique_views'),
    data: campaignChartItems.value.map((item) => Number(item.uniqueViews) || 0),
  },
  {
    name: t('analytics.chart.clicks'),
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
  colors: ['#418FFD', '#22AE8A'],
  grid: {
    borderColor: isDark.value ? '#253746' : '#e5e7eb',
    strokeDashArray: 4,
  },
  legend: {
    show: true,
    position: 'top',
    horizontalAlign: 'right',
    fontSize: '12px',
    labels: {
      colors: isDark.value ? '#81B3E0' : '#253746',
    },
  },
  xaxis: {
    categories: campaignChartItems.value.map((item) => item.subject || `#${item.campaignId}`),
    labels: {
      rotate: -30,
      trim: true,
      style: {
        colors: isDark.value ? '#81B3E0' : '#3F607A',
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        colors: isDark.value ? '#81B3E0' : '#3F607A',
        fontSize: '12px',
      },
      formatter: (value) => Math.round(value).toLocaleString(locale.value),
    },
  },
  tooltip: {
    shared: true,
    intersect: false,
    theme: isDark.value ? 'dark' : 'light',
    y: {
      formatter: (value) => formatCount(value),
    },
  },
}))

onMounted(() => {
  loadAnalytics()
  loadPerformance()
})
</script>
