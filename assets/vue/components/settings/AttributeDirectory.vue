<template>
  <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          {{ title }}
        </h2>

        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {{ description }}
        </p>
      </div>

      <button
          type="button"
          class="inline-flex shrink-0 items-center gap-2 whitespace-nowrap min-w-max px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
          @click="openCreateModal"
      >
        <BaseIcon name="plus" class="w-3.5 h-3.5" inherit-color />

        Add Attribute
      </button>
    </div>

    <BaseDataTable
        :items="attributes"
        :is-loading="isLoading"
        :load-error="loadError"
        loading-message="Loading attributes..."
        empty-message="No attributes found."
        :colspan="5"
    >
      <template #head>
        <th class="px-6 py-4">ID</th>
        <th class="px-6 py-4">Name</th>
        <th class="px-6 py-4">Type</th>
        <th class="px-6 py-4">Required</th>
        <th class="px-6 py-4 text-right">Actions</th>
      </template>

      <template #row="{ item: attribute }">
        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
          {{ attribute.id }}
        </td>

        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
          {{ attribute.name }}
        </td>

        <td class="px-6 py-4 text-slate-600 dark:text-slate-300">
          {{ attribute.type === 'textline' ? 'Text' : attribute.type === 'hidden' ? 'Hidden' : attribute.type }}
        </td>

        <td class="px-6 py-4">
          <BaseBadge :variant="attribute.required ? 'danger' : 'neutral'">
            {{ attribute.required ? 'Required' : 'Optional' }}
          </BaseBadge>
        </td>

        <td class="px-6 py-4">
          <div class="flex justify-end gap-2">
            <ActionButton icon="edit" @click="handleEdit(attribute)">
              Edit
            </ActionButton>

            <ActionButton variant="danger" icon="delete" @click="handleDelete(attribute)">
              Delete
            </ActionButton>
          </div>
        </td>
      </template>

      <template #card="{ item: attribute }">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              #{{ attribute.id }}
            </p>

            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ attribute.name }}
            </p>

            <p class="text-sm text-slate-500 dark:text-slate-400">
              {{ attribute.type === 'textline' ? 'Text' : attribute.type === 'hidden' ? 'Hidden' : attribute.type }}
            </p>
          </div>

          <BaseBadge :variant="attribute.required ? 'danger' : 'neutral'">
            {{ attribute.required ? 'Required' : 'Optional' }}
          </BaseBadge>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <ActionButton block icon="edit" @click="handleEdit(attribute)">
            Edit
          </ActionButton>

          <ActionButton block variant="danger" icon="delete" @click="handleDelete(attribute)">
            Delete
          </ActionButton>
        </div>
      </template>
    </BaseDataTable>
  </div>

  <slot
      name="create-modal"
      :is-open="isCreateModalOpen"
      :close="closeCreateModal"
      :created="handleCreated"
  />

  <slot
      name="edit-modal"
      :is-open="isEditModalOpen"
      :attribute="selectedAttribute"
      :close="closeEditModal"
      :updated="handleUpdated"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import BaseIcon from '../base/BaseIcon.vue'
import BaseBadge from '../base/BaseBadge.vue'
import ActionButton from '../base/ActionButton.vue'
import BaseDataTable from '../base/BaseDataTable.vue'

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { type: Object, required: true }
})

const attributes = ref([])

const isLoading = ref(false)
const loadError = ref('')

const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)

const selectedAttribute = ref(null)

const fetchAttributes = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const result = await props.client.getAttributeDefinitions()
    attributes.value = result.items ?? result.data ?? []
  } catch (e) {
    console.error(e)
    loadError.value = e?.message || 'Failed to load attributes.'
    attributes.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAttributes)

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleCreated = async () => {
  closeCreateModal()
  await fetchAttributes()
}

const handleEdit = (attribute) => {
  selectedAttribute.value = attribute
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  selectedAttribute.value = null
  isEditModalOpen.value = false
}

const handleUpdated = async () => {
  closeEditModal()
  await fetchAttributes()
}

const handleDelete = async (attribute) => {
  const confirmed = window.confirm(
      `Delete attribute "${attribute.name}"?\n\nThis action cannot be undone.`
  )

  if (!confirmed) return

  try {
    await props.client.deleteAttributeDefinition(attribute.id)
    await fetchAttributes()
  } catch (e) {
    console.error(e)
    alert(e?.message || 'Failed to delete attribute.')
  }
}
</script>