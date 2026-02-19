import { GameGrid } from './GameGrid'
import { Solution } from './GraphSolver'

export type SolveResult = {
  solution: Solution | null
  solutionMetadata: { islandCount: number; regionCount: number; method: string }
}

export type SolveOptions = {
  voidColorIndex?: number
  colors?: string[]
}

export class SolverClient {
  private worker: Worker | null = null

  /**
   * 异步求解（在 Worker 中执行）
   */
  public solve(
    gameGrid: GameGrid,
    options: SolveOptions = {}
  ): Promise<SolveResult> {
    this.terminate()

    this.worker = new Worker(new URL('./solver.worker.ts', import.meta.url), {
      type: 'module'
    })

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker creation failed'))
        return
      }

      this.worker.onmessage = (e: MessageEvent) => {
        const { type, solution: sol, solutionMetadata, message } = e.data

        if (type === 'DONE') {
          const meta = solutionMetadata ?? {
            islandCount: 0,
            regionCount: 0,
            method: 'MultiGraphSolver (IDA*)'
          }
          resolve({ solution: sol ?? null, solutionMetadata: meta })
          this.terminate()
          return
        }
        if (type === 'ERROR') {
          reject(new Error(message ?? 'Unknown error'))
          this.terminate()
          return
        }
      }

      this.worker.onerror = (err: ErrorEvent) => {
        reject(new Error(err.message ?? 'Worker error'))
        this.terminate()
      }

      // 只传纯数据，避免 Vue reactive/Proxy 导致 postMessage DataCloneError
      const gridData = gameGrid.toJSON()
      const colors = options.colors ?? []
      const payload = {
        type: 'START_SOLVE' as const,
        payload: {
          gridData: {
            rows: gridData.rows,
            cols: gridData.cols,
            colorCount: gridData.colorCount,
            grid: gridData.grid.map((row) => [...row])
          },
          options: {
            voidColorIndex: options.voidColorIndex ?? -1,
            colors: Array.isArray(colors) ? [...colors] : []
          }
        }
      }
      this.worker.postMessage(payload)
    })
  }

  /**
   * 强制停止求解
   */
  public terminate() {
    if (this.worker) {
      this.worker.terminate() // 浏览器 API：直接杀死线程
      this.worker = null
    }
  }
}
