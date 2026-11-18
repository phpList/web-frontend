<template>
  <AttributeDirectory
      :title="t('settings.subscriber_attributes.title')"
      :description="t('settings.subscriber_attributes.description')"
      :client="subscriberAttributesClient"
  >
    <template #create-modal="{ isOpen, close, created }">
      <CreateSubscriberAttributeModal
          :is-open="isOpen"
          @close="close"
          @created="created"
      />
    </template>

    <template #edit-modal="{ isOpen, attribute, close, updated }">
      <EditSubscriberAttributeModal
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
import CreateSubscriberAttributeModal from './CreateSubscriberAttributeModal.vue'
import EditSubscriberAttributeModal from './EditSubscriberAttributeModal.vue'

import { subscriberAttributesClient } from '../../api'

const { t } = useI18n()
</script>
