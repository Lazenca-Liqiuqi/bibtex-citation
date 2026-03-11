const { I18n } = window[Symbol.for("typora-plugin-core@v2")];

const en = {
  pluginName: "BibTeX Citations",
  fileNotFound: "BibTeX file not found: ",
  loadError: "Failed to load BibTeX files: ",
  settingsSaved: "Settings updated.",
  emptyPathWarning: "Please enter a BibTeX file path first.",
  absolutePathRequired:
    "This path mode only accepts absolute BibTeX file paths.",
  sidebar: {
    title: "BibTeX Citations",
    heading: "BibTeX Citations",
    description:
      "Review the current BibTeX configuration, indexed entries, and quick actions.",
    pathBaseLabel: "Path Base",
    configuredFilesLabel: "Configured Files",
    indexedEntriesLabel: "Indexed Entries",
    citedEntriesLabel: "Cited In Current Doc",
    refreshButton: "Refresh Cache",
    empty: "No BibTeX files are configured yet.",
    unavailable: "Refresh needed",
    loadErrorPrefix: "Index refresh failed: ",
    triggerHint:
      "Type [@query] in the editor to search citations from the configured files.",
    duplicateHint:
      "When citation keys are duplicated, the earlier configured file wins.",
    citationCountHint:
      "The current-document count shows both unique citation keys and total citation occurrences found in bracket citations.",
    citationCountFormat: "{unique} unique / {total} total",
    filesTitle: "BibTeX Files",
  },
  settings: {
    language: {
      name: "Display Language",
      desc: "Choose the display language used by this plugin.",
      en: "English",
      zhCn: "简体中文",
    },
    pathBase: {
      name: "Path Base",
      desc: "Choose how non-absolute BibTeX file paths should be resolved.",
      markdown: "Relative to the current Markdown file",
      typora: "Relative to the folder currently opened in Typora",
      absolute: "Absolute paths only",
    },
    bibFiles: {
      name: "BibTeX Files",
      desc: "Manage BibTeX file paths one by one. The order controls duplicate citation key priority.",
      add: "Add BibTeX File",
      empty: "No BibTeX files configured yet.",
      placeholder: "./references.bib",
      remove: "Remove",
    },
  },
};

const zhCn = {
  pluginName: "BibTeX 引用",
  fileNotFound: "未找到 BibTeX 文件：",
  loadError: "加载 BibTeX 文件失败：",
  settingsSaved: "设置已更新。",
  emptyPathWarning: "请先输入 BibTeX 文件路径。",
  absolutePathRequired: "当前路径模式仅接受绝对 BibTeX 文件路径。",
  sidebar: {
    title: "BibTeX 引用",
    heading: "BibTeX 引用",
    description: "查看当前 BibTeX 配置、索引状态与快捷操作。",
    pathBaseLabel: "路径基准",
    configuredFilesLabel: "已配置文件数",
    indexedEntriesLabel: "已索引条目数",
    citedEntriesLabel: "当前文档引用统计",
    refreshButton: "刷新缓存",
    empty: "暂未配置任何 BibTeX 文件。",
    unavailable: "待刷新",
    loadErrorPrefix: "刷新索引失败：",
    triggerHint: "在编辑器中输入 [@query] 即可从已配置文件中检索引用。",
    duplicateHint: "当 citation key 重复时，会优先采用更靠前配置的文件。",
    citationCountHint:
      "当前文档统计基于方括号引用中的 citation key，同时显示唯一文献数与总出现次数。",
    citationCountFormat: "共 {unique} 条 / {total} 次",
    filesTitle: "BibTeX 文件",
  },
  settings: {
    language: {
      name: "显示语言",
      desc: "选择此插件使用的显示语言。",
      en: "English",
      zhCn: "简体中文",
    },
    pathBase: {
      name: "路径基准",
      desc: "选择非绝对 BibTeX 路径的解析基准。",
      markdown: "相对当前 Markdown 文件",
      typora: "相对 Typora 当前打开的文件夹",
      absolute: "仅接受绝对路径",
    },
    bibFiles: {
      name: "BibTeX 文件",
      desc: "逐条管理 BibTeX 文件路径，顺序会影响重复 citation key 的优先级。",
      add: "添加 BibTeX 文件",
      empty: "暂未配置任何 BibTeX 文件。",
      placeholder: "./references.bib",
      remove: "删除",
    },
  },
};

export function createI18n(displayLanguage = "zh-cn") {
  return new I18n({
    userLang: displayLanguage,
    resources: {
      en,
      zh: zhCn,
      "zh-cn": zhCn,
    },
  });
}
