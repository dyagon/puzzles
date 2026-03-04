import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    app: { title: 'Puzzles' },
    nav: {
      home: 'Home',
      kami2: 'Kami2',
      sudoku: 'Sudoku',
    },
    home: {
      intro: 'Choose a puzzle from the navigation above.',
    },
    kami2: {
      modeEdit: 'Edit',
      modePlay: 'Play',
      editHint: 'Hold Space and move the mouse to paint continuously in edit mode.',
      resetGrid: 'Reset grid',
      testSteps: 'Test steps: {count}',
      paletteChoose: 'Choose colors ({count})',
      emptyTooltip:
        'Empty: click to select, can set region to empty (not counted as connected).',
      paletteDialogTitle: 'Choose colors to use (at least 1)',
      dialogCancel: 'Cancel',
      dialogConfirm: 'Confirm',
      graphInfoTitle: 'Graph info',
      graphInfoIslands: 'Island count:',
      graphInfoRegions: 'Connected regions:',
      graphInfoPerIsland: 'Regions per island:',
      graphInfoLoading: 'Calculating...',
      solveButtonIdleEdit: 'Solve optimal solution',
      solveButtonIdlePlay: 'Solve minimum steps',
      solving: 'Solving...',
      terminate: 'Stop solving',
      solutionHeader: 'Optimal solution:',
      solutionInfoTitle: 'Solution info',
      solutionInfoSteps: 'Minimum steps:',
      solutionInfoMethod: 'Method:',
      stepPrefix: 'Step {index}:',
      stepDescription: 'Fill region at ({row}, {col}) with this color',
    },
    sudoku: {
      title: 'Sudoku',
      reset: 'Reset',
      showErrors: 'Show errors',
    },
    lang: {
      zh: '中文',
      en: 'English',
    },
  },
  zh: {
    app: { title: 'Puzzles' },
    nav: {
      home: '首页',
      kami2: 'Kami2',
      sudoku: '数独',
    },
    home: {
      intro: '选择上方导航进入对应谜题应用。',
    },
    kami2: {
      modeEdit: '编辑',
      modePlay: '测试',
      editHint: '编辑时按住空格 + 移动鼠标可连续上色',
      resetGrid: '重置网格',
      testSteps: '测试步数：{count}',
      paletteChoose: '选择颜色 ({count})',
      emptyTooltip: '空白：点击选中，可将区域填为空白（不参与连通）',
      paletteDialogTitle: '选择使用的颜色（至少 1 个）',
      dialogCancel: '取消',
      dialogConfirm: '确定',
      graphInfoTitle: '图信息',
      graphInfoIslands: '岛屿数量：',
      graphInfoRegions: '联通区域数：',
      graphInfoPerIsland: '各岛屿区域数：',
      graphInfoLoading: '计算中...',
      solveButtonIdleEdit: '求解最优解',
      solveButtonIdlePlay: '求解最少步骤',
      solving: '求解中...',
      terminate: '终止求解',
      solutionHeader: '最优解步骤：',
      solutionInfoTitle: '解信息',
      solutionInfoSteps: '最少步数：',
      solutionInfoMethod: '解法：',
      stepPrefix: '步骤 {index}:',
      stepDescription: '将位置({row}, {col})所在的区域染成此颜色',
    },
    sudoku: {
      title: '数独',
      reset: '重置',
      showErrors: '显示错误',
    },
    lang: {
      zh: '中文',
      en: 'English',
    },
  },
} as const

function detectLocale(): 'en' | 'zh' {
  if (typeof window === 'undefined') return 'en'
  const saved = window.localStorage.getItem('locale')
  if (saved === 'en' || saved === 'zh') return saved
  const lang = window.navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  return 'en'
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages,
})

