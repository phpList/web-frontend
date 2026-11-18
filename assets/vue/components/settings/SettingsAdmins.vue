<template>
  <div class="bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm overflow-hidden">
    <div class="p-4 sm:p-6 border-b border-slate-300 dark:border-slate-700 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ t('settings.admins.title') }}</h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-350">{{ t('settings.admins.description') }}</p>
      </div>

      <BaseButton variant="accent" icon="plus" @click="openCreateModal">
        {{ t('settings.admins.add') }}
      </BaseButton>
    </div>

    <BaseDataTable
        :items="admins"
        :is-loading="isLoading"
        :load-error="loadError"
        :loading-message="t('settings.admins.loading')"
        :empty-message="t('settings.admins.empty')"
        :colspan="6"
    >
      <template #head>
        <th class="px-6 py-4">{{ t('settings.admins.id') }}</th>
        <th class="px-6 py-4">{{ t('settings.admins.login_name') }}</th>
        <th class="px-6 py-4">{{ t('settings.admins.email') }}</th>
        <th class="px-6 py-4">{{ t('settings.admins.super_user') }}</th>
        <th class="px-6 py-4">{{ t('settings.admins.created') }}</th>
        <th class="px-6 py-4 text-right">{{ t('settings.actions') }}</th>
      </template>

      <template #row="{ item: admin }">
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350">{{ admin.id }}</td>
        <td class="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{{ admin.loginName }}</td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350">{{ admin.email }}</td>
        <td class="px-6 py-4">
          <BaseBadge :variant="admin.superUser ? 'info' : 'neutral'">
            {{ admin.superUser ? t('common.yes') : t('common.no') }}
          </BaseBadge>
        </td>
        <td class="px-6 py-4 text-slate-600 dark:text-slate-350 text-xs">
          {{ formatDate(admin.createdAt) }}
        </td>
        <td class="px-6 py-4">
          <div class="flex flex-wrap justify-end gap-2">
            <ActionButton icon="edit" @click="handleEdit(admin)">
              {{ t('common.edit') }}
            </ActionButton>

            <ActionButton variant="danger" icon="delete" @click="handleDelete(admin)">
              {{ t('common.delete') }}
            </ActionButton>
          </div>
        </td>
      </template>

      <template #card="{ item: admin }">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-350">#{{ admin.id }}</p>
            <p class="font-semibold text-slate-900 dark:text-slate-100">{{ admin.loginName }}</p>
            <p class="text-sm text-slate-500 dark:text-slate-350">{{ admin.email }}</p>
          </div>

          <BaseBadge class="whitespace-nowrap" :variant="admin.superUser ? 'info' : 'neutral'">
            {{ admin.superUser ? t('settings.admins.badge_super') : t('settings.admins.badge_user') }}
          </BaseBadge>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-350">
          {{ t('settings.admins.created_on', { date: formatDate(admin.createdAt) }) }}
        </p>

        <div class="grid grid-cols-2 gap-2">
          <ActionButton block icon="edit" @click="handleEdit(admin)">
            {{ t('common.edit') }}
          </ActionButton>

          <ActionButton block variant="danger" icon="delete" @click="handleDelete(admin)">
            {{ t('common.delete') }}
          </ActionButton>
        </div>
      </template>
    </BaseDataTable>
  </div>

  <!-- Create Admin Modal -->
  <CreateAdminModal
    :is-open="isCreateModalOpen"
    @close="closeCreateModal"
    @created="handleAdminCreated"
  />

  <!-- Edit Admin Modal -->
  <EditAdminModal
    :is-open="isEditModalOpen"
    :admin="selectedAdmin"
    @close="closeEditModal"
    @updated="handleAdminUpdated"
  />
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import CreateAdminModal from './CreateAdminModal.vue'
import EditAdminModal from './EditAdminModal.vue'
import { fetchAllAdmins, adminClient } from '../../api'
import BaseButton from "../base/BaseButton.vue";
import BaseBadge from "../base/BaseBadge.vue";
import ActionButton from "../base/ActionButton.vue";
import BaseDataTable from "../base/BaseDataTable.vue";

const { t, locale } = useI18n()

const admins = ref([])
const isLoading = ref(false)
const loadError = ref('')
const isCreateModalOpen = ref(false)
const selectedAdmin = ref(null)
const isEditModalOpen = ref(false)

const fetchAdmins = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    admins.value = await fetchAllAdmins()
  } catch (error) {
    console.error('Failed to fetch administrators:', error)
    admins.value = []
    loadError.value = error?.message || t('settings.admins.errors.load_failed')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAdmins()
})

const handleDelete = async (admin) => {
  const confirmed = window.confirm(
    t('settings.admins.delete_confirm', { name: admin.loginName })
  )

  if (!confirmed) return

  try {
    await adminClient.deleteAdministrator(admin.id)
    await fetchAdmins()
  } catch (e) {
    console.error('Delete failed', e)
    alert(t('settings.admins.errors.delete_failed', { reason: e?.message || t('settings.admins.errors.unknown') }))
  }
}

const handleEdit = (admin) => {
  selectedAdmin.value = admin
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedAdmin.value = null
}

const handleAdminUpdated = async () => {
  await fetchAdmins()
}

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  isCreateModalOpen.value = false
}

const handleAdminCreated = async () => {
  await fetchAdmins()
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString(locale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>
