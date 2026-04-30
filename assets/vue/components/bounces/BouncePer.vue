<template>
  <div class="space-y-6 pb-4">
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100">
        <h3 class="text-base font-semibold text-slate-900">Bounces By Subscriber</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm hidden md:table">
          <thead class="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th class="px-6 py-4">Subscriber</th>
              <th class="px-6 py-4">Email</th>
              <th class="px-6 py-4">Confirmed</th>
              <th class="px-6 py-4">Blacklisted</th>
              <th class="px-6 py-4 text-right">Total Bounces</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoadingSubscribers">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">Loading subscriber bounce data...</td>
            </tr>
            <tr v-else-if="subscriberErrorMessage">
              <td colspan="5" class="px-6 py-8 text-center text-red-600">{{ subscriberErrorMessage }}</td>
            </tr>
            <tr v-else-if="normalizedSubscriberBounces.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-slate-500">No subscriber bounce data found.</td>
            </tr>
            <tr
              v-for="subscriber in normalizedSubscriberBounces"
              :key="subscriber.subscriberId"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 text-slate-700 font-mono">#{{ subscriber.subscriberId }}</td>
              <td class="px-6 py-4 text-slate-900 font-medium">{{ subscriber.email }}</td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="subscriber.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ subscriber.confirmed ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="subscriber.blacklisted ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ subscriber.blacklisted ? 'Yes' : 'No' }}
                </span>
              </td>
              <td class="px-6 py-4 text-right text-slate-900 font-semibold">{{ subscriber.totalBounces }}</td>
            </tr>
          </tbody>
        </table>

        <div class="block md:hidden divide-y divide-slate-100">
          <div v-if="isLoadingSubscribers" class="px-4 py-8 text-center text-slate-500 text-sm">
            Loading subscriber bounce data...
          </div>
          <div v-else-if="subscriberErrorMessage" class="px-4 py-8 text-center text-red-600 text-sm">
            {{ subscriberErrorMessage }}
          </div>
          <div v-else-if="normalizedSubscriberBounces.length === 0" class="px-4 py-8 text-center text-slate-500 text-sm">
            No subscriber bounce data found.
          </div>
          <div
            v-for="subscriber in normalizedSubscriberBounces"
            :key="`mobile-subscriber-${subscriber.subscriberId}`"
            class="p-4 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-slate-900">#{{ subscriber.subscriberId }}</p>
              <p class="text-sm font-semibold text-slate-900">{{ subscriber.totalBounces }}</p>
            </div>
            <p class="text-sm text-slate-800">{{ subscriber.email }}</p>
            <div class="flex items-center gap-2 text-xs">
              <span
                class="px-2 py-0.5 rounded-full font-medium"
                :class="subscriber.confirmed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'"
              >
                Confirmed: {{ subscriber.confirmed ? 'Yes' : 'No' }}
              </span>
              <span
                class="px-2 py-0.5 rounded-full font-medium"
                :class="subscriber.blacklisted ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'"
              >
                Blacklisted: {{ subscriber.blacklisted ? 'Yes' : 'No' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-100">
        <h3 class="text-base font-semibold text-slate-900">Bounces By Campaign</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm hidden md:table">
          <thead class="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th class="px-6 py-4">Campaign</th>
              <th class="px-6 py-4">Subject</th>
              <th class="px-6 py-4 text-right">Total Bounces</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-if="isLoadingCampaigns">
              <td colspan="3" class="px-6 py-8 text-center text-slate-500">Loading campaign bounce data...</td>
            </tr>
            <tr v-else-if="campaignErrorMessage">
              <td colspan="3" class="px-6 py-8 text-center text-red-600">{{ campaignErrorMessage }}</td>
            </tr>
            <tr v-else-if="normalizedCampaignBounces.length === 0">
              <td colspan="3" class="px-6 py-8 text-center text-slate-500">No campaign bounce data found.</td>
            </tr>
            <tr
              v-for="campaign in normalizedCampaignBounces"
              :key="campaign.messageId"
              class="hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 text-slate-700 font-mono">#{{ campaign.messageId }}</td>
              <td class="px-6 py-4 text-slate-900 font-medium">{{ campaign.subject }}</td>
              <td class="px-6 py-4 text-right text-slate-900 font-semibold">{{ campaign.totalBounces }}</td>
            </tr>
          </tbody>
        </table>

        <div class="block md:hidden divide-y divide-slate-100">
          <div v-if="isLoadingCampaigns" class="px-4 py-8 text-center text-slate-500 text-sm">
            Loading campaign bounce data...
          </div>
          <div v-else-if="campaignErrorMessage" class="px-4 py-8 text-center text-red-600 text-sm">
            {{ campaignErrorMessage }}
          </div>
          <div v-else-if="normalizedCampaignBounces.length === 0" class="px-4 py-8 text-center text-slate-500 text-sm">
            No campaign bounce data found.
          </div>
          <div
            v-for="campaign in normalizedCampaignBounces"
            :key="`mobile-campaign-${campaign.messageId}`"
            class="p-4 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-slate-900">#{{ campaign.messageId }}</p>
              <p class="text-sm font-semibold text-slate-900">{{ campaign.totalBounces }}</p>
            </div>
            <p class="text-sm text-slate-800">{{ campaign.subject }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { bouncesClient } from '../../api'

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
      subject: item.subject ?? 'No subject',
      totalBounces: Number(item.total_bounces ?? 0),
    }))
    : []
))

const normalizedSubscriberBounces = computed(() => (
  Array.isArray(bouncesPerSubscriber.value)
    ? bouncesPerSubscriber.value.map((item) => ({
      subscriberId: item.subscriber_id ?? 'N/A',
      email: item.email ?? 'Unknown email',
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
    campaignErrorMessage.value = error?.message ?? 'Failed to load campaign bounce data.'
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
    subscriberErrorMessage.value = error?.message ?? 'Failed to load subscriber bounce data.'
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
