# LAST_RUN

## 日期

- 2026-03-12

## 已完成

- 修复了 CSL 动作前校验：现在 `Render Citations` 和 `Insert / Update Bibliography` 会重新扫描全文，遇到未知 key 或非法 citation block 会直接报错并停止
- 修复了 HTML 注释中的 `[@key]` 被误计入扫描的问题；注释里的 citation 现在不会参与引用统计、CSL 校验、citation 渲染或 bibliography 提取
- 统一了 bibliography 的对外与内部语义：界面文案改为“插入/更新参考文献”，内部命名改为 `upsert bibliography`
- 新增“删除参考文献”功能，只删除本插件生成的受控 bibliography 块，不删除用户手写的普通参考文献段落
- 收紧了侧边栏文案与布局：去掉标题区、合并底部提示，并把“插入/更新参考文献”和“删除”放到同一行，当前按钮宽度约为七三开

## 主要方法与工具

- `Get-Content src\\plugin.js`
- `Get-Content src\\document\\brackets.js`
- `Get-Content src\\csl\\citation-blocks.js`
- `Get-Content src\\csl\\bibliography.js`
- `Get-Content src\\sidebar\\panel.js`
- `Get-Content src\\i18n.js`
- `Get-Content style.css`
- `rg -n "insertBibliography|upsertBibliography|removeBibliography|citation block" src README.md`
- `node --check src\\plugin.js`
- `node --check src\\sidebar\\panel.js`
- `node --check src\\csl\\bibliography.js`
- `node --check src\\i18n.js`
- `node --input-type=module -` 最小样例：验证 HTML 注释忽略、受控 bibliography 删除行为
- `apply_patch`

## 当前任务

- bibliography 的插入、更新、删除和非法块拦截已经接通，但 citation 仍是“替换式渲染”，执行后会抹掉原始 `@key`
- 下一步的主线仍然是让 citation 渲染后保留原始 key，避免 bibliography 与后续更新失去持久真源

## 下次继续

- 设计 citation 的受控块格式，在渲染后保留原始 `[@key]`
- 在 Typora 真机中回归 bibliography 的插入、更新、删除、非法块拦截和注释忽略行为
- 如需继续调整侧边栏布局，沿用当前“前两个按钮整行、bibliography 与删除同行七三开”的样式约定
