<template>
  <AttributeDirectory
      title="Subscriber Attributes"
      description="Manage subscriber attribute definitions"
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
import AttributeDirectory from './AttributeDirectory.vue'
import CreateSubscriberAttributeModal from './CreateSubscriberAttributeModal.vue'
import EditSubscriberAttributeModal from './EditSubscriberAttributeModal.vue'

import { subscriberAttributesClient } from '../../api'
</script>