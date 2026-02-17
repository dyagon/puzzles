<template>
  <div class="solver-panel">
    <!-- 游戏模式：显示求解按钮或最优解 -->
    <template v-if="gameStore.mode === 'PLAY'">
      <button 
        v-if="!gameStore.solution"
        @click="handleSolve" 
        :disabled="gameStore.solving"
        class="solve-button"
      >
        {{ gameStore.solving ? '求解中...' : '求解最少步骤' }}
      </button>
      
      <div v-if="gameStore.solution" class="solution-header">
        <div class="solution-title">最优解步骤：</div>
        <div class="solution-steps-count">{{ gameStore.solution.steps }} 步</div>
      </div>
    </template>
    
    <!-- 编辑模式：显示求解按钮 -->
    <template v-else>
      <button 
        @click="handleSolve" 
        :disabled="gameStore.solving"
        class="solve-button"
      >
        {{ gameStore.solving ? '求解中...' : '求解最优解' }}
      </button>
    </template>
    
    <!-- 显示解决方案步骤 -->
    <div v-if="gameStore.solution && gameStore.solution.path.length > 0" class="solution-path">
      <div 
        v-for="(step, index) in gameStore.solution.path" 
        :key="index" 
        class="solution-step"
        :class="{ active: gameStore.selectedStepIndex === index }"
        @click="handleStepClick(index)"
      >
        <div class="step-content">
          <span class="step-number">步骤 {{ index + 1 }}:</span>
          <span class="step-color-swatch" :style="{ backgroundColor: step.color }"></span>
          <span class="step-text">将位置({{ step.region.r }}, {{ step.region.c }})所在的区域染成此颜色</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../stores/gameStore'

const gameStore = useGameStore()

const handleSolve = () => {
  gameStore.solvePuzzle()
}

const handleStepClick = (index: number) => {
  gameStore.selectStep(index)
}
</script>

<style scoped>
.solver-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.solve-button {
  padding: 8px 16px;
  background-color: #4ECDC4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.solve-button:hover:not(:disabled) {
  background-color: #3db8ab;
}

.solve-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.solution-path {
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.85rem;
}

.solution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.solution-title {
  font-weight: 600;
  color: #333;
}

.solution-steps-count {
  font-weight: 600;
  color: #4ECDC4;
  font-size: 0.9rem;
}

.solution-step {
  padding: 8px;
  color: #666;
  line-height: 1.4;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
  margin-bottom: 4px;
}

.solution-step:hover {
  background-color: #f0f0f0;
}

.solution-step.active {
  background-color: #e3f2fd;
  border: 1px solid #2196f3;
}

.step-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  font-weight: 600;
  color: #333;
}

.step-color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid #ccc;
  flex-shrink: 0;
}

.step-text {
  flex: 1;
  font-size: 0.85rem;
}
</style>
