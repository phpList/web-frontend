<template>
  <div>
    <!-- Backdrop for mobile -->
    <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        @click="closeSidebar"
    ></div>

    <aside
        class="fixed inset-y-0 left-0 bg-slate-500 dark:bg-slate-950 border-r border-slate-600 dark:border-slate-800 w-64 z-50 transform transition-all duration-300 lg:inset-auto lg:sticky lg:top-0 lg:self-start lg:h-screen lg:translate-x-0"
        :class="[isSidebarOpen ? 'translate-x-0' : '-translate-x-full', isSidebarCollapsed ? 'lg:w-16' : '']"
    >
      <div class="flex flex-col h-full">
        <div
            class="h-16 flex items-center justify-between px-6 border-b border-slate-600 dark:border-slate-800"
            :class="isSidebarCollapsed ? 'lg:justify-center lg:px-0' : ''"
        >
          <SidebarLogo :class="isSidebarCollapsed ? 'lg:hidden' : ''" />

          <!-- Desktop: collapse sidebar -->
          <button
              type="button"
              class="hidden lg:block p-1.5 hover:bg-slate-600 dark:hover:bg-slate-800 rounded-lg text-slate-100 hover:text-white dark:text-slate-400 dark:hover:text-slate-200"
              :class="isSidebarCollapsed ? 'lg:hidden' : ''"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              @click="toggleCollapsed"
          >
            <BaseIcon name="sidebar" inherit-color />
          </button>

          <!-- Desktop, collapsed: logo becomes the expand button on hover -->
          <button
              v-if="isSidebarCollapsed"
              type="button"
              class="group hidden lg:flex w-9 h-9 items-center justify-center rounded-lg text-slate-100 hover:bg-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              aria-label="Expand sidebar"
              title="Expand sidebar"
              @click="toggleCollapsed"
          >
            <span class="w-8 h-8 rounded-full flex items-center justify-center bg-white/60 dark:bg-transparent group-hover:hidden">
              <img :src="logo" alt="Logo" class="w-full h-full block" style="object-fit: contain;" />
            </span>
            <span class="hidden group-hover:flex">
              <BaseIcon name="sidebar" inherit-color />
            </span>
          </button>
          <button
              class="lg:hidden p-1.5 hover:bg-slate-600 dark:hover:bg-slate-800 rounded-lg text-slate-100 hover:text-white dark:text-slate-400 dark:hover:text-slate-200"
              @click="closeSidebar"
          >
            <BaseIcon name="close" />
          </button>
        </div>

        <!-- Navigation area -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto overflow-x-hidden"
             :class="isSidebarCollapsed ? 'lg:px-2' : ''">
          <SidebarNavSection
              v-for="section in visibleSections"
              :key="section.id"
              v-bind="section"
          />
        </nav>

        <!-- Current admin + logout -->
        <div class="border-t border-slate-600 dark:border-slate-800 px-4 py-4" :class="isSidebarCollapsed ? 'lg:px-2' : ''" data-testid="sidebar-user">
          <div
              class="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-600 dark:hover:bg-slate-800"
              :class="isSidebarCollapsed ? 'lg:flex-col lg:px-0 lg:gap-2' : ''"
          >
            <div
                class="shrink-0 h-9 w-9 rounded-full bg-slate-700 dark:bg-slate-800 border border-slate-400/40 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-white uppercase transition-colors group-hover:border-slate-300"
                data-testid="sidebar-avatar"
                aria-hidden="true"
            >
              {{ adminInitial }}
            </div>
            <div class="min-w-0 flex-1 flex flex-col" :class="isSidebarCollapsed ? 'lg:hidden' : ''">
              <span class="text-sm font-bold text-slate-100 leading-none truncate">
                {{ adminName }}
              </span>
              <span class="text-[10px] text-slate-100 dark:text-slate-400 mt-1">
                {{ adminData.super_user ? 'Super Admin' : 'Administrator' }}
              </span>
            </div>
            <a
                href="/logout"
                class="shrink-0 p-2 rounded-lg no-underline text-slate-100 hover:text-white hover:bg-slate-500 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Logout"
                title="Logout"
            >
              <BaseIcon name="logout" inherit-color />
            </a>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import SidebarLogo from './SidebarLogo.vue'
import SidebarNavSection from './SidebarNavSection.vue'
import BaseIcon from '../base/BaseIcon.vue'
import logo from '../../../images/logo-48.png'
import { useSidebar } from '../../composables/useSidebar'
import { useCurrentAdmin } from '../../composables/useCurrentAdmin'

const { isSidebarOpen, isSidebarCollapsed, toggleCollapsed, closeSidebar } = useSidebar()
const { adminData, loadCurrentAdmin, hasPrivilege } = useCurrentAdmin()

onMounted(loadCurrentAdmin)

const adminName = computed(() => adminData.value?.login_name || 'Admin User')
const adminInitial = computed(() => adminName.value.trim().charAt(0) || 'A')

const sections = [
  {
    id: 'general',
    label: 'General',
    items: [
      { label: 'Dashboard', icon: 'grid', route: '/', badge: null },
      { label: 'Subscribers', icon: 'users', route: '/subscribers', requiredPrivilege: 'subscribers' },
      { label: 'Lists', icon: 'list', route: '/lists' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { label: 'Campaigns', icon: 'plane', route: '/campaigns', requiredPrivilege: 'campaigns' },
      { label: 'Stuck Campaigns', icon: 'warning', route: '/campaigns/stuck', requiredPrivilege: 'campaigns' },
      { label: 'Templates', icon: 'template', route: '/templates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { label: 'Bounces', icon: 'warning', route: '/bounces' },
      { label: 'Analytics', icon: 'chart', route: '/analytics', requiredPrivilege: 'statistics' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Settings', icon: 'settings', route: '/settings', requiredPrivilege: 'settings' },
      { label: 'Public pages', icon: 'public', route: '/public' },
    ],
  },
]

const visibleSections = computed(() =>
  sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPrivilege(item.requiredPrivilege)),
    }))
    .filter((section) => section.items.length > 0)
)
</script>
