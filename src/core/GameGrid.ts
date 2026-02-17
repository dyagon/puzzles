// --- 2. 数据结构定义 ---
export interface Cell {
  r: number
  c: number
  colorIndex: number // 使用颜色索引而不是颜色字符串
}

// GameGrid 数据结构：包含元数据和 cells
export interface GameGrid {
  rows: number
  cols: number
  colors: readonly string[] // 颜色数组（元数据，不变）
  cells: Cell[][] // 二维数组，cells[col][row]
}
  