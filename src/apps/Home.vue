<template>
  <div class="page">
    <p class="intro">{{ t('home.intro') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style scoped>
.page {
  padding: 2rem;
}
.intro {
  margin: 0;
  color: #aab;
}
</style>
