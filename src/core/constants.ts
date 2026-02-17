
// 几何常数
export const SIDE_A = 56 // 边长 a (像素)
export const HALF_A = SIDE_A / 2 // 半宽 (水平步进单位)
export const TRI_H = (Math.sqrt(3) / 2) * SIDE_A // 高 h
// 网格尺寸
export const ROWS = 29 // 2个半角 + 27个整角 = 29个逻辑单元
export const COLS = 10 
// 画布尺寸
export const BOARD_WIDTH = 10 * TRI_H;
export const BOARD_HEIGHT = Math.floor(ROWS / 2) * SIDE_A

// 颜色配置
export const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7'] as const
export const BASE_COLOR = COLORS[0] // 初始/重置画布时的底色

// 计算值
export const TOTAL_CELLS = ROWS * COLS
