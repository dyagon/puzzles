import { getNeighbors } from './draw'
import type { Cell } from './Cell'
import { UnionFind } from './UnionFind'
import { ROWS, COLS, TOTAL_CELLS } from './constants'

/**
 * 将二维坐标 (r, c) 映射为一维索引 index
 */
const getIndex = (r: number, c: number): number => {
  return r * COLS + c;
};

/**
 * 根据当前 Grid 颜色构建并查集
 * @returns UnionFind 实例
 */
const buildGameState = (grid: Cell[][]): UnionFind => {
  // 安全检查：grid 是列优先结构 [列][行]，需要确保有足够的列和行
  if (!grid?.length || grid.length < COLS || !grid[0]?.length || grid[0].length < ROWS) {
    return new UnionFind(TOTAL_CELLS)
  }

  const uf = new UnionFind(TOTAL_CELLS);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // 安全检查：确保 grid[c] 和 grid[c][r] 存在
      if (!grid[c]?.[r]) continue;
      
      const currentIdx = getIndex(r, c);
      const currentColor = grid[c][r].color;
      
      // 获取物理邻居 (复用之前的 getNeighbors 函数)
      const neighbors = getNeighbors(r, c);

      for (const n of neighbors) {
        // 边界检查 (确保邻居有效)
        if (n.r >= 0 && n.r < ROWS && n.c >= 0 && n.c < COLS && grid[n.c]?.[n.r]) {
          const neighborIdx = getIndex(n.r, n.c);
          const neighborColor = grid[n.c][n.r].color;

          // 核心逻辑：如果邻居颜色相同，合并它们
          if (currentColor === neighborColor) {
            uf.union(currentIdx, neighborIdx);
          }
        }
      }
    }
  }
  
  return uf
}

export { buildGameState }
