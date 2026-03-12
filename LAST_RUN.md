# LAST_RUN

## 日期

- 2026-03-12

## 已完成

- 为 citation 渲染增加了受控 citation 块，渲染后会保留原始 `[@key]` 在注释中
- 新增 `Restore Citations / 恢复`，可以把受控 citation 块还原成原始 `[@key]` / `[@a; @b]`
- 抽出了统一引用源提取逻辑，当前会同时识别正文里的严格 `[@key]` 和受控 citation 块中的原始 `[@key]`
- `Insert / Update Bibliography` 已适配受控 citation 块；渲染后不恢复也能继续生成或更新参考文献
- 当前文档引用统计已适配受控 citation 块；渲染前、渲染后、恢复后的统计保持一致
- 侧边栏按钮布局已调整为两组七三开：`渲染引用/恢复` 与 `插入/更新参考文献/删除`

## 主要方法与工具

- `Get-Content src\\csl\\render.js`
- `Get-Content src\\csl\\citation-blocks.js`
- `Get-Content src\\csl\\bibliography.js`
- `Get-Content src\\document\\state.js`
- `Get-Content src\\sidebar\\panel.js`
- `Get-Content src\\i18n.js`
- `Get-Content README.md`
- `Get-ChildItem -Recurse .\\src -Filter *.js | ForEach-Object { node --check $_.FullName }`
- `node --input-type=module -` 最小样例：验证渲染后 bibliography 可用、统计前后保持一致、恢复后内容可逆
- `apply_patch`

## 当前任务

- bibliography、统计与恢复链路已经接通受控 citation 块
- 下一步更值得继续的是：围绕受控 citation 块补“更新已渲染 citation”的能力，或者继续扩更复杂的 CSL 引用语法

## 下次继续

- 在 Typora 真机中回归：渲染后直接插 bibliography、恢复后再插 bibliography、统计数字前后一致
- 如果继续完善 citation 工作流，优先设计“更新已有受控 citation 块”的操作，而不是重新要求用户先恢复
- 若继续扩展 CSL 能力，优先评估 locator、prefix/suffix 与 note-style 的支持边界
