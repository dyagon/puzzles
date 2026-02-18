<template>
  <div class="game-container">
    <!-- 左侧：游戏区域，高度占满 -->
    <GameBoard
      v-if="gameStore.gameGrid"
      :rows="gameStore.gameGrid.rows"
      :cols="gameStore.gameGrid.cols"
      :grid="gameStore.gameGrid"
      :highlight-cells="gameStore.highlightCells"
      @update:grid="gameStore.setGameGrid($event)"
      @step="gameStore.incrementStepCount()"
    />

    <!-- 右侧：状态 + 控制 统一放一起 -->
    <aside class="right-sidebar">
      <div class="status-panel">
        <div class="status-item">联通区域：{{ gameStore.regionCount }}</div>
        <div v-if="gameStore.mode === 'PLAY'" class="status-item">测试步数：{{ gameStore.stepCount }}</div>
        <div v-if="gameStore.mode === 'PLAY' && gameStore.solution" class="status-item solution-info">
          <div>最少步骤：{{ gameStore.solution.steps }}</div>
        </div>
      </div>
      <div class="controls">
        <div class="mode-switch">
          <label>
            <input type="radio" value="EDIT" :checked="gameStore.mode === 'EDIT'" @change="handleModeChange('EDIT')" /> 编辑
          </label>
          <label>
            <input type="radio" value="PLAY" :checked="gameStore.mode === 'PLAY'" @change="handleModeChange('PLAY')" /> 测试
          </label>
        </div>
        <ColorPalette />
        <span v-if="gameStore.mode === 'EDIT'" class="edit-tip">编辑时按住空格 + 移动鼠标可连续上色</span>
        <button v-if="gameStore.mode === 'PLAY'" @click="resetGrid">回到编辑状态</button>
        <SolverPanel />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/gameStore'
import GameBoard from './components/GameBoard.vue'
import ColorPalette from './components/ColorPalette.vue'
import SolverPanel from './components/SolverPanel.vue'

const gameStore = useGameStore()

const resetGrid = () => {
  gameStore.loadEditStateOrInit()
}

const handleModeChange = (newMode: 'EDIT' | 'PLAY') => {
  gameStore.setMode(newMode)
}

// 键盘事件处理
const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    gameStore.setSpaceHeld(true)
  }
}

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === 'Space') {
    e.preventDefault()
    gameStore.setSpaceHeld(false)
  }
}

onMounted(() => {
  gameStore.loadEditStateOrInit()
  globalThis.addEventListener('keydown', onKeyDown)
  globalThis.addEventListener('keyup', onKeyUp)
})

onUnmounted(() => {
  globalThis.removeEventListener('keydown', onKeyDown)
  globalThis.removeEventListener('keyup', onKeyUp)
  gameStore.cleanup()
})
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

.edit-tip {
  font-size: 0.9rem;
  color: #666;
}

.status-item {
  font-size: 1rem;
  font-weight: 500;
}

.solution-info {
  color: #4ECDC4;
  font-weight: 600;
}

button {
  padding: 8px 16px;
  background-color: #4ECDC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background-color: #3db8ab;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

</style>
