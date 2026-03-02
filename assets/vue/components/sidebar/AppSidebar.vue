<template>
  <aside
      class="fixed inset-y-0 left-0 bg-white border-r border-slate-200 w-64 z-50 transform transition-transform duration-300 lg:relative lg:translate-x-0 translate-x-0"
  >
    <div class="flex flex-col h-full">
      <div class="h-16 flex items-center px-6 border-b border-slate-100">
        <SidebarLogo />
      </div>

      <!-- Navigation area -->
      <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <SidebarNavSection
            v-for="section in sections"
            :key="section.id"
            v-bind="section"
        />
      </nav>
    </div>
  </aside>

</template>

<script setup>
import SidebarLogo from './SidebarLogo.vue'
import SidebarNavSection from './SidebarNavSection.vue'

const sections = [
  {
    id: 'general',
    label: 'General',
    items: [
      { label: 'Dashboard', icon: 'grid', route: '/', badge: null },
      { label: 'Subscribers', icon: 'users', route: '/subscribers' },
      { label: 'Lists', icon: 'list', route: '/lists' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { label: 'Campaigns', icon: 'plane', route: '/campaigns' },
      { label: 'Templates', icon: 'template', route: '/templates' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { label: 'Bounces', icon: 'warning', route: '/bounces' },
      { label: 'Analytics', icon: 'chart', route: '/analytics' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { label: 'Settings', icon: 'settings', route: '/settings' },
      { label: 'Public pages', icon: 'public', route: '/public' },
    ],
  },
]
</script>
