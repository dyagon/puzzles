<template>
  <div v-if="gameStore.mode === 'EDIT'" class="graph-info-panel">
    <div class="info-title">{{ t('kami2.graphInfoTitle') }}</div>
    <template v-if="gameStore.graphInfo">
      <div class="info-row">
        <span class="info-label">{{ t('kami2.graphInfoIslands') }}</span>
        {{ gameStore.graphInfo.islandCount }}
      </div>
      <div class="info-row">
        <span class="info-label">{{ t('kami2.graphInfoRegions') }}</span>
        {{ gameStore.graphInfo.regionCount }}
      </div>
      <div v-if="gameStore.graphInfo.perIslandSizes.length > 0" class="island-detail">
        <span class="info-label">{{ t('kami2.graphInfoPerIsland') }}</span>
        <span class="island-sizes">{{ islandSizesText }}</span>
      </div>
    </template>
    <div v-else class="info-loading">{{ t('kami2.graphInfoLoading') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()
const { t } = useI18n()

const islandSizesText = computed(() => {
  const sizes = gameStore.graphInfo?.perIslandSizes
  if (!sizes?.length) return '-'
  return sizes.join(', ')
})
</script>

<style scoped>
.graph-info-panel {
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.info-row {
  color: #333;
}

.info-label {
  color: #666;
  margin-right: 4px;
}

.island-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.island-sizes {
  font-size: 0.85rem;
  color: #555;
  word-break: break-all;
}

.info-loading {
  color: #999;
  font-size: 0.9rem;
}
</style>
