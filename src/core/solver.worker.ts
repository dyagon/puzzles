import { GraphBuilder } from "./GraphBuilder";
import { MultiGraphSolver } from "./GraphSolver";
import { GameGrid } from "./GameGrid";

type WorkerMessage = {
  type: "START_SOLVE";
  payload: {
    gridData: ReturnType<GameGrid["toJSON"]>;
    options: {
      voidColorIndex: number;
      colors: readonly string[];
    };
  };
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  if (type !== "START_SOLVE") return;

  try {
    const gameGrid = GameGrid.fromJSON(payload.gridData);
    const { voidColorIndex, colors } = payload.options;

    // 构建图并求解
    const builder = new GraphBuilder(gameGrid, voidColorIndex);
    const islands = builder.buildIslands();
    const islandCount = islands.length;
    const regionCount = islands.reduce((sum, isl) => sum + isl.size, 0);

    const solver = new MultiGraphSolver(gameGrid, {
      voidColorIndex,
      colors,
    });
    const solution = solver.solve();

    self.postMessage({
      type: "DONE",
      solution,
      solutionMetadata: {
        islandCount,
        regionCount,
        method: "MultiGraphSolver (IDA*)",
      },
    });
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      message: (error as Error).message,
    });
  }
};
