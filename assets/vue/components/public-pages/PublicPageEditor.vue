<template>
  <section class="space-y-6">
    <header class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-xl font-bold text-slate-900">
        {{ isEditMode ? 'Edit Subscribe Page' : 'Create Subscribe Page' }}
      </h1>
      <div class="flex gap-2">
        <button
          type="button"
          class="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors"
          @click="goBack"
        >
          Back
        </button>
        <button
          type="button"
          class="px-4 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
          :disabled="isSaving || isLoading"
          @click="savePage"
        >
          {{ isSaving ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </header>

    <div v-if="isLoading" class="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500">
      Loading public page data...
    </div>

    <div v-else class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div class="border-b border-slate-200 px-4 pt-4 sm:px-6 sm:pt-6">
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            v-for="step in steps"
            :key="step.id"
            type="button"
            class="rounded-t-lg px-2 py-2 text-center text-xs font-semibold transition-colors"
            :class="currentStep === step.id ? 'bg-ext-wf1 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'"
            @click="goToStep(step.id)"
          >
            <span class="block text-base leading-none">{{ step.id }}</span>
            <span class="block mt-1">{{ step.label }}</span>
          </button>
        </div>
      </div>

      <div class="p-4 sm:p-6 space-y-5">
        <section v-if="currentStep === 1" class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">General settings</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="space-y-1 md:col-span-2">
              <span class="text-sm font-medium text-slate-700">Title</span>
              <input v-model="form.title" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Language file to use</span>
              <select v-model="form.languageFile" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
                <option v-for="option in languageOptions" :key="option" :value="option">{{ option }}</option>
              </select>
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Text for button</span>
              <input v-model="form.button" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
            </label>

            <label class="space-y-1 md:col-span-2">
              <span class="text-sm font-medium text-slate-700">Intro text</span>
              <textarea v-model="form.introText" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Header text</span>
              <textarea v-model="form.headerText" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Footer text</span>
              <textarea v-model="form.footerText" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Thank you page text</span>
              <textarea v-model="form.thankYouPageText" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>

            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Text for successful AJAX subscription</span>
              <textarea v-model="form.ajaxSuccessText" rows="3" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>

            <fieldset class="space-y-2">
              <legend class="text-sm font-medium text-slate-700">HTML email choice</legend>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="textonly" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Don't offer choice, default to text
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="htmlonly" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Don't offer choice, default to HTML
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="checkfortext" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Offer checkbox for text
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="checkforhtml" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Offer checkbox for HTML
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="radiotext" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Radio buttons, default to text
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.htmlChoice" type="radio" value="radiohtml" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Radio buttons, default to HTML
              </label>
            </fieldset>

            <fieldset class="space-y-2">
              <legend class="text-sm font-medium text-slate-700">Display email address confirmation field</legend>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.displayEmailConfirmationField" type="radio" value="1" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                Yes
              </label>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input v-model="form.displayEmailConfirmationField" type="radio" value="0" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
                No
              </label>
            </fieldset>
          </div>
        </section>

        <section v-else-if="currentStep === 2" class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Select the lists to offer</h2>
          <fieldset class="space-y-2">
            <legend class="text-sm font-medium text-slate-700">Display list categories</legend>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="form.displayListCategories" type="radio" value="0" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
              Do not show list categories
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input v-model="form.displayListCategories" type="radio" value="1" class="h-4 w-4 border-slate-300 text-ext-wf1 focus:ring-ext-wf2">
              Display lists in labelled categories
            </label>
          </fieldset>

          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              :checked="form.noPreselectAnyList"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
              @change="toggleNoPreselectAnyList($event)"
            >
            Do not preselect any list
          </label>

          <div class="space-y-3">
            <article
              v-for="list in publicLists"
              :key="list.id"
              class="rounded-lg border border-slate-200 p-3"
            >
              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label class="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <input
                    :checked="form.selectedListIds.includes(list.id)"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                    @change="toggleListSelection(list.id, $event)"
                  >
                  {{ list.name || `List #${list.id}` }}
                </label>
                <label class="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    :checked="form.preselectedListId === list.id"
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                    :disabled="!form.selectedListIds.includes(list.id)"
                    @change="toggleListPreselection(list.id, $event)"
                  >
                  Preselect
                </label>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="currentStep === 3" class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Select the attributes to use</h2>
          <article
            v-for="attribute in attributes"
            :key="attribute.id"
            class="rounded-lg border border-slate-200 p-4 space-y-3"
          >
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-800">Attribute: {{ attribute.id }}</p>
              <label class="flex items-center gap-2 text-sm text-slate-700">
                <input
                  :checked="attributeState(attribute.id).use"
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                  @change="updateAttributeState(attribute.id, 'use', $event.target.checked)"
                >
                Use this attribute in the page
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-500">Name</p>
                <p class="text-sm text-slate-800">{{ attribute.name }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-500">Type</p>
                <p class="text-sm text-slate-800">{{ attribute.type }}</p>
              </div>
              <label class="space-y-1">
                <span class="text-sm font-medium text-slate-700">Default value</span>
                <input
                  :value="attributeState(attribute.id).defaultValue"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
                  @input="updateAttributeState(attribute.id, 'defaultValue', $event.target.value)"
                >
              </label>
              <label class="space-y-1">
                <span class="text-sm font-medium text-slate-700">Order of listing</span>
                <input
                  :value="attributeState(attribute.id).listOrder"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
                  @input="updateAttributeState(attribute.id, 'listOrder', $event.target.value)"
                >
              </label>
            </div>

            <label class="flex items-center gap-2 text-sm text-slate-700">
              <input
                :checked="attributeState(attribute.id).required"
                type="checkbox"
                class="h-4 w-4 rounded border-slate-300 text-ext-wf1 focus:ring-ext-wf2"
                @change="updateAttributeState(attribute.id, 'required', $event.target.checked)"
              >
              Is this attribute required?
            </label>
          </article>
        </section>

        <section v-else-if="currentStep === 4" class="space-y-6">
          <h2 class="text-lg font-semibold text-slate-900">Transaction messages</h2>
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-800">Message subscribers receive when they subscribe</h3>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Subject</span>
              <input v-model="form.subscribeSubject" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
            </label>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Message</span>
              <textarea v-model="form.subscribeMessage" rows="6" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-800">Message they receive when they confirm their subscription</h3>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Subject</span>
              <input v-model="form.confirmedSubject" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
            </label>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Message</span>
              <textarea v-model="form.confirmedMessage" rows="6" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>
          </div>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-slate-800">Content of the message they receive when they unsubscribe</h3>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Subject</span>
              <input v-model="form.unsubscribeSubject" type="text" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
            </label>
            <label class="space-y-1">
              <span class="text-sm font-medium text-slate-700">Message</span>
              <textarea v-model="form.unsubscribeMessage" rows="6" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"></textarea>
            </label>
          </div>
        </section>

        <section v-else class="space-y-4">
          <h2 class="text-lg font-semibold text-slate-900">Owner</h2>
          <label class="space-y-1 block">
            <span class="text-sm font-medium text-slate-700">Select admin</span>
            <select v-model="form.ownerId" class="w-full md:max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2">
              <option value="">No owner</option>
              <option v-for="admin in admins" :key="admin.id" :value="String(admin.id)">
                {{ admin.loginName || admin.email || `Admin #${admin.id}` }}
              </option>
            </select>
          </label>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup>
import {computed, onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {
  backendFetch,
  fetchAllAdmins,
  fetchAllAttributeDefinitions,
  fetchAllLists,
  subscribePagesClient
} from '../../api'

const route = useRoute()
const router = useRouter()

const isEditMode = computed(() => Number.isFinite(Number(route.params.pageId)))
const pageId = computed(() => Number(route.params.pageId))

const isLoading = ref(true)
const isSaving = ref(false)
const admins = ref([])
const lists = ref([])
const attributes = ref([])
const currentStep = ref(1)
const steps = [
  { id: 1, label: 'General' },
  { id: 2, label: 'Lists' },
  { id: 3, label: 'Attributes' },
  { id: 4, label: 'Messages' },
  { id: 5, label: 'Owner' }
]
const attributeConfig = ref({})
const dataMap = ref({})
const legacyHtmlChoiceOptions = new Set(['textonly', 'htmlonly', 'checkfortext', 'checkforhtml', 'radiotext', 'radiohtml'])

const form = ref({
  title: '',
  languageFile: 'english.inc',
  introText: '',
  headerText: '',
  footerText: '',
  thankYouPageText: '',
  ajaxSuccessText: '',
  button: '',
  htmlChoice: 'checkforhtml',
  displayEmailConfirmationField: '0',
  displayListCategories: '1',
  noPreselectAnyList: true,
  selectedListIds: [],
  preselectedListId: null,
  subscribeSubject: '',
  subscribeMessage: '',
  confirmedSubject: '',
  confirmedMessage: '',
  unsubscribeSubject: '',
  unsubscribeMessage: '',
  ownerId: ''
})

const defaultLanguageOptions = ref(['english.inc'])

const loadDefaultLanguageOptions = async () => {
  try {
    const resp = await backendFetch('/_internal/languages')
    if (resp && resp.ok) {
      const items = await resp.json()
      if (Array.isArray(items) && items.length > 0) {
        defaultLanguageOptions.value = items
      }
    }
  } catch (error) {
    // keep default hardcoded list on error
    console.error('Failed to load default language options:', error)
  }
}

const languageOptions = computed(() => {
  const current = form.value.languageFile?.trim()
  if (!current || defaultLanguageOptions.value.includes(current)) {
    return defaultLanguageOptions.value
  }
  return [current, ...defaultLanguageOptions.value]
})

const publicLists = computed(() => lists.value.filter((list) => list.public === true))

const goToStep = (stepId) => {
  currentStep.value = stepId
}

const parseBoolean = (value, fallback = false) => {
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value !== 'string') return fallback
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase())
}

const parseIdArray = (value) => {
  if (!value) return []

  let raw = value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        raw = JSON.parse(trimmed)
      } catch (error) {
        raw = trimmed.split(',')
      }
    } else {
      raw = trimmed.split(',')
    }
  }

  if (!Array.isArray(raw)) {
    raw = [raw]
  }

  return raw
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0)
}

const getDataValue = (key, fallback = '') => {
  const value = dataMap.value[key]
  return value === undefined || value === null ? fallback : String(value)
}

const attributeState = (attributeId) => {
  if (!attributeConfig.value[attributeId]) {
    attributeConfig.value[attributeId] = {
      use: false,
      required: false,
      defaultValue: '',
      listOrder: ''
    }
  }

  return attributeConfig.value[attributeId]
}

const updateAttributeState = (attributeId, field, value) => {
  attributeConfig.value[attributeId] = {
    ...attributeState(attributeId),
    [field]: value
  }
}

const toggleListSelection = (listId, event) => {
  const checked = event?.target?.checked === true
  const selected = new Set(form.value.selectedListIds)

  if (checked) {
    selected.add(listId)
  } else {
    selected.delete(listId)
    if (form.value.preselectedListId === listId) {
      form.value.preselectedListId = null
      form.value.noPreselectAnyList = true
    }
  }

  form.value.selectedListIds = Array.from(selected).sort((a, b) => a - b)
}

const toggleNoPreselectAnyList = (event) => {
  const checked = event?.target?.checked === true
  if (checked) {
    form.value.noPreselectAnyList = true
    form.value.preselectedListId = null
    return
  }

  form.value.noPreselectAnyList = form.value.preselectedListId === null
}

const toggleListPreselection = (listId, event) => {
  const checked = event?.target?.checked === true
  form.value.preselectedListId = checked ? listId : null
  form.value.noPreselectAnyList = form.value.preselectedListId === null
}

const loadPageDataMap = (items) => {
  dataMap.value = Object.fromEntries(
      (items || []).map(({ key, value }) => [key, value])
  )
}

const applyLoadedDataToForm = (page = null) => {
  form.value.title = page?.title || ''
  form.value.ajaxSuccessText = getDataValue('ajax_subscribeconfirmation', '')
  form.value.attributes = getDataValue('attributes', '')
  form.value.button = getDataValue('button', '')
  form.value.footerText = getDataValue('footer', '')
  form.value.headerText = getDataValue('header', '')
  const legacyHtmlChoice = getDataValue('htmlchoice', '').trim().toLowerCase()
  form.value.htmlChoice = legacyHtmlChoiceOptions.has(legacyHtmlChoice)
    ? legacyHtmlChoice // todo: check if correct
    : (parseBoolean(getDataValue('html_email_choice', '1'), true) ? 'checkforhtml' : 'textonly')
  form.value.introText = getDataValue('intro', '')
  form.value.languageFile = getDataValue('language_file', 'english.inc')
  form.value.selectedListIds = parseIdArray(getDataValue('lists', ''))
  const loadedPreselectedId = Number(getDataValue('preselectlist', ''))
  form.value.preselectedListId = loadedPreselectedId && form.value.selectedListIds.includes(loadedPreselectedId)
    ? loadedPreselectedId
    : null
  form.value.noPreselectAnyList = form.value.preselectedListId === null
  form.value.displayListCategories = parseBoolean(getDataValue('showcategories', '1'), true) ? '1' : '0'
  form.value.thankYouPageText = getDataValue('thankyoupage', '')
  form.value.title = getDataValue('title', '')
  form.value.displayEmailConfirmationField = parseBoolean(getDataValue('emaildoubleentry', '0')) ? '1' : '0'

  // form.value.subscribeSubject = getDataValue('tx_subscribe_subject', '')
  // form.value.subscribeMessage = getDataValue('tx_subscribe_message', '')
  // form.value.confirmedSubject = getDataValue('tx_confirm_subject', '')
  // form.value.confirmedMessage = getDataValue('tx_confirm_message', '')
  // form.value.unsubscribeSubject = getDataValue('tx_unsubscribe_subject', '')
  // form.value.unsubscribeMessage = getDataValue('tx_unsubscribe_message', '')

  const ownerIdFromPage = page?.owner?.id ? String(page.owner.id) : ''
  form.value.ownerId = getDataValue('owner_id', ownerIdFromPage)

  // const config = {}
  // attributes.value.forEach((attribute) => {
  //   const id = attribute.id
  //   config[id] = {
  //     use: parseBoolean(getDataValue(`attribute_${id}_use`, '0')),
  //     required: parseBoolean(getDataValue(`attribute_${id}_required`, '0')),
  //     defaultValue: getDataValue(`attribute_${id}_default`, ''),
  //     listOrder: getDataValue(`attribute_${id}_order`, '')
  //   }
  // })
  // attributeConfig.value = config
}

const loadInitialData = async () => {
  isLoading.value = true

  try {
    // fetch language options from vendor package (exposed via internal controller)
    await loadDefaultLanguageOptions()
    const [fetchedAdmins, fetchedLists, fetchedAttributes] = await Promise.all([
      fetchAllAdmins(),
      fetchAllLists(),
      fetchAllAttributeDefinitions()
    ])

    admins.value = fetchedAdmins.sort((a, b) => a.id - b.id)
    lists.value = fetchedLists.sort((a, b) => a.id - b.id)
    attributes.value = fetchedAttributes.sort((a, b) => a.id - b.id)

    if (isEditMode.value) {
      const page = await subscribePagesClient.getSubscribePage(pageId.value)
      loadPageDataMap(page?.data)
      applyLoadedDataToForm(page)
    } else {
      dataMap.value = {}
      applyLoadedDataToForm()
    }
  } catch (error) {
    console.error('Failed to load public page editor data:', error)
    window.alert(error?.message || 'Failed to load data for public page editor.')
  } finally {
    isLoading.value = false
  }
}

const serializeIdArray = (ids) => ids
  .map((id) => Number(id))
  .filter((id) => Number.isFinite(id) && id > 0)
  .sort((a, b) => a - b)
  .join(',')

const persistDataItems = async () => {
  const selectedListIds = serializeIdArray(form.value.selectedListIds)
  const selectedListSet = new Set(parseIdArray(selectedListIds))
  const candidatePreselectedId = form.value.noPreselectAnyList ? null : Number(form.value.preselectedListId)
  const normalizedPreselectedId = Number.isFinite(candidatePreselectedId) && selectedListSet.has(candidatePreselectedId)
    ? String(candidatePreselectedId)
    : ''

  // todo: check how it should be done with attributes
  // attributes.value.forEach((attribute) => {
  //   const state = attributeState(attribute.id)
  //   payload.push([`attribute_${attribute.id}_use`, state.use ? '1' : '0'])
  //   payload.push([`attribute_${attribute.id}_required`, state.required ? '1' : '0'])
  //   payload.push([`attribute_${attribute.id}_default`, state.defaultValue || ''])
  //   payload.push([`attribute_${attribute.id}_order`, state.listOrder || ''])
  // })

  return [
    ['title', form.value.title],
    ['language_file', form.value.languageFile],
    ['intro', form.value.introText],
    ['header', form.value.headerText],
    ['footer', form.value.footerText],
    ['thankyoupage', form.value.thankYouPageText],
    ['ajax_subscribeconfirmation', form.value.ajaxSuccessText],
    ['button', form.value.button],
    ['htmlchoice', form.value.htmlChoice],
    ['emaildoubleentry', form.value.displayEmailConfirmationField ? 'yes' : 'no'],
    ['showcategories', form.value.displayListCategories ? 'yes' : 'no'],
    ['lists', selectedListIds],
    ['preselectlist', normalizedPreselectedId],
    // ['tx_subscribe_subject', form.value.subscribeSubject],
    // ['tx_subscribe_message', form.value.subscribeMessage],
    // ['tx_confirm_subject', form.value.confirmedSubject],
    // ['tx_confirm_message', form.value.confirmedMessage],
    // ['tx_unsubscribe_subject', form.value.unsubscribeSubject],
    // ['tx_unsubscribe_message', form.value.unsubscribeMessage],
  ]
}

const savePage = async () => {
  const dataItems = (await persistDataItems()).map(([key, value]) => ({
    key,
    value
  }));

  const title = form.value.title.trim()
  if (!title) {
    window.alert('Title is required.')
    return
  }

  isSaving.value = true
  try {
    const ownerId = form.value.ownerId ? Number(form.value.ownerId) : null
    let savedPage

    if (isEditMode.value) {
      savedPage = await subscribePagesClient.updateSubscribePage(pageId.value, {
        title,
        active: true,
        owner: ownerId,
        data: dataItems
      })
    } else {
      savedPage = await subscribePagesClient.createSubscribePage({
        title,
        active: true,
        owner: ownerId,
        data: dataItems
      })
    }

    const savedId = Number(savedPage?.id || pageId.value)
    if (!Number.isFinite(savedId) || savedId <= 0) {
      throw new Error('Invalid subscribe page id returned from server.')
    }

    await persistDataItems(savedId)

    if (!isEditMode.value) {
      await router.replace({ name: 'public-page-edit', params: { pageId: savedId } })
    }

    window.alert('Public page saved.')
  } catch (error) {
    console.error('Failed to save public page:', error)
    window.alert(error?.message || 'Failed to save public page.')
  } finally {
    isSaving.value = false
  }
}

const goBack = () => {
  router.push({ name: 'public-pages' })
}

onMounted(() => {
  loadInitialData()
})
</script>
