import type { Cell, GameGrid } from './GameGrid'
import { ROWS, COLS, COLORS } from './constants'

/**
 * 创建初始化的 GameGrid
 */
export const createGameGrid = (
  rows: number = ROWS,
  cols: number = COLS,
  colors: readonly string[] = COLORS,
  baseColorIndex: number = 0
): GameGrid => {
  const cells: Cell[][] = []
  for (let c = 0; c < cols; c++) {
    const col: Cell[] = []
    for (let r = 0; r < rows; r++) {
      col.push({ r, c, colorIndex: baseColorIndex })
    }
    cells.push(col)
  }
  
  return {
    rows,
    cols,
    colors: [...colors], // 复制数组
    cells
  }
}

/**
 * 根据 GameGrid 获取 Cell 的颜色字符串
 */
export const getCellColor = (gameGrid: GameGrid, cell: Cell): string => {
  return gameGrid.colors[cell.colorIndex] || gameGrid.colors[0]
}

/**
 * 根据 GameGrid 和坐标获取颜色字符串
 */
export const getColorAt = (gameGrid: GameGrid, r: number, c: number): string => {
  const cell = gameGrid.cells[c]?.[r]
  if (!cell) return gameGrid.colors[0]
  return gameGrid.colors[cell.colorIndex] || gameGrid.colors[0]
}

/**
 * 深拷贝 GameGrid
 */
export const cloneGameGrid = (gameGrid: GameGrid): GameGrid => {
  return {
    rows: gameGrid.rows,
    cols: gameGrid.cols,
    colors: [...gameGrid.colors],
    cells: gameGrid.cells.map(col => col.map(cell => ({ ...cell })))
  }
}
