import { SIDE_A, HALF_A, TRI_H, COLS, ROWS } from './constants'

/**
 * 核心逻辑 1: 计算三角形顶点坐标
 * 
 * 布局原理：
 * x 轴上，每个格子占据 0.5a 的宽度。
 * c=0 的左边缘占据 0 到 0.5a。
 * c=1 的完整三角形占据 0 到 1.0a (中心错位)。
 * 实际上，为了严丝合缝，我们可以这样理解 x 坐标：
 * 第 c 列的起始 x = c * (a/2)。
 */
// --- 画布尺寸 (旋转后) ---
// 宽度现在由原来的行数决定 (10行 * 高度h)

/**
 * 旋转后的坐标计算
 * r (0-9): 映射到 X 轴
 * c (0-27): 映射到 Y 轴
 */
export const getTrianglePoints = (c: number, r: number): string => {
  // 交换映射逻辑
  const startX = c * TRI_H;      // X 由 c 控制
  let startY = (r - 1) * HALF_A;
  
  // 现在：isRight (▷) / isLeft (◁)
  const isRight = (r + c) % 2 == 0;

  if (r === 0) {
    startY = 0;
    if (isRight) {
      return `${startX},${startY} ${startX + TRI_H},${startY} ${startX},${startY + HALF_A}`;
    } else {
      return `${startX},${startY} ${startX + TRI_H},${startY} ${startX + TRI_H},${startY + HALF_A}`;
    }
  }
  if (r === 29) {
    console.log("right bottom");
    startY = 14 * SIDE_A;
    if (isRight) {
       // Right (▷) 的下半部分被切
       // 顶点: 左上, 左下, 右上(尖) -> 实际上是 Right 三角形的上半截保留
       // 坐标: (x, y), (x, y+hw), (x+h, y)
       return `${startX},${startY} ${startX},${startY + HALF_A} ${startX + TRI_H},${startY}`;
    } else {
       // Left (◁) 的下半部分被切
       // 顶点: 右上, 右下, 左上(尖)
       return `${startX + TRI_H},${startY} ${startX + TRI_H},${startY + HALF_A} ${startX},${startY}`;
    }
  }
  if (isRight) {
    return `${startX},${startY} ${startX},${startY + SIDE_A} ${startX + TRI_H},${startY + HALF_A}`;
  } else {
    return `${startX + TRI_H},${startY} ${startX + TRI_H},${startY + SIDE_A} ${startX},${startY + HALF_A}`;
  }

};


/**
 * 核心逻辑 2: 联通性邻居查找
 * 
 * 在三角形网格中，每个三角形有最多3个邻居：
 * 1. 水平方向：左右两个邻居
 * 2. 垂直方向：根据三角形方向（向上/向下）决定上下邻居
 */
export const getNeighbors = (r: number, c: number): { r: number; c: number }[] => {
  const neighbors: { r: number; c: number }[] = []
  
  // 1. 上下邻居
  if (r > 0) neighbors.push({ r: r - 1, c })
  if (r < ROWS - 1) neighbors.push({ r: r + 1, c })
  
  // 2. 水平邻居
  const isRight = (r + c) % 2 == 0;
  if (isRight && c > 0) {
    neighbors.push({ r, c: c - 1 })
  } else if (!isRight && c < COLS - 1) {
    neighbors.push({ r, c: c + 1 })
  }
  return neighbors
}
