<template>
  <BaseCard class="system-card">
    <header class="system-card__header">
      <h2>System Overview</h2>
    </header>

    <section class="system-card__queue">
      <div class="system-card__queue-header">
        <p>Queue Status</p>
        <BaseBadge variant="success">Healthy</BaseBadge>
      </div>
      <BaseProgressBar :value="queuePercent" />

      <p class="system-card__queue-text">
        {{ remaining.toLocaleString() }} emails remaining in queue
      </p>
    </section>

    <dl class="system-card__meta">
      <div>
        <dt>Last Cron Run</dt>
        <dd>2 mins ago</dd>
      </div>
      <div>
        <dt>PHP Version</dt>
        <dd>8.2.14</dd>
      </div>
      <div>
        <dt>Database Size</dt>
        <dd>256 MB</dd>
      </div>
    </dl>

    <footer class="system-card__footer">
      <BaseButton variant="ghost">Run Manual Maintenance</BaseButton>
    </footer>
  </BaseCard>
</template>

<script setup>
import BaseCard from './components/base/BaseCard.vue'
import BaseBadge from './components/base/BaseBadge.vue'
import BaseButton from './components/base/BaseButton.vue'
import BaseProgressBar from './components/base/BaseProgressBar.vue'

const props = defineProps({
  queuePercent: { type: Number, default: 60 },
  remaining: { type: Number, default: 45102 },
})
</script>
