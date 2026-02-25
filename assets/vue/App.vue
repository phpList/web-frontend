<template>
  <aside class="sidebar">
    <div class="sidebar__top">
      <SidebarLogo />

      <nav class="sidebar__nav">
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
      { label: 'Dashboard', icon: 'grid', route: '/dashboard', badge: null },
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
