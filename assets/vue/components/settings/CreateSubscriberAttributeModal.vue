<template>
  <BaseModal
      :is-open="isOpen"
      :title="t('settings.subscriber_attributes.create_title')"
      max-width="2xl"
      @close="close"
  >
        <form
            class="p-6 space-y-5"
            @submit.prevent="submit"
        >
          <div>
            <label class="block mb-1 text-slate-700 dark:text-slate-200">{{ t('settings.attributes.name') }}</label>

            <input
                v-model="form.name"
                class="w-full rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
                required
            >
          </div>

          <div>
            <label class="block mb-1 text-slate-700 dark:text-slate-200">{{ t('settings.attributes.type') }}</label>

            <select
                v-model="form.type"
                class="w-full rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            >
              <option
                  v-for="type in attributeTypes"
                  :key="type.value"
                  :value="type.value"
              >
                {{ type.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block mb-1 text-slate-700 dark:text-slate-200">{{ t('settings.subscriber_attributes.order') }}</label>

            <input
                v-model.number="form.order"
                type="number"
                class="w-full rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            >
          </div>

          <div>
            <label class="block mb-1 text-slate-700 dark:text-slate-200">{{ t('settings.subscriber_attributes.default_value') }}</label>

            <input
                v-model="form.default_value"
                class="w-full rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
            >
          </div>

          <label class="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <input
                v-model="form.required"
                type="checkbox"
            >

            {{ t('settings.attributes.required') }}
          </label>

          <div v-if="supportsOptions">
            <div class="flex justify-between items-center mb-3">
              <strong class="text-slate-900 dark:text-slate-100">{{ t('settings.subscriber_attributes.options') }}</strong>

              <button
                  type="button"
                  class="rounded bg-slate-200 dark:bg-slate-700 dark:text-slate-100 px-3 py-1"
                  @click="addOption"
              >
                {{ t('settings.subscriber_attributes.add_option') }}
              </button>
            </div>

            <div class="max-h-64 overflow-y-auto border rounded p-2 space-y-2 pr-2 border-slate-300 dark:border-slate-600">
              <div
                  v-for="(option, index) in form.options"
                  :key="index"
                  class="flex gap-2"
              >
                <input
                    v-model="option.name"
                    class="flex-1 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
                    :placeholder="t('settings.subscriber_attributes.option')"
                >

                <input
                    v-model.number="option.list_order"
                    type="number"
                    class="w-24 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 px-3 py-2"
                >

                <button
                    type="button"
                    class="rounded px-3"
                    @click="removeOption(index)"
                >
                  <BaseIcon name="delete" class="w-4 h-4 cursor-pointer"/>
                </button>
              </div>
            </div>
          </div>
          <div
              v-if="error"
              class="text-red-600 dark:text-red-400"
          >
            {{ error }}
          </div>

          <div class="flex justify-end gap-3">
            <button
                type="button"
                class="rounded border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2"
                @click="close"
            >
              {{ t('common.cancel') }}
            </button>

            <button
                class="rounded bg-ext-wf1 px-4 py-2 text-white"
                :disabled="saving"
            >
              {{ saving ? t('common.creating') : t('common.create') }}
            </button>
          </div>
        </form>
  </BaseModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import BaseModal from '../base/BaseModal.vue';
import { subscriberAttributesClient } from '../../api';
import BaseIcon from "../base/BaseIcon.vue";

const { t } = useI18n();

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits([
  'close',
  'created',
]);

const saving = ref(false);
const error = ref('');

const attributeTypes = computed(() => [
  'textline', 'hidden', 'creditcardno', 'select', 'date', 'checkbox', 'textarea', 'radio', 'checkboxgroup',
].map((value) => ({ value, label: t(`settings.attribute_types.${value}`) })));

const optionTypes = ['select', 'radio', 'checkboxgroup'];

function newForm() {
  return {
    name: '',
    type: 'textline',
    order: null,
    default_value: '',
    required: false,
    options: [],
  };
}

const form = reactive(newForm());

const supportsOptions = computed(() =>
    optionTypes.includes(form.type)
);

watch(
    () => props.isOpen,
    (open) => {
      if (!open) {
        return;
      }

      Object.assign(form, newForm());
      error.value = '';
    }
);

function addOption() {
  form.options.push({
    name: '',
    list_order: form.options.length + 1,
  });
}

function removeOption(index) {
  form.options.splice(index, 1);
}

function close() {
  emit('close');
}

async function submit() {
  saving.value = true;
  error.value = '';

  try {
    await subscriberAttributesClient.createAttributeDefinition({
      ...form,
      options: JSON.parse(JSON.stringify(form.options)),
    });

    emit('created');
    close();
  } catch (e) {
    error.value = e?.message || t('settings.attributes.errors.create_failed');
  } finally {
    saving.value = false;
  }
}
</script>
