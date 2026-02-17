import { buildGameState } from './calculate'
import { getNeighbors } from './draw'
import type { GameGrid } from './GameGrid'
import { cloneGameGrid } from './gameGridUtils'

/**
 * 获取 GameGrid 的状态字符串（用于去重）
 */
const getStateKey = (gameGrid: GameGrid): string => {
  return gameGrid.cells.map(col => col.map(cell => cell.colorIndex).join(',')).join('|')
}

/**
 * Flood fill操作：将指定位置所在的联通区域染成新颜色索引
 */
const floodFill = (
  gameGrid: GameGrid,
  startC: number,
  startR: number,
  newColorIndex: number
): GameGrid => {
  const newGameGrid = cloneGameGrid(gameGrid)
  const oldColorIndex = newGameGrid.cells[startC][startR].colorIndex
  
  if (oldColorIndex === newColorIndex) {
    return newGameGrid
  }
  
  const queue = [{ r: startR, c: startC }]
  const visited = new Set<string>()
  
  newGameGrid.cells[startC][startR].colorIndex = newColorIndex
  visited.add(`${startR},${startC}`)
  
  while (queue.length > 0) {
    const curr = queue.shift()!
    const neighbors = getNeighbors(curr.r, curr.c)
    
    for (const n of neighbors) {
      const nKey = `${n.r},${n.c}`
      if (visited.has(nKey)) continue
      
      if (n.c < 0 || n.c >= gameGrid.cols || n.r < 0 || n.r >= gameGrid.rows) continue
      if (!newGameGrid.cells[n.c]?.[n.r]) continue
      
      const cell = newGameGrid.cells[n.c][n.r]
      if (cell.colorIndex === oldColorIndex) {
        cell.colorIndex = newColorIndex
        visited.add(nKey)
        queue.push(n)
      }
    }
  }
  
  return newGameGrid
}

/**
 * 获取所有联通区域的代表点（每个区域取第一个点）
 */
const getRegionRepresentatives = (gameGrid: GameGrid): { r: number; c: number }[] => {
  const uf = buildGameState(gameGrid)
  const representatives = new Map<number, { r: number; c: number }>()
  const { rows, cols } = gameGrid
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c
      const root = uf.find(idx)
      
      if (!representatives.has(root)) {
        representatives.set(root, { r, c })
      }
    }
  }
  
  return Array.from(representatives.values())
}

/**
 * 获取指定位置所在区域的所有 cell 坐标
 */
export const getRegionCells = (
  gameGrid: GameGrid,
  startC: number,
  startR: number
): { r: number; c: number }[] => {
  const cells: { r: number; c: number }[] = []
  const targetColorIndex = gameGrid.cells[startC][startR].colorIndex
  const queue = [{ r: startR, c: startC }]
  const visited = new Set<string>()
  
  visited.add(`${startR},${startC}`)
  cells.push({ r: startR, c: startC })
  
  while (queue.length > 0) {
    const curr = queue.shift()!
    const neighbors = getNeighbors(curr.r, curr.c)
    
    for (const n of neighbors) {
      const nKey = `${n.r},${n.c}`
      if (visited.has(nKey)) continue
      
      if (n.c < 0 || n.c >= gameGrid.cols || n.r < 0 || n.r >= gameGrid.rows) continue
      if (!gameGrid.cells[n.c]?.[n.r]) continue
      
      const cell = gameGrid.cells[n.c][n.r]
      if (cell.colorIndex === targetColorIndex) {
        visited.add(nKey)
        cells.push({ r: n.r, c: n.c })
        queue.push(n)
      }
    }
  }
  
  return cells
}

/**
 * 求解器：使用DFS找到最少步骤（带回溯和剪枝）
 */
export interface Solution {
  steps: number
  path: Array<{
    region: { r: number; c: number }
    color: string
    description: string
  }>
}

/**
 * DFS求解器（带回溯和剪枝）
 */
export const solve = (initialGameGrid: GameGrid): Solution | null => {
  // 检查初始状态
  const initialState = buildGameState(initialGameGrid)
  if (initialState.count === 1) {
    return { steps: 0, path: [] }
  }
  
  // 最优解（用于剪枝）
  let bestSolution: Solution | null = null
  const MAX_DEPTH = 20 // 最大搜索深度限制
  
  // 当前路径中访问过的状态（用于避免循环）
  const currentPathStates = new Set<string>()
  
  /**
   * 检查是否应该剪枝
   */
  const shouldPrune = (
    steps: number,
    regionCount: number,
    stateKey: string
  ): boolean => {
    // 剪枝1: 如果已经超过最大深度
    if (steps >= MAX_DEPTH) {
      return true
    }
    
    // 剪枝2: 如果当前步数已经超过已知最优解
    if (bestSolution !== null && steps >= bestSolution.steps) {
      return true
    }
    
    // 剪枝3: 启发式剪枝 - 如果剩余区域数-1 > 剩余步骤数，不可能完成
    const remainingSteps = MAX_DEPTH - steps
    if (regionCount - 1 > remainingSteps) {
      return true
    }
    
    // 剪枝4: 如果当前状态在当前路径中已经访问过（避免循环）
    if (currentPathStates.has(stateKey)) {
      return true
    }
    
    return false
  }
  
  /**
   * 更新最优解
   */
  const updateBestSolution = (steps: number, path: Solution['path']): void => {
    if (bestSolution === null || steps < bestSolution.steps) {
      bestSolution = {
        steps,
        path: [...path] // 深拷贝路径
      }
    }
  }
  
  /**
   * DFS递归函数
   * @param gameGrid 当前网格状态
   * @param steps 当前已用步数
   * @param path 当前路径
   */
  const dfs = (
    gameGrid: GameGrid,
    steps: number,
    path: Solution['path']
  ): void => {
    const currentState = buildGameState(gameGrid)
    const stateKey = getStateKey(gameGrid)
    
    // 检查是否达到目标（联通区域数为1）
    if (currentState.count === 1) {
      updateBestSolution(steps, path)
      return
    }
    
    // 剪枝检查
    if (shouldPrune(steps, currentState.count, stateKey)) {
      return
    }
    
    // 将当前状态加入路径（用于回溯）
    currentPathStates.add(stateKey)
    
    // 获取所有联通区域的代表点
    const regions = getRegionRepresentatives(gameGrid)
    
    // 对每个联通区域，尝试所有可能的颜色索引
    for (const region of regions) {
      const currentColorIndex = gameGrid.cells[region.c][region.r].colorIndex
      
      // 尝试所有颜色索引（除了当前颜色索引）
      for (let newColorIndex = 0; newColorIndex < gameGrid.colors.length; newColorIndex++) {
        if (newColorIndex === currentColorIndex) continue
        
        // 剪枝5: 如果当前步数+1已经超过已知最优解，跳过
        if (bestSolution !== null && steps + 1 >= bestSolution.steps) {
          continue
        }
        
        // 执行flood fill（创建新状态）
        const nextGameGrid = floodFill(gameGrid, region.c, region.r, newColorIndex)
        const nextStateKey = getStateKey(nextGameGrid)
        
        // 剪枝6: 如果新状态在当前路径中已经访问过，跳过
        if (currentPathStates.has(nextStateKey)) {
          continue
        }
        
        // 获取颜色字符串用于显示
        const colorString = gameGrid.colors[newColorIndex]
        
        // 构建新的路径步骤
        const nextStep = {
          region,
          color: colorString,
          description: `步骤 ${steps + 1}: 将位置(${region.r}, ${region.c})所在的区域染成 ${colorString}`
        }
        
        // 递归搜索
        dfs(nextGameGrid, steps + 1, [...path, nextStep])
      }
    }
    
    // 回溯：从当前路径中移除当前状态
    currentPathStates.delete(stateKey)
  }
  
  // 开始DFS搜索
  dfs(cloneGameGrid(initialGameGrid), 0, [])
  
  return bestSolution
}
