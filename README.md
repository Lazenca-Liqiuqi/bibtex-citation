# bibtex-citation

`bibtex-citation` 是一个 Typora Community Plugin 插件，用于在 Typora 中输入 `@` 时，从一个或多个已配置的本地 BibTeX 文件中检索文献条目，并插入对应的引用键。

插件只会读取你在设置中配置的 `.bib` 文件，并在选中候选项后插入 `@citationKey`。它不会修改任何 `.bib` 文件，也不依赖外部参考文献管理器、SQLite、原生 Node 模块或第三方 npm 包。

当前文档对应发布版本：`0.1.1`。

## 功能概览

- 从一个或多个本地 `.bib` 文件检索文献
- 支持按 `citation key`、标题、作者、期刊、年份等字段搜索
- 在 Typora 中输入 `@` 触发候选列表
- 多个 BibTeX 路径支持逐条添加、编辑、删除
- 相对路径支持多种解析基准模式
- 当多个 BibTeX 文件存在相同 `citation key` 时，以配置列表中更靠前的文件为准

## 环境要求

- Typora
- Typora Community Plugin Framework
- 一个或多个本地 `.bib` 文件

## 安装

### 依赖前提

1. 安装并启用 Typora Community Plugin Framework
   - 项目地址：<https://github.com/typora-community-plugin/typora-community-plugin>
2. 准备至少一个本地 `.bib` 文件

### 安装插件

将本仓库克隆或复制到 Typora 插件目录，并确保插件目录名为 `bibtex-citation`。

#### Windows

```powershell
cd $env:UserProfile\.typora\community-plugins\
git clone https://github.com/Lazenca-Liqiuqi/bibtex-citation.git bibtex-citation
```

#### macOS / Linux

```bash
cd ~/.config/Typora/plugins/plugins/
git clone https://github.com/Lazenca-Liqiuqi/bibtex-citation.git bibtex-citation
```

这个精简后的插件不需要额外安装依赖，也不需要执行构建步骤。把插件目录放到正确位置后即可。

### 启用插件

1. 打开 Typora
2. 使用 `Ctrl + .` 打开全局设置
3. 进入 Community Plugins 页面
4. 在已安装插件列表中启用 `BibTeX Citations`

## 配置 BibTeX 文件路径

启用插件后，打开插件设置，可以在 `BibTeX Files` 区域逐条维护 `.bib` 文件路径。

推荐流程：

1. 在 `Path Base` 中选择路径解析方式
2. 在输入框中填写一个 `.bib` 文件路径
3. 点击 `Add BibTeX File` 添加到列表
4. 如需修改已有路径，直接编辑对应输入框
5. 如需删除某项，点击该行右侧的 `Remove`

可填写的路径示例：

```text
./references.bib
../bib/library.bib
D:/Literature/shared.bib
```

当前支持 3 种路径基准模式：

- `Relative to the current Markdown file`
- `Relative to the folder currently opened in Typora`
- `Absolute paths only`

## 使用教学

### 1. 准备 BibTeX 条目

确保你的 `.bib` 文件包含常见的 BibTeX 条目，例如：

```bibtex
@article{smith2024example,
  title   = {An Example Paper},
  author  = {Smith, John},
  year    = {2024},
  journal = {Journal of Examples}
}
```

### 2. 在 Typora 中输入 `@`

在 Markdown 文档中输入 `@`，然后继续输入检索关键词。你可以按以下信息搜索：

- `citation key`
- 标题
- 作者
- 期刊
- 年份

例如：

```text
@smith
@2024
@example
```

### 3. 选择候选项并插入引用

插件会弹出候选列表。使用方向键选择目标条目后按回车，即可插入：

```text
@smith2024example
```

插件只会插入引用键，不会自动展开完整参考文献格式，也不会修改原始 `.bib` 文件。

## 相对路径解析规则

如果你在设置中填写的是相对路径，插件会按照 `Path Base` 的配置决定解析基准。

- 选择 `Relative to the current Markdown file` 时，会优先以当前正在编辑的 Markdown 文件所在目录为基准
- 选择 `Relative to the folder currently opened in Typora` 时，会以 Typora 当前打开的目录为基准
- 选择 `Absolute paths only` 时，只接受绝对路径；相对路径不会被加载

例如，当前文档路径为：

```text
D:/Projects/paper/notes/chapter1.md
```

而你配置的是：

```text
../references/library.bib
```

那么插件会优先解析到：

```text
D:/Projects/paper/references/library.bib
```

如果当前 Markdown 文件路径无法确定，而你选择的是第一种模式，插件会回退到 Typora 当前打开的目录或进程工作目录继续解析。

## 重复 citation key 的优先级

如果多个已配置的 BibTeX 文件中存在相同的 `citation key`，插件会保留配置顺序更靠前的那个条目，后面的同名条目会被忽略。

例如你配置了：

```text
primary.bib
secondary.bib
```

若两个文件都包含 `smith2024example`，最终会以 `primary.bib` 中的条目为准。

## 常见排查

### 输入 `@` 后没有出现候选项

- 确认 Typora Community Plugin Framework 已正确启用
- 确认 `BibTeX Citations` 插件已启用
- 确认 `BibTeX Files` 中填写的路径真实存在且可读取
- 如果使用相对路径，确认路径是相对于当前 Markdown 文件目录而不是其他目录

### 检索结果不完整或不准确

- 检查 `.bib` 文件是否为常见 BibTeX 写法
- 检查条目是否包含 `title`、`author`、`year`、`journal`、`journaltitle`、`booktitle`、`publisher` 等常见字段
- 检查是否存在重复的 `citation key`

### 某个 BibTeX 文件没有生效

- 检查多个路径之间的分隔是否正确
- 检查文件扩展名是否为 `.bib`
- 检查路径是否存在拼写错误或权限问题
- 插件会跳过缺失或不可读取的 BibTeX 文件，并在控制台给出警告

## 说明

- 插件 ID：`bibtex-citation`
- 插件名称：`BibTeX Citations`
- 当前版本：`0.1.0`
- 支持平台：Windows、Linux、macOS
- 本仓库和本地插件目录都应使用名称 `bibtex-citation`
