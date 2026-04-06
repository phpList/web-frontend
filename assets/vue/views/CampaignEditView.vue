<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500">Campaign</p>
            <h2 class="text-xl font-bold text-slate-900">Edit Campaign #{{ campaignId }}</h2>
          </div>

          <RouterLink
            to="/campaigns"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Campaigns
          </RouterLink>
        </div>
      </div>

      <div v-if="isLoading" class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading campaign...
      </div>

      <div v-else-if="loadError" class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-red-600 shadow-sm">
        {{ loadError }}
      </div>

      <div v-else class="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div class="border-b border-slate-200 px-4 pt-4 sm:px-6 sm:pt-6">
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              v-for="step in steps"
              :key="step.id"
              type="button"
              class="rounded-t-lg px-2 py-2 text-center text-xs font-semibold transition-colors"
              :class="currentStep === step.id
                ? 'bg-ext-wf1 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'"
              @click="goToStep(step.id)"
            >
              <span class="block text-base leading-none">{{ step.id }}</span>
              <span class="block mt-1">{{ step.label }}</span>
            </button>
          </div>
        </div>

        <div class="p-4 sm:p-6 space-y-5">
          <section v-if="currentStep === 1" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Content</h3>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-subject">Subject</label>
              <input
                id="campaign-subject"
                v-model="form.subject"
                type="text"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="Campaign subject"
              >
            </div>

            <div class="space-y-3 rounded-lg border border-slate-200 p-4">
              <p class="text-sm font-semibold text-slate-900">How do you want to compose content?</p>

              <label class="flex items-center gap-2 text-sm text-slate-800">
                <input
                  v-model="form.composeMode"
                  type="radio"
                  value="webpage"
                  class="h-4 w-4 border-slate-300 text-slate-900"
                >
                Send a webpage
              </label>

              <label class="flex items-center gap-2 text-sm text-slate-800">
                <input
                  v-model="form.composeMode"
                  type="radio"
                  value="compose"
                  class="h-4 w-4 border-slate-300 text-slate-900"
                >
                Compose message
              </label>
            </div>

            <div v-if="form.composeMode === 'webpage'" class="space-y-2">
              <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-webpage-url">Webpage URL</label>
              <input
                id="campaign-webpage-url"
                v-model="form.webpageUrl"
                type="url"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/page"
              >
              <p class="text-xs text-slate-500">Campaign content will be saved as <code>[URL:YOUR_URL]</code>.</p>
            </div>

            <div v-else class="space-y-4">
              <CkEditorField
                id="campaign-html-content"
                v-model="form.composeHtml"
                label="HTML content"
              />
            </div>

            <div>
              <label for="campaign-footer" class="mb-1 block text-sm font-medium text-slate-700">Footer</label>

              <textarea
                  id="campaign-footer"
                  v-model="form.footer"
                  rows="6"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </section>

          <section v-else-if="currentStep === 2" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Format</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_2fr_1fr]">

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-template">Use template</label>
                <select id="campaign-template" v-model="form.templateId" class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" >
                  <option value="" class="text-slate-400">No template</option>
                  <option
                      v-for="template in templates"
                      :key="template.id"
                      :value="String(template.id)"
                  >
                    {{ template.title }}
                  </option>
                </select>
              </div>

              <div class="sm:justify-self-center justify-self-start">
                <label class="mb-1 block text-sm font-medium text-slate-700">
                  Send format
                </label>

                <div class="flex gap-4">
                  <label class="flex items-center gap-2 text-sm text-slate-900">
                    <input type="radio" value="html" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    HTML
                  </label>

                  <label class="flex items-center gap-2 text-sm text-slate-900">
                    <input type="radio" value="text" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    Text
                  </label>

                  <label class="flex items-center gap-2 text-sm text-slate-900">
                    <input type="radio" value="invite" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"/>
                    Invite
                  </label>
                </div>
              </div>

              <label class="flex items-center gap-2 text-sm text-slate-800 sm:mt-2">
                <input
                  v-model="form.htmlFormated"
                  disabled
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 text-slate-900"
                >
                HTML formatted
              </label>
            </div>

          </section>

          <section v-else-if="currentStep === 3" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Scheduling</h3>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-embargo">Embargo until</label>
                <input
                  id="campaign-embargo"
                  v-model="form.embargo"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-repeat-interval">Repeat interval (minutes)</label>
                <input
                  id="campaign-repeat-interval"
                  v-model="form.repeatInterval"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-repeat-until">Stop sending after</label>
                <input
                  id="campaign-repeat-until"
                  v-model="form.repeatUntil"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-requeue-interval">Requeue every (minutes)</label>
                <input
                  id="campaign-requeue-interval"
                  v-model="form.requeueInterval"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-requeue-until">Requeue until</label>
                <input
                  id="campaign-requeue-until"
                  v-model="form.requeueUntil"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>
          </section>

          <section v-else-if="currentStep === 4" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Lists</h3>

            <p class="text-sm text-slate-600">Please select the lists you want to send this campaign to.</p>

            <div class="max-h-96 overflow-auto rounded-lg border border-slate-200 p-3">
              <label
                v-for="list in mailingLists"
                :key="list.id"
                :for="`campaign-list-${list.id}`"
                class="flex items-center gap-2 py-1 text-sm text-slate-800"
              >
                <input
                  :id="`campaign-list-${list.id}`"
                  v-model="selectedListIds"
                  type="checkbox"
                  :value="list.id"
                  class="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                >
                <span>{{ list.name || `List #${list.id}` }}</span>
              </label>

              <p v-if="mailingLists.length === 0" class="text-sm text-slate-500">No mailing lists found.</p>
            </div>
          </section>

          <section v-else-if="currentStep === 5" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Send test</h3>

            <p class="text-sm text-slate-600">Test send to email address(es).</p>
            <div class="text-slate-400">
              (comma separate addresses - all must be existing subscribers)
            </div>

            <div class="rounded-lg border border-slate-200 p-3 space-y-3">
              <textarea
                id="campaign-test-recipients"
                v-model="form.testRecipients"
                rows="5"
                class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="email1@example.com, email2@example.com"
              ></textarea>

              <button
                type="button"
                class="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                :disabled="isSendingTest"
                @click="sendTestCampaign"
              >
                Send test
              </button>
            </div>
          </section>

          <section v-else class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900">Finish</h3>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-from">From</label>
                <input
                  id="campaign-from"
                  v-model="form.fromField"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="From name or address"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-reply-to">Reply-To</label>
                <input
                  id="campaign-reply-to"
                  v-model="form.replyTo"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Reply-to email"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700" for="campaign-to-field">To field</label>
                <input
                  id="campaign-to-field"
                  v-model="form.toField"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Recipient field"
                >
              </div>
            </div>

            <div class="space-y-2 rounded-lg border p-4" :class="warnings.length ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'">
              <p class="text-sm font-semibold" :class="warnings.length ? 'text-amber-800' : 'text-emerald-800'">
                {{ warnings.length ? 'Please review before saving' : 'Campaign is ready to save' }}
              </p>
              <p v-for="warning in warnings" :key="warning" class="text-sm text-amber-800">
                {{ warning }}
              </p>
            </div>
          </section>
        </div>

        <div class="border-t border-slate-200 px-4 py-4 sm:px-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="text-sm">
              <div v-if="saveErrors.length" class="text-red-600">
                <p class="font-medium">Please fix the following fields:</p>
                <ul class="mt-1 list-disc pl-5 space-y-1">
                  <li v-for="errorItem in saveErrors" :key="errorItem">{{ errorItem }}</li>
                </ul>
              </div>
              <p v-else-if="saveError" class="text-red-600 whitespace-pre-line">{{ saveError }}</p>
              <p v-else-if="saveSuccess" class="text-emerald-700">{{ saveSuccess }}</p>
            </div>

            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                :disabled="currentStep === 1"
                @click="previousStep"
              >
                Back
              </button>

              <button
                v-if="currentStep < steps.length"
                type="button"
                class="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                :disabled="isSaving"
                @click="nextStep"
              >
                Next
              </button>

              <button
                type="button"
                class="rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                :disabled="isSaving"
                @click="saveCampaign"
              >
                {{ isSaving ? 'Saving...' : 'Save and continue editing' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {RouterLink, useRoute, useRouter} from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CkEditorField from '../components/base/CkEditorField.vue'
import {campaignClient, listClient, listMessagesClient, templateClient} from '../api'

const route = useRoute()
const router = useRouter()

const steps = [
  { id: 1, label: 'Content' },
  { id: 2, label: 'Format' },
  { id: 3, label: 'Scheduling' },
  { id: 4, label: 'Lists' },
  { id: 5, label: 'Test send' },
  { id: 6, label: 'Finish' },
]

const campaignId = computed(() => Number(route.params.campaignId))
const currentStep = ref(1)
const isLoading = ref(true)
const loadError = ref('')
const isSaving = ref(false)
const isSendingTest = ref(false)
const saveError = ref('')
const saveErrors = ref([])
const saveSuccess = ref('')

const campaign = ref(null)
const templates = ref([])
const mailingLists = ref([])
const associatedListIds = ref([])
const selectedListIds = ref([])
const composeHtmlCache = ref('')

const stepSlugById = {
  1: 'content',
  2: 'format',
  3: 'scheduling',
  4: 'lists',
  5: 'test-send',
  6: 'finish'
}

const form = ref({
  subject: '',
  composeMode: 'compose',
  webpageUrl: '',
  composeHtml: '',
  composeText: '',
  footer: '',
  fromField: '',
  toField: '',
  replyTo: '',
  userSelection: '',
  templateId: '',
  sendFormat: 'html',
  htmlFormated: true,
  testRecipients: '',
  embargo: '',
  repeatInterval: '',
  repeatUntil: '',
  requeueInterval: '',
  requeueUntil: ''
})

const warnings = computed(() => {
  const list = []

  if (normalizeListIds(selectedListIds.value).length === 0) {
    list.push('Destination lists are missing.')
  }

  if (form.value.composeMode === 'webpage' && !form.value.webpageUrl.trim()) {
    list.push('Webpage URL is required for "Send a webpage" mode.')
  }

  if (form.value.composeMode === 'compose' && !form.value.composeHtml.trim() && !form.value.composeText.trim()) {
    list.push('Compose message mode requires HTML or text content.')
  }

  return list
})

const isAuthenticationError = (error) => error?.name === 'AuthenticationException' || error?.status === 401

const validationFieldLabels = {
  'format.sendFormat': 'Send format',
  'schedule.repeatUntil': 'Stop sending after',
  'schedule.requeueUntil': 'Requeue until',
  'schedule.embargo': 'Embargo until'
}

const normalizeFieldName = (fieldPath = '') => {
  if (validationFieldLabels[fieldPath]) return validationFieldLabels[fieldPath]

  const fallback = String(fieldPath)
    .split('.')
    .pop()
    ?.replace(/\[\d+]/g, '')
    ?.replace(/_/g, ' ')
    ?.replace(/([a-z])([A-Z])/g, '$1 $2')
    ?.trim()

  if (!fallback) return 'Field'
  return fallback.charAt(0).toUpperCase() + fallback.slice(1)
}

const formatValidationErrors = (error) => {
  const responseData = error?.responseData
  const fromObject = []

  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    Object.entries(responseData).forEach(([field, rawMessage]) => {
      if (!rawMessage) return
      const text = Array.isArray(rawMessage) ? rawMessage.join(' ') : String(rawMessage)
      fromObject.push(`${normalizeFieldName(field)}: ${text}`)
    })
  }

  if (fromObject.length > 0) return [...new Set(fromObject)]
  console.log('Failed to format validation errors:', error)
  return []
}

const normalizeListIds = (values) =>
  values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value))

const parseTestRecipients = (value) =>
  String(value || '')
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)

const toLocalDateTimeInput = (dateValue) => {
  if (!dateValue) return ''

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const toApiDateTime = (value) => {
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}

const extractWebpageUrl = (text) => {
  if (!text) return null
  const match = text.match(/\[URL:([^\]]+)\]/)
  return match?.[1]?.trim() || null
}

const resolveStepFromRouteValue = (value) => {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return null

  const fromNumber = Number(raw)
  if (Number.isInteger(fromNumber) && fromNumber >= 1 && fromNumber <= steps.length) {
    return fromNumber
  }

  const normalized = String(raw).toLowerCase()
  const entry = Object.entries(stepSlugById).find(([, slug]) => slug === normalized)
  return entry ? Number(entry[0]) : null
}

const fillForm = (campaignValue) => {
  const content = campaignValue?.messageContent || {}
  const options = campaignValue?.messageOptions || {}
  const format = campaignValue?.messageFormat || {}
  const schedule = campaignValue?.messageSchedule || {}

  const webpageUrl = extractWebpageUrl(content.text)
  const composeMode = webpageUrl ? 'webpage' : 'compose'

  form.value = {
    subject: content.subject || '',
    composeMode,
    webpageUrl: webpageUrl || '',
    composeHtml: content.text || '',
    composeText: content.textMessage || '',
    footer: content.footer || '',
    fromField: options.fromField || '',
    toField: options.toField || '',
    replyTo: options.replyTo || '',
    userSelection: options.userSelection || '',
    templateId: campaignValue?.template?.id ? String(campaignValue.template.id) : '',
    sendFormat: format.sendFormat.toLowerCase() || 'html',
    htmlFormated: format.htmlFormated !== null && format.htmlFormated !== undefined ? Boolean(format.htmlFormated) : true,
    testRecipients: '',
    embargo: toLocalDateTimeInput(schedule.embargo),
    repeatInterval: schedule.repeatInterval !== null && schedule.repeatInterval !== undefined ? String(schedule.repeatInterval) : '',
    repeatUntil: toLocalDateTimeInput(schedule.repeatUntil),
    requeueInterval: schedule.requeueInterval !== null && schedule.requeueInterval !== undefined ? String(schedule.requeueInterval) : '',
    requeueUntil: toLocalDateTimeInput(schedule.requeueUntil)
  }
}

const loadCampaignData = async () => {
  if (!Number.isFinite(campaignId.value) || campaignId.value <= 0) {
    loadError.value = 'Invalid campaign ID.'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadError.value = ''

  try {
    const [campaignResponse, listResponse, associatedListResponse] = await Promise.all([
      campaignClient.getCampaign(campaignId.value),
      listClient.getLists(0, 1000),
      listMessagesClient.getListsByMessage(campaignId.value)
    ])

    campaign.value = campaignResponse
    fillForm(campaignResponse)

    mailingLists.value = Array.isArray(listResponse?.items) ? listResponse.items : []

    const linkedIds = Array.isArray(associatedListResponse?.items)
      ? associatedListResponse.items.map((list) => Number(list.id)).filter((id) => Number.isFinite(id))
      : []

    associatedListIds.value = linkedIds
    selectedListIds.value = [...linkedIds]
  } catch (error) {
    console.error(`Failed to load campaign ${campaignId.value} for editing:`, error)
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    loadError.value = error?.message || 'Failed to load campaign data.'
  } finally {
    isLoading.value = false
  }
}

const buildCampaignPayload = () => {
  const currentCampaign = campaign.value
  const metadata = currentCampaign?.messageMetadata || {}

  const urlToken = `[URL:${form.value.webpageUrl.trim()}]`
  const contentText = form.value.composeMode === 'webpage' ? urlToken : form.value.composeHtml
  const contentTextMessage = form.value.composeMode === 'webpage' ? urlToken : form.value.composeText

  const payload = {
    content: {
      subject: form.value.subject,
      text: contentText,
      text_message: contentTextMessage,
      footer: form.value.footer
    },
    format: {
      html_formated: Boolean(form.value.htmlFormated),
      send_format: form.value.sendFormat || 'html',
    },
    metadata: {
      status: metadata.status || 'draft'
    },
    schedule: {
      embargo: toApiDateTime(form.value.embargo) || new Date().toISOString()
    },
    options: {
      from_field: form.value.fromField,
      to_field: form.value.toField,
      reply_to: form.value.replyTo,
      user_selection: form.value.userSelection
    }
  }

  const repeatInterval = Number(form.value.repeatInterval)
  const requeueInterval = Number(form.value.requeueInterval)

  if (form.value.repeatInterval !== '' && Number.isFinite(repeatInterval) && repeatInterval > 0) {
    payload.schedule.repeat_interval = repeatInterval
  }

  const repeatUntil = toApiDateTime(form.value.repeatUntil)
  if (repeatUntil) {
    payload.schedule.repeat_until = repeatUntil
  }

  if (form.value.requeueInterval !== '' && Number.isFinite(requeueInterval) && requeueInterval > 0) {
    payload.schedule.requeue_interval = requeueInterval
  }

  const requeueUntil = toApiDateTime(form.value.requeueUntil)
  if (requeueUntil) {
    payload.schedule.requeue_until = requeueUntil
  }

  const selectedTemplateId = Number(form.value.templateId)
  if (Number.isFinite(selectedTemplateId) && selectedTemplateId > 0) {
    payload.template_id = selectedTemplateId
  } else if (currentCampaign?.template?.id) {
    payload.template_id = null
  }

  return payload
}

const syncLists = async () => {
  const nextIds = normalizeListIds(selectedListIds.value)
  const currentIds = normalizeListIds(associatedListIds.value)

  const currentSet = new Set(currentIds)
  const nextSet = new Set(nextIds)

  const toAdd = nextIds.filter((id) => !currentSet.has(id))
  const toRemove = currentIds.filter((id) => !nextSet.has(id))

  const operations = [
    ...toAdd.map((listId) => listMessagesClient.associateMessageWithList(campaignId.value, listId)),
    ...toRemove.map((listId) => listMessagesClient.dissociateMessageFromList(campaignId.value, listId))
  ]

  if (operations.length === 0) return

  const results = await Promise.allSettled(operations)
  const failedOperations = results.filter((result) => result.status === 'rejected')

  if (failedOperations.length > 0) {
    throw new Error(`Failed to update ${failedOperations.length} list association(s).`)
  }

  associatedListIds.value = [...nextIds]
}

const saveCampaign = async () => {
  if (isSaving.value) return

  if (form.value.composeMode === 'webpage' && !form.value.webpageUrl.trim()) {
    saveError.value = 'Webpage URL is required when "Send a webpage" is selected.'
    saveErrors.value = []
    saveSuccess.value = ''
    currentStep.value = 1
    return
  }

  isSaving.value = true
  saveError.value = ''
  saveErrors.value = []
  saveSuccess.value = ''

  try {
    const payload = buildCampaignPayload()
    campaign.value = await campaignClient.updateCampaign(campaignId.value, payload)

    await syncLists()

    saveSuccess.value = 'Campaign saved successfully.'
  } catch (error) {
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    const formattedErrors = formatValidationErrors(error)
    if (formattedErrors.length > 0) {
      saveErrors.value = formattedErrors
      saveError.value = ''
    } else {
      saveError.value = error?.message || 'Failed to save campaign.'
      saveErrors.value = []
    }
  } finally {
    isSaving.value = false
  }
}

const sendTestCampaign = async () => {
  if (isSendingTest.value) return

  const recipients = parseTestRecipients(form.value.testRecipients)
  if (recipients.length === 0) {
    saveError.value = 'Please enter at least one test recipient email.'
    saveErrors.value = []
    saveSuccess.value = ''
    return
  }

  isSendingTest.value = true
  saveError.value = ''
  saveErrors.value = []
  saveSuccess.value = ''

  try {
    await campaignClient.testSendCampaign(campaignId.value, recipients)
    saveSuccess.value = 'Test campaign sent successfully.'
  } catch (error) {
    if (isAuthenticationError(error)) {
      window.location.href = '/login'
      return
    }
    saveError.value = error?.message || 'Failed to send test campaign.'
    saveErrors.value = []
  } finally {
    isSendingTest.value = false
  }
}

const loadTemplates = async () => {
  try {
    const response = await templateClient.getTemplates(0, 1000)

    templates.value = Array.isArray(response?.items)
        ? response.items
        : []
  } catch (error) {
    console.error('Failed to load templates:', error)
  }
}

const goToStep = (stepId) => {
  if (stepId < 1 || stepId > steps.length) return
  currentStep.value = stepId
}

const previousStep = () => {
  if (currentStep.value > 1) currentStep.value -= 1
}

const nextStep = () => {
  if (currentStep.value < steps.length) currentStep.value += 1
}

watch(
  () => route.query.section,
  (sectionValue) => {
    const nextStepValue = resolveStepFromRouteValue(sectionValue)
    if (nextStepValue && nextStepValue !== currentStep.value) {
      currentStep.value = nextStepValue
    }
  },
  { immediate: true }
)

watch(currentStep, (stepValue) => {
  const section = stepSlugById[stepValue] || stepSlugById[1]
  if (route.query.section === section) return

  router.replace({
    query: {
      ...route.query,
      section
    }
  }).catch(() => {})
})

watch(
  () => form.value.composeMode,
  (mode, previousMode) => {
    if (mode === 'compose') {
      if (!form.value.composeHtml.trim()) {
        form.value.composeHtml = composeHtmlCache.value || campaign.value?.messageContent?.text || ''
      }
      return
    }

    if (previousMode === 'compose' && form.value.composeHtml.trim()) {
      composeHtmlCache.value = form.value.composeHtml
    }
  }
)

watch(
  () => form.value.composeHtml,
  (value) => {
    if (form.value.composeMode === 'compose' && value.trim()) {
      composeHtmlCache.value = value
    }
  }
)

onMounted(() => {
  loadCampaignData()
  loadTemplates()
})
</script>
