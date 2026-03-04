<template>
  <div class="sudoku-app">
    <h1>数独</h1>
    <div class="board-wrap">
      <div class="board" :class="{ 'show-errors': showErrors }">
        <div
          v-for="(row, i) in grid"
          :key="i"
          class="row"
          :class="{ 'thick-bottom': (i + 1) % 3 === 0 && i !== 8 }"
        >
          <div
            v-for="(cell, j) in row"
            :key="j"
            class="cell"
            :class="{
              fixed: cell.fixed,
              'thick-right': (j + 1) % 3 === 0 && j !== 8,
              error: showErrors && cell.value && !isValid(i, j),
            }"
          >
            <input
              v-if="!cell.fixed"
              v-model.number="cell.value"
              type="number"
              min="1"
              max="9"
              class="input"
              @input="onInput($event, i, j)"
            />
            <span v-else class="fixed-num">{{ cell.value }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="actions">
      <button type="button" @click="reset">重置</button>
      <label class="toggle">
        <input v-model="showErrors" type="checkbox" />
        显示错误
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Cell {
  value: number | null
  fixed: boolean
}

// 示例：简单初盘（0 表示空格）
const initial = [
  [5, 3, 4, 1, 7, 3, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 1, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
]

function toGrid(data: number[][]): Cell[][] {
  return data.map((row) =>
    row.map((v) => ({ value: v || null, fixed: v !== 0 }))
  )
}

const grid = reactive<Cell[][]>(toGrid(initial.map((r) => [...r])))
const showErrors = ref(false)

function onInput(e: Event, row: number, col: number) {
  const t = (e.target as HTMLInputElement).value
  const n = t === '' ? null : parseInt(t, 10)
  if (n === null || (n >= 1 && n <= 9)) {
    grid[row][col].value = n
  } else {
    ;(e.target as HTMLInputElement).value = String(grid[row][col].value ?? '')
  }
}

function getRow(r: number): (number | null)[] {
  return grid[r].map((c) => c.value)
}
function getCol(c: number): (number | null)[] {
  return grid.map((row) => row[c].value)
}
function getBox(r: number, c: number): (number | null)[] {
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  const out: (number | null)[] = []
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) out.push(grid[br + i][bc + j].value)
  return out
}

function isValid(r: number, c: number): boolean {
  const v = grid[r][c].value
  if (v === null) return true
  const noDup = (arr: (number | null)[]) => {
    const nums = arr.filter((x): x is number => x !== null)
    return new Set(nums).size === nums.length
  }
  return noDup(getRow(r)) && noDup(getCol(c)) && noDup(getBox(r, c))
}

function reset() {
  const data = initial.map((r) => [...r])
  for (let i = 0; i < 9; i++)
    for (let j = 0; j < 9; j++) {
      grid[i][j].value = data[i][j] || null
      grid[i][j].fixed = data[i][j] !== 0
    }
}
</script>

<style scoped>
.sudoku-app {
  min-height: 100vh;
  padding: 1rem;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #1a1a2e;
  color: #eee;
}
h1 {
  margin: 0 0 1rem;
  font-size: 1.5rem;
}
.board-wrap {
  margin-bottom: 1rem;
}
.board {
  display: inline-block;
  border: 2px solid #4a4a6a;
  border-radius: 4px;
  overflow: hidden;
  background: #16213e;
}
.row {
  display: flex;
}
.cell {
  width: 36px;
  height: 36px;
  border: 1px solid #2a2a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}
.cell.thick-right {
  border-right-width: 2px;
}
.row.thick-bottom .cell {
  border-bottom-width: 2px;
}
.input {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  color: #eee;
  font-size: 1rem;
  text-align: center;
  padding: 0;
}
.input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
}
.fixed-num {
  font-weight: 600;
  color: #aab;
}
.cell.error .input,
.cell.error .fixed-num {
  color: #f66;
}
.actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}
.actions button {
  padding: 0.4rem 0.8rem;
  background: #4a4a6a;
  color: #eee;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.actions button:hover {
  background: #5a5a7a;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>
