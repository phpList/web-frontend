<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
    aria-labelledby="edit-admin-modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" @click="close"></div>
    <form class="mt-4 space-y-4" @submit.prevent="submitUpdateAdmin">
      <div class="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg md:min-w-xl sm:w-full z-10 max-h-[90vh] overflow-y-auto">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h3 id="edit-admin-modal-title" class="text-lg leading-6 font-medium text-slate-900">
              Edit Administrator
            </h3>
            <button type="button" class="text-slate-400 hover:text-slate-500" @click="close" aria-label="Close edit administrator modal">
              <BaseIcon name="close" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- ID Display -->
          <div class="bg-slate-50 p-3 rounded-md">
            <p class="text-xs text-slate-500">Administrator ID</p>
            <p class="font-mono font-semibold text-slate-900">{{ admin?.id }}</p>
          </div>

          <!-- Login Name -->
          <div>
            <label for="edit-admin-login-name" class="block text-sm font-medium text-slate-700">Login Name</label>
            <input
              id="edit-admin-login-name"
              v-model.trim="form.loginName"
              type="text"
              minlength="3"
              maxlength="255"
              placeholder="admin"
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
            <p class="mt-1 text-xs text-slate-500">Leave empty to keep current value. Minimum 3 characters.</p>
          </div>

          <!-- Email -->
          <div>
            <label for="edit-admin-email" class="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="edit-admin-email"
              v-model.trim="form.email"
              type="email"
              placeholder="admin@example.com"
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
            <p class="mt-1 text-xs text-slate-500">Leave empty to keep current value.</p>
          </div>

          <!-- Password -->
          <div>
            <label for="edit-admin-password" class="block text-sm font-medium text-slate-700">Password</label>
            <input
              id="edit-admin-password"
              v-model="form.password"
              type="password"
              minlength="6"
              maxlength="255"
              placeholder="••••••••"
              class="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
            <p class="mt-1 text-xs text-slate-500">Leave empty to keep current password. Minimum 6 characters if setting new password.</p>
          </div>

          <!-- Super User -->
          <div class="flex items-center">
            <input
              id="edit-admin-super-user"
              v-model="form.superUser"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded accent-ext-wf1"
            >
            <label for="edit-admin-super-user" class="ml-2 block text-sm text-slate-900">
              Super User / Full Access
            </label>
          </div>

          <!-- Privileges Section -->
          <div class="border-t pt-4 border-slate-300">
            <p class="text-sm font-medium text-slate-700 mb-3">Privileges</p>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="edit-priv-subscribers"
                  v-model="form.privileges.subscribers"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded accent-ext-wf1"
                >
                <label for="edit-priv-subscribers" class="ml-2 block text-sm text-slate-700">
                  Subscribers Management
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="edit-priv-campaigns"
                  v-model="form.privileges.campaigns"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded accent-ext-wf1"
                >
                <label for="edit-priv-campaigns" class="ml-2 block text-sm text-slate-700">
                  Campaigns Management
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="edit-priv-statistics"
                  v-model="form.privileges.statistics"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded accent-ext-wf1"
                >
                <label for="edit-priv-statistics" class="ml-2 block text-sm text-slate-700">
                  Statistics Viewing
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="edit-priv-settings"
                  v-model="form.privileges.settings"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded accent-ext-wf1"
                >
                <label for="edit-priv-settings" class="ml-2 block text-sm text-slate-700">
                  Settings Management
                </label>
              </div>
            </div>
          </div>

          <p v-if="updateError" class="text-sm text-red-600">{{ updateError }}</p>
        </div>

        <div class="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="submit"
            :disabled="isUpdating"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
          >
            {{ isUpdating ? 'Updating...' : 'Update' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
            @click="close"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Requests } from '@tatevikgr/rest-api-client'
import { adminClient } from '../../api'
import BaseIcon from "../base/BaseIcon.vue";

const props = defineProps({
  isOpen: Boolean,
  admin: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const isUpdating = ref(false)
const updateError = ref('')

const form = ref({
  loginName: '',
  email: '',
  password: '',
  superUser: false,
  privileges: {
    subscribers: false,
    campaigns: false,
    statistics: false,
    settings: false
  }
})

const resetForm = () => {
  if (props.admin) {
    form.value = {
      loginName: props.admin.loginName,
      email: props.admin.email,
      password: '',
      superUser: props.admin.superUser || false,
      privileges: {
        subscribers: props.admin.privileges?.subscribers || false,
        campaigns: props.admin.privileges?.campaigns || false,
        statistics: props.admin.privileges?.statistics || false,
        settings: props.admin.privileges?.settings || false
      }
    }
  }
  updateError.value = ''
}

watch(
  () => [props.isOpen, props.admin?.id],
  ([isOpen]) => {
    if (isOpen) {
      resetForm()
    }
  }
)

const close = () => {
  if (isUpdating.value) {
    return
  }

  emit('close')
}

const submitUpdateAdmin = async () => {
  if (isUpdating.value || !props.admin) {
    return
  }

  isUpdating.value = true
  updateError.value = ''

  try {
    const updateData = {}

    if (form.value.loginName.trim()) {
      updateData.loginName = form.value.loginName.trim()
    }

    if (form.value.email.trim()) {
      updateData.email = form.value.email.trim()
    }

    if (form.value.password) {
      updateData.password = form.value.password
    }

    updateData.superUser = form.value.superUser
    updateData.privileges = form.value.privileges

    const request = new Requests.UpdateAdministratorRequest(
      updateData.loginName,
      updateData.password,
      updateData.email,
      updateData.superUser,
      updateData.privileges
    )

    const updatedAdmin = await adminClient.updateAdministrator(props.admin.id, request)
    emit('updated', updatedAdmin)
    emit('close')
  } catch (error) {
    console.error('Update admin failed:', error)
    updateError.value = error?.message || 'Failed to update administrator.'
  } finally {
    isUpdating.value = false
  }
}
</script>

