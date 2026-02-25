<template>
  <div class="capacity-card">
    <div class="capacity-card__header">
      <p class="capacity-card__title">{{ title }}</p>
      <p class="capacity-card__value">
        {{ used }}% <span class="capacity-card__label">Used</span>
      </p>
    </div>

    <div class="capacity-card__bar">
      <div
          class="capacity-card__bar-fill"
          :style="{ width: used + '%' }"
      />
    </div>

    <p class="capacity-card__footer">
      Need more? <button class="capacity-card__link" type="button">Upgrade plan</button>
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  used: {
    type: Number,
    default: 82,
  },
  title: {
    type: String,
    default: 'Campaign Capacity',
  },
})
</script>

<style scoped>
.capacity-card {
  margin: 1.5rem;
  padding: 1rem 1.1rem;
  border-radius: 1.1rem;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #e5e7eb;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.35);
  font-size: 0.85rem;
}

.capacity-card__header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.7rem;
}

.capacity-card__title {
  font-weight: 600;
  color: #f9fafb;
}

.capacity-card__value {
  font-weight: 700;
  color: #f9fafb;
}

.capacity-card__label {
  font-weight: 500;
  opacity: 0.9;
  margin-left: 0.1rem;
}

.capacity-card__bar {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.24);
  overflow: hidden;
  margin-bottom: 0.8rem;
}

.capacity-card__bar-fill {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-radius: inherit;
  background: #facc15;
}

.capacity-card__footer {
  margin: 0;
  font-size: 0.8rem;
  color: #e5e7eb;
}

.capacity-card__link {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: #fef9c3;
  text-decoration: underline;
  cursor: pointer;
}
</style>
