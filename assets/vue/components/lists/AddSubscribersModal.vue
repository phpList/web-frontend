<template>
  <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      aria-labelledby="add-subscribers-modal-title"
      role="dialog"
      aria-modal="true"
  >
    <div
        class="fixed inset-0 bg-slate-900/50 transition-opacity"
        aria-hidden="true"
        @click="close"
    ></div>

    <div
        class="relative z-10 w-full overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:max-w-lg sm:w-full"
    >
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
        <div class="flex items-center justify-between">
          <h3 id="add-subscribers-modal-title" class="text-lg font-medium leading-6 text-slate-900">
            Add subscribers
          </h3>

          <button
              type="button"
              class="text-slate-400 hover:text-slate-500"
              @click="close"
          >
            <BaseIcon name="close" class="w-5 h-5" />
          </button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="submitAddSubscribers">
          <div>
            <label for="subscriber-emails" class="block text-sm font-medium text-slate-700">
              Email addresses
            </label>
            <textarea
                id="subscriber-emails"
                v-model.trim="addSubsForm.emails"
                rows="8"
                placeholder="john@example.com&#10;jane@example.com&#10;team@example.com"
                class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            ></textarea>
            <p class="mt-1 text-xs text-slate-500">
              Enter one email per line, or separate multiple emails with commas.
            </p>
          </div>

          <p v-if="addSubsError" class="text-sm text-red-600">
            {{ addSubsError }}
          </p>
        </form>
      </div>

      <div class="bg-slate-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
        <button
            type="button"
            :disabled="addingSubscribers || !addSubsForm.emails.trim()"
            class="w-full inline-flex justify-center rounded-md border border-transparent bg-ext-wf1 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
            @click="submitAddSubscribers"
        >
          {{ addingSubscribers ? 'Adding...' : 'Add subscribers' }}
        </button>

        <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
            @click="close"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseIcon from '../base/BaseIcon.vue'
import { subscriptionClient } from '../../api'

const props = defineProps({
  isOpen: Boolean,
  list: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'added'])

const addingSubscribers = ref(false)
const addSubsError = ref('')
const addSubsForm = ref({
  emails: ''
})

const resetAddSubsForm = () => {
  addSubsForm.value = {
    emails: ''
  }
  addSubsError.value = ''
}

watch(
    () => props.isOpen,
    (isOpen) => {
      if (isOpen) {
        resetAddSubsForm()
      }
    }
)

const close = () => {
  if (addingSubscribers.value) return
  emit('close')
}

const parseEmails = (raw) => {
  return raw
      .split(/[\n,;]/)
      .map(email => email.trim())
      .filter(Boolean)
}

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

const submitAddSubscribers = async () => {
  if (addingSubscribers.value) return

  if (!props.list?.id) {
    addSubsError.value = 'No mailing list selected.'
    return
  }

  const emails = parseEmails(addSubsForm.value.emails)

  if (!emails.length) {
    addSubsError.value = 'At least one email is required.'
    return
  }

  const invalidEmails = emails.filter(email => !isValidEmail(email))
  if (invalidEmails.length) {
    addSubsError.value = `Invalid email(s): ${invalidEmails.join(', ')}`
    return
  }

  addingSubscribers.value = true
  addSubsError.value = ''

  try {
    await subscriptionClient.createSubscriptions(emails, props.list.id)
    emit('added')
    emit('close')
  } catch (error) {
    addSubsError.value = error?.message || 'Failed to add subscribers to the list.'
  } finally {
    addingSubscribers.value = false
  }
}
</script>
