<template>
  <section class="bg-white rounded-xl border border-slate-200 shadow-sm">
    <header class="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
      <h2 class="text-xl font-bold text-slate-900">Email Template Library</h2>
      <div class="flex gap-2">
        <button
          class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          type="button"
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

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <article
          v-for="templateItem in templates"
          :key="templateItem.id"
          class="border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-all"
        >
          <div class="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-6xl">
            <img
              :src="getTemplateImage(templateItem)"
              :alt="`Template #${templateItem.id}`"
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
                class="px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                type="button"
                aria-label="Copy template"
              >
                <BaseIcon name="copy" />
              </button>

              <button
                class="px-3 py-2 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                type="button"
                aria-label="Delete template"
              >
                <BaseIcon name="delete" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BaseIcon from '../base/BaseIcon.vue'
import { templateClient } from '../../api'

const router = useRouter()
const templates = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

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
    templates.value = Array.isArray(response?.items) ? response.items : []
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

onMounted(() => {
  loadTemplates()
})
</script>
