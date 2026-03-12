export const CITATION_START_MARKER = "<!-- bibtex-citation:citation:start ";
export const CITATION_END_MARKER = "<!-- bibtex-citation:citation:end -->";

/**
 * 功能：构造受控 citation 块的全局匹配正则。
 * 输入：无。
 * 输出：用于扫描整篇 Markdown 的 RegExp 实例。
 */
export function createControlledCitationPattern() {
  return new RegExp(
    `${escapeRegex(CITATION_START_MARKER)}([\\s\\S]*?) -->([\\s\\S]*?)${escapeRegex(CITATION_END_MARKER)}`,
    "g",
  );
}

/**
 * 功能：清洗将要写入 HTML 注释的原始 citation block，避免意外闭合注释。
 * 输入：原始 citation block 文本。
 * 输出：可安全放进注释的字符串。
 */
export function escapeControlledCitationPayload(text) {
  return String(text || "").replace(/-->/g, "--&gt;");
}

/**
 * 功能：把受控注释中的原始 citation payload 恢复为可写回 Markdown 的文本。
 * 输入：受控注释中记录的 citation payload。
 * 输出：还原后的 citation block。
 */
export function unescapeControlledCitationPayload(text) {
  return String(text || "").replace(/--&gt;/g, "-->");
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
