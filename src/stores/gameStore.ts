import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { buildGameState } from '../core/calculate'
import { solve, type Solution, getRegionCells } from '../core/solver'
import type { GameGrid } from '../core/GameGrid'
import { ROWS, COLS, COLORS } from '../core/constants'
import { createGameGrid, cloneGameGrid } from '../core/gameGridUtils'
import { saveGameToDefault, loadGameFromDefault, listAllGames } from '../utils/gameStorage'
import type { GameListItem } from '../core/gameData'

export const useGameStore = defineStore('game', () => {
  // 游戏模式
  const mode = ref<'EDIT' | 'PLAY'>('EDIT')
  
  // 颜色选择（使用索引）
  const selectedColorIndex = ref<number>(0)
  
  // 空格键状态
  const spaceHeld = ref(false)
  
  // 游戏状态
  const gameGrid = ref<GameGrid | null>(null)
  const stepCount = ref(0)
  
  // 求解器状态
  const solution = ref<Solution | null>(null)
  const solving = ref(false)
  const selectedStepIndex = ref<number | null>(null)
  const highlightCells = ref<Array<{ r: number; c: number; color: string }>>([])
  const initialGameGridForSolution = ref<GameGrid | null>(null)
  const isBlinking = ref(false)
  let blinkTimer: number | null = null
  
  // 游戏列表状态
  const gameList = ref<GameListItem[]>([])
  const loadingGames = ref(false)
  const currentGameId = ref<string | null>(null)
  
  // 计算属性
  const regionCount = computed(() => {
    if (mode.value === 'EDIT' || !gameGrid.value) {
      return '-'
    }
    return buildGameState(gameGrid.value).count
  })
  
  // 获取当前选中的颜色字符串（用于向后兼容）
  const selectedColor = computed(() => {
    if (!gameGrid.value) return COLORS[0]
    return gameGrid.value.colors[selectedColorIndex.value] || COLORS[0]
  })
  
  // Actions
  const setMode = (newMode: 'EDIT' | 'PLAY') => {
    mode.value = newMode
  }
  
  const setSelectedColorIndex = (index: number) => {
    if (gameGrid.value && index >= 0 && index < gameGrid.value.colors.length) {
      selectedColorIndex.value = index
    }
  }
  
  const setSelectedColor = (color: string) => {
    const index = gameGrid.value?.colors.indexOf(color)
    if (index !== undefined && index >= 0) {
      selectedColorIndex.value = index
    }
  }
  
  const setSpaceHeld = (held: boolean) => {
    spaceHeld.value = held
  }
  
  const setGameGrid = (newGameGrid: GameGrid) => {
    gameGrid.value = newGameGrid
  }
  
  const incrementStepCount = () => {
    stepCount.value++
  }
  
  const resetStepCount = () => {
    stepCount.value = 0
  }
  
  // 初始化网格
  const initGrid = () => {
    gameGrid.value = createGameGrid(ROWS, COLS, COLORS, 0)
    stepCount.value = 0
    selectedStepIndex.value = null
    highlightCells.value = []
    initialGameGridForSolution.value = null
    selectedColorIndex.value = 0
    
    // 清除闪烁定时器
    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    isBlinking.value = false
  }
  
  // 求解函数
  const solvePuzzle = () => {
    if (!gameGrid.value) return
    
    solving.value = true
    solution.value = null
    selectedStepIndex.value = null
    highlightCells.value = []
    
    // 清除之前的闪烁定时器
    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    isBlinking.value = false
    
    // 保存当前 gameGrid 状态作为求解的初始状态
    initialGameGridForSolution.value = cloneGameGrid(gameGrid.value)
    
    // 使用setTimeout让UI更新，然后执行求解
    setTimeout(() => {
      try {
        const result = solve(gameGrid.value!)
        solution.value = result
        
        if (result) {
          console.log('=== 求解结果 ===')
          console.log(`最少步骤数：${result.steps}`)
          console.log('解决方案：')
          result.path.forEach((step, index) => {
            console.log(`${index + 1}. ${step.description}`)
          })
          console.log('===============')
        } else {
          console.log('未找到解决方案（可能超过最大搜索深度）')
        }
      } catch (error) {
        console.error('求解过程中出错：', error)
      } finally {
        solving.value = false
      }
    }, 100)
  }
  
  // 选择步骤并高亮对应的区域（闪烁几次后自动消失）
  const selectStep = (index: number) => {
    if (!solution.value?.path[index] || !initialGameGridForSolution.value) return
    
    // 清除之前的闪烁定时器
    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    
    selectedStepIndex.value = index
    const step = solution.value.path[index]
    
    // 使用求解时的初始 gameGrid 状态来计算区域（因为解决方案是基于初始状态的）
    const regionCells = getRegionCells(
      initialGameGridForSolution.value, 
      step.region.c, 
      step.region.r
    )
    
    // 设置高亮信息（使用步骤的目标颜色作为边框颜色）
    highlightCells.value = regionCells.map(cell => ({
      r: cell.r,
      c: cell.c,
      color: step.color
    }))
    
    // 开始闪烁效果
    isBlinking.value = true
    let blinkCount = 1 // 从1开始，因为已经显示了第一次
    const maxBlinks = 6 // 闪烁6次（3次完整循环：显示-隐藏-显示-隐藏-显示-隐藏）
    const blinkInterval = 300 // 每次闪烁间隔300ms
    
    // 第一次已经显示，从第二次开始定时闪烁
    blinkTimer = globalThis.setInterval(() => {
      blinkCount++
      
      if (blinkCount % 2 === 0) {
        // 偶数次：显示高亮
        highlightCells.value = regionCells.map(cell => ({
          r: cell.r,
          c: cell.c,
          color: step.color
        }))
      } else {
        // 奇数次：隐藏高亮
        highlightCells.value = []
      }
      
      if (blinkCount >= maxBlinks) {
        // 闪烁完成，清除高亮和定时器
        if (blinkTimer !== null) {
          clearInterval(blinkTimer)
        }
        blinkTimer = null
        highlightCells.value = []
        isBlinking.value = false
        selectedStepIndex.value = null
      }
    }, blinkInterval)
  }
  
  // 清理函数
  const cleanup = () => {
    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    isBlinking.value = false
  }
  
  // 保存游戏（编辑模式）
  const saveGame = async () => {
    if (!gameGrid.value) return
    
    try {
      const savedId = await saveGameToDefault(gameGrid.value, solution.value || undefined)
      // 刷新游戏列表
      await refreshGameList()
      return savedId
    } catch (error) {
      console.error('保存游戏失败:', error)
      throw error
    }
  }
  
  // 加载游戏列表
  const refreshGameList = async () => {
    loadingGames.value = true
    try {
      gameList.value = await listAllGames()
    } catch (error) {
      console.error('加载游戏列表失败:', error)
    } finally {
      loadingGames.value = false
    }
  }
  
  // 加载游戏（游戏模式）
  const loadGame = async (gameId: string) => {
    try {
      const gameData = await loadGameFromDefault(gameId)
      if (!gameData) {
        throw new Error(`游戏 ${gameId} 不存在`)
      }
      
      // 加载初始状态
      gameGrid.value = cloneGameGrid(gameData.initialGrid)
      stepCount.value = 0
      currentGameId.value = gameId
      
      // 如果有最优解，加载它
      if (gameData.solution) {
        solution.value = gameData.solution
        // 保存初始状态用于显示步骤
        initialGameGridForSolution.value = cloneGameGrid(gameData.initialGrid)
      } else {
        solution.value = null
        initialGameGridForSolution.value = null
      }
      
      // 清除高亮
      selectedStepIndex.value = null
      highlightCells.value = []
      if (blinkTimer !== null) {
        clearInterval(blinkTimer)
        blinkTimer = null
      }
      isBlinking.value = false
      
      return gameData
    } catch (error) {
      console.error(`加载游戏 ${gameId} 失败:`, error)
      throw error
    }
  }
  
  return {
    // State
    mode,
    selectedColorIndex,
    selectedColor, // 计算属性，向后兼容
    spaceHeld,
    gameGrid,
    stepCount,
    solution,
    solving,
    selectedStepIndex,
    highlightCells,
    isBlinking,
    gameList,
    loadingGames,
    currentGameId,
    
    // Computed
    regionCount,
    
    // Actions
    setMode,
    setSelectedColorIndex,
    setSelectedColor, // 向后兼容
    setSpaceHeld,
    setGameGrid,
    incrementStepCount,
    resetStepCount,
    initGrid,
    solvePuzzle,
    selectStep,
    cleanup,
    saveGame,
    refreshGameList,
    loadGame
  }
})
