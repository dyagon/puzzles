import { getNeighbors } from './draw'
import type { GameGrid } from './GameGrid'
import { UnionFind } from './UnionFind'

/**
 * 将二维坐标 (r, c) 映射为一维索引 index
 */
const getIndex = (r: number, c: number, cols: number): number => {
  return r * cols + c;
};

/**
 * 根据当前 GameGrid 构建并查集
 * @returns UnionFind 实例
 */
const buildGameState = (gameGrid: GameGrid): UnionFind => {
  const { rows, cols, cells } = gameGrid
  const totalCells = rows * cols
  
  // 安全检查
  if (!cells?.length || cells.length < cols || !cells[0]?.length || cells[0].length < rows) {
    return new UnionFind(totalCells)
  }

  const uf = new UnionFind(totalCells);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // 安全检查：确保 cells[c] 和 cells[c][r] 存在
      if (!cells[c]?.[r]) continue;
      
      const currentIdx = getIndex(r, c, cols);
      const currentColorIndex = cells[c][r].colorIndex;
      
      // 获取物理邻居 (复用之前的 getNeighbors 函数)
      const neighbors = getNeighbors(r, c);

      for (const n of neighbors) {
        // 边界检查 (确保邻居有效)
        if (n.r >= 0 && n.r < rows && n.c >= 0 && n.c < cols && cells[n.c]?.[n.r]) {
          const neighborIdx = getIndex(n.r, n.c, cols);
          const neighborColorIndex = cells[n.c][n.r].colorIndex;

          // 核心逻辑：如果邻居颜色索引相同，合并它们
          if (currentColorIndex === neighborColorIndex) {
            uf.union(currentIdx, neighborIdx);
          }
        }
      }
    }
  }
  
  return uf
}

export { buildGameState }
