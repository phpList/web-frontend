<!-- assets/vue/layouts/AdminLayout.vue -->
<template>
  <div class="flex flex-col flex-1">
    <!-- Topbar -->
    <header class="h-16 bg-slate-500 dark:bg-slate-950 border-b border-slate-600 dark:border-slate-800 flex items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 shrink-0 sticky top-0 z-30">
      <div class="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
        <button
            class="lg:hidden p-2 -ml-2 text-slate-100 hover:text-white dark:text-slate-350 dark:hover:text-white transition-colors"
            @click="openSidebar"
        >
          <BaseIcon name="menu" inherit-color />
        </button>
        <div class="topbar-search-container relative max-w-md w-full transition-all">
          <BaseIcon name="search" />
          <input
              v-model.trim="searchQuery"
              placeholder="Search subscribers, campaigns..."
              class="w-full pl-10 pr-4 py-2 bg-slate-700 dark:bg-slate-800 border border-slate-600 dark:border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-300 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="text"
              @focus="showSearchResults = true"
              @input="handleSearchInput"
          >
          <div
              v-if="showSearchResults && searchQuery"
              class="absolute top-full mt-2 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg z-50 overflow-hidden"
          >
            <div v-if="isSearching" class="px-3 py-2 text-sm text-slate-500 dark:text-slate-350">
              Searching...
            </div>
            <template v-else>
              <div v-if="searchResults.length" class="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                Subscribers
              </div>
              <a
                  v-for="subscriber in searchResults"
                  :key="subscriber.id"
                  :href="`/subscribers?findColumn=email&findValue=${encodeURIComponent(subscriber.email)}`"
                  class="block px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-b-0 border-slate-100 dark:border-slate-700"
              >
                {{ subscriber.email }}
              </a>

              <div v-if="campaignResults.length" class="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 border-y border-slate-100 dark:border-slate-700">
                Campaigns
              </div>
              <a
                  v-for="campaign in campaignResults"
                  :key="`campaign-${campaign.id}`"
                  :href="`/campaigns/${campaign.id}/edit`"
                  class="block px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 border-b last:border-b-0 border-slate-100 dark:border-slate-700"
              >
                {{ campaign.messageContent?.subject || `Campaign #${campaign.id}` }}
              </a>

              <div v-if="!searchResults.length && !campaignResults.length" class="px-3 py-2 text-sm text-slate-500 dark:text-slate-350">
                No results found
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 sm:gap-5 shrink-0">
        <AdminNotifications />

        <button
            type="button"
            class="flex items-center justify-center p-2 text-slate-100 hover:text-white dark:text-slate-350 dark:hover:text-white transition-colors"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleDarkMode"
        >
          <BaseIcon :name="isDark ? 'sun' : 'moon'" inherit-color />
        </button>

        <LanguageSelect />
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 p-4 sm:p-6 lg:p-10">
      <slot />
    </main>
  </div>
</template>

<script setup>
import BaseIcon from "../components/base/BaseIcon.vue";
import LanguageSelect from "../components/base/LanguageSelect.vue";
import AdminNotifications from "../components/notifications/AdminNotifications.vue";
import { useSidebar } from "../composables/useSidebar";
import { useDarkMode } from "../composables/useDarkMode";
import { useCurrentAdmin } from "../composables/useCurrentAdmin";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Requests } from "@tatevikgr/rest-api-client";
import { subscribersClient, campaignClient } from "../api";

const { openSidebar } = useSidebar();
const { isDark, toggleDarkMode } = useDarkMode();
const { loadCurrentAdmin } = useCurrentAdmin();

const searchQuery = ref('');
const searchResults = ref([]);
const campaignResults = ref([]);
const showSearchResults = ref(false);
const isSearching = ref(false);
let searchTimeout = null;
let searchRequestId = 0;

const runSearch = async () => {
  const query = searchQuery.value.trim();
  if (!query) {
    searchResults.value = [];
    campaignResults.value = [];
    isSearching.value = false;
    return;
  }

  const requestId = ++searchRequestId;
  isSearching.value = true;

  try {
    const filter = new Requests.SubscribersFilterRequest(
      null,
      null,
      'email',
      query
    );
    const [subscriberResponse, campaignResponse] = await Promise.all([
      subscribersClient.getSubscribers(filter, null, 5),
      campaignClient.getCampaigns(null, 5, query)
    ]);
    if (requestId !== searchRequestId) {
      return;
    }

    searchResults.value = subscriberResponse.items || [];
    campaignResults.value = campaignResponse.items || [];
  } catch (error) {
    if (requestId === searchRequestId) {
      searchResults.value = [];
      campaignResults.value = [];
    }
    console.error('Failed to search:', error);
  } finally {
    if (requestId === searchRequestId) {
      isSearching.value = false;
    }
  }
};

const handleSearchInput = () => {
  showSearchResults.value = true;
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = setTimeout(() => {
    runSearch();
  }, 300);
};

const closeSearchResultsOnOutsideClick = (event) => {
  if (event.target.closest('.topbar-search-container')) {
    return;
  }

  showSearchResults.value = false;
};

onMounted(() => {
  document.addEventListener('click', closeSearchResultsOnOutsideClick);
  loadCurrentAdmin();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSearchResultsOnOutsideClick);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>
