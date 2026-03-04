import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'
import { GameGrid, EMPTY_COLOR_INDEX } from '../core/GameGrid'
import { type Solution } from '../core/GraphSolver'
import { SolverClient } from '../core/SolverClient'
import { GraphBuilder } from '../core/GraphBuilder'

/** 选中空白时的 selectedColorIndex 值 */
export const EMPTY_SELECTION_INDEX = -1

// 初始化网格所需常量
export const VSIDE_ROWS = 14
export const COLS = 10
/** 编辑模式下默认颜色数量（可增删，至少 1 个） */
export const DEFAULT_COLORS = [
  '#CDBBA6', '#58ACB1', '#326E77', '#A52343', '#D4A329',
'#33332F', '#D9C29F', '#118E71', '#B82A30', '#888682',
'#C16A29', '#D1A500', '#7B9824', '#355027', '#90C1C0',
'#493B2F', '#B6462A', '#78B7B1', '#C58733', '#C8B29C' ] as const
/** 向后兼容：若 grid 未加载则 fallback */
export const COLORS = DEFAULT_COLORS

const EDIT_STORAGE_KEY = 'kami2-edit-grid'

const solverClient = new SolverClient()

export const useGameStore = defineStore('game', () => {
  // 游戏模式：EDIT 编辑 / PLAY 测试
  const mode = ref<'EDIT' | 'PLAY'>('EDIT')

  // 颜色选择（使用索引）
  const selectedColorIndex = ref<number>(0)

  /** 调色板颜色表（全局状态），与 gameGrid.colorCount 一致；grid 中索引对应此数组下标 */
  const paletteColors = ref<string[]>([])

  // 空格键状态
  const spaceHeld = ref(false)

  // 游戏状态
  const gameGrid = ref<GameGrid | null>(null)
  const stepCount = ref(0)

  // 求解器状态
  const solution = ref<Solution | null>(null)
  /** 求解结果元数据：孤岛数、联通区域数、解法名称 */
  const solutionMetadata = ref<{ islandCount: number; regionCount: number; method: string } | null>(null)
  /** 步骤1 构建图后的图信息（用于 UI 显示） */
  const graphInfo = ref<{ islandCount: number; regionCount: number; perIslandSizes: number[] } | null>(null)
  /** 当前求解阶段：idle | building | solving | done */
  const solvePhase = ref<'idle' | 'building' | 'solving' | 'done'>('idle')
  const solving = ref(false)
  const selectedStepIndex = ref<number | null>(null)
  const highlightCells = ref<Array<{ r: number; c: number; color: string }>>([])
  const initialGameGridForSolution = ref<GameGrid | null>(null)
  const isBlinking = ref(false)
  let blinkTimer: ReturnType<typeof setInterval> | null = null
  let editGraphInfoTimer: ReturnType<typeof setTimeout> | null = null

  // 计算属性
  const regionCount = computed(() => {
    if (mode.value === 'EDIT' || !gameGrid.value) {
      return '-'
    }
    return gameGrid.value.getRegionCells(0, 0).length
  })
  
  // 获取当前选中的颜色字符串（用于向后兼容），空白返回特殊标记
  const selectedColor = computed(() => {
    if (selectedColorIndex.value === EMPTY_SELECTION_INDEX) return 'transparent'
    const pal = paletteColors.value
    if (!pal.length) return DEFAULT_COLORS[0]
    return pal[selectedColorIndex.value] ?? pal[0]
  })

  /** 获取用于网格的实际颜色索引（空白选择转换为 EMPTY_COLOR_INDEX） */
  const selectedColorIndexForGrid = computed(() => {
    return selectedColorIndex.value === EMPTY_SELECTION_INDEX 
      ? EMPTY_COLOR_INDEX 
      : selectedColorIndex.value
  })

  /** 从 localStorage 读取编辑状态，无效或不存在返回 null；会设置 paletteColors */
  const loadEditState = (): GameGrid | null => {
    try {
      const raw = localStorage.getItem(EDIT_STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw) as { rows: number; cols: number; colors?: string[]; colorCount?: number; grid: number[][] }
      if (!data?.grid?.length) return null
      const colors = data.colors && data.colors.length > 0 ? data.colors : [...DEFAULT_COLORS]
      paletteColors.value = colors
      return GameGrid.fromJSON(data)
    } catch {
      return null
    }
  }

  /** 将当前编辑状态写入 localStorage（含调色板与 grid） */
  const saveEditState = () => {
    if (mode.value !== 'EDIT' || !gameGrid.value) return
    try {
      const payload = { ...gameGrid.value.toJSON(), colors: paletteColors.value }
      localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // ignore
    }
  }

  /** 进入编辑模式时：优先从 localStorage 恢复，否则初始化新网格 */
  const loadEditStateOrInit = () => {
    const loaded = loadEditState()
    if (loaded) {
      gameGrid.value = markRaw(loaded)
      stepCount.value = 0
      solution.value = null
      selectedStepIndex.value = null
      highlightCells.value = []
      initialGameGridForSolution.value = null
      solutionMetadata.value = null
      graphInfo.value = null
      if (blinkTimer !== null) {
        clearInterval(blinkTimer)
        blinkTimer = null
      }
      isBlinking.value = false
    } else {
      initGrid()
    }
  }

  // Actions
  const setMode = (newMode: 'EDIT' | 'PLAY') => {
    mode.value = newMode
    if (newMode === 'EDIT') {
      loadEditStateOrInit()
      // 编辑模式下，如果已有 grid，立即计算图信息
      if (gameGrid.value) {
        if (editGraphInfoTimer !== null) {
          clearTimeout(editGraphInfoTimer)
        }
        editGraphInfoTimer = globalThis.setTimeout(() => {
          if (gameGrid.value && mode.value === 'EDIT') {
            try {
              const builder = new GraphBuilder(gameGrid.value, EMPTY_COLOR_INDEX)
              const islands = builder.buildIslands()
              const islandCount = islands.length
              const regionCount = islands.reduce((sum, isl) => sum + isl.size, 0)
              const perIslandSizes = islands.map((isl) => isl.size)
              graphInfo.value = { islandCount, regionCount, perIslandSizes }
            } catch (error) {
              console.error('计算图信息失败：', error)
              graphInfo.value = null
            }
          }
          editGraphInfoTimer = null
        }, 200)
      }
    } else {
      // 切换到测试模式时，清除编辑模式的图信息
      if (editGraphInfoTimer !== null) {
        clearTimeout(editGraphInfoTimer)
        editGraphInfoTimer = null
      }
      graphInfo.value = null
    }
  }
  
  const setSelectedColorIndex = (index: number) => {
    // 允许选择空白（EMPTY_SELECTION_INDEX）或有效颜色索引
    if (index === EMPTY_SELECTION_INDEX || (index >= 0 && index < paletteColors.value.length)) {
      selectedColorIndex.value = index
    }
  }

  const setSelectedColor = (color: string) => {
    const index = paletteColors.value.indexOf(color)
    if (index >= 0) selectedColorIndex.value = index
  }
  
  const setSpaceHeld = (held: boolean) => {
    spaceHeld.value = held
  }
  
  const setGameGrid = (newGameGrid: GameGrid) => {
    gameGrid.value = markRaw(newGameGrid)
    saveEditState()
    
    // 编辑模式下，实时计算图信息（防抖200ms）
    if (mode.value === 'EDIT') {
      if (editGraphInfoTimer !== null) {
        clearTimeout(editGraphInfoTimer)
      }
      editGraphInfoTimer = globalThis.setTimeout(() => {
        if (newGameGrid && mode.value === 'EDIT') {
          try {
            const builder = new GraphBuilder(newGameGrid, EMPTY_COLOR_INDEX)
            const islands = builder.buildIslands()
            const islandCount = islands.length
            const regionCount = islands.reduce((sum, isl) => sum + isl.size, 0)
            const perIslandSizes = islands.map((isl) => isl.size)
            graphInfo.value = { islandCount, regionCount, perIslandSizes }
          } catch (error) {
            console.error('计算图信息失败：', error)
            graphInfo.value = null
          }
        }
        editGraphInfoTimer = null
      }, 200)
    }
  }


  /** 从候选颜色（如 DEFAULT_COLORS）中勾选得到新调色板，至少保留 1 色；会重映射网格 */
  const setPaletteFromSelection = (selectedColors: string[]) => {
    if (mode.value !== 'EDIT' || selectedColors.length < 1) return
    const oldPal = [...paletteColors.value]
    paletteColors.value = [...selectedColors]
    const newCount = selectedColors.length
    if (gameGrid.value) {
      const grid = gameGrid.value.grid.map(row =>
        row.map(v => {
          const oldHex = oldPal[v]
          const newIdx = selectedColors.indexOf(oldHex)
          return newIdx >= 0 ? newIdx : 0
        })
      )
      gameGrid.value = markRaw(
        new GameGrid(
          gameGrid.value.vside_rows,
          gameGrid.value.cols,
          newCount,
          grid
        )
      )
    }
    if (selectedColorIndex.value >= newCount) {
      selectedColorIndex.value = newCount - 1
    }
    saveEditState()
  }

  const incrementStepCount = () => {
    stepCount.value++
  }
  
  const resetStepCount = () => {
    stepCount.value = 0
  }
  
  // 初始化网格（重置画布，至少 1 色，默认使用第一个颜色填充）
  const initGrid = () => {
    paletteColors.value = [...DEFAULT_COLORS]
    // 创建网格，所有格子初始化为颜色索引 0（第一个颜色）
    const initialGrid = Array.from({ length: 2 * VSIDE_ROWS + 1 }, () =>
      Array.from({ length: COLS }, () => 0)
    )
    gameGrid.value = markRaw(new GameGrid(VSIDE_ROWS, COLS, paletteColors.value.length, initialGrid))
    stepCount.value = 0
    selectedStepIndex.value = null
    highlightCells.value = []
    initialGameGridForSolution.value = null
    selectedColorIndex.value = 0
    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    isBlinking.value = false
    saveEditState()
  }
  
  // 求解函数：使用 Worker 异步求解，进度通过 SolverClient 直接打印并更新 UI
  const solvePuzzle = async () => {
    if (!gameGrid.value) return

    solving.value = true
    solvePhase.value = 'building'
    solution.value = null
    solutionMetadata.value = null
    selectedStepIndex.value = null
    highlightCells.value = []
    graphInfo.value = null

    if (blinkTimer !== null) {
      clearInterval(blinkTimer)
      blinkTimer = null
    }
    isBlinking.value = false

    initialGameGridForSolution.value = markRaw(gameGrid.value.clone())

    try {
      const result = await solverClient.solve(gameGrid.value, {
        voidColorIndex: EMPTY_COLOR_INDEX,
        colors: paletteColors.value
      })

      solvePhase.value = 'done'
      solution.value = result.solution
      solutionMetadata.value = result.solutionMetadata
    } catch (error) {
      console.error('求解过程中出错：', error)
      solution.value = null
      solutionMetadata.value = null
    } finally {
      solving.value = false
      solvePhase.value = 'idle'
    }
  }

  // 终止求解
  const terminateSolve = () => {
    solverClient.terminate()
    solving.value = false
    solvePhase.value = 'idle'
    // 不清除 graphInfo，保留已构建的图信息
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
    const regionCells = initialGameGridForSolution.value.getRegionCells(
      step.region.r,
      step.region.c
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
    if (editGraphInfoTimer !== null) {
      clearTimeout(editGraphInfoTimer)
      editGraphInfoTimer = null
    }
    isBlinking.value = false
  }

    return {
    // State
    mode,
    selectedColorIndex,
    selectedColor,
    selectedColorIndexForGrid,
    paletteColors,
    spaceHeld,
    gameGrid,
    stepCount,
    solution,
    solutionMetadata,
    graphInfo,
    solvePhase,
    solving,
    selectedStepIndex,
    highlightCells,
    isBlinking,

    // Computed
    regionCount,

    // Actions
    setMode,
    setSelectedColorIndex,
    setSelectedColor,
    setSpaceHeld,
    setGameGrid,
    setPaletteFromSelection,
    incrementStepCount,
    resetStepCount,
    initGrid,
    loadEditStateOrInit,
    solvePuzzle,
    terminateSolve,
    selectStep,
    cleanup
  }
})
