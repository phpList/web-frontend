<template>
  <section class="bg-white rounded-xl border border-slate-200 shadow-sm">
    <header class="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 class="text-xl font-bold text-slate-900">Templates</h2>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          type="button"
          @click="openDefaultTemplateModal"
        >
          Add Template From Default
        </button>
        <button
          class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          type="button"
          @click="goToCreateTemplate"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          New Template
        </button>
      </div>
    </header>

    <div class="p-6">
      <div v-if="isLoading" class="py-12 text-center text-slate-500">
        Loading templates...
      </div>

      <div v-else-if="errorMessage" class="py-12 text-center text-red-600">
        {{ errorMessage }}
      </div>

      <div v-else-if="templates.length === 0" class="py-12 text-center text-slate-500">
        No templates found.
      </div>

      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <article
          v-for="templateItem in templates"
          :key="templateItem.id"
          class="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
        >
          <div class="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl">
            <img
              :src="getTemplateImage(templateItem)"
              :alt="`T#${templateItem.id}`"
              class="w-full h-full object-cover"
            >
          </div>

          <div class="p-4">
            <h3 class="font-semibold text-slate-900 mb-1">{{ templateItem.title || `Template #${templateItem.id}` }}</h3>
            <p class="text-xs text-slate-500 mb-3">
              {{ getTemplateType(templateItem) }}
            </p>

            <div class="flex justify-between items-center text-xs text-slate-400">
              <span>ID {{ templateItem.id }}</span>
              <span>Order {{ templateItem.order ?? '-' }}</span>
            </div>

            <div class="mt-4 flex gap-2">
              <button
                class="flex-1 px-3 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                type="button"
                @click="goToEditTemplate(templateItem.id)"
              >
                <BaseIcon name="edit" />
                Edit
              </button>

              <button
                class="px-3 py-2 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                type="button"
                aria-label="Delete template"
                @click="deleteTemplate(templateItem.id)"
              >
                <BaseIcon name="delete" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>

  <div
    v-if="isDefaultTemplateModalOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0"
    aria-labelledby="default-template-modal-title"
    role="dialog"
    aria-modal="true"
  >
    <div
      class="fixed inset-0 bg-slate-900/50 transition-opacity"
      aria-hidden="true"
      @click="closeDefaultTemplateModal"
    ></div>

    <form class="w-full sm:max-w-lg z-10" @submit.prevent="submitCreateFromDefault">
      <div class="bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all">
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h3 id="default-template-modal-title" class="text-lg leading-6 font-medium text-slate-900">
              Add Template From Default
            </h3>
            <button type="button" class="text-slate-400 hover:text-slate-500" @click="closeDefaultTemplateModal">
              <BaseIcon name="close" class="w-5 h-5" />
            </button>
          </div>

          <div v-if="isDefaultTemplatesLoading" class="text-sm text-slate-500">
            Loading default templates...
          </div>

          <div v-else class="space-y-2">
            <label for="default-template-select" class="block text-sm font-medium text-slate-700">Default template</label>
            <select
              id="default-template-select"
              v-model="selectedDefaultTemplateKey"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
              :disabled="isCreatingFromDefault || defaultTemplates.length === 0"
            >
              <option value="">Select a default template</option>
              <option
                v-for="defaultTemplate in defaultTemplates"
                :key="defaultTemplate.key"
                :value="defaultTemplate.key"
              >
                {{ defaultTemplate.name }}
              </option>
            </select>

            <p
              v-if="selectedDefaultTemplateDescription"
              class="text-xs text-slate-500"
            >
              {{ selectedDefaultTemplateDescription }}
            </p>
          </div>

          <p v-if="defaultTemplatesError" class="text-sm text-red-600">
            {{ defaultTemplatesError }}
          </p>
          <p v-if="createFromDefaultError" class="text-sm text-red-600">
            {{ createFromDefaultError }}
          </p>
        </div>

        <div class="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-2">
          <button
            type="submit"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-ext-wf1 text-base font-medium text-white hover:bg-ext-wf3 focus:outline-none sm:w-auto sm:text-sm disabled:opacity-50"
            :disabled="isCreatingFromDefault || isDefaultTemplatesLoading || !selectedDefaultTemplateKey"
          >
            {{ isCreatingFromDefault ? 'Adding...' : 'Add' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm"
            :disabled="isCreatingFromDefault"
            @click="closeDefaultTemplateModal"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import { templateClient } from '../../api'

const router = useRouter()
const templates = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const isDefaultTemplateModalOpen = ref(false)
const defaultTemplates = ref([])
const isDefaultTemplatesLoading = ref(false)
const defaultTemplatesError = ref('')
const selectedDefaultTemplateKey = ref('')
const isCreatingFromDefault = ref(false)
const createFromDefaultError = ref('')

const getTemplateImage = (templateItem) => {
  const images = templateItem?.images
  if (!images) return '';

  return `data:${images[0].mimetype};base64,${images[0].data}`;
}

const getTemplateType = (templateItem) => {
  const hasHtml = typeof templateItem.content === 'string' && templateItem.content.trim().length > 0
  const hasText = typeof templateItem.text === 'string' && templateItem.text.trim().length > 0

  if (hasHtml && hasText) {
    return 'html + text'
  }

  if (hasHtml) {
    return 'html'
  }

  if (hasText) {
    return 'text'
  }

  return 'empty'
}

const loadTemplates = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await templateClient.getTemplates(0, 1000)

    const items = Array.isArray(response?.items) ? response.items : []

    templates.value = items.sort((a, b) => {
      const aOrder = a.listOrder ?? Number.MAX_SAFE_INTEGER
      const bOrder = b.listOrder ?? Number.MAX_SAFE_INTEGER

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      return (a.name ?? '').localeCompare(b.name ?? '')
    })
  } catch (error) {
    console.error('Failed to load templates:', error)
    errorMessage.value = 'Failed to load templates.'
  } finally {
    isLoading.value = false
  }
}

const goToEditTemplate = (templateId) => {
  router.push(`/templates/${templateId}/edit`)
}

const goToCreateTemplate = () => {
  router.push('/templates/create')
}

const deleteTemplate = async (templateId) => {
  if (!confirm('Are you sure you want to delete this template?')) {
    return
  }

  try {
    await templateClient.deleteTemplate(templateId)
    templates.value = templates.value.filter((template) => template.id !== templateId)
  } catch (error) {
    console.error('Failed to delete template:', error)
  }
}

const selectedDefaultTemplateDescription = computed(() => {
  const selectedTemplate = defaultTemplates.value.find((templateItem) => templateItem.key === selectedDefaultTemplateKey.value)
  return selectedTemplate?.description || ''
})

const loadDefaultTemplates = async () => {
  isDefaultTemplatesLoading.value = true
  defaultTemplatesError.value = ''

  try {
    const response = await templateClient.getDefaultTemplates()
    defaultTemplates.value = Array.isArray(response) ? response : []
    selectedDefaultTemplateKey.value = ''
  } catch (error) {
    console.error('Failed to load default templates:', error)
    defaultTemplatesError.value = 'Failed to load default templates.'
    defaultTemplates.value = []
    selectedDefaultTemplateKey.value = ''
  } finally {
    isDefaultTemplatesLoading.value = false
  }
}

const openDefaultTemplateModal = async () => {
  isDefaultTemplateModalOpen.value = true
  createFromDefaultError.value = ''
  await loadDefaultTemplates()
}

const closeDefaultTemplateModal = () => {
  if (isCreatingFromDefault.value) {
    return
  }

  isDefaultTemplateModalOpen.value = false
}

const submitCreateFromDefault = async () => {
  if (isCreatingFromDefault.value) {
    return
  }

  if (!selectedDefaultTemplateKey.value) {
    createFromDefaultError.value = 'Please select a default template.'
    return
  }

  isCreatingFromDefault.value = true
  createFromDefaultError.value = ''

  try {
    await templateClient.createFromDefault(selectedDefaultTemplateKey.value)
    isDefaultTemplateModalOpen.value = false
    await loadTemplates()
  } catch (error) {
    console.error('Failed to create template from default:', error)
    createFromDefaultError.value = error?.message || 'Failed to create template from default.'
  } finally {
    isCreatingFromDefault.value = false
  }
}

onMounted(() => {
  loadTemplates()
})
</script>
