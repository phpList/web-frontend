<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
    aria-labelledby="create-admin-modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div class="fixed inset-0 bg-slate-900/50 transition-opacity" aria-hidden="true" @click="close"></div>
    <form class="mt-4 space-y-4" @submit.prevent="submitCreateAdmin">
      <div class="relative bg-white dark:bg-slate-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:max-w-lg md:min-w-xl sm:w-full z-10 max-h-[90vh] overflow-y-auto">
        <div class="bg-white dark:bg-slate-800 px-4 pt-5 pb-4 sm:p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h3 id="create-admin-modal-title" class="text-lg leading-6 font-medium text-slate-900 dark:text-slate-100">
              Create New Administrator
            </h3>
            <button type="button" class="text-slate-400 dark:text-slate-500 hover:text-slate-500 dark:hover:text-slate-400" @click="close">
              <BaseIcon name="close" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Login Name -->
          <div>
            <label for="admin-login-name" class="block text-sm font-medium text-slate-700 dark:text-slate-200">Login Name</label>
            <input
              id="admin-login-name"
              v-model.trim="form.login_name"
              type="text"
              required
              minlength="3"
              maxlength="255"
              placeholder="admin"
              class="mt-1 block w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimum 3 characters</p>
          </div>

          <!-- Email -->
          <div>
            <label for="admin-email" class="block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
            <input
              id="admin-email"
              v-model.trim="form.email"
              type="email"
              required
              placeholder="admin@example.com"
              class="mt-1 block w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
          </div>

          <!-- Password -->
          <div>
            <label for="admin-password" class="block text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <input
              id="admin-password"
              v-model="form.password"
              type="password"
              required
              minlength="6"
              maxlength="255"
              placeholder="••••••••"
              class="mt-1 block w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
            <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">Minimum 6 characters</p>
          </div>

          <!-- Super User -->
          <div class="flex items-center">
            <input
              id="admin-super-user"
              v-model="form.super_user"
              type="checkbox"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
            >
            <label for="admin-super-user" class="ml-2 block text-sm text-slate-900 dark:text-slate-100">
              Super User / Full Access
            </label>
          </div>

          <!-- Privileges Section -->
          <div v-if="!form.super_user" class="border-t border-slate-200 dark:border-slate-700 pt-4">
            <p class="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Privileges</p>
            <div class="space-y-2">
              <div class="flex items-center">
                <input
                  id="priv-subscribers"
                  v-model="form.privileges.subscribers"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                >
                <label for="priv-subscribers" class="ml-2 block text-sm text-slate-700 dark:text-slate-200">
                  Subscribers Management
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="priv-campaigns"
                  v-model="form.privileges.campaigns"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                >
                <label for="priv-campaigns" class="ml-2 block text-sm text-slate-700 dark:text-slate-200">
                  Campaigns Management
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="priv-statistics"
                  v-model="form.privileges.statistics"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                >
                <label for="priv-statistics" class="ml-2 block text-sm text-slate-700 dark:text-slate-200">
                  Statistics Viewing
                </label>
              </div>

              <div class="flex items-center">
                <input
                  id="priv-settings"
                  v-model="form.privileges.settings"
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 rounded accent-ext-wf1"
                >
                <label for="priv-settings" class="ml-2 block text-sm text-slate-700 dark:text-slate-200">
                  Settings Management
                </label>
              </div>
            </div>
          </div>

          <p v-if="createError" class="text-sm text-red-600 dark:text-red-400">{{ createError }}</p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="submit"
            :disabled="isCreating || !isFormValid"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
          >
            {{ isCreating ? 'Creating...' : 'Create' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-base font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
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
import { ref, watch, computed } from 'vue'
import { Requests } from '@tatevikgr/rest-api-client'
import { adminClient } from '../../api'
import BaseIcon from "../base/BaseIcon.vue";

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'created'])

const isCreating = ref(false)
const createError = ref('')

const form = ref({
  login_name: '',
  email: '',
  password: '',
  super_user: false,
  privileges: {
    subscribers: false,
    campaigns: false,
    statistics: false,
    settings: false
  }
})

const isFormValid = computed(() => {
  return form.value.login_name.trim().length >= 3 &&
    form.value.email.trim().length > 0 &&
    form.value.password.length >= 6 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
})

const resetForm = () => {
  form.value = {
    login_name: '',
    email: '',
    password: '',
    super_user: false,
    privileges: {
      subscribers: false,
      campaigns: false,
      statistics: false,
      settings: false
    }
  }
  createError.value = ''
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      resetForm()
    }
  }
)

const close = () => {
  if (isCreating.value) {
    return
  }

  emit('close')
}

const submitCreateAdmin = async () => {
  if (isCreating.value || !isFormValid.value) {
    return
  }

  if (!form.value.login_name.trim()) {
    createError.value = 'Login name is required.'
    return
  }

  if (!form.value.email.trim()) {
    createError.value = 'Email is required.'
    return
  }

  if (!form.value.password) {
    createError.value = 'Password is required.'
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    const request = new Requests.CreateAdministratorRequest(
      form.value.login_name.trim(),
      form.value.password,
      form.value.email.trim(),
      form.value.super_user,
      form.value.super_user ? undefined : form.value.privileges
    )

    const createdAdmin = await adminClient.createAdministrator(request)
    emit('created', createdAdmin)
    emit('close')
  } catch (error) {
    console.error('Create admin failed:', error)
    createError.value = error?.message || 'Failed to create administrator.'
  } finally {
    isCreating.value = false
  }
}
</script>

