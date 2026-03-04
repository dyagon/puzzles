<template>
  <div class="board-wrapper">
    <svg
      class="game-svg"
      :viewBox="`0 0 ${boardWidth} ${boardHeight}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <g v-for="(row, r) in gameGrid?.grid" :key="r">
        <polygon
          v-for="(_colorIndex, c) in row"
          :key="`${r}-${c}`"
          :points="gameGrid?.getTrianglePoints(c, r) ?? ''"
          :fill="getCellColor(c, r)"
          :stroke="getCellStroke(c, r)"
          :stroke-width="getCellStrokeWidth(c, r)"
          class="triangle-cell"
          @click="handleCellClick(c, r)"
          @mouseenter="handleCellEnter(c, r)"
        />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../stores/gameStore'
import type { GameGrid } from '../core/GameGrid'
import { TRI_H } from '../core/GameGrid'

interface Props {
  rows: number
  cols: number
  grid: GameGrid | null
  highlightCells?: Array<{ r: number; c: number; color: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:grid': [grid: GameGrid]
  step: []
}>()

// 使用 store
const gameStore = useGameStore()

// 计算画布尺寸
const boardWidth = computed(() => (props.grid?.cols || 0) * TRI_H)
const boardHeight = computed(() => props.grid?.height ?? 0)

// 获取 gameGrid
const gameGrid = computed(() => props.grid)

// 获取 cell 的颜色字符串（颜色表来自全局 paletteColors）
// 如果 cell 在高亮列表中，使用高亮颜色；否则使用原始颜色
const getCellColor = (c: number, r: number): string => {
  if (!gameGrid.value) return '#fff'
  
  // 检查是否在高亮列表中
  if (props.highlightCells && props.highlightCells.length > 0) {
    const highlightCell = props.highlightCells.find(
      cell => cell.c === c && cell.r === r
    )
    if (highlightCell) {
      return highlightCell.color
    }
  }
  
  // 返回原始颜色
  return gameGrid.value.getColorAt(r, c, gameStore.paletteColors)
}

// 获取 cell 的边框颜色（始终使用默认值）
const getCellStroke = (_c: number, _r: number): string => {
  return '#fff'
}

// 获取 cell 的边框宽度（始终使用默认值）
const getCellStrokeWidth = (_c: number, _r: number): number => {
  return 1
}

const paintCell = (c: number, r: number) => {
  if (!gameGrid.value) return
  const newGameGrid = gameGrid.value.clone()
  newGameGrid.grid[r][c] = gameStore.selectedColorIndexForGrid
  emit('update:grid', newGameGrid)
}

const handleCellEnter = (c: number, r: number) => {
  if (gameStore.mode === 'EDIT' && gameStore.spaceHeld) {
    paintCell(c, r)
  }
}

const floodFill = (
  startC: number,
  startR: number,
  _oldColorIndex: number,
  newColorIndex: number
) => {
  if (!gameGrid.value) return
  const newGameGrid = gameGrid.value.clone()
  newGameGrid.floodFill(startR, startC, newColorIndex)
  emit('update:grid', newGameGrid)
}

const handleCellClick = (c: number, r: number) => {
  if (!gameGrid.value) return
  const targetColorIndex = gameGrid.value.getColorIndex(r, c)
  const newColorIndex = gameStore.selectedColorIndexForGrid

  if (gameStore.mode === 'EDIT') {
    paintCell(c, r)
  } else {
    if (targetColorIndex === newColorIndex) return
    floodFill(c, r, targetColorIndex, newColorIndex)
    emit('step')
  }
}
</script>

<style scoped>
.board-wrapper {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #e8e8e8;
}

.game-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.triangle-cell {
  cursor: pointer;
  transition: fill 0.2s;
}

.triangle-cell:hover {
  opacity: 0.9;
}
</style>
