<template>
  <div class="space-y-6 pb-4">
    <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
      <div class="p-5 border-b border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100">{{ t('bounces.rules.title') }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-350 mt-0.5">
            {{ t('bounces.rules.description') }}
          </p>
        </div>
        <button
          type="button"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          @click="openCreateModal"
        >
          {{ t('bounces.rules.new') }}
        </button>
      </div>

      <BaseDataTable
          :items="allBounceRules"
          :is-loading="isLoading"
          :loading-message="t('bounces.rules.loading')"
          :empty-message="t('bounces.rules.empty')"
          :colspan="6"
      >
        <template #head>
          <th class="px-6 py-4">#</th>
          <th class="px-6 py-4">{{ t('bounces.rules.rule') }}</th>
          <th class="px-6 py-4">{{ t('bounces.rules.pattern') }}</th>
          <th class="px-6 py-4">{{ t('bounces.rules.action') }}</th>
          <th class="px-6 py-4 text-right">{{ t('bounces.rules.hits') }}</th>
          <th class="px-6 py-4 text-right">{{ t('bounces.table.status') }}</th>
        </template>

        <template #row="{ item: rule }">
          <td class="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-350">{{ rule.list_order }}</td>
          <td class="px-6 py-4 text-slate-900 dark:text-slate-100 font-medium">{{ rule.comment }}</td>
          <td class="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-350" :title="rule.pattern">{{ rule.regex }}</td>
          <td class="px-6 py-4">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="rule.actionClass">{{ rule.action }}</span>
          </td>
          <td class="px-6 py-4 text-right font-semibold text-slate-700 dark:text-slate-200">{{ rule.count }}</td>
          <td class="px-6 py-4 text-right">
            <BaseBadge class="capitalize" :variant="rule.status === 'active' ? 'success' : 'neutral'">
              {{ statusLabel(rule.status) }}
            </BaseBadge>
          </td>
        </template>

        <template #card="{ item: rule }">
          <div class="flex items-center justify-between gap-2">
            <p class="font-semibold text-slate-900 dark:text-slate-100 min-w-0 break-words">{{ rule.comment }}</p>
            <BaseBadge class="capitalize" :variant="rule.status === 'active' ? 'success' : 'neutral'">
              {{ statusLabel(rule.status) }}
            </BaseBadge>
          </div>
          <p class="text-xs font-mono text-slate-600 dark:text-slate-350 break-all">{{ rule.regex }}</p>
          <div class="flex items-center justify-between gap-2 text-sm">
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="rule.actionClass">{{ rule.action }}</span>
            <span class="text-slate-700 dark:text-slate-200">{{ t('bounces.rules.hits_label') }} <span class="font-semibold">{{ rule.count }}</span></span>
          </div>
        </template>
      </BaseDataTable>
    </div>

    <BaseModal
        :is-open="isCreateModalOpen"
        :title="t('bounces.rules.modal_title')"
        max-width="lg"
        @close="closeCreateModal"
    >
      <form class="px-4 pt-5 pb-4 sm:p-6 space-y-4" @submit.prevent="submitCreateRule">
            <div>
              <label for="bounce-rule-regex" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('bounces.rules.regex') }}</label>
              <input
                id="bounce-rule-regex"
                v-model.trim="createForm.regex"
                type="text"
                required
                :class="fieldInputClass('regex', 'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm bg-white dark:bg-slate-800 dark:text-slate-100')"
              >
              <FieldError :messages="fieldErrors('regex')" />
            </div>

            <div>
              <label for="bounce-rule-comment" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('bounces.rules.comment') }}</label>
              <input
                id="bounce-rule-comment"
                v-model.trim="createForm.comment"
                type="text"
                :class="fieldInputClass('comment', 'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm bg-white dark:bg-slate-800 dark:text-slate-100')"
              >
              <FieldError :messages="fieldErrors('comment')" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="bounce-rule-action" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('bounces.rules.action') }}</label>
                <select
                  id="bounce-rule-action"
                  v-model="createForm.action"
                  :class="fieldInputClass('action', 'mt-1 block w-full rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none sm:text-sm')"
                >
                  <option v-for="bounceAction in bounceActions" :key="bounceAction" :value="bounceAction">{{ bounceAction }}</option>
                </select>
                <FieldError :messages="fieldErrors('action')" />
              </div>

              <div>
                <label for="bounce-rule-status" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('bounces.table.status') }}</label>
                <select
                  id="bounce-rule-status"
                  v-model="createForm.status"
                  :class="fieldInputClass('status', 'mt-1 block w-full rounded-md shadow-sm py-2 px-3 bg-white dark:bg-slate-800 dark:text-slate-100 focus:outline-none sm:text-sm')"
                >
                  <option value="active">{{ t('bounces.status.active') }}</option>
                  <option value="inactive">{{ t('bounces.status.inactive') }}</option>
                </select>
                <FieldError :messages="fieldErrors('status')" />
              </div>
            </div>

            <div>
              <label for="bounce-rule-order" class="block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('bounces.rules.list_order') }}</label>
              <input
                id="bounce-rule-order"
                v-model="createForm.list_order"
                type="number"
                min="0"
                step="1"
                :class="fieldInputClass('list_order', 'mt-1 block w-full rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm bg-white dark:bg-slate-800 dark:text-slate-100')"
              >
              <FieldError :messages="fieldErrors('list_order')" />
            </div>

            <p v-if="createError" class="text-sm text-red-600 dark:text-red-400">{{ createError }}</p>
            <FieldError :messages="generalErrors(KNOWN_FIELDS)" />
      </form>

      <template #footer>
        <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
            :disabled="isCreatingRule"
            data-testid="modal-submit"
            @click="submitCreateRule"
        >
          {{ isCreatingRule ? t('bounces.rules.creating') : t('bounces.rules.create') }}
        </button>
        <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            :disabled="isCreatingRule"
            data-testid="modal-cancel"
            @click="closeCreateModal"
        >
          {{ t('common.cancel') }}
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import {onMounted, ref} from "vue";
import { useI18n } from 'vue-i18n'
import BaseBadge from '../base/BaseBadge.vue'
import BaseDataTable from '../base/BaseDataTable.vue'
import BaseModal from '../base/BaseModal.vue'
import FieldError from '../base/FieldError.vue'
import { bouncesClient} from "../../api";
import { useApiValidationErrors } from '../../composables/useApiValidationErrors'

const { t } = useI18n()

const KNOWN_FIELDS = ['regex', 'comment', 'action', 'status', 'list_order']

const { fieldErrors, fieldInputClass, generalErrors, fieldErrorsMap, setErrorsFromError, clearErrors, hasFieldErrors } = useApiValidationErrors()

const statusLabel = (status) => (
  status === 'active' || status === 'inactive' ? t(`bounces.status.${status}`) : status
)

const allBounceRules = ref([])
const isLoading = ref(true)
const isCreateModalOpen = ref(false)
const isCreatingRule = ref(false)
const createError = ref('')
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
  clearErrors()
}

const loadBounceRules = async () => {
  try {
    const bounceRules = await bouncesClient.listRegex()
    allBounceRules.value = Array.isArray(bounceRules) ? bounceRules : []
  } catch (error) {
    console.error('Failed to fetch bounce rules', error)
    allBounceRules.value = []
  } finally {
    isLoading.value = false
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
    fieldErrorsMap.value = { regex: [t('bounces.rules.errors.regex_required')] }
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
      fieldErrorsMap.value = {
        ...fieldErrorsMap.value,
        list_order: [t('bounces.rules.errors.list_order_invalid')]
      }
      createError.value = ''
      return
    }
    payload.list_order = parsedListOrder
  }

  isCreatingRule.value = true
  createError.value = ''
  clearErrors()

  try {
    await bouncesClient.upsertRegex(payload)
    isCreateModalOpen.value = false
    await loadBounceRules()
  } catch (error) {
    setErrorsFromError(error)
    createError.value = hasFieldErrors.value ? '' : (error?.message ?? t('bounces.rules.errors.create_failed'))
  } finally {
    isCreatingRule.value = false
  }
}

onMounted(() => {
  loadBounceRules()
})
</script>
