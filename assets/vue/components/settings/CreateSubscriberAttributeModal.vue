<template>
  <Teleport to="body">
    <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div class="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-lg font-semibold">
            Create Subscriber Attribute
          </h2>

          <button
              class="text-slate-500 hover:text-slate-800"
              @click="close"
          >
            ✕
          </button>
        </div>

        <form
            class="p-6 space-y-5"
            @submit.prevent="submit"
        >
          <div>
            <label class="block mb-1">Name</label>

            <input
                v-model="form.name"
                class="w-full rounded border border-slate-300 px-3 py-2"
                required
            >
          </div>

          <div>
            <label class="block mb-1">Type</label>

            <select
                v-model="form.type"
                class="w-full rounded border border-slate-300 px-3 py-2"
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
            <label class="block mb-1">Order</label>

            <input
                v-model.number="form.order"
                type="number"
                class="w-full rounded border border-slate-300 px-3 py-2"
            >
          </div>

          <div>
            <label class="block mb-1">Default value</label>

            <input
                v-model="form.default_value"
                class="w-full rounded border border-slate-300 px-3 py-2"
            >
          </div>

          <label class="flex items-center gap-2">
            <input
                v-model="form.required"
                type="checkbox"
            >

            Required
          </label>

          <div v-if="supportsOptions">
            <div class="flex justify-between items-center mb-3">
              <strong>Options</strong>

              <button
                  type="button"
                  class="rounded bg-slate-200 px-3 py-1"
                  @click="addOption"
              >
                Add
              </button>
            </div>

            <div class="max-h-64 overflow-y-auto border rounded p-2 space-y-2 pr-2 border-slate-300">
              <div
                  v-for="(option, index) in form.options"
                  :key="index"
                  class="flex gap-2"
              >
                <input
                    v-model="option.name"
                    class="flex-1 rounded border border-slate-300 px-3 py-2"
                    placeholder="Option"
                >

                <input
                    v-model.number="option.list_order"
                    type="number"
                    class="w-24 rounded border border-slate-300 px-3 py-2"
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
              class="text-red-600"
          >
            {{ error }}
          </div>

          <div class="flex justify-end gap-3">
            <button
                type="button"
                class="rounded border px-4 py-2"
                @click="close"
            >
              Cancel
            </button>

            <button
                class="rounded bg-ext-wf1 px-4 py-2 text-white"
                :disabled="saving"
            >
              {{ saving ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { subscriberAttributesClient } from '../../api';
import BaseIcon from "../base/BaseIcon.vue";

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits([
  'close',
  'created',
]);

const saving = ref(false);
const error = ref('');

const attributeTypes = [
  { label: 'Text', value: 'textline' },
  { label: 'Hidden', value: 'hidden' },
  { label: 'Credit Card', value: 'creditcardno' },
  { label: 'Select', value: 'select' },
  { label: 'Date', value: 'date' },
  { label: 'Checkbox', value: 'checkbox' },
  { label: 'Textarea', value: 'textarea' },
  { label: 'Radio', value: 'radio' },
  { label: 'Checkbox Group', value: 'checkboxgroup' },
];

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
    error.value = e?.message || 'Unable to create attribute.';
  } finally {
    saving.value = false;
  }
}
</script>
