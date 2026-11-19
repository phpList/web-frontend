<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('lists.create.title')"
      max-width="xl"
      @close="close"
  >
    <form class="px-4 pt-5 pb-4 sm:p-6 space-y-4" @submit.prevent="submitCreateList">
            <div>
              <label for="list-name" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.name') }}</label>
              <input
                id="list-name"
                v-model.trim="createForm.name"
                type="text"
                required
                :class="fieldInputClass('name', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('name')" />
            </div>

            <div class="flex items-center">
              <input
                id="list-public"
                v-model="createForm.public"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded accent-ext-wf1"
              >
              <label for="list-public" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                {{ t('lists.form.public') }}
              </label>
            </div>

            <div>
              <label for="list-position" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.list_position') }}</label>
              <input
                id="list-position"
                v-model="createForm.listPosition"
                type="number"
                min="0"
                step="1"
                :class="fieldInputClass('list_position', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('list_position')" />
            </div>

            <div>
              <label for="list-description" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.description') }}</label>
              <textarea
                id="list-description"
                v-model.trim="createForm.description"
                rows="3"
                :class="fieldInputClass('description', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              ></textarea>
              <FieldError :messages="fieldErrors('description')" />
            </div>

            <p v-if="createError" class="text-sm text-red-600 dark:text-red-400">{{ createError }}</p>
            <FieldError :messages="generalErrors(KNOWN_FIELDS)" />
    </form>

    <template #footer>
      <button
          type="button"
          :disabled="creatingList || !createForm.name.trim()"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
          @click="submitCreateList"
      >
        {{ creatingList ? t('lists.create.creating') : t('lists.create.submit') }}
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
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Requests } from '@tatevikgr/rest-api-client'
import BaseModal from '../base/BaseModal.vue'
import FieldError from '../base/FieldError.vue'
import { listClient } from '../../api'
import { useApiValidationErrors } from '../../composables/useApiValidationErrors'

const { t } = useI18n()

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'created'])

const creatingList = ref(false)
const createError = ref('')

const KNOWN_FIELDS = ['name', 'list_position', 'description']

const { fieldErrors, fieldInputClass, generalErrors, setErrorsFromError, clearErrors, hasFieldErrors } =
  useApiValidationErrors()
const createForm = ref({
  name: '',
  public: false,
  listPosition: '',
  description: ''
})

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    public: false,
    listPosition: '',
    description: ''
  }
  createError.value = ''
  clearErrors()
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      resetCreateForm()
    }
  }
)

const close = () => {
  if (creatingList.value) {
    return
  }

  emit('close')
}

const submitCreateList = async () => {
  if (creatingList.value) {
    return
  }

  const name = createForm.value.name.trim()
  if (!name) {
    createError.value = t('lists.form.errors.name_required')
    return
  }

  const parsedPosition = createForm.value.listPosition === '' ? null : Number(createForm.value.listPosition)

  if (parsedPosition !== null && (!Number.isInteger(parsedPosition) || parsedPosition < 0)) {
    createError.value = t('lists.form.errors.position_invalid')
    return
  }

  creatingList.value = true
  createError.value = ''
  clearErrors()

  try {
    const request = new Requests.CreateSubscriberListRequest(
      name,
      !!createForm.value.public,
      parsedPosition,
      createForm.value.description.trim() || null
    )

    const createdList = await listClient.createList(request)
    emit('created', createdList)
    emit('close')
  } catch (error) {
    setErrorsFromError(error)
    createError.value = hasFieldErrors.value ? '' : (error?.message || t('lists.create.errors.failed'))
  } finally {
    creatingList.value = false
  }
}
</script>
