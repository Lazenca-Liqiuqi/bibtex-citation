import { toCslItem } from "./item.js";
import { getPluginRequire } from "./runtime.js";
import { extractClosedBracketRanges } from "../document/brackets.js";
import { collectValidCitationBlocksFromRanges, parseStrictCitationKeys } from "./citation-blocks.js";
import {
  CITATION_END_MARKER,
  CITATION_START_MARKER,
  createControlledCitationPattern,
  escapeControlledCitationPayload,
  unescapeControlledCitationPayload,
} from "./controlled-citations.js";

const pluginRequire = getPluginRequire();
const { Cite } = pluginRequire("@citation-js/core");
const CONTROLLED_CITATION_PATTERN = createControlledCitationPattern();

/**
 * 功能：把当前文档中严格匹配 `[@key; @other]` 的合法引用块渲染为 CSL 文中引用。
 * 输入：Markdown 文本、BibTeX 条目数组、已注册的 CSL 模板名。
 * 输出：返回改写后的 Markdown 与渲染统计。
 */
export function renderCitationMarkdown(markdown, entries, templateName) {
  const source = String(markdown || "");
  const ranges = extractClosedBracketRanges(source);
  if (!ranges.length) {
    return createRenderResult(source);
  }

  const entryMap = new Map(entries.map((entry) => [entry.key, entry]));
  const validCitationBlocks = collectValidCitationBlocks(ranges, entryMap);
  const cite = createCitationFormatter(validCitationBlocks, entryMap);
  const citationOrder = createCitationOrder(validCitationBlocks, cite, templateName);
  let cursor = 0;
  let changed = false;
  let renderedBlocks = 0;
  let renderedKeys = 0;
  let output = "";

  for (const range of ranges) {
    output += source.slice(cursor, range.start);

    const citationBlock = validCitationBlocks.find((block) => block.range === range);
    if (!citationBlock || !cite) {
      output += range.text;
      cursor = range.end;
      continue;
    }

    output += buildControlledCitationBlock(
      citationBlock.range.text,
      renderCitationCluster(
        cite,
        citationBlock,
        validCitationBlocks,
        citationOrder,
        templateName,
      ),
    );
    changed = true;
    renderedBlocks += 1;
    renderedKeys += citationBlock.keys.length;
    cursor = range.end;
  }

  output += source.slice(cursor);
  return createRenderResult(
    changed ? output : source,
    changed,
    renderedBlocks,
    renderedKeys,
  );
}

/**
 * 功能：把受控 citation 块恢复为原始 `[@key]` / `[@a; @b]` 文本。
 * 输入：Markdown 文本。
 * 输出：返回恢复后的 Markdown 与恢复统计。
 */
export function restoreCitationMarkdown(markdown) {
  const source = String(markdown || "");
  let restoredBlocks = 0;
  let restoredKeys = 0;

  const nextMarkdown = source.replace(CONTROLLED_CITATION_PATTERN, (_, rawCitationBlock) => {
    const restoredBlock = unescapeControlledCitationPayload(rawCitationBlock);
    const keys = parseStrictCitationKeys(restoredBlock) || [];
    restoredBlocks += 1;
    restoredKeys += keys.length;
    return restoredBlock;
  });

  return createRenderResult(
    nextMarkdown,
    nextMarkdown !== source,
    restoredBlocks,
    restoredKeys,
  );
}

function createRenderResult(markdown, changed = false, renderedBlocks = 0, renderedKeys = 0) {
  return {
    markdown,
    changed,
    renderedBlocks,
    renderedKeys,
  };
}

/**
 * 功能：为渲染后的 citation 文本包上一层受控注释块，同时保留原始 `[@key]`。
 * 输入：原始 citation block 文本、渲染后的 citation HTML。
 * 输出：可直接写回 Markdown 的受控 citation 块字符串。
 */
function buildControlledCitationBlock(rawCitationBlock, renderedCitationHtml) {
  return `${CITATION_START_MARKER}${escapeControlledCitationPayload(rawCitationBlock)} -->${renderedCitationHtml}${CITATION_END_MARKER}`;
}

/**
 * 功能：收集当前文档中可安全渲染的合法引用块。
 * 输入：闭合方括号范围列表、BibTeX 条目映射。
 * 输出：仅包含所有 key 都存在于文献库中的引用块描述数组。
 */
function collectValidCitationBlocks(ranges, entryMap) {
  return collectValidCitationBlocksFromRanges(ranges, (key) => entryMap.has(key));
}

/**
 * 功能：基于整篇文档里所有合法引用块创建统一的 Citation.js 渲染器。
 * 输入：合法引用块列表、BibTeX 条目映射。
 * 输出：可复用的 Cite 实例；若没有合法引用块则返回 null。
 */
function createCitationFormatter(validCitationBlocks, entryMap) {
  if (!validCitationBlocks.length) {
    return null;
  }

  const citationItems = new Map();
  for (const citationBlock of validCitationBlocks) {
    for (const key of citationBlock.keys) {
      if (!citationItems.has(key)) {
        citationItems.set(key, toCslItem(entryMap.get(key)));
      }
    }
  }

  return new Cite(Array.from(citationItems.values()));
}

/**
 * 功能：根据当前样式的参考文献排序结果，为 citation key 建立稳定顺序。
 * 输入：合法引用块列表、Cite 实例、样式模板名。
 * 输出：key 到排序序号的映射；若无法生成则返回空映射。
 */
function createCitationOrder(validCitationBlocks, cite, templateName) {
  if (!cite || !validCitationBlocks.length) {
    return new Map();
  }

  const bibliographyEntries = cite.format("bibliography", {
    template: templateName,
    format: "text",
    asEntryArray: true,
  });

  return new Map(
    bibliographyEntries.map(([id], index) => [id, index]),
  );
}

/**
 * 功能：在整篇文档上下文中渲染单个引用块，保证同作者同年的消歧结果稳定。
 * 输入：Cite 实例、当前引用块、整篇文档的合法引用块列表、引用排序映射、样式模板名。
 * 输出：当前引用块对应的文中引用字符串。
 */
function renderCitationCluster(
  cite,
  citationBlock,
  validCitationBlocks,
  citationOrder,
  templateName,
) {
  const blockIndex = validCitationBlocks.indexOf(citationBlock);
  const citationsPre = validCitationBlocks
    .slice(0, blockIndex)
    .map((block) => sortCitationKeys(block.keys, citationOrder));
  const citationsPost = validCitationBlocks
    .slice(blockIndex + 1)
    .map((block) => sortCitationKeys(block.keys, citationOrder));

  return cite.format("citation", {
    template: templateName,
    format: "html",
    entry: sortCitationKeys(citationBlock.keys, citationOrder),
    citationsPre,
    citationsPost,
  });
}

/**
 * 功能：按样式推导出的参考文献顺序重排当前引用块中的 key。
 * 输入：引用 key 列表、key 到排序序号的映射。
 * 输出：排序后的新 key 列表；未知 key 保持在末尾并按原相对顺序保留。
 */
function sortCitationKeys(keys, citationOrder) {
  return [...keys].sort((left, right) => {
    const leftOrder = citationOrder.has(left) ? citationOrder.get(left) : Number.MAX_SAFE_INTEGER;
    const rightOrder = citationOrder.has(right) ? citationOrder.get(right) : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}
