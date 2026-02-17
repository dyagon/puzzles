// UnionFind.ts
export class UnionFind {
    // parent[i] 存储节点 i 的父节点索引
    private parent: number[];
    // count 存储当前连通分量的总数 (即区域数量)
    public count: number;
  
    constructor(n: number) {
      this.count = n; // 初始时，每个节点都是独立的，共有 n 个区域
      this.parent = new Array(n);
      for (let i = 0; i < n; i++) {
        this.parent[i] = i; // 初始时，每个节点的父节点是它自己
      }
    }
  
    // 查找 x 的根节点 (带路径压缩优化)
    // 路径压缩：在查找过程中，直接把沿途节点的父节点指向根，树变得极扁
    find(x: number): number {
      if (this.parent[x] !== x) {
        this.parent[x] = this.find(this.parent[x]); // 递归并压缩
      }
      return this.parent[x];
    }
  
    // 合并 p 和 q 所在的两个集合
    union(p: number, q: number): void {
      const rootP = this.find(p);
      const rootQ = this.find(q);
  
      // 如果根不同，说明原本不连通，现在合并它们
      if (rootP !== rootQ) {
        this.parent[rootP] = rootQ; // 将一棵树挂到另一棵树下
        this.count--; // 连通区域少了一个
      }
    }
    
    // 判断两个节点是否连通
    isConnected(p: number, q: number): boolean {
      return this.find(p) === this.find(q);
    }
  }
  