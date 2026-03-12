import { toCslItem } from "./item.js";
import { getPluginRequire } from "./runtime.js";
import {
  collectCitationSourcesFromMarkdown,
  collectUniqueCitationKeys,
} from "./citation-blocks.js";

const pluginRequire = getPluginRequire();
const { Cite } = pluginRequire("@citation-js/core");

const BIBLIOGRAPHY_START_MARKER = "<!-- bibtex-citation:bibliography:start -->";
const BIBLIOGRAPHY_END_MARKER = "<!-- bibtex-citation:bibliography:end -->";
const BIBLIOGRAPHY_BLOCK_PATTERN = new RegExp(
  `${escapeRegex(BIBLIOGRAPHY_START_MARKER)}[\\s\\S]*?${escapeRegex(BIBLIOGRAPHY_END_MARKER)}`,
  "m",
);

/**
 * 功能：根据当前文档中的合法 citation key 插入或更新参考文献块。
 * 输入：Markdown 文本、BibTeX 条目数组、已注册的 CSL 模板名、参考文献标题。
 * 输出：返回改写后的 Markdown 与更新统计。
 */
export function upsertBibliographyMarkdown(markdown, entries, templateName, headingText) {
  const source = String(markdown || "");
  const entryMap = new Map(entries.map((entry) => [entry.key, entry]));
  const citationSources = collectCitationSourcesFromMarkdown(source, (key) => entryMap.has(key));
  if (!citationSources.length) {
    return createBibliographyResult(source);
  }

  const keys = collectUniqueCitationKeys(citationSources);
  if (!keys.length) {
    return createBibliographyResult(source);
  }

  const cite = new Cite(keys.map((key) => toCslItem(entryMap.get(key))));
  const bibliographyHtml = String(
    cite.format("bibliography", {
      template: templateName,
      format: "html",
    }) || "",
  ).trim();
  if (!bibliographyHtml) {
    return createBibliographyResult(source);
  }

  const bibliographyBlock = buildBibliographyBlock(headingText, bibliographyHtml);
  const markdownWithBibliography = upsertBibliographyBlock(source, bibliographyBlock);

  return createBibliographyResult(
    markdownWithBibliography,
    markdownWithBibliography !== source,
    keys.length,
  );
}

/**
 * 功能：删除当前文档中由本插件生成的受控参考文献块。
 * 输入：Markdown 文本。
 * 输出：返回删除后的 Markdown 与是否发生改动。
 */
export function removeBibliographyMarkdown(markdown) {
  const source = String(markdown || "");
  if (!BIBLIOGRAPHY_BLOCK_PATTERN.test(source)) {
    return createBibliographyResult(source);
  }

  const nextMarkdown = source
    .replace(/\n?\s*<!-- bibtex-citation:bibliography:start -->[\s\S]*?<!-- bibtex-citation:bibliography:end -->\s*\n?/m, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return createBibliographyResult(`${nextMarkdown}\n`, true);
}

function createBibliographyResult(markdown, changed = false, keyCount = 0) {
  return {
    markdown,
    changed,
    keyCount,
  };
}

function buildBibliographyBlock(headingText, bibliographyHtml) {
  const normalizedHeading = String(headingText || "").trim() || "References";
  return [
    BIBLIOGRAPHY_START_MARKER,
    `## ${normalizedHeading}`,
    "",
    bibliographyHtml,
    BIBLIOGRAPHY_END_MARKER,
  ].join("\n");
}

function upsertBibliographyBlock(markdown, bibliographyBlock) {
  const source = String(markdown || "");
  if (BIBLIOGRAPHY_BLOCK_PATTERN.test(source)) {
    return source.replace(BIBLIOGRAPHY_BLOCK_PATTERN, bibliographyBlock);
  }

  const trimmed = source.replace(/\s+$/, "");
  return `${trimmed}\n\n${bibliographyBlock}\n`;
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
