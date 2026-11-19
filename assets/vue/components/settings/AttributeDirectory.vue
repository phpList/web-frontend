<template>
  <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">
          {{ title }}
        </h2>

        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-350">
          {{ description }}
        </p>
      </div>

      <BaseButton variant="accent" icon="plus" @click="openCreateModal">
        {{ t('settings.attributes.add') }}
      </BaseButton>
    </div>

    <BaseDataTable
        :items="attributes"
        :is-loading="isLoading"
        :load-error="loadError"
        :loading-message="t('settings.attributes.loading')"
        :empty-message="t('settings.attributes.empty')"
        :colspan="5"
    >
      <template #head>
        <th class="px-6 py-4">{{ t('settings.attributes.id') }}</th>
        <th class="px-6 py-4">{{ t('settings.attributes.name') }}</th>
        <th class="px-6 py-4">{{ t('settings.attributes.type') }}</th>
        <th class="px-6 py-4">{{ t('settings.attributes.required') }}</th>
        <th class="px-6 py-4 text-right">{{ t('settings.actions') }}</th>
      </template>

      <template #row="{ item: attribute }">
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350">
          {{ attribute.id }}
        </td>

        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">
          {{ attribute.name }}
        </td>

        <td class="px-6 py-4 text-slate-600 dark:text-slate-350">
          {{ typeLabel(attribute.type) }}
        </td>

        <td class="px-6 py-4">
          <BaseBadge :variant="attribute.required ? 'danger' : 'neutral'">
            {{ attribute.required ? t('settings.attributes.required') : t('settings.attributes.optional') }}
          </BaseBadge>
        </td>

        <td class="px-6 py-4">
          <div class="flex justify-end gap-2">
            <ActionButton icon="edit" @click="handleEdit(attribute)">
              {{ t('common.edit') }}
            </ActionButton>

            <ActionButton variant="danger" icon="delete" @click="handleDelete(attribute)">
              {{ t('common.delete') }}
            </ActionButton>
          </div>
        </td>
      </template>

      <template #card="{ item: attribute }">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-350">
              #{{ attribute.id }}
            </p>

            <p class="font-semibold text-slate-900 dark:text-slate-100">
              {{ attribute.name }}
            </p>

            <p class="text-sm text-slate-500 dark:text-slate-350">
              {{ typeLabel(attribute.type) }}
            </p>
          </div>

          <BaseBadge :variant="attribute.required ? 'danger' : 'neutral'">
            {{ attribute.required ? t('settings.attributes.required') : t('settings.attributes.optional') }}
          </BaseBadge>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <ActionButton block icon="edit" @click="handleEdit(attribute)">
            {{ t('common.edit') }}
          </ActionButton>

          <ActionButton block variant="danger" icon="delete" @click="handleDelete(attribute)">
            {{ t('common.delete') }}
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
import { useI18n } from 'vue-i18n'
import BaseButton from '../base/BaseButton.vue'
import BaseBadge from '../base/BaseBadge.vue'
import ActionButton from '../base/ActionButton.vue'
import BaseDataTable from '../base/BaseDataTable.vue'

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  client: { type: Object, required: true }
})

const typeLabel = (type) => (
  ['textline', 'hidden'].includes(type) ? t(`settings.attribute_types.${type}`) : type
)

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
    loadError.value = e?.message || t('settings.attributes.errors.load_failed')
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
      t('settings.attributes.delete_confirm', { name: attribute.name })
  )

  if (!confirmed) return

  try {
    await props.client.deleteAttributeDefinition(attribute.id)
    await fetchAttributes()
  } catch (e) {
    console.error(e)
    alert(e?.message || t('settings.attributes.errors.delete_failed'))
  }
}
</script>
