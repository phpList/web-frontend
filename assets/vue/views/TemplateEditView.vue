<template>
  <AdminLayout>
    <section class="max-w-3xl bg-white rounded-xl border border-slate-200 shadow-sm">
      <header class="p-6 border-b border-slate-200">
        <h1 class="text-xl font-bold text-slate-900">Edit Template</h1>
      </header>

      <div class="p-6">
        <div v-if="isLoading" class="py-8 text-center text-slate-500">
          Loading template...
        </div>

        <div v-else class="space-y-6">
          <div v-if="loadError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ loadError }}
          </div>

          <form v-else class="space-y-6" @submit.prevent="saveTemplate">
            <div class="space-y-2">
              <label for="template-title" class="block text-sm font-medium text-slate-700">Title</label>
              <input
                id="template-title"
                v-model.trim="form.title"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
                placeholder="Enter template title"
                required
              >
            </div>

            <CkEditorField
              id="template-content"
              v-model="form.content"
              label="Content"
            />

            <div class="space-y-2">
              <div class="flex items-center justify-between gap-2">
                <label for="template-text" class="block text-sm font-medium text-slate-700">Text version</label>
                <button
                  type="button"
                  class="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 text-xs text-slate-700 transition-colors"
                  @click="populateTextFromContent"
                >
                  Use HTML as plain text
                </button>
              </div>
              <textarea
                id="template-text"
                v-model="form.text"
                rows="7"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
                placeholder="[CONTENT]"
              />
            </div>

            <div class="space-y-2">
              <label for="template-file" class="block text-sm font-medium text-slate-700">Template file</label>
              <input
                id="template-file"
                type="file"
                accept=".html,.htm,.txt"
                class="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-ext-wf2 file:px-3 file:py-2 file:text-ext-wf3 hover:file:bg-indigo-100"
                @change="handleFileChange"
              >
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-700">Checks</label>
              <div class="space-y-2 rounded-lg border border-slate-200 p-4">
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    v-model="form.checkLinks"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf1"
                  >
                  Check that all links have a full URL
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    v-model="form.checkImages"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf1"
                  >
                  Check that all images have a full URL
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    v-model="form.checkExternalImages"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf1"
                  >
                  Check that all external images exist
                </label>
              </div>
            </div>

            <div v-if="saveError" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ saveError }}
            </div>
            <div v-if="saveSuccess" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {{ saveSuccess }}
            </div>

            <div class="flex items-center justify-end gap-2">
              <RouterLink
                to="/templates"
                class="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors"
              >
                Cancel
              </RouterLink>
              <button
                type="submit"
                class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isSaving"
              >
                {{ isSaving ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CkEditorField from '../components/base/CkEditorField.vue'
import apiClient, { templateClient } from '../api'

const route = useRoute()

const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const form = ref({
  title: '',
  content: '',
  text: '',
  file: null,
  checkLinks: false,
  checkImages: false,
  checkExternalImages: false
})

const templateId = computed(() => route.params.templateId)

const loadTemplate = async () => {
  if (!templateId.value) {
    loadError.value = 'Template ID is missing.'
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const template = await templateClient.getTemplate(templateId.value)
    form.value.title = template?.title || ''
    form.value.content = template?.content || ''
    form.value.text = template?.text || ''
    form.value.file = null
  } catch (error) {
    console.error('Failed to load template:', error)
    loadError.value = 'Failed to load template.'
  } finally {
    isLoading.value = false
  }
}

const populateTextFromContent = () => {
  if (!form.value.content) {
    form.value.text = ''
    return
  }

  form.value.text = form.value.content
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const handleFileChange = (event) => {
  const [file] = event.target.files || []
  form.value.file = file || null
}

const saveTemplate = async () => {
  if (!templateId.value) {
    saveError.value = 'Template ID is missing.'
    return
  }

  if (!form.value.title) {
    saveError.value = 'Title is required.'
    return
  }

  isSaving.value = true
  saveError.value = ''
  saveSuccess.value = ''

  try {
    const payload = new FormData()
    payload.append('title', form.value.title)
    payload.append('content', form.value.content || '')
    payload.append('text', form.value.text || '')
    payload.append('check_links', String(form.value.checkLinks))
    payload.append('check_images', String(form.value.checkImages))
    payload.append('check_external_images', String(form.value.checkExternalImages))

    if (form.value.file instanceof File) {
      payload.append('file', form.value.file)
    }

    await apiClient.put(`templates/${templateId.value}`, payload, {
      'Content-Type': 'multipart/form-data'
    })
    saveSuccess.value = 'Template updated successfully.'
  } catch (error) {
    console.error('Failed to save template:', error)
    saveError.value = error?.message || 'Failed to save template.'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadTemplate()
})
</script>
