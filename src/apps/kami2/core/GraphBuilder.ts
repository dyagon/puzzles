import { GameGrid } from './GameGrid'

/** 图节点定义 */
export interface RegionNode {
  id: number
  color: number
  size: number
  neighbors: Set<number>
  representative: { r: number; c: number }
}

export class GraphBuilder {
  // --- 实例状态 ---
  private readonly gameGrid: GameGrid
  private readonly voidColorIndex: number
  
  // 核心数据结构：全图节点集合
  private readonly nodes = new Map<number, RegionNode>()
  
  // 辅助映射表：(r,c) -> NodeID，避免重复传参
  private nodeMap: Int32Array
  private nodeIdCounter = 0

  /**
   * 构造器只负责初始化基础状态
   */
  constructor(gameGrid: GameGrid, voidColorIndex: number = -1) {
    this.gameGrid = gameGrid
    this.voidColorIndex = voidColorIndex
    this.nodeMap = new Int32Array(gameGrid.rows * gameGrid.cols).fill(-1)
  }

  /**
   * [公开 API] 执行构建并返回孤岛列表
   */
  public buildIslands(): Map<number, RegionNode>[] {
    // 1. 构建全图 (填充 this.nodes)
    this.buildGlobalGraph()
    
    // 2. 拆分连通分量
    return this.splitIntoIslands()
  }

  /**
   * 内部流程：遍历网格，构建节点和边
   */
  private buildGlobalGraph(): void {
    const { cols, rows, grid } = this.gameGrid
    const getIdx = (r: number, c: number) => c * rows + r

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = getIdx(r, c)
        const color = grid[r][c]

        // 跳过 Void 或已处理的格子
        if (color === this.voidColorIndex || this.nodeMap[idx] !== -1) continue

        // --- 步骤 A: 创建新节点并聚类 ---
        this.createNodeAndFloodFill(r, c, color)
        
        // --- 步骤 B: 建立连接 (Link Edges) ---
        // 这一步需要在 BFS 之后立即做，因为只有确定了节点边界，才能找邻居
        // 为了避免在 buildGlobalGraph 里写 huge loop，我们把连接逻辑也封装进去，
        // 或者让 createNodeAndFloodFill 返回当前节点的所有格子，再传给 linkNeighbors。
        // 这里选择后者，保持职责单一。
      }
    }
  }

  /**
   * [核心逻辑拆分] 创建节点 + 泛洪填充
   * 返回当前节点包含的所有格子，供后续连边使用
   */
  private createNodeAndFloodFill(startR: number, startC: number, color: number): { r: number; c: number }[] {
    const { rows, grid } = this.gameGrid
    const getIdx = (r: number, c: number) => c * rows + r

    // 1. 创建节点
    const currentNodeId = this.nodeIdCounter++
    const node: RegionNode = {
      id: currentNodeId,
      color: color,
      size: 0,
      neighbors: new Set(),
      representative: { r: startR, c: startC }
    }
    this.nodes.set(currentNodeId, node)

    // 2. 泛洪聚类 (Flood Fill)
    const queue = [{ r: startR, c: startC }]
    this.nodeMap[getIdx(startR, startC)] = currentNodeId
    node.size++
    
    const regionCells: { r: number; c: number }[] = [{ r: startR, c: startC }]

    let head = 0
    while (head < queue.length) {
      const curr = queue[head++]
      // 遍历物理邻居
      for (const n of this.gameGrid.getNeighbors(curr.r, curr.c)) {
        if (!this.isValidCell(n.r, n.c)) continue
        
        const nIdx = getIdx(n.r, n.c)
        const nColor = grid[n.r][n.c]

        // 仅处理同色且未访问的格子
        if (nColor === color && this.nodeMap[nIdx] === -1) {
          this.nodeMap[nIdx] = currentNodeId
          node.size++
          queue.push(n)
          regionCells.push(n)
        }
      }
    }

    // 3. 顺便执行连边逻辑 (Link Neighbors)
    //    也可以返回 cells 在外部调用，但在内部调用更紧凑
    this.linkNeighbors(regionCells, currentNodeId)

    return regionCells
  }

  /**
   * [核心逻辑拆分] 建立图的边 (检查邻居)
   */
  private linkNeighbors(cells: { r: number; c: number }[], currentNodeId: number): void {
    const { rows } = this.gameGrid
    const getIdx = (r: number, c: number) => c * rows + r
    const currentNode = this.nodes.get(currentNodeId)!

    for (const cell of cells) {
      for (const n of this.gameGrid.getNeighbors(cell.r, cell.c)) {
        if (!this.isValidCell(n.r, n.c)) continue
        
        const nIdx = getIdx(n.r, n.c)
        const neighborNodeId = this.nodeMap[nIdx]

        // 核心连边规则：
        // 1. 邻居已被访问 (neighborNodeId !== -1)
        // 2. 邻居不是自己 (neighborNodeId !== currentNodeId)
        if (neighborNodeId !== -1 && neighborNodeId !== currentNodeId) {
          const neighborNode = this.nodes.get(neighborNodeId)!
          
          // 双向连接
          currentNode.neighbors.add(neighborNodeId)
          neighborNode.neighbors.add(currentNodeId)
        }
      }
    }
  }

  /**
   * [辅助] 检查格子是否有效且非 Void
   */
  private isValidCell(r: number, c: number): boolean {
    const { rows, cols, grid } = this.gameGrid
    return (
      r >= 0 && r < rows &&
      c >= 0 && c < cols &&
      grid[r][c] !== this.voidColorIndex
    )
  }

  /**
   * [后处理] 将全图拆分为孤岛列表 (BFS 遍历图)
   */
  private splitIntoIslands(): Map<number, RegionNode>[] {
    const islands: Map<number, RegionNode>[] = []
    const visitedNodeIds = new Set<number>()

    for (const [startNodeId, startNode] of this.nodes) {
      if (visitedNodeIds.has(startNodeId)) continue

      const currentIsland = new Map<number, RegionNode>()
      islands.push(currentIsland)

      const queue = [startNode]
      visitedNodeIds.add(startNodeId)
      currentIsland.set(startNodeId, startNode)

      let head = 0
      while (head < queue.length) {
        const curr = queue[head++]
        for (const neighborId of curr.neighbors) {
          if (!visitedNodeIds.has(neighborId)) {
            visitedNodeIds.add(neighborId)
            const neighborNode = this.nodes.get(neighborId)!
            currentIsland.set(neighborId, neighborNode)
            queue.push(neighborNode)
          }
        }
      }
    }
    return islands
  }
}
