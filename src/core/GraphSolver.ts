import { GameGrid } from './GameGrid'
import { GraphBuilder, RegionNode } from './GraphBuilder'



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
 * 多岛屿图求解器
 * 负责协调所有连通分量 (Islands) 的求解，并合并结果
 */
export class MultiGraphSolver {
  private readonly gameGrid: GameGrid
  private readonly voidColorIndex: number
  private readonly colorPalette: readonly string[]

  constructor(
    gameGrid: GameGrid,
    options?: {
      voidColorIndex?: number
      colors?: readonly string[]
    }
  ) {
    this.gameGrid = gameGrid
    this.voidColorIndex = options?.voidColorIndex ?? -1
    this.colorPalette = options?.colors ?? []
  }

  /**
   * [主入口] 执行全局求解
   */
  public solve(): Solution | null {
    // 1. 拆分连通分量
    const builder = new GraphBuilder(this.gameGrid, this.voidColorIndex)
    const islands = builder.buildIslands()

    if (islands.length === 0) return { steps: 0, path: [] }

    // --- 优化分支：只有一个岛屿时，目标颜色不限 ---
    if (islands.length === 1) {
      // 直接对唯一的岛屿求解，targetColor 传 null，表示“任意单色皆可”
      return this.solveSingleIsland(islands[0], null, 0)
    }

    // --- 常规分支：多个岛屿，必须枚举统一的目标色 ---
    const allColors = new Set<number>()
    for (const island of islands) {
      for (const node of island.values()) {
        allColors.add(node.color)
      }
    }

    let bestGlobalSolution: Solution | null = null

    for (const targetColor of allColors) {
      const currentSolution = this.solveGlobalForTarget(islands, targetColor)
      
      if (currentSolution) {
        if (
          bestGlobalSolution === null ||
          currentSolution.steps < bestGlobalSolution.steps
        ) {
          bestGlobalSolution = currentSolution
        }
      }
    }

    return bestGlobalSolution
  }

  /**
   * 计算将所有岛屿统一为指定 targetColor 的总代价
   */
  private solveGlobalForTarget(
    islands: Map<number, RegionNode>[],
    targetColor: number
  ): Solution | null {
    let totalSteps = 0
    const globalPath: Solution['path'] = []

    for (let islandIndex = 0; islandIndex < islands.length; islandIndex++) {
      const island = islands[islandIndex]
      const result = this.solveSingleIsland(island, targetColor, islandIndex)
      
      if (!result) return null

      totalSteps += result.steps
      globalPath.push(...result.path)
    }

    return { steps: totalSteps, path: globalPath }
  }

  /**
   * [核心算法] 针对单个岛屿的 IDA* 求解
   * @param targetColor 如果为 null，表示只要变成任意单色即可
   */
  private solveSingleIsland(
    nodes: Map<number, RegionNode>,
    targetColor: number | null,
    islandIndex: number
  ): Solution | null {
    // 1. 初始状态检查
    const distinctColors = new Set<number>()
    let hasTarget = false
    for (const n of nodes.values()) {
      distinctColors.add(n.color)
      if (targetColor !== null && n.color === targetColor) hasTarget = true
    }

    // 成功条件：只剩一种颜色
    if (distinctColors.size === 1) {
        // 如果指定了颜色，必须匹配；没指定颜色，任意单色即成功
        const finalColor = nodes.values().next().value!.color
        if (targetColor === null || finalColor === targetColor) {
            return { steps: 0, path: [] }
        }
    }

    // 2. IDA* 迭代加深搜索
    const maxDepth = 20 
    for (let limit = 0; limit <= maxDepth; limit++) {
      const result = this.dfs(nodes, 0, limit, [], targetColor, islandIndex)
      if (result) return result
    }

    return null
  }

  /**
   * 深度优先搜索 (DFS)
   */
  private dfs(
    nodes: Map<number, RegionNode>,
    g: number,
    limit: number,
    path: any[],
    targetColor: number | null,
    islandIndex: number
  ): Solution | null {

    // --- 1. 计算当前状态特征 ---
    const distinctColors = new Set<number>()
    let currentHasTarget = false
    let firstNode: RegionNode | null = null

    for (const n of nodes.values()) {
      if (!firstNode) firstNode = n
      distinctColors.add(n.color)
      if (targetColor !== null && n.color === targetColor) currentHasTarget = true
    }

    // --- 2. 终止条件判定 ---
    if (nodes.size === 1) {
      const finalColor = firstNode!.color
      
      // 情况 A: 不需要指定颜色 (null) 或者 颜色已匹配
      if (targetColor === null || finalColor === targetColor) {
        return { steps: g, path: this.formatPath(path) }
      }
      
      // 情况 B: 指定了目标色，但当前是别的纯色 (说明初始图中没有目标色)
      // 需要额外一步：转色
      if (g + 1 <= limit) {
        const extraStep = {
          regionId: firstNode!.id,
          color: targetColor,
          representative: firstNode!.representative
        }
        return { steps: g + 1, path: this.formatPath([...path, extraStep]) }
      } else {
        return null 
      }
    }

    // --- 3. 启发式剪枝 (h函数) ---
    let h = 0
    if (targetColor === null) {
        // 模式：任意单色。h = 颜色数 - 1
        h = distinctColors.size - 1
    } else {
        // 模式：指定目标色。
        // 含目标色 -> h = distinct - 1
        // 不含目标色 -> h = distinct (先归一，再转色)
        h = currentHasTarget ? distinctColors.size - 1 : distinctColors.size
    }
    
    if (g + h > limit) return null

    // --- 4. 生成移动 ---
    const moves = this.getPossibleMoves(nodes)

    for (const move of moves) {
      const nextNodes = this.applyMove(nodes, move.regionId, move.color)
      
      const res = this.dfs(
        nextNodes,
        g + 1,
        limit,
        [...path, move],
        targetColor,
        islandIndex
      )
      if (res) return res
    }

    return null
  }

  /**
   * 执行图合并 (逻辑不变)
   */
  private applyMove(
    nodes: Map<number, RegionNode>,
    targetId: number,
    newColor: number
  ): Map<number, RegionNode> {
    const newNodes = new Map<number, RegionNode>()
    for (const [id, n] of nodes) {
      newNodes.set(id, { ...n, neighbors: new Set(n.neighbors) })
    }

    const targetNode = newNodes.get(targetId)!
    targetNode.color = newColor

    const neighborsToMerge: number[] = []
    for (const nId of targetNode.neighbors) {
      if (newNodes.get(nId)!.color === newColor) {
        neighborsToMerge.push(nId)
      }
    }

    for (const mergeId of neighborsToMerge) {
      const mergedNode = newNodes.get(mergeId)!
      targetNode.size += mergedNode.size
      
      for (const neighborOfMergedId of mergedNode.neighbors) {
        if (neighborOfMergedId !== targetId) {
          targetNode.neighbors.add(neighborOfMergedId)
          const remoteNode = newNodes.get(neighborOfMergedId)!
          remoteNode.neighbors.delete(mergeId)
          remoteNode.neighbors.add(targetId)
        }
      }
      targetNode.neighbors.delete(mergeId)
      newNodes.delete(mergeId)
    }
    
    targetNode.neighbors.delete(targetId)
    return newNodes
  }

  /**
   * 获取可行移动列表 (逻辑不变)
   */
  private getPossibleMoves(nodes: Map<number, RegionNode>) {
    const moves: { regionId: number; color: number; score: number; representative: any }[] = []
    
    for (const node of nodes.values()) {
      const neighborColors = new Set<number>()
      for (const nId of node.neighbors) {
        const neighbor = nodes.get(nId)
        if (neighbor) neighborColors.add(neighbor.color)
      }

      for (const c of neighborColors) {
        moves.push({
          regionId: node.id,
          color: c,
          score: node.size,
          representative: node.representative
        })
      }
    }
    return moves.sort((a, b) => b.score - a.score)
  }

  private formatPath(rawPath: any[]): Solution['path'] {
    return rawPath.map((step, index) => {
      const colorStr = this.getColorString(step.color)
      return {
        region: step.representative,
        color: colorStr,
        description: `Step ${index + 1}: Fill region at (${step.representative.r}, ${step.representative.c}) with ${colorStr}`
      }
    })
  }

  private getColorString(colorIndex: number): string {
    return this.colorPalette[colorIndex] ?? `#Color${colorIndex}`
  }
}
