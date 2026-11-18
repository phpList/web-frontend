<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('subscribers.modal.title', { id: subscriber?.id ?? '' })"
      max-width="lg"
      @close="close"
  >
        <div class="px-4 pt-5 pb-4 sm:p-6 sm:pb-4 space-y-4">
                <div v-if="loading" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <div v-else-if="error" class="text-red-500 dark:text-red-400 text-sm">
                  {{ error }}
                </div>
                <form v-else @submit.prevent="save" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('subscribers.modal.email') }}</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      required
                      class="mt-1 block w-full border border-slate-300 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                  </div>

                  <div class="flex items-center">
                    <input
                      id="confirmed"
                      v-model="formData.confirmed"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                    >
                    <label for="confirmed" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                      {{ t('subscribers.modal.confirmed') }}
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="blacklisted"
                      v-model="formData.blacklisted"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                    >
                    <label for="blacklisted" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                      {{ t('subscribers.modal.blacklisted') }}
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="htmlEmail"
                      v-model="formData.htmlEmail"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                    >
                    <label for="htmlEmail" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                      {{ t('subscribers.modal.html_email') }}
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="disabled"
                      v-model="formData.disabled"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                    >
                    <label for="disabled" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                      {{ t('subscribers.modal.disabled') }}
                    </label>
                  </div>

                  <div v-if="subscriber && subscriber.subscribedLists" class="mt-4">
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">{{ t('subscribers.modal.subscribed_lists') }}</label>
                    <div class="flex flex-wrap gap-2">
                      <BaseBadge
                        v-for="list in subscriber.subscribedLists"
                        :key="list.id"
                        variant="info"
                      >
                        {{ list.name }}
                      </BaseBadge>
                      <span v-if="!subscriber.subscribedLists.length" class="text-xs text-slate-500 dark:text-slate-350">
                        {{ t('subscribers.modal.no_lists') }}
                      </span>
                    </div>
                  </div>

                  <div v-if="subscriber" class="text-xs text-slate-400 dark:text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <p>{{ t('subscribers.modal.created', { value: subscriber.createdAt }) }}</p>
                    <p>{{ t('subscribers.modal.updated', { value: subscriber.updatedAt === '' ? '-' : subscriber.updatedAt }) }}</p>
                    <p>{{ t('subscribers.modal.bounce_count', { value: subscriber.bounceCount }) }}</p>
                    <p>{{ t('subscribers.modal.unique_id', { value: subscriber.uniqueId }) }}</p>
                    <p>{{ t('subscribers.modal.uuid', { value: subscriber.uuid === '' ? '-' : subscriber.uuid }) }}</p>
                  </div>
                </form>
        </div>

    <template #footer>
      <button
          type="button"
          :disabled="loading || saving"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
          @click="save"
      >
        {{ saving ? t('common.saving') : t('common.save') }}
      </button>
      <button
          type="button"
          class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
          @click="close"
      >
        {{ t('common.cancel') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from '../base/BaseModal.vue'
import BaseBadge from '../base/BaseBadge.vue'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { subscribersClient } from '../../api'

const { t } = useI18n()

const props = defineProps({
  isOpen: Boolean,
  subscriberId: Number
})

const emit = defineEmits(['close', 'updated'])

const loading = ref(false)
const saving = ref(false)
const error = ref(null)
const subscriber = ref(null)
const formData = ref({
  email: '',
  confirmed: false,
  blacklisted: false,
  htmlEmail: false,
  disabled: false
})

const fetchSubscriberDetails = async () => {
  loading.value = true
  error.value = null
  try {
    subscriber.value = await subscribersClient.getSubscriber(props.subscriberId)
    
    // Update formData
    formData.value = {
      email: subscriber.value.email,
      confirmed: !!subscriber.value.confirmed,
      blacklisted: !!subscriber.value.blacklisted,
      htmlEmail: !!subscriber.value.htmlEmail,
      disabled: !!subscriber.value.disabled,
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const save = async () => {
  saving.value = true
  error.value = null
  try {
    const updatedSubscriber = await subscribersClient.updateSubscriber(props.subscriberId, formData.value)
    emit('updated', updatedSubscriber)
    close()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('close')
}

watch(
    () => [props.isOpen, props.subscriberId],
    ([isOpen, subscriberId]) => {
      if (isOpen && subscriberId) {
        fetchSubscriberDetails()
      }
    },
    { immediate: true }
)
</script>
