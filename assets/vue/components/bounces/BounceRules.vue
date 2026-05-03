<template>
  <div class="space-y-6 pb-4">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-slate-900">Bounce Rules</h3>
        <p class="text-xs text-slate-500 mt-0.5">
          Rules are evaluated top-to-bottom. Drag to reorder priority.
        </p>
      </div>
      <button
        type="button"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
        @click="openCreateModal"
      >
        New Rule
      </button>
    </div>

    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="hidden md:grid px-5 py-3.5 border-b border-slate-100 grid-cols-12 gap-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        <span class="col-span-1 hidden md:block">#</span>
        <span class="col-span-4 md:col-span-3">Rule</span>
        <span class="col-span-4 md:col-span-3">Pattern</span>
        <span class="col-span-4 md:col-span-2">Action</span>
        <span class="col-span-1 hidden md:block text-right">Hits</span>
        <span class="col-span-4 md:col-span-2 text-right">Status</span>
      </div>

      <div
          v-for="rule in allBounceRules"
          :key="rule.id"
          class="border-b last:border-b-0 border-slate-100 hover:bg-slate-50"
      >
        <div class="md:hidden px-5 py-4 space-y-1.5 text-sm">
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Rule -</span> <span class="text-slate-900 min-w-0 break-words">{{ rule.comment }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Pattern -</span> <span class="font-mono text-xs text-slate-500 min-w-0 break-all">{{ rule.regex }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Action -</span> <span :class="rule.actionClass" class="text-xs font-medium min-w-0 break-words">{{ rule.action }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Hits -</span> <span class="text-slate-700 min-w-0 break-words">{{ rule.count }}</span></p>
          <p class="flex items-start gap-1"><span class="font-medium text-slate-700 shrink-0">Status -</span> <span class="capitalize min-w-0 break-words">{{ rule.status }}</span></p>
        </div>

        <div class="hidden md:grid md:grid-cols-12 md:gap-4 px-5 py-4 items-center">
          <span class="col-span-1 text-xs font-mono text-slate-400">{{ rule.list_order }}</span>
          <div class="col-span-3">
          <p class="text-sm font-medium text-slate-900">{{ rule.comment }}</p>
          </div>
          <p class="col-span-3 text-xs font-mono text-slate-500" :title="rule.pattern">{{ rule.regex }}</p>
          <span class="col-span-2">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="rule.actionClass">{{ rule.action }}</span>
          </span>
          <span class="col-span-1 text-right text-sm font-semibold text-slate-700">{{ rule.count }}</span>
          <div class="col-span-2 flex justify-end items-center gap-2">
            <button
                type="button"
                class="text-xs px-2 py-1 rounded-md"
                :class="rule.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'"
            >
              {{ rule.status }}
            </button>
          </div>
        </div>
      </div>

<!--      <div class="px-5 py-3.5 flex items-center justify-between text-xs text-slate-500">-->
<!--        <span>{{ activeRulesCount }} of {{ bounceRules.length }} rules active</span>-->
<!--        <button type="button" class="hover:text-slate-700 transition-colors">Export Rules</button>-->
<!--      </div>-->
    </div>

    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
      aria-labelledby="create-bounce-rule-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div class="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" @click="closeCreateModal"></div>

      <form class="w-full sm:max-w-lg z-10" @submit.prevent="submitCreateRule">
        <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 space-y-4">
            <div class="flex justify-between items-center">
              <h3 id="create-bounce-rule-modal-title" class="text-lg leading-6 font-medium text-slate-900">
                New Bounce Rule
              </h3>
              <button type="button" class="text-slate-400 hover:text-slate-500" :disabled="isCreatingRule" @click="closeCreateModal">
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div>
              <label for="bounce-rule-regex" class="block text-sm font-medium text-slate-700">Regex</label>
              <input
                id="bounce-rule-regex"
                v-model.trim="createForm.regex"
                type="text"
                required
                :class="[
                  'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm',
                  fieldHasError('regex')
                    ? 'border border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                ]"
              >
              <p
                v-for="message in fieldErrors('regex')"
                :key="`regex-${message}`"
                class="mt-1 text-sm text-red-600"
              >
                {{ message }}
              </p>
            </div>

            <div>
              <label for="bounce-rule-comment" class="block text-sm font-medium text-slate-700">Comment (optional)</label>
              <input
                id="bounce-rule-comment"
                v-model.trim="createForm.comment"
                type="text"
                :class="[
                  'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm',
                  fieldHasError('comment')
                    ? 'border border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                ]"
              >
              <p
                v-for="message in fieldErrors('comment')"
                :key="`comment-${message}`"
                class="mt-1 text-sm text-red-600"
              >
                {{ message }}
              </p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="bounce-rule-action" class="block text-sm font-medium text-slate-700">Action</label>
                <select
                  id="bounce-rule-action"
                  v-model="createForm.action"
                  :class="[
                    'mt-1 block w-full rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none sm:text-sm',
                    fieldHasError('action')
                      ? 'border border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  ]"
                >
                  <option v-for="bounceAction in bounceActions" :key="bounceAction" :value="bounceAction">{{ bounceAction }}</option>
                </select>
                <p
                  v-for="message in fieldErrors('action')"
                  :key="`action-${message}`"
                  class="mt-1 text-sm text-red-600"
                >
                  {{ message }}
                </p>
              </div>

              <div>
                <label for="bounce-rule-status" class="block text-sm font-medium text-slate-700">Status</label>
                <select
                  id="bounce-rule-status"
                  v-model="createForm.status"
                  :class="[
                    'mt-1 block w-full rounded-md shadow-sm py-2 px-3 bg-white focus:outline-none sm:text-sm',
                    fieldHasError('status')
                      ? 'border border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  ]"
                >
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <p
                  v-for="message in fieldErrors('status')"
                  :key="`status-${message}`"
                  class="mt-1 text-sm text-red-600"
                >
                  {{ message }}
                </p>
              </div>
            </div>

            <div>
              <label for="bounce-rule-order" class="block text-sm font-medium text-slate-700">List Order (optional)</label>
              <input
                id="bounce-rule-order"
                v-model="createForm.list_order"
                type="number"
                min="0"
                step="1"
                :class="[
                  'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm',
                  fieldHasError('list_order')
                    ? 'border border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                ]"
              >
              <p
                v-for="message in fieldErrors('list_order')"
                :key="`list-order-${message}`"
                class="mt-1 text-sm text-red-600"
              >
                {{ message }}
              </p>
            </div>

            <p v-if="createError" class="text-sm text-red-600">{{ createError }}</p>
          </div>

          <div class="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="submit"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
              :disabled="isCreatingRule"
            >
              {{ isCreatingRule ? 'Creating...' : 'Create Rule' }}
            </button>
            <button
              type="button"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
              :disabled="isCreatingRule"
              @click="closeCreateModal"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import { bouncesClient} from "../../api";

const allBounceRules = ref([])
const isCreateModalOpen = ref(false)
const isCreatingRule = ref(false)
const createError = ref('')
const createFieldErrors = ref({})
const createForm = ref({
  regex: '',
  comment: '',
  action: '',
  status: 'active',
  list_order: '',
})

const appElement = document.getElementById('vue-app')
const parseBounceActions = () => {
  const raw = appElement?.dataset.bounceActions
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
const bounceActions = Object.values(parseBounceActions())

const resetCreateForm = () => {
  createForm.value = {
    regex: '',
    comment: '',
    action: bounceActions[0] ?? '',
    status: 'active',
    list_order: '',
  }
  createError.value = ''
  createFieldErrors.value = {}
}

const normalizeValidationErrors = (error) => {
  const responseData = error?.responseData
  if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) {
    return {}
  }

  const sourceErrors =
    responseData.errors && typeof responseData.errors === 'object' && !Array.isArray(responseData.errors)
      ? responseData.errors
      : responseData

  const normalized = {}

  Object.entries(sourceErrors).forEach(([field, messages]) => {
    if (!field || messages === null || messages === undefined) {
      return
    }

    const key = String(field)
    const list = Array.isArray(messages) ? messages : [messages]
    const textMessages = list
      .map((message) => String(message).trim())
      .filter(Boolean)

    if (textMessages.length > 0) {
      normalized[key] = textMessages
    }
  })

  return normalized
}

const fieldErrors = (field) => {
  const messages = createFieldErrors.value?.[field]
  return Array.isArray(messages) ? messages : []
}

const fieldHasError = (field) => fieldErrors(field).length > 0

const loadBounceRules = async () => {
  try {
    const bounceRules = await bouncesClient.listRegex()
    allBounceRules.value = Array.isArray(bounceRules) ? bounceRules : []
  } catch (error) {
    console.error('Failed to fetch bounce rules', error)
    allBounceRules.value = []
  }
}

const openCreateModal = () => {
  resetCreateForm()
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  if (isCreatingRule.value) {
    return
  }
  isCreateModalOpen.value = false
}

const submitCreateRule = async () => {
  if (isCreatingRule.value) {
    return
  }

  const regex = createForm.value.regex.trim()
  if (!regex) {
    createFieldErrors.value = { regex: ['Regex is required.'] }
    createError.value = ''
    return
  }

  const payload = { regex }

  const comment = createForm.value.comment.trim()
  if (comment) {
    payload.comment = comment
  }

  if (createForm.value.action) {
    payload.action = createForm.value.action
  }

  if (createForm.value.status) {
    payload.status = createForm.value.status
  }

  if (createForm.value.list_order !== '') {
    const parsedListOrder = Number(createForm.value.list_order)
    if (!Number.isInteger(parsedListOrder) || parsedListOrder < 0) {
      createFieldErrors.value = {
        ...createFieldErrors.value,
        list_order: ['List Order must be a whole number greater than or equal to 0.']
      }
      createError.value = ''
      return
    }
    payload.list_order = parsedListOrder
  }

  isCreatingRule.value = true
  createError.value = ''
  createFieldErrors.value = {}

  try {
    await bouncesClient.upsertRegex(payload)
    isCreateModalOpen.value = false
    await loadBounceRules()
  } catch (error) {
    createFieldErrors.value = normalizeValidationErrors(error)
    createError.value = Object.keys(createFieldErrors.value).length > 0
      ? ''
      : error?.message ?? 'Failed to create rule.'
  } finally {
    isCreatingRule.value = false
  }
}

onMounted(() => {
  loadBounceRules()
})
</script>
