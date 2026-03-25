<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
    aria-labelledby="create-list-modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" @click="close"></div>

    <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg sm:w-full z-10">
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
        <div class="flex justify-between items-center">
          <h3 id="create-list-modal-title" class="text-lg leading-6 font-medium text-slate-900">
            Create New List
          </h3>
          <button type="button" class="text-slate-400 hover:text-slate-500" @click="close">
            <BaseIcon name="close" class="w-5 h-5" />
          </button>
        </div>

        <form class="mt-4 space-y-4" @submit.prevent="submitCreateList">
          <div>
            <label for="list-name" class="block text-sm font-medium text-slate-700">Name</label>
            <input
              id="list-name"
              v-model.trim="createForm.name"
              type="text"
              required
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>

          <div class="flex items-center">
            <input
              id="list-public"
              v-model="createForm.public"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
            >
            <label for="list-public" class="ml-2 block text-sm text-slate-900">
              Public
            </label>
          </div>

          <div>
            <label for="list-position" class="block text-sm font-medium text-slate-700">List Position (optional)</label>
            <input
              id="list-position"
              v-model="createForm.listPosition"
              type="number"
              min="0"
              step="1"
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>

          <div>
            <label for="list-description" class="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              id="list-description"
              v-model.trim="createForm.description"
              rows="3"
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            ></textarea>
          </div>

          <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
        </form>
      </div>

      <div class="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
        <button
          type="button"
          :disabled="creatingList || !createForm.name.trim()"
          class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
          @click="submitCreateList"
        >
          {{ creatingList ? 'Creating...' : 'Create' }}
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
import { ref, watch } from 'vue'
import { Requests } from '@tatevikgr/rest-api-client'
import BaseIcon from '../base/BaseIcon.vue'
import { listClient } from '../../api'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'created'])

const creatingList = ref(false)
const createError = ref('')
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
    createError.value = 'Name is required.'
    return
  }

  const parsedPosition = createForm.value.listPosition === '' ? null : Number(createForm.value.listPosition)

  if (parsedPosition !== null && (!Number.isInteger(parsedPosition) || parsedPosition < 0)) {
    createError.value = 'List Position must be a whole number greater than or equal to 0.'
    return
  }

  creatingList.value = true
  createError.value = ''

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
    createError.value = error?.message || 'Failed to create list.'
  } finally {
    creatingList.value = false
  }
}
</script>
