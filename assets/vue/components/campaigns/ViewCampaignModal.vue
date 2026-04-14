<template>
  <div
      v-if="isViewModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="emit('close')"
  >
    <div class="w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
      <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h3 class="text-lg font-semibold text-slate-900">Campaign details: {{ campaign?.id || '-' }}</h3>
        <button
            type="button"
            class="text-sm text-slate-500 hover:text-slate-700"
            @click="emit('close')"
        >
          Close
        </button>
      </div>

      <div class="p-5">
        <p v-if="isViewLoading" class="text-sm text-slate-500">
          Loading campaign...
        </p>

        <p v-else-if="viewErrorMessage" class="text-sm text-red-600">
          {{ viewErrorMessage }}
        </p>

        <div v-else-if="campaign" class="space-y-2 text-sm text-slate-700">
          <p>
            <span class="font-medium text-slate-900">Subject:</span>
            {{ campaign?.messageContent?.subject || '-' }}
          </p>

          <p>
            <span class="font-medium text-slate-900">Entered:</span>
            {{ formatDate(campaign?.messageMetadata?.entered || null) }}
          </p>

          <p>
            <span class="font-medium text-slate-900">From:</span>
            {{ campaign?.messageOptions?.fromField || '-' }}
          </p>

          <div class="pt-2">
            <p class="font-medium text-slate-900">HTML content</p>
            <pre class="mt-1 max-h-52 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap">{{
                campaign?.messageContent?.text || '-'
              }}</pre>
          </div>

          <div class="pt-2">
            <p class="font-medium text-slate-900">Text content</p>
            <pre class="mt-1 max-h-52 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap">{{
                campaign?.messageContent?.textMessage || '-'
              }}</pre>
          </div>

          <div class="pt-2">
            <p class="font-medium text-slate-900">Footer</p>
            <pre class="mt-1 max-h-52 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs whitespace-pre-wrap">{{
                campaign?.messageContent?.footer || '-'
              }}</pre>
          </div>

          <p v-if="campaign?.messageSchedule?.requeueInterval">
            <span class="font-medium text-slate-900">Requeueing:</span>
            {{ getMessage(campaign?.messageSchedule) }}
          </p>

          <div class="mt-6 border-t border-slate-200 pt-4">
            <p class="mb-2 font-medium text-slate-900">
              Resend campaign
              <span class="ml-2 text-xs font-light text-slate-600">
                Choose mailing lists
              </span>
            </p>

            <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div class="flex-1">
                <div
                    class="max-h-44 overflow-auto rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm"
                >
                  <label
                      v-for="list in mailingLists"
                      :key="list.id"
                      :for="`mailing-list-${list.id}`"
                      class="flex items-center gap-2 py-1"
                  >
                    <input
                        :id="`mailing-list-${list.id}`"
                        v-model="selectedMailingListIds"
                        type="checkbox"
                        :value="list.id"
                        class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                    >
                    <span>{{ list.name }}</span>
                  </label>

                  <p v-if="mailingLists.length === 0" class="py-1 text-slate-500">
                    No mailing lists found.
                  </p>
                </div>
              </div>

              <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  :disabled="selectedMailingListIds.length === 0 || isResending"
                  @click="handleResend"
              >
                {{ isResending ? 'Sending...' : 'Send to lists' }}
              </button>
            </div>

            <p v-if="resendErrorMessage" class="mt-2 text-sm text-red-600">
              {{ resendErrorMessage }}
            </p>
          </div>
        </div>

        <p v-else class="text-sm text-slate-500">
          No campaign selected.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  isViewModalOpen: {
    type: Boolean,
    default: false
  },
  campaign: {
    type: Object,
    default: null
  },
  isViewLoading: {
    type: Boolean,
    default: false
  },
  viewErrorMessage: {
    type: String,
    default: ''
  },

  mailingLists: {
    type: Array,
    default: () => []
  },
  isResending: {
    type: Boolean,
    default: false
  },
  resendErrorMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'resend'])

const selectedMailingListIds = ref([])

watch(
    () => props.isViewModalOpen,
    (isOpen) => {
      if (isOpen) {
        selectedMailingListIds.value = []
      }
    }
)

function handleResend() {
  if (!props.campaign?.id || selectedMailingListIds.value.length === 0) return

  const listIds = selectedMailingListIds.value
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value))

  emit('resend', listIds)
}

function getMessage(schedule) {
  const interval = schedule.requeueInterval ?? schedule.repeatInterval
  if (!interval) return 'Invalid interval'

  const end = new Date(
      typeof schedule.repeatUntil === 'string'
          ? schedule.repeatUntil.replace(' ', 'T')
          : schedule.repeatUntil
  )

  if (isNaN(end)) return 'Invalid date'

  const minutes = end.getMinutes()
  const flooredMinutes = minutes - (minutes % interval)

  const final = new Date(end)
  final.setMinutes(flooredMinutes, 0, 0)

  return `every ${interval} minutes until ${final.toLocaleString()}`
}

function formatDate(value) {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString()
}
</script>
