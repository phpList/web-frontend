<template>
  <div>
    <!-- Backdrop for mobile -->
    <div
        v-if="isSidebarOpen"
        class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        @click="closeSidebar"
    ></div>

    <aside
        class="fixed inset-y-0 left-0 bg-slate-500 dark:bg-slate-950 border-r border-slate-600 dark:border-slate-800 w-64 z-50 transform transition-transform duration-300 lg:inset-auto lg:sticky lg:top-0 lg:self-start lg:h-screen lg:translate-x-0"
        :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex flex-col h-full">
        <div class="h-16 flex items-center justify-between px-6 border-b border-slate-600 dark:border-slate-800">
          <SidebarLogo />
          <button
              class="lg:hidden p-1.5 hover:bg-slate-600 dark:hover:bg-slate-800 rounded-lg text-slate-100 hover:text-white dark:text-slate-400 dark:hover:text-slate-200"
              @click="closeSidebar"
          >
            <BaseIcon name="close" />
          </button>
        </div>

        <!-- Navigation area -->
        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <SidebarNavSection
              v-for="section in visibleSections"
              :key="section.id"
              v-bind="section"
          />
        </nav>

        <!-- Current admin + logout -->
        <div class="border-t border-slate-600 dark:border-slate-800 px-4 py-4" data-testid="sidebar-user">
          <div class="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-600 dark:hover:bg-slate-800">
            <div
                class="shrink-0 h-9 w-9 rounded-full bg-slate-700 dark:bg-slate-800 border border-slate-400/40 dark:border-slate-700 flex items-center justify-center text-sm font-bold text-white uppercase transition-colors group-hover:border-slate-300"
                data-testid="sidebar-avatar"
                aria-hidden="true"
            >
              {{ adminInitial }}
            </div>
            <div class="min-w-0 flex-1 flex flex-col">
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
import { useSidebar } from '../../composables/useSidebar'
import { useCurrentAdmin } from '../../composables/useCurrentAdmin'

const { isSidebarOpen, closeSidebar } = useSidebar()
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
