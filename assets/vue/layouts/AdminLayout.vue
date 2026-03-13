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
        <div class="relative max-w-md w-full transition-all">
          <BaseIcon name="search" />
          <input
              placeholder="Search subscribers, campaigns..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              type="text"
          >
        </div>
      </div>

      <div class="flex items-center gap-4">
        <button class="hidden sm:flex items-center gap-2 px-4 py-2 bg-ext-wf1 text-white text-xs font-bold rounded-lg hover:bg-ext-wf3 transition-shadow shadow-sm shadow-indigo-500/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Create Campaign
        </button>

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
import { onMounted, ref } from "vue";

const { openSidebar } = useSidebar();

const adminData = ref({});
const dropdownOpen = ref(false);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

onMounted(async () => {
  try {
    const response = await fetch('/admin-about', {
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
</script>
