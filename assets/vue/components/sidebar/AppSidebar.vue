<template>
  <aside
      class="d-flex flex-column bg-white border-right sticky-top"
      style="height: 100vh; width: 260px;"
  >
    <!-- Sidebar topbar (logo area) matches main topbar paddings: py-3 px-4 -->
    <div class="py-3 px-4 border-bottom">
      <SidebarLogo />
    </div>

    <!-- Navigation area -->
    <nav class="nav flex-column gap-2 p-3 overflow-auto flex-grow-1">
      <SidebarNavSection
          v-for="section in sections"
          :key="section.id"
          v-bind="section"
      />
    </nav>
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
      { label: 'Lists & Segments', icon: 'list', route: '/lists' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    items: [
      { label: 'Campaigns', icon: 'plane', route: '/campaigns' },
      { label: 'Templates', icon: 'layout', route: '/templates' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { label: 'Bounces & Reports', icon: 'chart', route: '/reports' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [{ label: 'Settings', icon: 'settings', route: '/settings' }],
  },
]
</script>
