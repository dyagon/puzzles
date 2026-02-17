<template>
  <div class="game-container">
    <!-- 左侧：游戏区域，高度占满 -->
    <div class="board-wrapper">
        <svg
          class="game-svg"
          :viewBox="`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`"
          preserveAspectRatio="xMidYMid meet"
        >
          <g v-for="(col, c) in grid" :key="c">
            <polygon
              v-for="(cell, r) in col"
              :key="`${c}-${r}`"
              :points="getTrianglePoints(c, r)"
              :fill="cell.color"
              stroke="#fff"
              stroke-width="1"
              class="triangle-cell"
              @click="handleCellClick(c, r)"
              @mouseenter="handleCellEnter(c, r)"
            />
          </g>
        </svg>
    </div>

    <!-- 右侧：状态 + 控制 统一放一起 -->
    <aside class="right-sidebar">
      <div class="status-panel">
        <div class="status-item">联通区域：{{ regionCount }}</div>
        <div v-if="mode === 'PLAY'" class="status-item">步数：{{ stepCount }}</div>
      </div>
      <div class="controls">
        <div class="mode-switch">
          <label>
            <input type="radio" value="EDIT" v-model="mode" /> 编辑模式
          </label>
          <label>
            <input type="radio" value="PLAY" v-model="mode" /> 游戏模式 (点击变色)
          </label>
        </div>
        <div class="color-palette">
          <div
            v-for="color in COLORS"
            :key="color"
            :style="{ backgroundColor: color }"
            :class="['color-swatch', { active: selectedColor === color }]"
            @click="selectedColor = color"
          ></div>
        </div>
        <span v-if="mode === 'EDIT'" class="edit-tip">编辑时按住空格 + 移动鼠标可连续上色</span>
        <button @click="resetGrid">重置画布</button>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getTrianglePoints, getNeighbors } from './core/draw'
import { buildGameState } from './core/calculate'
import type { Cell } from './core/Cell'
import {
  ROWS,
  COLS,
  COLORS,
  BASE_COLOR,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from './core/constants'

// 状态
const mode = ref<'EDIT' | 'PLAY'>('EDIT')
const selectedColor = ref<(typeof COLORS)[number]>(COLORS[0])
const stepCount = ref(0)
const grid = ref<Cell[][]>([])
const spaceHeld = ref(false) // 按住空格时，鼠标经过的格子都上色

// 联通区域数（随 grid 变化）
const regionCount = computed(() => buildGameState(grid.value).count)

// --- 3. 初始化 ---
const initGrid = () => {
  const newGrid: Cell[][] = []
  for (let c = 0; c < COLS; c++) {
    const row: Cell[] = []
    for (let r = 0; r < ROWS; r++) {
      row.push({ r, c, color: BASE_COLOR })
    }
    newGrid.push(row)
  }
  grid.value = newGrid
  stepCount.value = 0
}

const resetGrid = () => initGrid()

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    spaceHeld.value = true
  }
}
const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    spaceHeld.value = false
  }
}

onMounted(() => {
  initGrid()
  globalThis.addEventListener('keydown', onKeyDown)
  globalThis.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  globalThis.removeEventListener('keydown', onKeyDown)
  globalThis.removeEventListener('keyup', onKeyUp)
})

const paintCell = (c: number, r: number) => {
  grid.value[c][r].color = selectedColor.value
}

const handleCellEnter = (c: number, r: number) => {
  if (mode.value === 'EDIT' && spaceHeld.value) {
    paintCell(c, r)
  }
}

const handleCellClick = (c: number, r: number) => {
  const targetColor = grid.value[c][r].color
  const newColor = selectedColor.value

  if (mode.value === 'EDIT') {
    paintCell(c, r)
  } else {
    if (targetColor === newColor) return
    floodFill(c, r, targetColor, newColor)
    stepCount.value++
  }
}

const floodFill = (
  startC: number,
  startR: number,
  oldColor: string,
  newColor: string
) => {
  const queue = [{ r: startR, c: startC }]
  const visited = new Set<string>()

  grid.value[startC][startR].color = newColor
  visited.add(`${startR},${startC}`)

  while (queue.length > 0) {
    const curr = queue.shift()!
    const neighbors = getNeighbors(curr.r, curr.c)

    for (const n of neighbors) {
      const nKey = `${n.r},${n.c}`
      if (visited.has(nKey)) continue

      // 边界检查：确保坐标在有效范围内
      if (n.c < 0 || n.c >= COLS || n.r < 0 || n.r >= ROWS) continue
      if (!grid.value[n.c] || !grid.value[n.c][n.r]) continue

      const cell = grid.value[n.c][n.r]
      if (cell.color === oldColor) {
        cell.color = newColor
        visited.add(nKey)
        queue.push(n)
      }
    }
  }
}
</script>

<style scoped>
.game-container {
  display: flex;
  flex-direction: row;
  font-family: sans-serif;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

/* 左侧游戏区域：占满剩余宽度与整屏高度 */
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

/* 右侧：状态 + 控制，统一一列 */
.right-sidebar {
  width: 200px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f5f5;
  border-left: 1px solid #ddd;
  gap: 24px;
}

.status-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
}

.mode-switch {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

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

.triangle-cell {
  cursor: pointer;
  transition: fill 0.2s;
}
.triangle-cell:hover {
  opacity: 0.9;
}

.edit-tip {
  font-size: 0.9rem;
  color: #666;
}

.status-item {
  font-size: 1rem;
  font-weight: 500;
}
</style>
