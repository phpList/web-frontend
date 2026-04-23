<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Template</p>
            <h2 class="text-xl font-bold text-slate-900">{{ pageTitle }}</h2>
          </div>

          <RouterLink
            to="/templates"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Templates
          </RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading template...
      </div>

      <div v-else-if="loadError" class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-red-600 shadow-sm">
        {{ loadError }}
      </div>

      <section v-else class="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form class="space-y-6" @submit.prevent="saveTemplate">
            <div class="grid gap-6 lg:grid-cols-2">
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

              <div class="space-y-2">
                <label for="template-list-order" class="block text-sm font-medium text-slate-700">List order</label>
                <input
                  id="template-list-order"
                  v-model.trim="form.listOrder"
                  type="number"
                  min="0"
                  step="1"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
                  placeholder="Optional (e.g. 10)"
                >
              </div>
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
                {{ saveButtonLabel }}
              </button>
            </div>
        </form>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CkEditorField from '../components/base/CkEditorField.vue'
import { templateClient } from '../api'
import { Requests } from "@tatevikgr/rest-api-client";

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const loadError = ref('')
const isSaving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')
const form = ref({
  title: '',
  listOrder: '',
  content: '',
  text: '',
  file: null,
  checkLinks: false,
  checkImages: false,
  checkExternalImages: false
})

const isCreateMode = computed(() => route.name === 'template-create')
const templateId = computed(() => Number(route.params.templateId))
const pageTitle = computed(() => isCreateMode.value ? 'Create Template' : `Edit Template #${templateId.value}`)
const saveButtonLabel = computed(() => {
  if (isSaving.value) {
    return isCreateMode.value ? 'Creating...' : 'Saving...'
  }

  return isCreateMode.value ? 'Create' : 'Save'
})

const loadTemplate = async () => {
  if (isCreateMode.value) {
    form.value.title = ''
    form.value.listOrder = ''
    form.value.content = ''
    form.value.text = ''
    form.value.file = null
    loadError.value = ''
    return
  }

  if (!Number.isFinite(templateId.value) || templateId.value <= 0) {
    loadError.value = 'Template ID is invalid.'
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const template = await templateClient.getTemplate(templateId.value)
    form.value.title = template?.title || ''
    form.value.listOrder = template?.listOrder !== null && template?.listOrder !== undefined
      ? String(template.listOrder)
      : ''
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

  const parser = new DOMParser()
  const doc = parser.parseFromString(form.value.content, 'text/html')
  doc.querySelectorAll('script, style').forEach((element) => element.remove())
  form.value.text = (doc.body.textContent || '').replace(/\s+/g, ' ')
}

const handleFileChange = (event) => {
  const [file] = event.target.files || []
  form.value.file = file || null
}

const saveTemplate = async () => {
  if (!isCreateMode.value && (!Number.isFinite(templateId.value) || templateId.value <= 0)) {
    saveError.value = 'Template ID is invalid.'
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
    const normalizedListOrder = form.value.listOrder === ''
      ? null
      : Number(form.value.listOrder)

    if (normalizedListOrder !== null && (!Number.isInteger(normalizedListOrder) || normalizedListOrder < 0)) {
      saveError.value = 'List order must be a non-negative integer.'
      return
    }

    const request = new Requests.TemplateRequest(
      form.value.title,
      form.value.content,
      form.value.text,
      form.value.file,
      form.value.checkLinks,
      form.value.checkImages,
      form.value.checkExternalImages,
      normalizedListOrder,
    )
    if (isCreateMode.value) {
      const createdTemplate = await templateClient.createTemplate(request)
      const createdTemplateId = Number(createdTemplate?.id)

      saveSuccess.value = 'Template created successfully.'

      if (Number.isFinite(createdTemplateId) && createdTemplateId > 0) {
        await router.replace(`/templates/${createdTemplateId}/edit`)
      }
      return
    }

    await templateClient.updateTemplate(request, templateId.value)

    saveSuccess.value = 'Template updated successfully.'
  } catch (error) {
    console.error('Failed to save template:', error)
    saveError.value = error?.message || 'Failed to save template.'
  } finally {
    isSaving.value = false
  }
}

watch(
    [isCreateMode, templateId],
    () => {
      loadTemplate()
    },
    { immediate: true }
)
</script>
