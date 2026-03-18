<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" @click="close"></div>

    <!-- Modal Content -->
    <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full z-10">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <div class="flex justify-between items-center">
                <h3 class="text-lg leading-6 font-medium text-slate-900" id="modal-title">
                  Subscriber Details ID: {{ subscriber.id ?? '' }}
                </h3>
                <button type="button" class="text-slate-400 hover:text-slate-500" @click="close">
                  <BaseIcon name="close" class="w-5 h-5" />
                </button>
              </div>
              <div class="mt-4 space-y-4">
                <div v-if="loading" class="flex justify-center py-8">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <div v-else-if="error" class="text-red-500 text-sm">
                  {{ error }}
                </div>
                <form v-else @submit.prevent="save" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-slate-700">Email</label>
                    <input
                      v-model="formData.email"
                      type="email"
                      required
                      class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                  </div>
                  
                  <div class="flex items-center">
                    <input
                      id="confirmed"
                      v-model="formData.confirmed"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    >
                    <label for="confirmed" class="ml-2 block text-sm text-slate-900">
                      Confirmed
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="blacklisted"
                      v-model="formData.blacklisted"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    >
                    <label for="blacklisted" class="ml-2 block text-sm text-slate-900">
                      Blacklisted
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="htmlEmail"
                      v-model="formData.htmlEmail"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    >
                    <label for="htmlEmail" class="ml-2 block text-sm text-slate-900">
                      HTML Email
                    </label>
                  </div>

                  <div class="flex items-center">
                    <input
                      id="disabled"
                      v-model="formData.disabled"
                      type="checkbox"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                    >
                    <label for="disabled" class="ml-2 block text-sm text-slate-900">
                      Disabled
                    </label>
                  </div>
                  
                  <div v-if="subscriber && subscriber.subscribedLists" class="mt-4">
                    <label class="block text-sm font-medium text-slate-700 mb-2">Subscribed Lists</label>
                    <div class="flex flex-wrap gap-2">
                      <span
                        v-for="list in subscriber.subscribedLists"
                        :key="list.id"
                        class="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                      >
                        {{ list.name }}
                      </span>
                      <span v-if="!subscriber.subscribedLists.length" class="text-xs text-slate-500">
                        No lists
                      </span>
                    </div>
                  </div>

                  <div v-if="subscriber" class="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
                    <p>Created: {{ subscriber.createdAt }}</p>
                    <p>Updated: {{ subscriber.updatedAt === '' ? '-' : subscriber.updatedAt }}</p>
                    <p>Bounce Count: {{ subscriber.bounceCount }}</p>
                    <p>Unique ID: {{ subscriber.uniqueId }}</p>
                    <p>UUID: {{ subscriber.uuid === '' ? '-' : subscriber.uuid }}</p>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="button"
            :disabled="loading || saving"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
            @click="save"
          >
            {{ saving ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            @click="close"
          >
            Cancel
          </button>
        </div>
      </div>
  </div>
</template>

<script setup>
import BaseIcon from '../base/BaseIcon.vue'
import { ref, watch } from 'vue'
import { subscribersClient } from '../../api'

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

watch(() => props.isOpen, (newValue) => {
  if (newValue && props.subscriberId) {
    fetchSubscriberDetails()
  }
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
      disabled: !!subscriber.value.disabled
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
</script>
