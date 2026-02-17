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
        <div v-if="gameStore.mode === 'PLAY'" class="status-item">步数：{{ gameStore.stepCount }}</div>
        <div v-if="gameStore.mode === 'PLAY' && gameStore.solution" class="status-item solution-info">
          <div>最少步骤：{{ gameStore.solution.steps }}</div>
        </div>
      </div>
      <div class="controls">
        <div class="mode-switch">
          <label>
            <input type="radio" value="EDIT" :checked="gameStore.mode === 'EDIT'" @change="handleModeChange('EDIT')" /> 编辑模式
          </label>
          <label>
            <input type="radio" value="PLAY" :checked="gameStore.mode === 'PLAY'" @change="handleModeChange('PLAY')" /> 游戏模式 (点击变色)
          </label>
        </div>
        
        <!-- 游戏模式：游戏选择器 -->
        <div v-if="gameStore.mode === 'PLAY'" class="game-selector">
          <div class="selector-label">选择游戏：</div>
          <select 
            v-model="selectedGameId" 
            @change="handleGameSelect"
            class="game-select"
            :disabled="gameStore.loadingGames"
          >
            <option value="">-- 请选择游戏 --</option>
            <option 
              v-for="game in gameStore.gameList" 
              :key="game.id" 
              :value="game.id"
            >
              {{ game.name }} {{ game.hasSolution ? `(${game.solutionSteps}步)` : '' }}
            </option>
          </select>
          <button 
            @click="refreshGames" 
            :disabled="gameStore.loadingGames"
            class="refresh-btn"
            title="刷新游戏列表"
          >
            {{ gameStore.loadingGames ? '加载中...' : '刷新' }}
          </button>
        </div>
        
        <ColorPalette />
        <span v-if="gameStore.mode === 'EDIT'" class="edit-tip">编辑时按住空格 + 移动鼠标可连续上色</span>
        
        <!-- 编辑模式：保存按钮 -->
        <div v-if="gameStore.mode === 'EDIT'" class="edit-actions">
          <button @click="handleSaveGame" :disabled="saving" class="save-btn">
            {{ saving ? '保存中...' : '保存游戏' }}
          </button>
          <div v-if="saveMessage" class="save-message" :class="{ error: saveError }">
            {{ saveMessage }}
          </div>
        </div>
        
        <button @click="resetGrid">重置画布</button>
        <SolverPanel />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useGameStore } from './stores/gameStore'
import GameBoard from './components/GameBoard.vue'
import ColorPalette from './components/ColorPalette.vue'
import SolverPanel from './components/SolverPanel.vue'

const gameStore = useGameStore()

// 保存状态
const saving = ref(false)
const saveMessage = ref('')
const saveError = ref(false)

// 游戏选择状态
const selectedGameId = ref('')

// 初始化网格
const resetGrid = () => {
  gameStore.initGrid()
  selectedGameId.value = ''
}

// 处理模式切换
const handleModeChange = async (newMode: 'EDIT' | 'PLAY') => {
  gameStore.setMode(newMode)
  
  if (newMode === 'PLAY') {
    // 切换到游戏模式时，加载游戏列表
    await gameStore.refreshGameList()
  } else {
    // 切换到编辑模式时，重置选择
    selectedGameId.value = ''
  }
}

// 处理游戏选择
const handleGameSelect = async () => {
  if (!selectedGameId.value) return
  
  try {
    await gameStore.loadGame(selectedGameId.value)
  } catch (error) {
    console.error('加载游戏失败:', error)
    alert(`加载游戏失败: ${error}`)
  }
}

// 刷新游戏列表
const refreshGames = async () => {
  await gameStore.refreshGameList()
}

// 保存游戏
const handleSaveGame = async () => {
  if (!gameStore.gameGrid) return
  
  saving.value = true
  saveMessage.value = ''
  saveError.value = false
  
  try {
    // 如果有解，使用现有解；如果没有解，先求解
    let solution = gameStore.solution
    if (!solution) {
      // 如果没有解，先求解
      gameStore.solvePuzzle()
      
      // 等待求解完成（最多等待30秒）
      const maxWaitTime = 30000
      const startTime = Date.now()
      await new Promise<void>((resolve, reject) => {
        const checkSolution = () => {
          if (!gameStore.solving) {
            solution = gameStore.solution
            resolve()
          } else if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('求解超时，请稍后重试'))
          } else {
            setTimeout(checkSolution, 100)
          }
        }
        checkSolution()
      })
    }
    
    const savedId = await gameStore.saveGame()
    saveMessage.value = `游戏已保存为 ${savedId}.json，请将文件放到 src/games/default 目录`
    saveError.value = false
    
    // 5秒后清除消息
    setTimeout(() => {
      saveMessage.value = ''
    }, 5000)
  } catch (error: any) {
    saveMessage.value = `保存失败: ${error?.message || error}`
    saveError.value = true
    
    // 5秒后清除错误消息
    setTimeout(() => {
      saveMessage.value = ''
    }, 5000)
  } finally {
    saving.value = false
  }
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
  gameStore.initGrid()
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

.game-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.selector-label {
  font-size: 0.9rem;
  font-weight: 500;
  color: #333;
}

.game-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  background: white;
  cursor: pointer;
}

.game-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-btn {
  padding: 6px 12px;
  font-size: 0.85rem;
}

.edit-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.save-btn {
  width: 100%;
}

.save-message {
  font-size: 0.85rem;
  color: #4ECDC4;
  padding: 4px 8px;
  background: #f0f9f8;
  border-radius: 4px;
}

.save-message.error {
  color: #ff6b6b;
  background: #fff5f5;
}
</style>
