<template>
  <div class="game-container">
    <!-- 游戏区域 + 侧边栏 组合居中，中间无间隙 -->
    <div class="game-main">
      <div
        class="board-area"
        :style="boardAreaStyle"
      >
        <GameBoard
          v-if="gameStore.gameGrid"
          :rows="gameStore.gameGrid.rows"
          :cols="gameStore.gameGrid.cols"
          :grid="gameStore.gameGrid"
          :highlight-cells="gameStore.highlightCells"
          @update:grid="gameStore.setGameGrid($event)"
          @step="gameStore.incrementStepCount()"
        />
      </div>

      <!-- 右侧：状态 + 控制，可滚动 -->
      <aside class="right-sidebar">
        <div class="controls">
          <div class="mode-switch">
            <button
              type="button"
              class="mode-btn"
              :class="{ active: gameStore.mode === 'EDIT' }"
              @click="handleModeChange('EDIT')"
            >
              编辑
            </button>
            <button
              type="button"
              class="mode-btn"
              :class="{ active: gameStore.mode === 'PLAY' }"
              @click="handleModeChange('PLAY')"
            >
              测试
            </button>
          </div>
          <ColorPalette />
          <GraphInfoPanel />
          <span v-if="gameStore.mode === 'EDIT'" class="edit-tip"
            >编辑时按住空格 + 移动鼠标可连续上色</span
          >
          <button v-if="gameStore.mode === 'PLAY'" @click="resetGrid">
            重置网格
          </button>
          <div v-if="gameStore.mode === 'PLAY'" class="status-panel">
            <div class="status-item">测试步数：{{ gameStore.stepCount }}</div>
          </div>
          <SolverPanel />
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed } from "vue";
import { useGameStore } from "./stores/gameStore";
import { TRI_H } from "./core/GameGrid";
import GameBoard from "./components/GameBoard.vue";
import ColorPalette from "./components/ColorPalette.vue";
import GraphInfoPanel from "./components/GraphInfoPanel.vue";
import SolverPanel from "./components/SolverPanel.vue";

const gameStore = useGameStore();

const boardAreaStyle = computed(() => {
  const g = gameStore.gameGrid;
  if (!g) return {};
  return {
    width: `${g.cols * TRI_H}px`,
    height: `${g.height}px`,
  };
});

const resetGrid = () => {
  gameStore.loadEditStateOrInit();
};

const handleModeChange = (newMode: "EDIT" | "PLAY") => {
  gameStore.setMode(newMode);
};

// 键盘事件处理
const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    e.preventDefault();
    gameStore.setSpaceHeld(true);
    return;
  }

  // 数字键 1-9 选择颜色（仅在编辑模式下）
  if (gameStore.mode === "EDIT") {
    const key = e.key;
    if (key >= "1" && key <= "9") {
      const colorIndex = Number.parseInt(key, 10) - 1; // '1' -> 0, '2' -> 1, ...
      if (colorIndex >= 0 && colorIndex < gameStore.paletteColors.length) {
        e.preventDefault();
        gameStore.setSelectedColorIndex(colorIndex);
      }
    }
  }
};

const onKeyUp = (e: KeyboardEvent) => {
  if (e.code === "Space") {
    e.preventDefault();
    gameStore.setSpaceHeld(false);
  }
};

onMounted(() => {
  gameStore.loadEditStateOrInit();
  globalThis.addEventListener("keydown", onKeyDown);
  globalThis.addEventListener("keyup", onKeyUp);
});

onUnmounted(() => {
  globalThis.removeEventListener("keydown", onKeyDown);
  globalThis.removeEventListener("keyup", onKeyUp);
  gameStore.cleanup();
});
</script>

<style scoped>
.game-container {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: sans-serif;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}

/* 游戏 Board + 侧边栏 组合，中间无间隙，整体居中，高度随内容 */
.game-main {
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  align-items: flex-start;
  gap: 0;
}

.board-area {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
  overflow: hidden;
  align-self: center;
}

/* 右侧：状态 + 控制，统一一列，内容过长可滚动 */
.right-sidebar {
  width: 320px;
  flex-shrink: 0;
  max-height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f5f5;
  border-left: 1px solid #ddd;
  gap: 24px;
  overflow-y: auto;
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
  padding-bottom: 24px;
}

.mode-switch {
  display: flex;
  flex-direction: row;
  gap: 0;
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #ccc;
}

.mode-btn {
  flex: 1;
  padding: 10px 16px;
  font-size: 0.95rem;
  border: none;
  background: #eee;
  color: #555;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.mode-btn:first-child {
  border-right: 1px solid #ccc;
}

.mode-btn:hover:not(.active) {
  background: #e0e0e0;
  color: #333;
}

.mode-btn.active {
  background: #4ecdc4;
  color: white;
  font-weight: 600;
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
  color: #4ecdc4;
  font-weight: 600;
}

button {
  padding: 8px 16px;
  background-color: #4ecdc4;
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
