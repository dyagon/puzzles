<template>
  <div class="color-palette">
    <!-- 编辑模式：当前调色板 + 打开弹窗按钮 -->
    <div v-if="canEdit" class="color-edit-row">
      <button type="button" class="open-picker-btn" @click="showPicker = true">
        选择颜色 ({{ colors.length }})
      </button>
    </div>

    <div class="color-palette-items">
      <!-- 空白选项 -->
      <div
        :class="['color-swatch', 'empty-swatch', { active: selectedColorIndex === EMPTY_SELECTION_INDEX }]"
        :title="'空白：点击选中，可将区域填为空白（不参与连通）'"
        @click="handleEmptyClick"
      >
        <span class="empty-icon">∅</span>
      </div>
      <template v-for="(color, index) in colors" :key="index">
        <div
          :style="{ backgroundColor: color }"
          :class="['color-swatch', { active: selectedColorIndex === index }]"
          @click="handleColorClick(index)"
          :title="`颜色 ${index + 1} (按 ${index + 1} 键选择)`"
        />
      </template>
    </div>

    <!-- 颜色选择弹窗 -->
    <Teleport to="body">
      <div v-if="showPicker" class="picker-overlay" @click.self="closePicker">
        <div class="picker-modal">
          <div class="picker-title">选择使用的颜色（至少 1 个）</div>
          <div class="picker-list">
            <label
              v-for="(hex, i) in DEFAULT_COLORS"
              :key="i"
              class="picker-item"
              :class="{ disabled: isOnlySelected(hex) }"
            >
              <input
                type="checkbox"
                :checked="selectedSet.has(hex)"
                :disabled="isOnlySelected(hex)"
                @change="toggleColor(hex)"
              />
              <span class="picker-swatch" :style="{ backgroundColor: hex }"></span>
            </label>
          </div>
          <div class="picker-actions">
            <button type="button" class="picker-btn cancel" @click="closePicker">取消</button>
            <button type="button" class="picker-btn confirm" @click="applySelection">确定</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useGameStore, EMPTY_SELECTION_INDEX, DEFAULT_COLORS } from '../stores/gameStore'

const gameStore = useGameStore()

const canEdit = computed(() => gameStore.mode === 'EDIT')
const colors = computed(() => gameStore.paletteColors)
const selectedColorIndex = computed(() => gameStore.selectedColorIndex)

const showPicker = ref(false)
/** 弹窗内当前勾选集合（hex 字符串），与 palette 同步 */
const selectedSet = ref<Set<string>>(new Set())

watch(showPicker, (open) => {
  if (open) {
    selectedSet.value = new Set(gameStore.paletteColors)
  }
})

/** 当前仅剩该颜色被选中时，不可取消勾选 */
function isOnlySelected(hex: string): boolean {
  return selectedSet.value.has(hex) && selectedSet.value.size === 1
}

function toggleColor(hex: string) {
  const next = new Set(selectedSet.value)
  if (next.has(hex)) {
    if (next.size <= 1) return
    next.delete(hex)
  } else {
    next.add(hex)
  }
  selectedSet.value = next
}

function applySelection() {
  const list = [...DEFAULT_COLORS].filter((c) => selectedSet.value.has(c))
  if (list.length < 1) return
  gameStore.setPaletteFromSelection(list)
  showPicker.value = false
}

function closePicker() {
  showPicker.value = false
}

const handleEmptyClick = () => {
  gameStore.setSelectedColorIndex(EMPTY_SELECTION_INDEX)
}

const handleColorClick = (index: number) => {
  gameStore.setSelectedColorIndex(index)
}
</script>

<style scoped>
.color-palette {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.color-edit-row {
  display: flex;
  align-items: center;
}

.open-picker-btn {
  padding: 8px 14px;
  font-size: 0.9rem;
  background: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.open-picker-btn:hover {
  background: #e0e0e0;
}

.color-palette-items {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
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

.empty-swatch {
  background: repeating-linear-gradient(
    45deg,
    #ddd,
    #ddd 4px,
    #fff 4px,
    #fff 8px
  );
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #999;
}

.empty-swatch.active {
  border-color: #333;
  border-width: 3px;
}

.empty-icon {
  font-size: 18px;
  color: #666;
  font-weight: bold;
}

/* 弹窗 */
.picker-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.picker-modal {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  min-width: 280px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.picker-title {
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.picker-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid #eee;
}

.picker-item:hover:not(.disabled) {
  background: #f5f5f5;
}

.picker-item.disabled {
  opacity: 0.8;
  cursor: not-allowed;
}

.picker-item input {
  cursor: pointer;
}

.picker-item.disabled input {
  cursor: not-allowed;
}

.picker-swatch {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #ccc;
  flex-shrink: 0;
}

.picker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.picker-btn {
  padding: 8px 18px;
  font-size: 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  transition: background 0.2s;
}

.picker-btn.cancel {
  background: #eee;
  color: #333;
}

.picker-btn.cancel:hover {
  background: #ddd;
}

.picker-btn.confirm {
  background: #4ecdc4;
  color: white;
}

.picker-btn.confirm:hover {
  background: #3db8ab;
}
</style>
