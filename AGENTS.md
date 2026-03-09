# AGENTS.md

## 项目基本信息

- 项目名称：`bibtex-citation`
- 当前工作区目录名与 Git 远程仓库名均已迁移为 `bibtex-citation`
- 项目类型：Typora Community Plugin 插件
- 主要功能：在 Typora 中输入 `@` 时，从配置的多个 BibTeX 文件中检索文献条目并插入引用键
- 运行依赖：
  - Typora Community Plugin Framework
  - 一个或多个本地 `.bib` 文件
  - Node.js `>=22`
- 插件元数据入口：
  - [`manifest.json`](D:\Desktop\bibtex-citation\manifest.json)
  - [`main.js`](D:\Desktop\bibtex-citation\main.js)

## 目录结构

- [`main.js`](D:\Desktop\bibtex-citation\main.js)：插件主入口，包含设置页、BibTeX 解析、引用建议与插件注册
- [`style.css`](D:\Desktop\bibtex-citation\style.css)：建议列表样式与深色主题样式
- [`manifest.json`](D:\Desktop\bibtex-citation\manifest.json)：Typora 插件清单，声明插件 ID、版本和平台
- [`package.json`](D:\Desktop\bibtex-citation\package.json)：Node 依赖声明与运行时要求
- [`package-lock.json`](D:\Desktop\bibtex-citation\package-lock.json)：锁定依赖版本
- [`README.md`](D:\Desktop\bibtex-citation\README.md)：安装、配置与基础使用说明
- [`assets/`](D:\Desktop\bibtex-citation\assets)：README 截图与演示 GIF

## 技术栈与技术路线

### 技术栈

- JavaScript（ES Module 风格）
- Typora Community Plugin Core API
- Node.js 内置模块：`fs`
- CSS：候选列表样式

### 技术路线

- 通过 `EditorSuggest` 监听编辑器中的 `@query` 模式
- 通过设置项维护多个 BibTeX 文件路径，支持逗号、分号和换行分隔
- 相对路径优先相对当前正在编辑的 Markdown 文件目录解析，无法确定当前文件时再回退到 Typora 进程当前目录
- 读取并解析配置中的 `.bib` 文件，提取 `key`、`title`、`author`、`year`、`journal` 等字段用于搜索和展示
- 插入行为只写入 `@citationKey`，也不修改任何 `.bib` 文件

## 当前状态

- 当前仓库非常精简，核心逻辑集中在 [`main.js`](D:\Desktop\bibtex-citation\main.js)，尚未拆分模块
- 根目录目前没有 `src/`、测试目录、构建产物目录或自动化检查脚本
- `package.json` 当前仅保留一个占位性质的 `npm run build`，插件不再依赖原生模块构建
- 最近提交主要集中在 README 与演示资源更新，尚未看到测试或发布流程相关文件
- 当前 Git 工作区存在本地修改，主要是本轮对 BibTeX-only 功能裁剪的改动

### 已知实现特征

- 只会检索设置中列出的 BibTeX 文件，不依赖外部文献管理器或 SQLite
- BibTeX 文件列表通过单个文本设置项维护，支持逗号、分号和换行混合分隔
- 若多个 BibTeX 文件存在相同 citation key，以配置列表中更靠前的文件为准
- 当前解析器是轻量实现，主要面向常见 BibTeX 条目与字段

## 计划

### 当前优先事项

- 先维护好根目录 `AGENTS.md`，确保后续会话能快速恢复上下文
- 如果继续开发，优先验证设置页对多个路径输入的可用性与易用性
- 补充最小可执行的调试流程说明，尤其是 BibTeX 文件路径配置与检索结果验证
- 品牌迁移已完成，后续重点转为改进路径解析与检索体验

### 建议后续改进

- 将 [`main.js`](D:\Desktop\bibtex-citation\main.js) 拆分为设置、BibTeX 解析、建议渲染等模块
- 为 BibTeX 解析与检索排序提取更细的纯函数，降低对 Typora 运行时的耦合，便于测试
- 增加至少一层手工验证清单或自动化测试脚本，覆盖：
  - 多个 `.bib` 文件加载成功
  - `@query` 候选项检索
  - 重复 citation key 的优先级行为
- 统一 README 中的安装路径、平台差异和实际代码行为

## 资源

### 常用文件

- 插件入口：[main.js](D:\Desktop\bibtex-citation\main.js)
- 插件清单：[manifest.json](D:\Desktop\bibtex-citation\manifest.json)
- 依赖配置：[package.json](D:\Desktop\bibtex-citation\package.json)
- 使用说明：[README.md](D:\Desktop\bibtex-citation\README.md)

### 常用命令

- 安装依赖：`npm install`
- 运行项目定义的构建流程：`npm run build`
- 查看当前 Git 状态：`git status --short --branch`

### 调试与排查提示

- 先确认 Typora 已启用 Community Plugin Framework，再检查本插件是否出现在插件列表中
- 若候选项不出现，先检查设置页里的 BibTeX 文件路径是否正确；相对路径默认相对当前 Markdown 文件目录解析
- 若检索结果异常，优先检查 BibTeX 条目格式是否属于常见写法，以及是否存在重复 citation key
