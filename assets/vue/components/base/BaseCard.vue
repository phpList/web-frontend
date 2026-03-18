<template>
  <div :class="cardClasses">
    <div :class="bodyClasses">
      <slot />
    </div>
  </div>
  
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default', // default | subtle | danger | success
  },
})

const cardVariantMap = {
  default: 'rounded-lg shadow-sm border border-gray-100 bg-white',
  subtle: 'rounded-lg shadow-sm border-0 bg-gray-50',
  danger: 'rounded-lg shadow-sm border-0 bg-red-600 text-white',
  success: 'rounded-lg shadow-sm border-0 bg-green-600 text-white',
}

const bodyVariantMap = {
  default: 'p-4',
  subtle: 'p-4',
  danger: 'p-4',
  success: 'p-4',
}

const cardClasses = cardVariantMap[props.variant] || cardVariantMap.default
const bodyClasses = bodyVariantMap[props.variant] || bodyVariantMap.default
</script>
