<template>
  <AttributeDirectory
      title="Admin Attributes"
      description="Manage administrator attribute definitions"
      :client="adminAttributeClient"
  >
    <template #create-modal="{ isOpen, close, created }">
      <CreateAdminAttributeModal
          :is-open="isOpen"
          @close="close"
          @created="created"
      />
    </template>

    <template #edit-modal="{ isOpen, attribute, close, updated }">
      <EditAdminAttributeModal
          :is-open="isOpen"
          :attribute="attribute"
          @close="close"
          @updated="updated"
      />
    </template>
  </AttributeDirectory>
</template>

<script setup>
import AttributeDirectory from './AttributeDirectory.vue'
import CreateAdminAttributeModal from './CreateAdminAttributeModal.vue'
import EditAdminAttributeModal from './EditAdminAttributeModal.vue'

import { adminAttributeClient } from '../../api'
</script>