import type { GameData, GameListItem } from '../core/gameData'
import type { GameGrid } from '../core/GameGrid'
import type { Solution } from '../core/solver'
import { cloneGameGrid } from '../core/gameGridUtils'

/**
 * 保存游戏到 src/games/default 目录
 * 注意：浏览器环境无法直接写入文件系统，所以使用下载功能
 * 用户需要手动将下载的文件放到 src/games/default 目录
 * @param gameGrid 当前游戏状态
 * @param solution 最优解（可选）
 * @returns 保存的文件名（两位数字编号）
 */
export async function saveGameToDefault(
  gameGrid: GameGrid,
  solution?: Solution
): Promise<string> {
  // 查找下一个可用的编号（01-99）
  let nextId = '01'
  const existingFiles = await listGamesInDefault()
  
  if (existingFiles.length > 0) {
    const maxId = Math.max(
      ...existingFiles.map(f => Number.parseInt(f.id, 10))
    )
    nextId = String(maxId + 1).padStart(2, '0')
    
    // 如果超过99，则查找第一个空缺
    if (Number.parseInt(nextId, 10) > 99) {
      const ids = new Set(existingFiles.map(f => Number.parseInt(f.id, 10)))
      for (let i = 1; i <= 99; i++) {
        if (!ids.has(i)) {
          nextId = String(i).padStart(2, '0')
          break
        }
      }
    }
  }
  
  const gameData: GameData = {
    id: nextId,
    initialGrid: cloneGameGrid(gameGrid),
    solution: solution
  }
  
  // 使用下载功能保存文件
  const jsonStr = JSON.stringify(gameData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${nextId}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  
  return nextId
}

/**
 * 列出 src/games/default 目录下的所有游戏
 * 使用 Vite 的 import.meta.glob 来动态导入所有游戏文件
 */
export async function listGamesInDefault(): Promise<GameListItem[]> {
  try {
    // 使用 Vite 的 glob 导入功能来获取所有游戏文件
    // 这会自动匹配 src/games/default/*.json 文件
    const gameModules = import.meta.glob('/src/games/default/*.json', { eager: false })
    
    const games: GameListItem[] = []
    
    // 并行加载所有游戏文件
    const loadPromises = Object.keys(gameModules).map(async (path) => {
      try {
        const module = await gameModules[path]() as { default: GameData }
        const gameData = module.default
        
        return {
          id: gameData.id,
          name: gameData.name || `游戏 ${gameData.id}`,
          hasSolution: !!gameData.solution,
          solutionSteps: gameData.solution?.steps
        } as GameListItem
      } catch (e) {
        console.warn(`加载游戏文件失败 ${path}:`, e)
        return null
      }
    })
    
    const results = await Promise.all(loadPromises)
    const validGames = results.filter((g): g is GameListItem => g !== null)
    
    // 按 ID 排序
    validGames.sort((a, b) => Number.parseInt(a.id, 10) - Number.parseInt(b.id, 10))
    
    return validGames
  } catch (error) {
    console.error('列出游戏失败:', error)
    // 如果 glob 导入失败，回退到尝试读取 01-99 的文件
    return await listGamesFallback()
  }
}

/**
 * 回退方案：尝试读取 01-99 的文件
 */
async function listGamesFallback(): Promise<GameListItem[]> {
  const games: GameListItem[] = []
  
  // 并行尝试读取多个文件（分批处理以避免过多请求）
  const batchSize = 10
  for (let start = 1; start <= 99; start += batchSize) {
    const batchPromises: Promise<GameListItem | null>[] = []
    
    for (let i = start; i < Math.min(start + batchSize, 100); i++) {
      const id = String(i).padStart(2, '0')
      batchPromises.push(
        loadGameFromDefault(id)
          .then(gameData => {
            if (gameData) {
              return {
                id: gameData.id,
                name: gameData.name || `游戏 ${id}`,
                hasSolution: !!gameData.solution,
                solutionSteps: gameData.solution?.steps
              } as GameListItem
            }
            return null
          })
          .catch(() => null)
      )
    }
    
    const batchResults = await Promise.all(batchPromises)
    const validGames = batchResults.filter((g): g is GameListItem => g !== null)
    games.push(...validGames)
  }
  
  return games
}

/**
 * 从 src/games/default 加载游戏
 */
export async function loadGameFromDefault(id: string): Promise<GameData | null> {
  try {
    const filePath = `/src/games/default/${id}.json`
    const response = await fetch(filePath)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data as GameData
  } catch (error) {
    console.error(`加载游戏 ${id} 失败:`, error)
    return null
  }
}

/**
 * 列出 src/games 目录下的所有游戏（包括子目录）
 */
export async function listAllGames(): Promise<GameListItem[]> {
  const games: GameListItem[] = []
  
  // 先加载 default 目录下的游戏
  const defaultGames = await listGamesInDefault()
  games.push(...defaultGames)
  
  // 可以扩展：加载其他目录下的游戏
  // 例如：src/games/level1, src/games/level2 等
  
  return games
}

/**
 * 从 src/games 加载游戏（支持子目录）
 */
export async function loadGame(gamePath: string): Promise<GameData | null> {
  try {
    const filePath = `/src/games/${gamePath}.json`
    const response = await fetch(filePath)
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    return data as GameData
  } catch (error) {
    console.error(`加载游戏 ${gamePath} 失败:`, error)
    return null
  }
}
