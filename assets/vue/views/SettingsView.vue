<template>
  <AdminLayout>
    <div class="space-y-6 animate-in fade-in duration-300">
      <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-slate-900">Settings</h2>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="filter"
              type="search"
              placeholder="Search keys..."
              class="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-ext-wf1 focus:ring-2 focus:ring-ext-wf2"
            />
            <button
              class="px-3 py-2 bg-ext-wf1 hover:bg-ext-wf3 text-white text-sm font-medium rounded-lg transition-colors"
              type="button"
              @click="loadConfigs"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <section class="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <div v-if="filtered.length" class="overflow-x-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="item in filtered" :key="item.key" class="border border-slate-200 rounded-lg p-3">
              <div class="mb-2">
                <div class="text-sm font-semibold text-slate-800">
                  {{ item.key }}
                </div>
                <div v-if="item.description" class="text-xs text-slate-500">
                  {{ item.description }}
                </div>
              </div>

              <input
                  v-model="edited[item.key]"
                  :readonly="!item.editable"
                  :class="['w-full px-2 py-1.5 text-sm rounded border',item.editable ? 'border-slate-300 focus:ring-1 focus:ring-ext-wf1 focus:border-ext-wf1' : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed']"
              />

              <div class="flex gap-2 mt-2">
                <button
                    class="px-2 py-1 text-xs rounded bg-ext-wf1 text-white disabled:opacity-50"
                    :disabled="saving[item.key] || !item.editable"
                    @click="save(item.key)"
                >
                  {{ saving[item.key] ? '...' : 'Save' }}
                </button>

                <button class="px-2 py-1 text-xs rounded border border-slate-300" @click="reset(item.key)">
                  Reset
                </button>
              </div>

              <p v-if="errors[item.key]" class="text-[11px] text-red-500 mt-1">
                {{ errors[item.key] }}
              </p>

              <p v-if="success[item.key]" class="text-[11px] text-green-500 mt-1">
                {{ success[item.key] }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import { default as apiClient } from '../api'

const configs = ref([])
const isLoading = ref(false)
const error = ref('')
const filter = ref('')
const edited = ref({})
const saving = ref({})
const errors = ref({})
const success = ref({})

const loadConfigs = async () => {
  isLoading.value = true
  error.value = ''
  try {
    const response = await apiClient.get('configs')
    const items = Array.isArray(response?.items) ? response.items : []
    configs.value = items
    // initialize edited values
    const map = {}
    items.forEach((it) => {
      map[it.key] = it.value ?? ''
    })
    edited.value = map
  } catch (err) {
    console.error('Failed to load configs', err)
    error.value = err?.message || 'Failed to load settings.'
  } finally {
    isLoading.value = false
  }
}

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return configs.value
  return configs.value.filter((c) => (c.key || '').toLowerCase().includes(q))
})

const save = async (key) => {
  if (!Object.prototype.hasOwnProperty.call(edited.value, key)) return
  saving.value = { ...saving.value, [key]: true }
  errors.value = { ...errors.value, [key]: '' }
  success.value = { ...success.value, [key]: '' }

  try {
    const payload = { value: edited.value[key] }
    const response = await apiClient.put(`configs/${encodeURIComponent(key)}`, payload)
    // update local cache: response may be the updated config
    const idx = configs.value.findIndex((c) => c.key === key)
    if (idx !== -1) {
      configs.value[idx] = response || { ...configs.value[idx], value: edited.value[key] }
    }
    success.value = { ...success.value, [key]: 'Saved' }
  } catch (err) {
    console.error('Failed to save config', key, err)
    const msg = err?.message || 'Save failed.'
    errors.value = { ...errors.value, [key]: msg }
  } finally {
    saving.value = { ...saving.value, [key]: false }
    setTimeout(() => {
      success.value = { ...success.value, [key]: '' }
      errors.value = { ...errors.value, [key]: '' }
    }, 3000)
  }
}

const reset = (key) => {
  const original = configs.value.find((c) => c.key === key)
  if (original) {
    edited.value = { ...edited.value, [key]: original.value ?? '' }
  }
  errors.value = { ...errors.value, [key]: '' }
  success.value = { ...success.value, [key]: '' }
}

onMounted(() => {
  loadConfigs()
})
</script>

