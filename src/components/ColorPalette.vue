<template>
  <div class="color-palette">
    <div
      v-for="color in COLORS"
      :key="color"
      :style="{ backgroundColor: color }"
      :class="['color-swatch', { active: selectedColor === color }]"
      @click="handleColorClick(color)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import { COLORS } from '../core/constants'

const gameStore = useGameStore()

const selectedColor = computed(() => gameStore.selectedColor)

const handleColorClick = (color: typeof COLORS[number]) => {
  gameStore.setSelectedColor(color)
}
</script>

<style scoped>
.color-palette {
  display: flex;
  gap: 10px;
}

.color-swatch {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.2s;
}

.color-swatch.active {
  border-color: #333;
  transform: scale(1.1);
}
</style>
