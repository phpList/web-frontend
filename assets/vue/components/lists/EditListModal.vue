<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('lists.edit.title')"
      max-width="xl"
      @close="close"
  >
    <form class="px-4 pt-5 pb-4 sm:p-6 space-y-4" @submit.prevent="submitEditList">
            <div>
              <label for="list-name" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.name') }}</label>
              <input
                id="list-name"
                v-model.trim="editForm.name"
                type="text"
                required
                :class="fieldInputClass('name', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('name')" />
            </div>

            <div class="flex items-center">
              <input
                id="list-public"
                v-model="editForm.public"
                type="checkbox"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded accent-ext-wf1"
              >
              <label for="list-public" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
                {{ t('lists.form.public') }}
              </label>
            </div>

            <div>
              <label for="list-position" class="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('lists.form.list_position') }}
              </label>
              <input
                id="list-position"
                v-model="editForm.listPosition"
                type="number"
                min="0"
                step="1"
                :class="fieldInputClass('list_position', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('list_position')" />
            </div>

            <div>
              <label for="list-description" class="block text-sm font-medium text-slate-700 dark:text-slate-200">
                {{ t('lists.form.description') }}
              </label>
              <textarea
                id="list-description"
                v-model.trim="editForm.description"
                rows="3"
                :class="fieldInputClass('description', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              ></textarea>
              <FieldError :messages="fieldErrors('description')" />
            </div>

            <div>
              <label for="list-category" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.category') }}</label>
              <input
                id="list-category"
                v-model.trim="editForm.category"
                type="text"
                :class="fieldInputClass('category', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('category')" />
            </div>

            <div>
              <label for="list-rss" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.rss_feed') }}</label>
              <input
                id="list-rss"
                v-model.trim="editForm.rssFeed"
                type="text"
                :class="fieldInputClass('rss_feed', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('rss_feed')" />
            </div>

            <div>
              <label for="list-prefix" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('lists.form.subject_prefix') }}</label>
              <input
                id="list-prefix"
                v-model.trim="editForm.subjectPrefix"
                type="text"
                :class="fieldInputClass('subject_prefix', 'mt-1 block w-full dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm')"
              >
              <FieldError :messages="fieldErrors('subject_prefix')" />
            </div>

            <p v-if="editError" class="text-sm text-red-600 dark:text-red-400">{{ editError }}</p>
            <FieldError :messages="generalErrors(KNOWN_FIELDS)" />
    </form>

    <template #footer>
      <button
          type="button"
          :disabled="updatingList || !editForm.name.trim()"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
          @click="submitEditList"
      >
        {{ updatingList ? t('common.saving') : t('common.save') }}
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
  isOpen: Boolean,
  list: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const updatingList = ref(false)
const editError = ref('')

const KNOWN_FIELDS = ['name', 'list_position', 'description', 'category', 'rss_feed', 'subject_prefix']

const { fieldErrors, fieldInputClass, generalErrors, setErrorsFromError, clearErrors, hasFieldErrors } =
  useApiValidationErrors()
const editForm = ref({
  name: '',
  public: false,
  listPosition: '',
  description: '',
  category: '',
  rssFeed: '',
  subjectPrefix: ''
})

const fillEditForm = () => {
  const sourcePosition = props.list?.listPosition ?? props.list?.list_position

  editForm.value = {
    name: props.list?.name || '',
    public: !!props.list?.public,
    listPosition: sourcePosition == null ? '' : String(sourcePosition),
    description: props.list?.description || '',
    category: props.list?.category || '',
    rssFeed: props.list?.rss_feed || '',
    subjectPrefix: props.list?.subject_prefix || ''
  }
  editError.value = ''
  clearErrors()
}

watch(
    () => [props.isOpen, props.list],
    ([isOpen]) => {
      if (isOpen) {
        fillEditForm()
      }
    },
    { immediate: true }
)

const close = () => {
  if (updatingList.value) {
    return
  }

  emit('close')
}

const submitEditList = async () => {
  if (updatingList.value || !props.list?.id) {
    return
  }

  const name = editForm.value.name.trim()
  if (!name) {
    editError.value = t('lists.form.errors.name_required')
    return
  }

  let parsedPosition = null
  if (String(editForm.value.listPosition).trim() !== '') {
    parsedPosition = Number(editForm.value.listPosition)
  }

  if (parsedPosition !== null && (!Number.isInteger(parsedPosition) || parsedPosition < 0)) {
    editError.value = t('lists.form.errors.position_invalid')
    return
  }

  updatingList.value = true
  editError.value = ''
  clearErrors()

  try {
    const request = new Requests.CreateSubscriberListRequest(
      name,
      !!editForm.value.public,
      parsedPosition,
      editForm.value.description.trim() || null,
      editForm.value.subjectPrefix.trim() || null,
      editForm.value.rssFeed.trim() || null,
      editForm.value.category.trim() || null,
    )

    const updatedList = await listClient.updateList(props.list.id, request)
    emit('updated', updatedList)
    emit('close')
  } catch (error) {
    setErrorsFromError(error)
    editError.value = hasFieldErrors.value ? '' : (error?.message || t('lists.edit.errors.failed'))
  } finally {
    updatingList.value = false
  }
}
</script>
