import type { GameGrid } from './GameGrid'
import type { Solution } from './solver'

/**
 * 游戏数据格式：包含初始状态和最优解
 */
export interface GameData {
  // 游戏元数据
  id: string // 游戏ID（文件名，如 "01", "02"）
  name?: string // 游戏名称（可选）
  
  // 初始游戏状态
  initialGrid: GameGrid
  
  // 最优解（可选，如果已求解）
  solution?: Solution
}

/**
 * 游戏列表项（用于选择界面）
 */
export interface GameListItem {
  id: string
  name: string
  hasSolution: boolean
  solutionSteps?: number
}
