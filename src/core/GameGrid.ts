import { UnionFind } from './UnionFind'

// 几何常数
export const SIDE_A = 56 // 边长 a (像素)
export const HALF_A = SIDE_A / 2 // 半宽 (水平步进单位)
export const TRI_H = (Math.sqrt(3) / 2) * SIDE_A // 高 h

/** 求解结果：最少步骤及操作路径 */
export interface Solution {
  steps: number
  path: Array<{
    region: { r: number; c: number }
    color: string
    description: string
  }>
}


/**
 * 游戏网格：使用二维数组存储 colorIndex，并提供绘制、邻居、联通区域与求解方法。
 * 高度方向正三角形边数为 vside_rows，行数 rows = 2 * vside_rows + 1，高度 = vside_rows * SIDE_A。
 */
export class GameGrid {
  /** 高度方向正三角形的边的个数 */
  readonly vside_rows: number
  /** 行数 = 2 * vside_rows + 1 */
  readonly rows: number
  /** 高度（像素）= vside_rows * SIDE_A */
  readonly height: number
  readonly cols: number
  readonly colors: readonly string[]
  /** grid[col][row] = colorIndex */
  readonly grid: number[][]

  constructor(
    vside_rows: number,
    cols: number,
    colors: readonly string[],
    grid?: number[][]
  ) {
    this.vside_rows = vside_rows
    this.rows = 2 * vside_rows + 1
    this.height = vside_rows * SIDE_A
    this.cols = cols
    this.colors = [...colors]
    this.grid = grid ?? Array.from({ length: cols }, () =>
      Array.from({ length: this.rows }, () => 0)
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
    return this.grid[c]?.[r] ?? 0
  }

  getColorAt(r: number, c: number): string {
    const idx = this.getColorIndex(r, c)
    return this.colors[idx] ?? this.colors[0]
  }

  /** 深拷贝 */
  clone(): GameGrid {
    return new GameGrid(
      this.vside_rows,
      this.cols,
      this.colors,
      this.grid.map(col => [...col])
    )
  }

  /** 序列化（用于 localStorage 等） */
  toJSON(): { rows: number; cols: number; colors: readonly string[]; grid: number[][] } {
    return {
      rows: this.rows,
      cols: this.cols,
      colors: this.colors,
      grid: this.grid.map(col => [...col])
    }
  }

  /** 从 JSON 反序列化 */
  static fromJSON(data: { rows: number; cols: number; colors: readonly string[]; grid: number[][] }): GameGrid {
    const vside_rows = (data.rows - 1) >> 1
    return new GameGrid(
      vside_rows,
      data.cols,
      data.colors,
      data.grid.map(col => [...col])
    )
  }

  /** 构建并查集，用于联通区域统计 */
  buildUnionFind(): UnionFind {
    const { rows, cols, grid } = this
    const totalCells = rows * cols
    if (!grid?.length || grid.length < cols || !grid[0]?.length || grid[0].length < rows) {
      return new UnionFind(totalCells)
    }
    const uf = new UnionFind(totalCells)
    const idx = (r: number, c: number) => r * cols + c
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[c]?.[r] === undefined) continue
        const currentIdx = idx(r, c)
        const currentColorIndex = grid[c][r]
        for (const n of this.getNeighbors(r, c)) {
          if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && grid[n.c]?.[n.r] !== undefined) {
            const neighborIdx = idx(n.r, n.c)
            if (currentColorIndex === grid[n.c][n.r]) {
              uf.union(currentIdx, neighborIdx)
            }
          }
        }
      }
    }
    return uf
  }

  /** 联通区域数量 */
  getRegionCount(): number {
    return this.buildUnionFind().count
  }

  /** 状态字符串（用于 BFS 去重） */
  getStateKey(): string {
    return this.grid.map(col => col.join(',')).join('|')
  }

  /** 将 (startR, startC) 所在联通区域染成新颜色，返回新网格 */
  floodFill(startR: number, startC: number, newColorIndex: number): GameGrid {
    const newGrid = this.clone()
    const oldColorIndex = newGrid.getColorIndex(startR, startC)
    if (oldColorIndex === newColorIndex) return newGrid
    const queue: { r: number; c: number }[] = [{ r: startR, c: startC }]
    const visited = new Set<string>()
    const g = newGrid.grid
    g[startC][startR] = newColorIndex
    visited.add(`${startR},${startC}`)
    while (queue.length > 0) {
      const curr = queue.shift()!
      for (const n of newGrid.getNeighbors(curr.r, curr.c)) {
        const nKey = `${n.r},${n.c}`
        if (visited.has(nKey)) continue
        if (n.c < 0 || n.c >= this.cols || n.r < 0 || n.r >= this.rows || g[n.c]?.[n.r] === undefined) continue
        if (g[n.c][n.r] === oldColorIndex) {
          g[n.c][n.r] = newColorIndex
          visited.add(nKey)
          queue.push(n)
        }
      }
    }
    return newGrid
  }

  /** 各联通区域的代表点（每个区域一个） */
  getRegionRepresentatives(): { r: number; c: number }[] {
    const uf = this.buildUnionFind()
    const representatives = new Map<number, { r: number; c: number }>()
    const idx = (r: number, c: number) => r * this.cols + c
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const root = uf.find(idx(r, c))
        if (!representatives.has(root)) representatives.set(root, { r, c })
      }
    }
    return Array.from(representatives.values())
  }

  /** 指定位置所在区域的所有格子坐标 */
  getRegionCells(startR: number, startC: number): { r: number; c: number }[] {
    const cells: { r: number; c: number }[] = []
    const targetColorIndex = this.getColorIndex(startR, startC)
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
        if (this.grid[n.c]?.[n.r] === targetColorIndex) {
          visited.add(nKey)
          cells.push({ r: n.r, c: n.c })
          queue.push(n)
        }
      }
    }
    return cells
  }

  /**
   * DFS 求解：回溯 + 剪枝，返回最少步数解。
   * 最大探索步数 = 联通区域数 - 1（理论最少步数上界）。
   */
  solve(): Solution | null {
    const regionCount = this.getRegionCount()
    if (regionCount === 1) return { steps: 0, path: [] }
    const maxSteps = regionCount - 1
    let best: Solution | null = null
    const pathStates = new Set<string>()

    const dfs = (gameGrid: GameGrid, steps: number, path: Solution['path']): void => {
      const stateKey = gameGrid.getStateKey()
      const count = gameGrid.getRegionCount()

      if (count === 1) {
        if (best === null || steps < best.steps) best = { steps, path: [...path] }
        return
      }

      if (steps >= maxSteps) return
      if (best !== null && steps >= best.steps) return
      if (count - 1 > maxSteps - steps) return
      if (pathStates.has(stateKey)) return

      pathStates.add(stateKey)
      const regions = gameGrid.getRegionRepresentatives()

      for (const region of regions) {
        const currentColorIndex = gameGrid.getColorIndex(region.r, region.c)
        for (let newColorIndex = 0; newColorIndex < gameGrid.colors.length; newColorIndex++) {
          if (newColorIndex === currentColorIndex) continue
          if (best !== null && steps + 1 >= best.steps) continue
          const nextGrid = gameGrid.floodFill(region.r, region.c, newColorIndex)
          const nextKey = nextGrid.getStateKey()
          if (pathStates.has(nextKey)) continue
          const colorString = gameGrid.colors[newColorIndex]
          const nextStep = {
            region,
            color: colorString,
            description: `步骤 ${steps + 1}: 将位置(${region.r}, ${region.c})所在的区域染成 ${colorString}`
          }
          dfs(nextGrid, steps + 1, [...path, nextStep])
        }
      }

      pathStates.delete(stateKey)
    }

    dfs(this.clone(), 0, [])
    return best
  }
}
