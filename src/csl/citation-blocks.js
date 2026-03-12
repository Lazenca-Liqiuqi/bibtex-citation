import { extractClosedBracketRanges } from "../document/brackets.js";
import {
  createControlledCitationPattern,
  unescapeControlledCitationPayload,
} from "./controlled-citations.js";

/**
 * 功能：解析严格合法的 CSL 引用块，仅接受 `[@key]` 或 `[@a; @b]` 形式。
 * 输入：单个闭合方括号块文本。
 * 输出：返回 citation key 数组；若不符合严格语法则返回 null。
 */
export function parseStrictCitationKeys(blockText) {
  if (!blockText.startsWith("[") || !blockText.endsWith("]")) {
    return null;
  }

  const inner = blockText.slice(1, -1).trim();
  if (!inner || !/^@([^\s\],;]+)(\s*;\s*@([^\s\],;]+))*$/.test(inner)) {
    return null;
  }

  return inner
    .split(/\s*;\s*/)
    .map((segment) => segment.replace(/^@/, "").trim())
    .filter(Boolean);
}

/**
 * 功能：从闭合方括号范围中筛选所有严格合法且 key 可解析的 citation block。
 * 输入：闭合方括号范围数组、用于校验 key 是否存在的函数。
 * 输出：返回可安全参与 CSL 渲染的引用块数组。
 */
export function collectValidCitationBlocksFromRanges(ranges, isKnownKey) {
  return ranges
    .map((range) => {
      const keys = parseStrictCitationKeys(range.text);
      if (!keys || !keys.every((key) => isKnownKey(key))) {
        return null;
      }

      return {
        range,
        keys,
      };
    })
    .filter(Boolean);
}

/**
 * 功能：直接从 Markdown 中提取严格合法且 key 可解析的 citation block。
 * 输入：Markdown 文本、用于校验 key 是否存在的函数。
 * 输出：返回可安全参与 CSL 渲染的引用块数组。
 */
export function collectValidCitationBlocksFromMarkdown(markdown, isKnownKey) {
  const ranges = extractClosedBracketRanges(String(markdown || ""));
  return collectValidCitationBlocksFromRanges(ranges, isKnownKey);
}

/**
 * 功能：从受控 citation 注释中提取严格合法且 key 可解析的 citation block。
 * 输入：Markdown 文本、用于校验 key 是否存在的函数。
 * 输出：返回来自受控 citation 块的引用源数组。
 */
export function collectValidControlledCitationBlocksFromMarkdown(markdown, isKnownKey) {
  const source = String(markdown || "");
  const pattern = createControlledCitationPattern();
  const validBlocks = [];
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const rawCitationBlock = unescapeControlledCitationPayload(match[1]);
    const keys = parseStrictCitationKeys(rawCitationBlock);
    if (!keys || !keys.every((key) => isKnownKey(key))) {
      continue;
    }

    validBlocks.push({
      range: {
        start: match.index,
        end: match.index + match[0].length,
        text: rawCitationBlock,
      },
      keys,
      sourceType: "controlled",
    });
  }

  return validBlocks;
}

/**
 * 功能：统一提取当前 Markdown 中可参与后续流程的引用源。
 * 说明：同时识别正文里的严格 `[@key]` 块与受控 citation 注释中的原始 `[@key]`。
 * 输入：Markdown 文本、用于校验 key 是否存在的函数。
 * 输出：按文档出现顺序返回统一引用源数组。
 */
export function collectCitationSourcesFromMarkdown(markdown, isKnownKey) {
  const source = String(markdown || "");
  const visibleBlocks = collectValidCitationBlocksFromMarkdown(source, isKnownKey).map((block) => ({
    ...block,
    sourceType: "visible",
  }));
  const controlledBlocks = collectValidControlledCitationBlocksFromMarkdown(source, isKnownKey);

  return [...visibleBlocks, ...controlledBlocks].sort((left, right) => {
    if (left.range.start !== right.range.start) {
      return left.range.start - right.range.start;
    }

    if (left.sourceType === right.sourceType) {
      return 0;
    }

    return left.sourceType === "visible" ? -1 : 1;
  });
}

/**
 * 功能：按首次出现顺序从合法 citation block 中提取唯一 key 列表。
 * 输入：合法 citation block 数组。
 * 输出：去重后且保留首次出现顺序的 key 数组。
 */
export function collectUniqueCitationKeys(validCitationBlocks) {
  const keys = [];
  const seen = new Set();

  for (const block of validCitationBlocks) {
    for (const key of block.keys) {
      if (!seen.has(key)) {
        seen.add(key);
        keys.push(key);
      }
    }
  }

  return keys;
}

/**
 * 功能：检查当前 Markdown 中是否存在会阻止 CSL 操作继续执行的非法引用块。
 * 说明：只要某个闭合方括号块中出现 `@`，就要求它必须满足严格的
 * `[@key]` / `[@a; @b]` 语法，且所有 key 都存在于当前文献库。
 * 输入：Markdown 文本、用于校验 key 是否存在的函数。
 * 输出：若存在问题则返回首个问题描述，否则返回 null。
 */
export function findFirstInvalidCitationProblem(markdown, isKnownKey) {
  const source = String(markdown || "");
  const ranges = extractClosedBracketRanges(source);

  for (const range of ranges) {
    if (!range.text.includes("@")) {
      continue;
    }

    const keys = parseStrictCitationKeys(range.text);
    if (!keys) {
      return {
        type: "invalid-block",
        blockText: range.text,
      };
    }

    const unknownKey = keys.find((key) => !isKnownKey(key));
    if (unknownKey) {
      return {
        type: "unknown-key",
        key: unknownKey,
        blockText: range.text,
      };
    }
  }

  const controlledPattern = createControlledCitationPattern();
  let match;
  while ((match = controlledPattern.exec(source)) !== null) {
    const rawCitationBlock = unescapeControlledCitationPayload(match[1]);
    const keys = parseStrictCitationKeys(rawCitationBlock);
    if (!keys) {
      return {
        type: "invalid-block",
        blockText: rawCitationBlock,
      };
    }

    const unknownKey = keys.find((key) => !isKnownKey(key));
    if (unknownKey) {
      return {
        type: "unknown-key",
        key: unknownKey,
        blockText: rawCitationBlock,
      };
    }
  }

  return null;
}
