<template>
  <div
    v-if="loading"
    class="flex justify-center py-8 mb-8"
  >
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
  </div>

  <div
    v-else-if="error"
    class="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400"
    role="alert"
  >
    {{ error }}
  </div>

  <section
    v-else
    class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
  >
    <div
      v-for="kpi in kpis"
      :key="kpi.id"
    >
      <KpiCard v-bind="kpi" class="h-full" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import KpiCard from './KpiCard.vue'

const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const { t, locale } = useI18n()

const formatNumber = (value) => new Intl.NumberFormat(locale.value).format(Number(value) || 0)

const formatPercentage = (value) => `${formatNumber(value)}%`

const formatChange = (value) => {
  return `${new Intl.NumberFormat(locale.value, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'exceptZero',
  }).format(Number(value) || 0)}%`
}

const toTrend = (value) => ((Number(value) || 0) < 0 ? 'down' : 'up')

const kpis = computed(() => [
  {
    id: 'subscribers',
    label: t('dashboard.kpi.total_subscribers'),
    value: formatNumber(props.summary?.totalSubscribers?.value),
    change: formatChange(props.summary?.totalSubscribers?.changeVsLastMonth),
    trend: toTrend(props.summary?.totalSubscribers?.changeVsLastMonth),
    icon: 'users',
  },
  {
    id: 'campaigns',
    label: t('dashboard.kpi.active_campaigns'),
    value: formatNumber(props.summary?.activeCampaigns?.value),
    change: formatChange(props.summary?.activeCampaigns?.changeVsLastMonth),
    trend: toTrend(props.summary?.activeCampaigns?.changeVsLastMonth),
    icon: 'plane',
  },
  {
    id: 'open-rate',
    label: t('dashboard.kpi.open_rate'),
    value: formatPercentage(props.summary?.openRate?.value),
    change: formatChange(props.summary?.openRate?.changeVsLastMonth),
    trend: toTrend(props.summary?.openRate?.changeVsLastMonth),
    icon: 'rate',
  },
  {
    id: 'bounce-rate',
    label: t('dashboard.kpi.bounce_rate'),
    value: formatPercentage(props.summary?.bounceRate?.value),
    change: formatChange(props.summary?.bounceRate?.changeVsLastMonth),
    trend: toTrend(props.summary?.bounceRate?.changeVsLastMonth),
    icon: 'warning',
  },
])
</script>
