<template>
  <div class="board-wrapper">
    <svg
      class="game-svg"
      :viewBox="`0 0 ${boardWidth} ${boardHeight}`"
      preserveAspectRatio="xMidYMid meet"
    >
      <g v-for="(col, c) in gameGrid?.cells" :key="c">
        <polygon
          v-for="(_cell, r) in col"
          :key="`${c}-${r}`"
          :points="getTrianglePoints(c, r)"
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
import { getTrianglePoints, getNeighbors } from '../core/draw'
import type { GameGrid } from '../core/GameGrid'
import { TRI_H, SIDE_A } from '../core/constants'
import { cloneGameGrid, getColorAt } from '../core/gameGridUtils'

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
const boardHeight = computed(() => Math.floor((props.grid?.rows || 0) / 2) * SIDE_A)

// 获取 gameGrid
const gameGrid = computed(() => props.grid)

// 获取 cell 的颜色字符串
const getCellColor = (c: number, r: number): string => {
  if (!gameGrid.value) return '#fff'
  return getColorAt(gameGrid.value, r, c)
}

// 获取 cell 的边框颜色
const getCellStroke = (c: number, r: number): string => {
  if (!props.highlightCells || props.highlightCells.length === 0) {
    return '#fff'
  }
  
  const highlightCell = props.highlightCells.find(
    cell => cell.c === c && cell.r === r
  )
  
  if (highlightCell) {
    return highlightCell.color
  }
  
  return '#fff'
}

// 获取 cell 的边框宽度
const getCellStrokeWidth = (c: number, r: number): number => {
  if (!props.highlightCells || props.highlightCells.length === 0) {
    return 1
  }
  
  const highlightCell = props.highlightCells.find(
    cell => cell.c === c && cell.r === r
  )
  
  if (highlightCell) {
    return 3 // 高亮时使用更粗的边框
  }
  
  return 1
}

const paintCell = (c: number, r: number) => {
  if (!gameGrid.value) return
  const newGameGrid = cloneGameGrid(gameGrid.value)
  newGameGrid.cells[c][r].colorIndex = gameStore.selectedColorIndex
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
  oldColorIndex: number,
  newColorIndex: number
) => {
  if (!gameGrid.value) return
  const newGameGrid = cloneGameGrid(gameGrid.value)
  const queue = [{ r: startR, c: startC }]
  const visited = new Set<string>()

  newGameGrid.cells[startC][startR].colorIndex = newColorIndex
  visited.add(`${startR},${startC}`)

  while (queue.length > 0) {
    const curr = queue.shift()!
    const neighbors = getNeighbors(curr.r, curr.c)

    for (const n of neighbors) {
      const nKey = `${n.r},${n.c}`
      if (visited.has(nKey)) continue

      // 边界检查：确保坐标在有效范围内
      if (n.c < 0 || n.c >= gameGrid.value.cols || n.r < 0 || n.r >= gameGrid.value.rows) continue
      if (!newGameGrid.cells[n.c] || !newGameGrid.cells[n.c][n.r]) continue

      const cell = newGameGrid.cells[n.c][n.r]
      if (cell.colorIndex === oldColorIndex) {
        cell.colorIndex = newColorIndex
        visited.add(nKey)
        queue.push(n)
      }
    }
  }
  
  emit('update:grid', newGameGrid)
}

const handleCellClick = (c: number, r: number) => {
  if (!gameGrid.value) return
  const cell = gameGrid.value.cells[c][r]
  if (!cell) return
  
  const targetColorIndex = cell.colorIndex
  const newColorIndex = gameStore.selectedColorIndex

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
  transition: fill 0.2s, stroke-width 0.15s, stroke 0.15s;
}

.triangle-cell:hover {
  opacity: 0.9;
}
</style>
