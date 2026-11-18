<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('lists.add_subscribers.title')"
      max-width="lg"
      @close="close"
  >
      <form class="px-4 pt-5 pb-4 sm:p-6 space-y-4" @submit.prevent="submitAddSubscribers">
            <div>
              <label for="subscriber-emails" class="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('lists.add_subscribers.emails') }}
              </label>
              <textarea
                  id="subscriber-emails"
                  v-model.trim="addSubsForm.emails"
                  rows="8"
                  :placeholder="t('lists.add_subscribers.emails_placeholder')"
                  :class="fieldInputClass('emails', 'mt-1 block w-full rounded-md dark:bg-slate-800 dark:text-slate-100 px-3 py-2 shadow-sm focus:outline-none sm:text-sm')"
              ></textarea>
              <FieldError :messages="fieldErrors('emails')" />
              <p class="mt-1 text-xs text-slate-500 dark:text-slate-350">
                {{ t('lists.add_subscribers.emails_help') }}
              </p>
            </div>

            <label class="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                  v-model="addSubsForm.autoConfirm"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-ext-wf1 accent-ext-wf1"
              />
              {{ t('lists.add_subscribers.auto_confirm') }}
            </label>

            <p v-if="addSubsError" class="text-sm text-red-600 dark:text-red-400">
              {{ addSubsError }}
            </p>
            <FieldError :messages="generalErrors(KNOWN_FIELDS)" />
      </form>

    <template #footer>
      <button
          type="button"
          :disabled="addingSubscribers || !addSubsForm.emails.trim()"
          class="w-full inline-flex justify-center rounded-md border border-transparent bg-ext-wf1 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto sm:text-sm disabled:opacity-50"
          @click="submitAddSubscribers"
      >
        {{ addingSubscribers ? t('lists.add_subscribers.adding') : t('lists.add_subscribers.submit') }}
      </button>

      <button
          type="button"
          class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-base font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
          @click="close"
      >
        {{ t('common.cancel') }}
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../base/BaseModal.vue'
import FieldError from '../base/FieldError.vue'
import { subscriptionClient } from '../../api'
import { useApiValidationErrors } from '../../composables/useApiValidationErrors'

const { t } = useI18n()

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

const KNOWN_FIELDS = ['emails']

const { fieldErrors, fieldInputClass, generalErrors, setErrorsFromError, clearErrors, hasFieldErrors } = useApiValidationErrors()
const addSubsForm = ref({
  emails: '',
  autoConfirm: false
})

const resetAddSubsForm = () => {
  addSubsForm.value = {
    emails: '',
    autoConfirm: false
  }
  addSubsError.value = ''
  clearErrors()
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
    addSubsError.value = t('lists.add_subscribers.errors.no_list')
    return
  }

  const emails = parseEmails(addSubsForm.value.emails)

  if (!emails.length) {
    addSubsError.value = t('lists.add_subscribers.errors.email_required')
    return
  }

  const invalidEmails = emails.filter(email => !isValidEmail(email))
  if (invalidEmails.length) {
    addSubsError.value = t('lists.add_subscribers.errors.invalid_emails', { emails: invalidEmails.join(', ') })
    return
  }

  addingSubscribers.value = true
  addSubsError.value = ''
  clearErrors()

  try {
    await subscriptionClient.createSubscriptions(emails, props.list.id, addSubsForm.value.autoConfirm)
    emit('added')
    emit('close')
  } catch (error) {
    setErrorsFromError(error)
    addSubsError.value = hasFieldErrors.value ? '' : (error?.message || t('lists.add_subscribers.errors.failed'))
  } finally {
    addingSubscribers.value = false
  }
}
</script>
