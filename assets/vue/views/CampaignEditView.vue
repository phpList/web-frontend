<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-slate-200 dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 shadow-sm p-4 sm:p-6">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-350">{{ t('campaign_edit.label') }}</p>
            <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">{{ pageTitle }}</h2>
          </div>

          <RouterLink
            to="/campaigns"
            class="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-800"
          >
            {{ t('campaign_edit.back_to_campaigns') }}
          </RouterLink>
        </div>
      </div>

      <div v-if="loading" class="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 p-6 text-sm text-slate-500 dark:text-slate-350 shadow-sm">
        {{ t('campaign_edit.loading') }}
      </div>

      <div v-else-if="error" class="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 p-6 text-sm text-red-600 dark:text-red-400 shadow-sm">
        {{ error }}
      </div>

      <div v-else class="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-900 shadow-sm overflow-hidden">
        <div class="border-b border-slate-300 dark:border-slate-700 px-4 pt-4 sm:px-6 sm:pt-6">
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
            <button
              v-for="step in steps"
              :key="step.id"
              type="button"
              class="rounded-t-lg px-2 py-2 text-center text-xs font-semibold transition-colors"
              :class="currentStep === step.id
                ? 'bg-ext-wf1 text-white'
                : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-350 hover:bg-slate-350 dark:hover:bg-slate-600'"
              @click="goToStep(step.id)"
            >
              <span class="block text-base leading-none">{{ step.id }}</span>
              <span class="block mt-1">{{ t(step.labelKey) }}</span>
            </button>
          </div>
        </div>

        <div class="p-4 sm:p-6 space-y-5">
          <section v-if="currentStep === 1" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.steps.content') }}</h3>

            <div>
              <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-subject">{{ t('campaign_edit.content.subject') }}</label>
              <input
                id="campaign-subject"
                v-model="form.subject"
                type="text"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :placeholder="t('campaign_edit.content.subject_placeholder')"
              >
            </div>

            <div class="space-y-3 rounded-lg border border-slate-300 dark:border-slate-700 p-4">
              <p class="text-sm font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.content.compose_question') }}</p>

              <label class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <input
                  v-model="form.composeMode"
                  type="radio"
                  value="webpage"
                  class="h-4 w-4 border-slate-300 dark:border-slate-600 text-slate-900"
                >
                {{ t('campaign_edit.content.mode_webpage') }}
              </label>

              <label class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                <input
                  v-model="form.composeMode"
                  type="radio"
                  value="compose"
                  class="h-4 w-4 border-slate-300 dark:border-slate-600 text-slate-900"
                >
                {{ t('campaign_edit.content.mode_compose') }}
              </label>
            </div>

            <div v-if="form.composeMode === 'webpage'" class="space-y-2">
              <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-webpage-url">{{ t('campaign_edit.content.webpage_url') }}</label>
              <input
                id="campaign-webpage-url"
                v-model="form.webpageUrl"
                type="url"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/page"
              >
              <p class="text-xs text-slate-500 dark:text-slate-350">{{ t('campaign_edit.content.webpage_hint', { token: '[URL:YOUR_URL]' }) }}</p>
            </div>

            <div v-else class="space-y-4">
              <CkEditorField
                id="campaign-html-content"
                v-model="form.composeHtml"
                :label="t('campaign_edit.content.html_content')"
              />
            </div>

            <div>
              <label for="campaign-footer" class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{{ t('campaign_edit.content.footer') }}</label>

              <textarea
                  id="campaign-footer"
                  v-model="form.footer"
                  rows="6"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </section>

          <section v-else-if="currentStep === 2" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.steps.format') }}</h3>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-[2fr_2fr_1fr]">

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-template">{{ t('campaign_edit.format.use_template') }}</label>
                <select id="campaign-template" v-model="form.templateId" class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500" >
                  <option value="" class="text-slate-400 dark:text-slate-500">{{ t('campaign_edit.format.no_template') }}</option>
                  <option
                      v-for="template in templates"
                      :key="template.id"
                      :value="String(template.id)"
                  >
                    {{ template.title }}
                  </option>
                </select>
              </div>

              <div class="md:justify-self-center justify-self-start">
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {{ t('campaign_edit.format.send_format') }}
                </label>

                <div class="flex flex-wrap gap-4">
                  <label class="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                    <input type="radio" value="html" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"/>
                    {{ t('campaign_edit.format.html') }}
                  </label>

                  <label class="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                    <input type="radio" value="text" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"/>
                    {{ t('campaign_edit.format.text') }}
                  </label>

                  <label class="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-100">
                    <input type="radio" value="invite" v-model="form.sendFormat" class="h-4 w-4 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"/>
                    {{ t('campaign_edit.format.invite') }}
                  </label>
                </div>
              </div>

              <label class="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-200 md:mt-2">
                <input
                  v-model="form.htmlFormated"
                  disabled
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 accent-ext-wf1"
                >
                {{ t('campaign_edit.format.html_formatted') }}
              </label>
            </div>

          </section>

          <section v-else-if="currentStep === 3" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.steps.scheduling') }}</h3>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-embargo">{{ t('campaign_edit.schedule.embargo') }}</label>
                <input
                  id="campaign-embargo"
                  v-model="form.embargo"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-repeat-interval">{{ t('campaign_edit.schedule.repeat_interval') }}</label>
                <input
                  id="campaign-repeat-interval"
                  v-model="form.repeatInterval"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-repeat-until">{{ t('campaign_edit.schedule.repeat_until') }}</label>
                <input
                  id="campaign-repeat-until"
                  v-model="form.repeatUntil"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-requeue-interval">{{ t('campaign_edit.schedule.requeue_interval') }}</label>
                <input
                  id="campaign-requeue-interval"
                  v-model="form.requeueInterval"
                  type="number"
                  min="0"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-requeue-until">{{ t('campaign_edit.schedule.requeue_until') }}</label>
                <input
                  id="campaign-requeue-until"
                  v-model="form.requeueUntil"
                  type="datetime-local"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
              </div>
            </div>
          </section>

          <section v-else-if="currentStep === 4" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.steps.lists') }}</h3>

            <p class="text-sm text-slate-600 dark:text-slate-350">{{ t('campaign_edit.lists.intro') }}</p>

            <div class="max-h-96 overflow-auto rounded-lg border border-slate-300 dark:border-slate-700 p-3">
              <label
                v-for="list in mailingLists"
                :key="list.id"
                :for="`campaign-list-${list.id}`"
                class="flex items-center gap-2 py-1 text-sm text-slate-800 dark:text-slate-200"
              >
                <input
                  :id="`campaign-list-${list.id}`"
                  v-model="selectedListIds"
                  type="checkbox"
                  :value="list.id"
                  class="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-slate-400 accent-ext-wf1"
                >
                <span>{{ list.name || t('campaign_edit.lists.fallback_name', { id: list.id }) }}</span>
              </label>

              <p v-if="mailingLists.length === 0" class="text-sm text-slate-500 dark:text-slate-350">{{ t('campaign_edit.lists.none') }}</p>
            </div>
          </section>

          <section v-else-if="currentStep === 5" class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.test.title') }}</h3>

            <p class="text-sm text-slate-600 dark:text-slate-350">{{ t('campaign_edit.test.intro') }}</p>
            <div class="text-slate-400 dark:text-slate-500">
              {{ t('campaign_edit.test.hint') }}
            </div>

            <div class="rounded-lg border border-slate-300 dark:border-slate-700 p-3 space-y-3">
              <textarea
                id="campaign-test-recipients"
                v-model="form.testRecipients"
                rows="5"
                class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                :placeholder="t('campaign_edit.test.placeholder')"
              ></textarea>

              <button
                type="button"
                class="rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                :disabled="isSendingTest"
                @click="sendTestCampaign"
              >
                {{ t('campaign_edit.test.title') }}
              </button>
            </div>
          </section>

          <section v-else class="space-y-5">
            <h3 class="text-2xl font-semibold text-slate-900 dark:text-slate-100">{{ t('campaign_edit.steps.finish') }}</h3>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-from">{{ t('campaign_edit.finish.from') }}</label>
                <input
                  id="campaign-from"
                  v-model="form.fromField"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  :placeholder="t('campaign_edit.finish.from_placeholder')"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-reply-to">{{ t('campaign_edit.finish.reply_to') }}</label>
                <input
                  id="campaign-reply-to"
                  v-model="form.replyTo"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  :placeholder="t('campaign_edit.finish.reply_to_placeholder')"
                >
              </div>

              <div>
                <label class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200" for="campaign-to-field">{{ t('campaign_edit.finish.to_field') }}</label>
                <input
                  id="campaign-to-field"
                  v-model="form.toField"
                  type="text"
                  class="w-full rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  :placeholder="t('campaign_edit.finish.to_field_placeholder')"
                >
              </div>
            </div>

            <div class="space-y-2 rounded-lg border p-4" :class="warnings.length ? 'border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10' : 'border-emerald-300 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10'">
              <p class="text-sm font-semibold" :class="warnings.length ? 'text-amber-800 dark:text-amber-400' : 'text-emerald-800 dark:text-emerald-400'">
                {{ warnings.length ? t('campaign_edit.finish.review') : t('campaign_edit.finish.ready') }}
              </p>
              <p v-for="warning in warnings" :key="warning" class="text-sm text-amber-800 dark:text-amber-400">
                {{ warning }}
              </p>
            </div>
          </section>
        </div>

        <div class="border-t border-slate-300 dark:border-slate-700 px-4 py-4 sm:px-6">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div class="text-sm">
              <div v-if="saveErrors.length" class="text-red-600 dark:text-red-400">
                <p class="font-medium">{{ t('campaign_edit.errors.fix_fields') }}</p>
                <ul class="mt-1 list-disc pl-5 space-y-1">
                  <li v-for="errorItem in saveErrors" :key="errorItem">{{ errorItem }}</li>
                </ul>
              </div>
              <p v-else-if="saveError" class="text-red-600 dark:text-red-400 whitespace-pre-line">{{ saveError }}</p>
              <p v-else-if="saveSuccess" class="text-emerald-700 dark:text-emerald-400">{{ saveSuccess }}</p>
            </div>

            <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap lg:justify-end">
              <button
                type="button"
                class="rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50"
                :disabled="currentStep === 1"
                @click="previousStep"
              >
                {{ t('campaign_edit.actions.back') }}
              </button>

              <button
                v-if="currentStep < steps.length"
                type="button"
                class="rounded-md border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50"
                :disabled="isSaving"
                @click="nextStep"
              >
                {{ t('common.next') }}
              </button>

              <button
                type="button"
                class="rounded-md border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:hover:bg-slate-600 disabled:opacity-50"
                :disabled="isSaving || isQueueing"
                @click="saveAndContinueEditing"
              >
                {{ isSaving ? t('common.saving') : t('campaign_edit.actions.save_continue') }}
              </button>

              <button
                v-if="canQueueCampaign"
                type="button"
                class="rounded-md border border-emerald-700 dark:border-emerald-600 bg-emerald-700 dark:bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 dark:hover:bg-emerald-500 disabled:opacity-50"
                :disabled="isSaving || isQueueing"
                @click="queueCampaignToSend"
              >
                {{ isQueueing ? t('campaign_edit.actions.queueing') : t('campaign_edit.actions.queue') }}
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
import {useI18n} from 'vue-i18n'
import {RouterLink, useRoute, useRouter} from 'vue-router'
import AdminLayout from '../layouts/AdminLayout.vue'
import CkEditorField from '../components/base/CkEditorField.vue'
import {campaignClient, fetchAllLists, listMessagesClient, templateClient} from '../api'
import {useApiValidationErrors} from '../composables/useApiValidationErrors'
import {useAsyncAction} from '../composables/useAsyncAction'

const {t} = useI18n()
const route = useRoute()
const router = useRouter()

const steps = [
  { id: 1, labelKey: 'campaign_edit.steps.content' },
  { id: 2, labelKey: 'campaign_edit.steps.format' },
  { id: 3, labelKey: 'campaign_edit.steps.scheduling' },
  { id: 4, labelKey: 'campaign_edit.steps.lists' },
  { id: 5, labelKey: 'campaign_edit.steps.test_send' },
  { id: 6, labelKey: 'campaign_edit.steps.finish' },
]

const campaignIdFromRoute = computed(() => Number(route.params.campaignId))
const isCreateMode = computed(() => route.name === 'campaign-create')
const activeCampaignId = computed(() => Number(campaign.value?.id) || campaignIdFromRoute.value)
const pageTitle = computed(() => isCreateMode.value ? t('campaign_edit.title.create') : t('campaign_edit.title.edit', { id: campaignIdFromRoute.value }))
const currentStep = ref(1)
const isSaving = ref(false)
const isSendingTest = ref(false)
const isQueueing = ref(false)
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

const defaultFormState = () => ({
  subject: '',
  composeMode: 'compose',
  webpageUrl: '',
  composeHtml: '',
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

const form = ref(defaultFormState())

const warnings = computed(() => {
  const list = []

  if (normalizeListIds(selectedListIds.value).length === 0) {
    list.push(t('campaign_edit.warnings.no_lists'))
  }

  if (form.value.composeMode === 'webpage' && !form.value.webpageUrl.trim()) {
    list.push(t('campaign_edit.warnings.webpage_url_required'))
  }

  if (form.value.composeMode === 'compose' && !form.value.composeHtml.trim()) {
    list.push(t('campaign_edit.warnings.compose_required'))
  }

  return list
})

const hasConfirmationUrlToken = computed(() =>
  String(form.value.composeHtml || '').includes('[CONFIRMATIONURL]') || form.value.sendFormat !== 'invite'
)

const canQueueCampaign = computed(() =>
    warnings.value.length === 0 &&
    hasConfirmationUrlToken.value &&
    campaign.value?.messageMetadata?.status !== 'submitted' &&
    Number.isFinite(activeCampaignId.value) &&
    activeCampaignId.value > 0
)

// Getters keep the labels reactive to language changes.
const validationFieldLabels = {
  get 'format.sendFormat'() { return t('campaign_edit.format.send_format') },
  get 'schedule.repeatUntil'() { return t('campaign_edit.schedule.repeat_until') },
  get 'schedule.requeueUntil'() { return t('campaign_edit.schedule.requeue_until') },
  get 'schedule.embargo'() { return t('campaign_edit.schedule.embargo') }
}

const {formatValidationErrors} = useApiValidationErrors(validationFieldLabels)

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
    composeHtml: format.htmlFormated ? content.text : content.textMessage || content.text || '',
    footer: content.footer || '',
    fromField: options.fromField || '',
    toField: options.toField || '',
    replyTo: options.replyTo || '',
    userSelection: options.userSelection || '',
    templateId: campaignValue?.template?.id ? String(campaignValue.template.id) : '',
    sendFormat: String(format.sendFormat || 'html').toLowerCase(),
    htmlFormated: format.htmlFormated !== null && format.htmlFormated !== undefined ? Boolean(format.htmlFormated) : true,
    testRecipients: '',
    embargo: toLocalDateTimeInput(schedule.embargo),
    repeatInterval: schedule.repeatInterval !== null && schedule.repeatInterval !== undefined ? String(schedule.repeatInterval) : '',
    repeatUntil: toLocalDateTimeInput(schedule.repeatUntil),
    requeueInterval: schedule.requeueInterval !== null && schedule.requeueInterval !== undefined ? String(schedule.requeueInterval) : '',
    requeueUntil: toLocalDateTimeInput(schedule.requeueUntil)
  }
}

const loadCampaignDataAction = useAsyncAction(
  async () => {
    if (isCreateMode.value) {
      const mailingListsResponse = await fetchAllLists()

      campaign.value = {
        messageMetadata: { status: 'draft' },
        messageContent: {},
        messageOptions: {},
        messageFormat: {},
        messageSchedule: {}
      }
      form.value = defaultFormState()
      mailingLists.value = mailingListsResponse
      associatedListIds.value = []
      selectedListIds.value = []
      composeHtmlCache.value = ''
      return
    }

    if (!Number.isFinite(campaignIdFromRoute.value) || campaignIdFromRoute.value <= 0) {
      error.value = t('campaign_edit.errors.invalid_id')
      return
    }

    const [campaignResponse, mailingListsResponse, associatedListResponse] = await Promise.all([
      campaignClient.getCampaign(campaignIdFromRoute.value),
      fetchAllLists(),
      listMessagesClient.getListsByMessage(campaignIdFromRoute.value)
    ])

    campaign.value = campaignResponse
    fillForm(campaignResponse)

    mailingLists.value = mailingListsResponse

    const linkedIds = Array.isArray(associatedListResponse?.items)
      ? associatedListResponse.items.map((list) => Number(list.id)).filter((id) => Number.isFinite(id))
      : []

    associatedListIds.value = linkedIds
    selectedListIds.value = [...linkedIds]
  },
  {
    errorMessage: (error) => error?.message || t('campaign_edit.errors.load_failed'),
    logLabel: 'Failed to load campaign data for editing:',
  }
)

const loading = loadCampaignDataAction.loading
const error = loadCampaignDataAction.error

const loadCampaignData = () => loadCampaignDataAction.run()

const buildCampaignPayload = () => {
  const currentCampaign = campaign.value
  const metadata = currentCampaign?.messageMetadata || {}

  const urlToken = `[URL:${form.value.webpageUrl.trim()}]`
  const contentText = form.value.composeMode === 'webpage' ? urlToken : form.value.composeHtml

  const payload = {
    content: {
      subject: form.value.subject,
      text: contentText,
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
  const currentCampaignId = activeCampaignId.value
  if (!Number.isFinite(currentCampaignId) || currentCampaignId <= 0) {
    throw new Error(t('campaign_edit.errors.save_before_lists'))
  }

  const nextIds = normalizeListIds(selectedListIds.value)
  const currentIds = normalizeListIds(associatedListIds.value)

  const currentSet = new Set(currentIds)
  const nextSet = new Set(nextIds)

  const toAdd = nextIds.filter((id) => !currentSet.has(id))
  const toRemove = currentIds.filter((id) => !nextSet.has(id))

  if (toAdd.length === 0 && toRemove.length === 0) return

  const results = []

  for (const listId of toAdd) {
    try {
      const result = await listMessagesClient.associateMessageWithList(currentCampaignId, listId)
      results.push({ status: 'fulfilled', value: result })
    } catch (error) {
      results.push({ status: 'rejected', reason: error, type: 'add', listId })
    }
  }

  for (const listId of toRemove) {
    try {
      const result = await listMessagesClient.dissociateMessageFromList(currentCampaignId, listId)
      results.push({ status: 'fulfilled', value: result })
    } catch (error) {
      results.push({ status: 'rejected', reason: error, type: 'remove', listId })
    }
  }

  const failedOperations = results.filter((result) => result.status === 'rejected')

  if (failedOperations.length > 0) {
    const latestAssociations = await listMessagesClient.getListsByMessage(currentCampaignId)
    associatedListIds.value = Array.isArray(latestAssociations?.items)
      ? latestAssociations.items.map((list) => Number(list.id)).filter((id) => Number.isFinite(id))
      : [...associatedListIds.value]
    throw new Error(t('campaign_edit.errors.lists_update_failed', { count: failedOperations.length }))
  }

  associatedListIds.value = [...nextIds]
}

const saveCampaign = async ({ advanceAfterSave = false } = {}) => {
  if (isSaving.value) return

  if (form.value.composeMode === 'webpage' && !form.value.webpageUrl.trim()) {
    saveError.value = t('campaign_edit.errors.webpage_url_required')
    saveErrors.value = []
    saveSuccess.value = ''
    currentStep.value = 1
    return
  }

  isSaving.value = true
  saveError.value = ''
  saveErrors.value = []
  saveSuccess.value = ''
  let isSaved = false

  try {
    const payload = buildCampaignPayload()
    const currentCampaignId = activeCampaignId.value

    if (Number.isFinite(currentCampaignId) && currentCampaignId > 0) {
      campaign.value = await campaignClient.updateCampaign(currentCampaignId, payload)
      await syncLists()
    } else {
      campaign.value = await campaignClient.createCampaign(payload)
      await syncLists()

      const createdCampaignId = Number(campaign.value?.id)
      if (Number.isFinite(createdCampaignId) && createdCampaignId > 0) {
        await router.replace({
          name: 'campaign-edit',
          params: { campaignId: createdCampaignId },
          query: route.query
        }).catch(() => {})
      }
    }

    saveSuccess.value = t('campaign_edit.success.saved')
    isSaved = true
  } catch (error) {
    const formattedErrors = formatValidationErrors(error)
    if (formattedErrors.length > 0) {
      saveErrors.value = formattedErrors
      saveError.value = ''
    } else {
      saveError.value = error?.message || t('campaign_edit.errors.save_failed')
      saveErrors.value = []
    }
  } finally {
    isSaving.value = false
  }

  if (isSaved && advanceAfterSave && currentStep.value < steps.length) {
    currentStep.value += 1
  }

  return isSaved
}

const saveAndContinueEditing = async () => {
  await saveCampaign({ advanceAfterSave: true })
}

const queueCampaignToSend = async () => {
  if (isQueueing.value || isSaving.value || !hasConfirmationUrlToken.value) return

  isQueueing.value = true
  saveError.value = ''
  saveErrors.value = []
  saveSuccess.value = ''

  try {
    const isSaved = await saveCampaign()
    if (!isSaved) return

    const currentCampaignId = activeCampaignId.value
    if (!Number.isFinite(currentCampaignId) || currentCampaignId <= 0) {
      throw new Error(t('campaign_edit.errors.save_before_queue'))
    }

    await campaignClient.updateCampaignStatus(currentCampaignId, 'submitted')
    saveSuccess.value = t('campaign_edit.success.queued')
    campaign.value = {
      ...campaign.value,
      messageMetadata: {
        ...(campaign.value?.messageMetadata || {}),
        status: 'submitted'
      }
    }
  } catch (error) {
    const formattedErrors = formatValidationErrors(error)
    if (formattedErrors.length > 0) {
      saveErrors.value = formattedErrors
      saveError.value = ''
    } else {
      saveError.value = error?.message || t('campaign_edit.errors.queue_failed')
      saveErrors.value = []
    }
  } finally {
    isQueueing.value = false
  }
}

const sendTestCampaign = async () => {
  if (isSendingTest.value) return

  const recipients = parseTestRecipients(form.value.testRecipients)
  if (recipients.length === 0) {
    saveError.value = t('campaign_edit.errors.no_test_recipient')
    saveErrors.value = []
    saveSuccess.value = ''
    return
  }

  isSendingTest.value = true
  saveError.value = ''
  saveErrors.value = []
  saveSuccess.value = ''

  try {
    const isSaved = await saveCampaign()
    if (!isSaved) return
    const currentCampaignId = activeCampaignId.value
    if (!Number.isFinite(currentCampaignId) || currentCampaignId <= 0) {
      saveError.value = t('campaign_edit.errors.save_before_test')
      saveErrors.value = []
      saveSuccess.value = ''
      return
    }

    await campaignClient.testSendCampaign(currentCampaignId, recipients)
    saveSuccess.value = t('campaign_edit.success.test_sent')
  } catch (error) {
    console.error('Failed to send test campaign:', error?.message ?? error)
    const formattedErrors = formatValidationErrors(error)
    if (formattedErrors.length > 0) {
      saveErrors.value = formattedErrors
      saveError.value = ''
    } else {
      saveError.value = error?.message?.slice(0, 100) || t('campaign_edit.errors.test_failed')
      saveErrors.value = []
    }
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
  () => [route.name, route.params.campaignId],
  () => {
    loadCampaignData()
  },
  { immediate: true }
)

watch(
  () => route.query.section,
  (sectionValue) => {
    const nextStepValue = resolveStepFromRouteValue(sectionValue) ?? 1
    if (nextStepValue !== currentStep.value) {
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
  loadTemplates()

  const redirectedErrors = window.history.state?.validationErrors
  if (Array.isArray(redirectedErrors) && redirectedErrors.length > 0) {
    saveErrors.value = redirectedErrors
    saveError.value = ''
  }
})
</script>
