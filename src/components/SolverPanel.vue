<template>
  <div class="solver-panel">
    <!-- 当前阶段提示 -->
    <div v-if="gameStore.solving || gameStore.graphInfo" class="phase-hint">
      <template v-if="gameStore.solvePhase === 'building'">步骤 1：构建图中…</template>
      <template v-else-if="gameStore.solvePhase === 'solving'">步骤 2：求解中（状态间隔输出到控制台）…</template>
      <template v-else-if="gameStore.graphInfo && !gameStore.solution">步骤 1 已完成，步骤 2 进行中…</template>
      <template v-else-if="gameStore.solution">步骤 3：已得到解</template>
    </div>

    <!-- 步骤 1：图信息（构建完成后显示） -->
    <div v-if="gameStore.graphInfo" class="solve-info graph-info">
      <div class="info-title">图信息</div>
      <div class="info-row"><span class="info-label">孤岛数量：</span>{{ gameStore.graphInfo.islandCount }}</div>
      <div class="info-row"><span class="info-label">联通区域数量：</span>{{ gameStore.graphInfo.regionCount }}</div>
      <div class="info-row"><span class="info-label">各岛屿节点数：</span>{{ gameStore.graphInfo.perIslandSizes.join(', ') }}</div>
    </div>

    <!-- 步骤 3：解信息（得到解后显示） -->
    <div v-if="gameStore.solutionMetadata" class="solve-info">
      <div class="info-title">解信息</div>
      <div class="info-row"><span class="info-label">最少步数：</span>{{ gameStore.solution?.steps ?? '-' }}</div>
      <div class="info-row"><span class="info-label">解法：</span>{{ gameStore.solutionMetadata.method }}</div>
    </div>

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

.phase-hint {
  font-size: 0.85rem;
  color: #666;
  padding: 6px 0;
}

.solve-info {
  padding: 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.solve-info.graph-info {
  background: #f8f9fa;
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
