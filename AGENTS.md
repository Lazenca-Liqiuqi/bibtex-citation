# AGENTS.md

## 项目基本信息

- 项目名称：`bibtex-citation`
- 当前工作区目录名与 Git 远程仓库名均已迁移为 `bibtex-citation`
- 项目类型：Typora Community Plugin 插件
- 当前发布目标版本：`0.1.2`
- 主要功能：在 Typora 的方括号引用语法中输入 `@query` 时，从配置的多个 BibTeX 文件中检索文献条目并插入引用键
- 运行依赖：
  - Typora Community Plugin Framework
  - 一个或多个本地 `.bib` 文件
  - Node.js `>=22`
- 插件元数据入口：
  - [`manifest.json`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\manifest.json)
  - [`main.js`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js)

## 目录结构

- [`main.js`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js)：插件主入口，包含设置页、BibTeX 解析、引用建议与插件注册
- [`style.css`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\style.css)：建议列表样式与深色主题样式
- [`manifest.json`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\manifest.json)：Typora 插件清单，声明插件 ID、版本和平台
- [`package.json`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\package.json)：Node 依赖声明与运行时要求
- [`package-lock.json`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\package-lock.json)：锁定依赖版本
- [`README.md`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\README.md)：安装、配置与基础使用说明

## 技术栈与技术路线

### 技术栈

- JavaScript（ES Module 风格）
- Typora Community Plugin Core API
- Node.js 内置模块：`fs`
- CSS：候选列表样式

### 技术路线

- 通过 `EditorSuggest` 监听未闭合方括号引用中的 `@query` 模式
- 通过设置项维护多个 BibTeX 文件路径，支持逗号、分号和换行分隔
- 相对路径优先相对当前正在编辑的 Markdown 文件目录解析，无法确定当前文件时再回退到 Typora 进程当前目录
- 读取并解析配置中的 `.bib` 文件，提取 `key`、`title`、`author`、`year`、`journal` 等字段用于搜索和展示
- 插入行为只写入 `@citationKey`，也不修改任何 `.bib` 文件

## 当前状态

- 当前仓库非常精简，核心逻辑集中在 [`main.js`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js)，尚未拆分模块
- 根目录目前没有 `src/`、测试目录、构建产物目录或自动化检查脚本
- `package.json` 当前仅保留一个占位性质的 `npm run build`，插件不再依赖原生模块构建
- 最近提交已包含 `v0.1.0`、`v0.1.1` 与候选列表交互修复，当前工作区主要是 `v0.1.2` 修订版本的发布收尾
- 仓库已完成 `v0.1.1` 发布，当前正在整理并发布 `v0.1.2`，重点覆盖候选列表交互与引用触发规则的修订
- 当前候选栏样式、点击选择、回车插入与越界修正已基本稳定，本轮额外确认了触发规则应收敛到方括号引用语法而非正文裸 `@`

### 已知实现特征

- 只会检索设置中列出的 BibTeX 文件，不依赖外部文献管理器或 SQLite
- BibTeX 文件列表通过单个文本设置项维护，支持逗号、分号和换行混合分隔
- 若多个 BibTeX 文件存在相同 citation key，以配置列表中更靠前的文件为准
- 当前解析器是轻量实现，主要面向常见 BibTeX 条目与字段
- 设置页当前已改为逐条添加、编辑、删除 BibTeX 路径，底层仍序列化为换行分隔字符串
- `README.md` 已同步当前设置页交互与路径基准模式说明
- 插件作者元数据当前统一为 `Lazenca-Liqiuqi`，不再使用早期遗留的 `adam`
- 项目记忆中的文件路径应统一指向当前 Typora 插件目录，不再引用旧的 `D:\Desktop\bibtex-citation`
- 候选项当前使用 HTML 字符串渲染而不是返回 DOM 节点，否则 Typora 建议列表会显示 `object HTMLDivElement`
- 候选项第一行是最多两行的标题，第二行是“年份标签 + 作者列表”，作者最多两行后截断
- 待选框宽度同时受插件样式与宿主 `.auto-suggest-container` / `.typ-suggestion` 约束
- 待选框越界修正当前通过 `transform: translateX(...)` 在显示后做一次性水平夹取，避免重复改写 `left` 导致位置漂移
- 候选栏当前只在未闭合的方括号引用中触发，例如 `[@key` 或 `[@a; @b`；正文里的裸 `@key` 不再触发
- 鼠标点击候选项当前依赖文档级捕获阶段 `mousedown` 兜底插入，并在后续短时间内吞掉 `mouseup/click`，避免点击后额外换行
- 当候选栏打开但宿主没有真实选中项时，`Enter` 当前会直接插入第一条真实建议；这条行为是显式兜底，不代表宿主真的选中了第一项
- “展开时默认真选中第一项” 已尝试过类名、模拟按键、hover 事件和最小运行时探针，最终放弃；后续除非重新接受这条需求，否则不要再继续在这条路线上投入时间

## 计划

### 当前优先事项

- 先维护好根目录 `AGENTS.md`，确保后续会话能快速恢复上下文
- 如果继续开发，优先验证设置页对多个路径输入的可用性与易用性
- 补充最小可执行的调试流程说明，尤其是 BibTeX 文件路径配置与检索结果验证
- 品牌迁移已完成，后续重点转为改进路径解析与检索体验
- 继续补充最小可执行的发布与回归验证说明，尤其是首次发布后的手工检查步骤
- 持续验证待选框在靠右输入、误按回车、重新聚焦后重新触发时的定位稳定性
- 如果继续美化，优先细化年份标签、选中态和列表整体层次，而不是继续放大候选框宽度
- 若继续完善引用工作流，优先围绕 `[@a; @b]` 这类多文献场景做手工回归，而不是恢复正文裸 `@` 触发

### 建议后续改进

- 将 [`main.js`](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js) 拆分为设置、BibTeX 解析、建议渲染等模块
- 为 BibTeX 解析与检索排序提取更细的纯函数，降低对 Typora 运行时的耦合，便于测试
- 增加至少一层手工验证清单或自动化测试脚本，覆盖：
  - 多个 `.bib` 文件加载成功
  - `@query` 候选项检索
  - 重复 citation key 的优先级行为
- 统一 README 中的安装路径、平台差异和实际代码行为

## 资源

### 常用文件

- 插件入口：[main.js](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\main.js)
- 插件清单：[manifest.json](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\manifest.json)
- 依赖配置：[package.json](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\package.json)
- 使用说明：[README.md](C:\Users\pc\.typora\community-plugins\plugins\bibtex-citation\README.md)

### 常用命令

- 安装依赖：`npm install`
- 运行项目定义的构建流程：`npm run build`
- 查看当前 Git 状态：`git status --short --branch`
- 检查作者、路径与仓库信息残留：`rg -n -S "adam|D:\\Desktop\\bibtex-citation|zotero|Zotero" .`
- 检查主入口语法：`node --check main.js`
- 检查候选栏触发与点击兜底相关实现：`rg -n "findQuery|handleSuggestEnterKey|handleSuggestPointerDown|transform = `translateX|getSelectedBibtexSuggestionKey" main.js`

### 调试与排查提示

- 先确认 Typora 已启用 Community Plugin Framework，再检查本插件是否出现在插件列表中
- 若候选项不出现，先检查设置页里的 BibTeX 文件路径是否正确；相对路径默认相对当前 Markdown 文件目录解析
- 若检索结果异常，优先检查 BibTeX 条目格式是否属于常见写法，以及是否存在重复 citation key
- 若候选项渲染异常，先确认 `renderSuggestion` 仍返回 HTML 字符串而不是 DOM 节点
- 若待选框位置异常，优先检查 `clampSuggestContainerToViewport` 是否还在使用 `transform` 而非累积改写 `left`
- 若用户反馈“回车能插入第一项但视觉上没真选中”，先记住这是已知取舍，不要再用伪高亮冒充宿主真选中态
