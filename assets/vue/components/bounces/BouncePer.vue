<template>
  <div class="space-y-6 pb-4">
    <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-300 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ t('bounces.per.by_subscriber') }}</h3>
      </div>

      <BaseDataTable
          :items="normalizedSubscriberBounces"
          :is-loading="isLoadingSubscribers"
          :load-error="subscriberErrorMessage"
          :loading-message="t('bounces.per.loading_subscribers')"
          :empty-message="t('bounces.per.empty_subscribers')"
          :colspan="5"
          :row-key="(item) => item.subscriberId"
      >
        <template #head>
          <th class="px-6 py-4">{{ t('bounces.table.subscriber') }}</th>
          <th class="px-6 py-4">{{ t('bounces.per.email') }}</th>
          <th class="px-6 py-4">{{ t('bounces.per.confirmed') }}</th>
          <th class="px-6 py-4">{{ t('bounces.per.blacklisted') }}</th>
          <th class="px-6 py-4 text-right">{{ t('bounces.per.total') }}</th>
        </template>

        <template #row="{ item: subscriber }">
          <td class="px-6 py-4 text-slate-700 dark:text-slate-200 font-mono">#{{ subscriber.subscriberId }}</td>
          <td class="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">{{ subscriber.email }}</td>
          <td class="px-6 py-4">
            <BaseBadge :variant="subscriber.confirmed ? 'success' : 'neutral'">
              {{ subscriber.confirmed ? t('bounces.yes') : t('bounces.no') }}
            </BaseBadge>
          </td>
          <td class="px-6 py-4">
            <BaseBadge :variant="subscriber.blacklisted ? 'danger' : 'neutral'">
              {{ subscriber.blacklisted ? t('bounces.yes') : t('bounces.no') }}
            </BaseBadge>
          </td>
          <td class="px-6 py-4 text-right text-slate-900 dark:text-slate-100 font-semibold">{{ subscriber.totalBounces }}</td>
        </template>

        <template #card="{ item: subscriber }">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-slate-900 dark:text-slate-100">#{{ subscriber.subscriberId }}</p>
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ subscriber.totalBounces }}</p>
          </div>
          <p class="text-sm text-slate-800 dark:text-slate-100">{{ subscriber.email }}</p>
          <div class="flex items-center gap-2 text-xs">
            <BaseBadge :variant="subscriber.confirmed ? 'success' : 'neutral'">
              {{ t('bounces.per.confirmed_value', { value: subscriber.confirmed ? t('bounces.yes') : t('bounces.no') }) }}
            </BaseBadge>
            <BaseBadge :variant="subscriber.blacklisted ? 'danger' : 'neutral'">
              {{ t('bounces.per.blacklisted_value', { value: subscriber.blacklisted ? t('bounces.yes') : t('bounces.no') }) }}
            </BaseBadge>
          </div>
        </template>
      </BaseDataTable>
    </div>

    <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-300 dark:border-slate-700">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ t('bounces.per.by_campaign') }}</h3>
      </div>

      <BaseDataTable
          :items="normalizedCampaignBounces"
          :is-loading="isLoadingCampaigns"
          :load-error="campaignErrorMessage"
          :loading-message="t('bounces.per.loading_campaigns')"
          :empty-message="t('bounces.per.empty_campaigns')"
          :colspan="3"
          :row-key="(item) => item.messageId"
      >
        <template #head>
          <th class="px-6 py-4">{{ t('bounces.table.campaign') }}</th>
          <th class="px-6 py-4">{{ t('bounces.per.subject') }}</th>
          <th class="px-6 py-4 text-right">{{ t('bounces.per.total') }}</th>
        </template>

        <template #row="{ item: campaign }">
          <td class="px-6 py-4 text-slate-700 dark:text-slate-200 font-mono">#{{ campaign.messageId }}</td>
          <td class="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">{{ campaign.subject }}</td>
          <td class="px-6 py-4 text-right text-slate-900 dark:text-slate-100 font-semibold">{{ campaign.totalBounces }}</td>
        </template>

        <template #card="{ item: campaign }">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-slate-900 dark:text-slate-100">#{{ campaign.messageId }}</p>
            <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ campaign.totalBounces }}</p>
          </div>
          <p class="text-sm text-slate-800 dark:text-slate-100">{{ campaign.subject }}</p>
        </template>
      </BaseDataTable>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { bouncesClient } from '../../api'
import BaseBadge from '../base/BaseBadge.vue'
import BaseDataTable from '../base/BaseDataTable.vue'

const { t } = useI18n()

const bouncesPerCampaign = ref([])
const bouncesPerSubscriber = ref([])
const isLoadingCampaigns = ref(false)
const isLoadingSubscribers = ref(false)
const campaignErrorMessage = ref('')
const subscriberErrorMessage = ref('')

const normalizeBoolean = (value) => value === true || value === 1 || value === '1'

const normalizedCampaignBounces = computed(() => (
  Array.isArray(bouncesPerCampaign.value)
    ? bouncesPerCampaign.value.map((item) => ({
      messageId: item.message_id ?? 'N/A',
      subject: item.subject ?? t('bounces.no_subject'),
      totalBounces: Number(item.total_bounces ?? 0),
    }))
    : []
))

const normalizedSubscriberBounces = computed(() => (
  Array.isArray(bouncesPerSubscriber.value)
    ? bouncesPerSubscriber.value.map((item) => ({
      subscriberId: item.subscriber_id ?? 'N/A',
      email: item.email ?? t('bounces.unknown_email'),
      confirmed: normalizeBoolean(item.confirmed),
      blacklisted: normalizeBoolean(item.blacklisted),
      totalBounces: Number(item.total_bounces ?? 0),
    }))
    : []
))

const loadBouncePerCampaign = async () => {
  isLoadingCampaigns.value = true
  campaignErrorMessage.value = ''

  try {
    const bounces = await bouncesClient.listByCampaign()
    bouncesPerCampaign.value = Array.isArray(bounces) ? bounces : []
  } catch (error) {
    campaignErrorMessage.value = error?.message ?? t('bounces.per.load_campaigns_failed')
    bouncesPerCampaign.value = []
  } finally {
    isLoadingCampaigns.value = false
  }
}

const loadBouncePerSubscriber = async () => {
  isLoadingSubscribers.value = true
  subscriberErrorMessage.value = ''

  try {
    const bounces = await bouncesClient.listBySubscriber()
    bouncesPerSubscriber.value = Array.isArray(bounces) ? bounces : []
  } catch (error) {
    subscriberErrorMessage.value = error?.message ?? t('bounces.per.load_subscribers_failed')
    bouncesPerSubscriber.value = []
  } finally {
    isLoadingSubscribers.value = false
  }
}

onMounted(() => {
  loadBouncePerCampaign()
  loadBouncePerSubscriber()
})
</script>
