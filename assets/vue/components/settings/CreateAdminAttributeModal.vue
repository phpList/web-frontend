<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('settings.admin_attributes.create_title')"
      max-width="lg"
      @close="$emit('close')"
  >
        <form
            class="p-6 space-y-5"
            @submit.prevent="submit"
        >
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              {{ t('settings.attributes.name') }}
            </label>

            <input
                v-model="form.name"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ext-wf1"
                required
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
              {{ t('settings.attributes.type') }}
            </label>

            <select
                v-model="form.type"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            >
              <option value="textline">{{ t('settings.attribute_types.textline') }}</option>
              <option value="hidden">{{ t('settings.attribute_types.hidden') }}</option>

            </select>
          </div>

          <label class="flex items-center gap-2">
            <input
                type="checkbox"
                v-model="form.required"
            >

            <span class="text-sm text-slate-700 dark:text-slate-200">
              {{ t('settings.attributes.required') }}
            </span>
          </label>

          <div
              v-if="error"
              class="text-sm text-red-600 dark:text-red-400"
          >
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
                type="button"
                class="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                @click="$emit('close')"
            >
              {{ t('common.cancel') }}
            </button>

            <button
                class="px-4 py-2 rounded-lg bg-ext-wf1 text-white"
                :disabled="saving"
            >
              {{ saving ? t('common.creating') : t('common.create') }}
            </button>
          </div>
        </form>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseModal from '../base/BaseModal.vue'
import { adminAttributeClient } from '../../api'

const { t } = useI18n()

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits([
  'close',
  'created'
])

const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  type: 'string',
  required: false
})

watch(
    () => props.isOpen,
    (open) => {
      if (!open) return

      form.name = ''
      form.type = 'textline'
      form.required = false
      error.value = ''
    }
)

const submit = async () => {
  saving.value = true
  error.value = ''

  try {
    await adminAttributeClient.createAttributeDefinition({
      name: form.name,
      type: form.type,
      required: form.required
    })

    emit('created')
  } catch (e) {
    error.value = e?.message || t('settings.attributes.errors.create_failed')
  } finally {
    saving.value = false
  }
}
</script>
