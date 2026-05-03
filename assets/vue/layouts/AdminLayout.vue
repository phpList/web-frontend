<!-- assets/vue/layouts/DashboardLayout.vue -->
<template>
  <div class="flex flex-col flex-1">
    <!-- Topbar -->
    <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div class="flex items-center gap-4 flex-1">
        <button
            class="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-600 transition-colors"
            @click="openSidebar"
        >
          <BaseIcon name="menu" />
        </button>
        <div class="topbar-search-container relative max-w-md w-full transition-all">
          <BaseIcon name="search" />
          <input
              v-model.trim="searchQuery"
              placeholder="Search subscribers, campaigns..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="text"
              @focus="showSearchResults = true"
              @input="handleSearchInput"
          >
          <div
              v-if="showSearchResults && searchQuery"
              class="absolute top-full mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg z-50 overflow-hidden"
          >
            <div v-if="isSearching" class="px-3 py-2 text-sm text-slate-500">
              Searching...
            </div>
            <template v-else>
              <div v-if="searchResults.length" class="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                Subscribers
              </div>
              <a
                  v-for="subscriber in searchResults"
                  :key="subscriber.id"
                  :href="`/subscribers?findColumn=email&findValue=${encodeURIComponent(subscriber.email)}`"
                  class="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
              >
                {{ subscriber.email }}
              </a>

              <div v-if="campaignResults.length" class="px-3 py-1 text-xs font-semibold text-slate-500 bg-slate-50 border-y border-slate-100">
                Campaigns
              </div>
              <a
                  v-for="campaign in campaignResults"
                  :key="`campaign-${campaign.id}`"
                  :href="`/campaigns/${campaign.id}/edit`"
                  class="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 border-b last:border-b-0 border-slate-100"
              >
                {{ campaign.messageContent?.subject || `Campaign #${campaign.id}` }}
              </a>

              <div v-if="!searchResults.length && !campaignResults.length" class="px-3 py-2 text-sm text-slate-500">
                No results found
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <RouterLink
          to="/campaigns/create"
          class="hidden sm:flex items-center gap-2 px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create Campaign
        </RouterLink>

        <!-- User dropdown -->
        <div class="relative">
          <div
              class="flex items-center gap-3 pl-2 cursor-pointer"
              @click="toggleDropdown"
          >
            <div class="flex flex-col items-end hidden sm:flex">
              <span class="text-sm font-bold text-slate-800 leading-none">
                {{ adminData.login_name || 'Admin User' }}
              </span>
              <span class="text-[10px] text-slate-500 mt-0.5">
                {{ adminData.super_user ? 'Super Admin' : 'Administrator' }}
              </span>
            </div>

            <BaseIcon name="chevronDown" />
          </div>

          <!-- Dropdown -->
          <div
              v-if="dropdownOpen"
              class="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50"
          >
            <a
                href="/logout"
                class="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Logout
            </a>
          </div>
        </div>
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
import { useSidebar } from "../composables/useSidebar";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from 'vue-router';
import { Requests } from "@tatevikgr/rest-api-client";
import { backendFetch, subscribersClient, campaignClient } from "../api";

const { openSidebar } = useSidebar();

const adminData = ref({});
const dropdownOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const campaignResults = ref([]);
const showSearchResults = ref(false);
const isSearching = ref(false);
let searchTimeout = null;
let searchRequestId = 0;

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

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

onMounted(async () => {
  document.addEventListener('click', closeSearchResultsOnOutsideClick);

  try {
    const response = await backendFetch('/admin-about', {
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    if (response.ok) {
      adminData.value = await response.json();
    }
  } catch (error) {
    console.error('Failed to fetch admin data:', error);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', closeSearchResultsOnOutsideClick);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>
