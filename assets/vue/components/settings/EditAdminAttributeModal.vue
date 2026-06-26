<template>
  <Teleport to="body">
    <div
        v-if="isOpen && attribute"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div class="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-slate-900">
            Edit Attribute
          </h2>

          <button
              class="text-slate-400 hover:text-slate-700"
              @click="$emit('close')"
          >
            ✕
          </button>
        </div>

        <form
            class="p-6 space-y-5"
            @submit.prevent="submit"
        >
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Name
            </label>

            <input
                v-model="form.name"
                class="w-full rounded-lg border border-slate-300 px-3 py-2"
                required
            >
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Type
            </label>

            <select
                v-model="form.type"
                class="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="string">String</option>
              <option value="text">Text</option>
              <option value="integer">Integer</option>
              <option value="boolean">Boolean</option>
              <option value="date">Date</option>
            </select>
          </div>

          <label class="flex items-center gap-2">
            <input
                type="checkbox"
                v-model="form.required"
            >

            <span class="text-sm text-slate-700">
              Required
            </span>
          </label>

          <div
              v-if="error"
              class="text-red-600 text-sm"
          >
            {{ error }}
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button
                type="button"
                class="px-4 py-2 rounded-lg border border-slate-300"
                @click="$emit('close')"
            >
              Cancel
            </button>

            <button
                class="px-4 py-2 rounded-lg bg-ext-wf1 text-white"
                :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { adminAttributeClient } from '../../api'

const props = defineProps({
  isOpen: Boolean,
  attribute: Object
})

const emit = defineEmits([
  'close',
  'updated'
])

const saving = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  type: 'string',
  required: false
})

watch(
    () => props.attribute,
    (attribute) => {
      if (!attribute) return

      form.name = attribute.name
      form.type = attribute.type
      form.required = attribute.required
      error.value = ''
    },
    { immediate: true }
)

const submit = async () => {
  saving.value = true
  error.value = ''

  try {
    await adminAttributeClient.updateAttributeDefinition(
        props.attribute.id,
        {
          name: form.name,
          type: form.type,
          required: form.required
        }
    )

    emit('updated')
  } catch (e) {
    error.value = e?.message || 'Unable to update attribute.'
  } finally {
    saving.value = false
  }
}
</script>
