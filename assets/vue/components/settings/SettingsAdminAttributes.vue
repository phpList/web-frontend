<template>
  <AttributeDirectory
      :title="t('settings.admin_attributes.title')"
      :description="t('settings.admin_attributes.description')"
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
import { useI18n } from 'vue-i18n'
import AttributeDirectory from './AttributeDirectory.vue'
import CreateAdminAttributeModal from './CreateAdminAttributeModal.vue'
import EditAdminAttributeModal from './EditAdminAttributeModal.vue'

import { adminAttributeClient } from '../../api'

const { t } = useI18n()
</script>
