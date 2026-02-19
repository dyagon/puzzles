
// 几何常数
export const SIDE_A = 56 // 边长 a (像素)
export const HALF_A = SIDE_A / 2 // 半宽 (水平步进单位)
export const TRI_H = (Math.sqrt(3) / 2) * SIDE_A // 高 h

/** 空白颜色索引：-1 表示空白，空白区域不参与连通性计算 */
export const EMPTY_COLOR_INDEX = -1


/**
 * 游戏网格：使用二维数组存储 colorIndex（索引 < colorCount），不保存颜色表，颜色数量由全局状态决定。
 */
export class GameGrid {
  readonly vside_rows: number
  readonly rows: number
  readonly height: number
  readonly cols: number
  /** 颜色数量，由全局状态（调色板）决定；grid 中索引均小于此值 */
  readonly colorCount: number
  /** grid[row][col] = colorIndex，唯一会修改处为 floodFill */
  grid: number[][]

  constructor(
    vside_rows: number,
    cols: number,
    colorCount: number,
    grid?: number[][]
  ) {
    this.vside_rows = vside_rows
    this.rows = 2 * vside_rows + 1
    this.height = vside_rows * SIDE_A
    this.cols = cols
    this.colorCount = Math.max(1, colorCount)
    this.grid = grid ?? Array.from({ length: this.rows }, () =>
      Array.from({ length: cols }, () => 0)
    )
  }

  /**
   * 计算三角形顶点坐标（SVG points 字符串）
   */
  getTrianglePoints(c: number, r: number): string {
    const startX = c * TRI_H
    let startY = (r - 1) * HALF_A
    const isRight = (r + c) % 2 === 0

    if (r === 0) {
      startY = 0
      if (isRight) {
        return `${startX},${startY} ${startX + TRI_H},${startY} ${startX},${startY + HALF_A}`
      }
      return `${startX},${startY} ${startX + TRI_H},${startY} ${startX + TRI_H},${startY + HALF_A}`
    }
    if (r === this.rows - 1) {
      startY = this.height
      if (isRight) {
        return `${startX},${startY} ${startX},${startY - HALF_A} ${startX + TRI_H},${startY}`
      }
      return `${startX + TRI_H},${startY} ${startX + TRI_H},${startY - HALF_A} ${startX},${startY}`
    }
    if (isRight) {
      return `${startX},${startY} ${startX},${startY + SIDE_A} ${startX + TRI_H},${startY + HALF_A}`
    }
    return `${startX + TRI_H},${startY} ${startX + TRI_H},${startY + SIDE_A} ${startX},${startY + HALF_A}`
  }

  /**
   * 获取 (r, c) 的联通邻居坐标
   */
  getNeighbors(r: number, c: number): { r: number; c: number }[] {
    const neighbors: { r: number; c: number }[] = []
    if (r > 0) neighbors.push({ r: r - 1, c })
    if (r < this.rows - 1) neighbors.push({ r: r + 1, c })
    const isRight = (r + c) % 2 === 0
    if (isRight && c > 0) {
      neighbors.push({ r, c: c - 1 })
    } else if (!isRight && c < this.cols - 1) {
      neighbors.push({ r, c: c + 1 })
    }
    return neighbors
  }

  getColorIndex(r: number, c: number): number {
    return this.grid[r]?.[c] ?? 0
  }

  /** 根据外部颜色表取格子的颜色字符串（颜色表由全局状态提供），空白返回透明 */
  getColorAt(r: number, c: number, colors: readonly string[]): string {
    const idx = this.getColorIndex(r, c)
    if (idx === EMPTY_COLOR_INDEX) return 'transparent'
    return colors[idx] ?? colors[0] ?? '#fff'
  }

  /** 深拷贝 */
  clone(): GameGrid {
    return new GameGrid(
      this.vside_rows,
      this.cols,
      this.colorCount,
      this.grid.map(row => [...row])
    )
  }

  /** 序列化（不包含颜色表，仅 colorCount 与 grid） */
  toJSON(): { rows: number; cols: number; colorCount: number; grid: number[][] } {
    return {
      rows: this.rows,
      cols: this.cols,
      colorCount: this.colorCount,
      grid: this.grid.map(row => [...row])
    }
  }

  /** 从 JSON 反序列化（支持旧格式列优先 grid[col][row]，自动转为行优先） */
  static fromJSON(data: {
    rows: number
    cols: number
    grid: number[][]
    colors?: string[]
    colorCount?: number
  }): GameGrid {
    const vside_rows = (data.rows - 1) >> 1
    const colorCount = data.colors?.length ?? data.colorCount ?? 1
    const rows = data.rows
    const cols = data.cols
    // 旧格式：grid.length === cols，每列长度 === rows → 转为行优先
    let grid = data.grid
    if (grid.length === cols && grid[0]?.length === rows) {
      grid = Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => data.grid[c][r])
      )
    } else {
      grid = data.grid.map(row => [...row])
    }
    return new GameGrid(vside_rows, data.cols, colorCount, grid)
  }

  /** 将 (startR, startC) 所在联通区域染成新颜色，原地修改 grid，不返回新网格 */
  floodFill(startR: number, startC: number, newColorIndex: number): void {
    const g = this.grid
    const oldColorIndex = this.getColorIndex(startR, startC)
    if (oldColorIndex === newColorIndex) return
    g[startR][startC] = newColorIndex
    const queue: { r: number; c: number }[] = [{ r: startR, c: startC }]
    const visited = new Set<string>()
    visited.add(`${startR},${startC}`)
    while (queue.length > 0) {
      const curr = queue.shift()!
      for (const n of this.getNeighbors(curr.r, curr.c)) {
        const nKey = `${n.r},${n.c}`
        if (visited.has(nKey)) continue
        if (n.c < 0 || n.c >= this.cols || n.r < 0 || n.r >= this.rows || g[n.r]?.[n.c] === undefined) continue
        if (g[n.r][n.c] === oldColorIndex) {
          g[n.r][n.c] = newColorIndex
          visited.add(nKey)
          queue.push(n)
        }
      }
    }
  }


  /** 指定位置所在区域的所有格子坐标，空白区域返回空数组 */
  getRegionCells(startR: number, startC: number): { r: number; c: number }[] {
    const targetColorIndex = this.getColorIndex(startR, startC)
    // 空白区域不返回
    if (targetColorIndex === EMPTY_COLOR_INDEX) return []
    const cells: { r: number; c: number }[] = []
    const queue = [{ r: startR, c: startC }]
    const visited = new Set<string>()
    visited.add(`${startR},${startC}`)
    cells.push({ r: startR, c: startC })
    while (queue.length > 0) {
      const curr = queue.shift()!
      for (const n of this.getNeighbors(curr.r, curr.c)) {
        const nKey = `${n.r},${n.c}`
        if (visited.has(nKey)) continue
        if (n.c < 0 || n.c >= this.cols || n.r < 0 || n.r >= this.rows) continue
        if (this.grid[n.r]?.[n.c] === targetColorIndex) {
          visited.add(nKey)
          cells.push({ r: n.r, c: n.c })
          queue.push(n)
        }
      }
    }
    return cells
  }

}
