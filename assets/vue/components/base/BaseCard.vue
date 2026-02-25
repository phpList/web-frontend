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
  default: 'card shadow-sm border-0 bg-white',
  subtle: 'card shadow-sm border-0 bg-light',
  danger: 'card shadow-sm border-0 bg-danger text-white',
  success: 'card shadow-sm border-0 bg-success text-white',
}

const bodyVariantMap = {
  default: 'card-body p-4',
  subtle: 'card-body p-4',
  danger: 'card-body p-4',
  success: 'card-body p-4',
}

const cardClasses = cardVariantMap[props.variant] || cardVariantMap.default
const bodyClasses = bodyVariantMap[props.variant] || bodyVariantMap.default
</script>
