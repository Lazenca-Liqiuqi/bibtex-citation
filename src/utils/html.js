/**
 * 功能：将输入中的连续空白压缩为单个空格并去掉首尾空白。
 * 输入：任意可转成字符串的值。
 * 输出：规范化后的字符串。
 */
export function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

/**
 * 功能：将较长文本整理为适合提示或摘要展示的单行字符串。
 * 输入：任意可转成字符串的值，以及可选的最大长度。
 * 输出：压缩空白后的摘要字符串；超长时会在末尾追加省略号。
 */
export function summarizeText(value, maxLength = 80) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return normalized.slice(0, Math.max(0, maxLength - 3)) + "...";
}

/**
 * 功能：转义 HTML 特殊字符，避免候选项渲染时被当成标签解析。
 * 输入：任意可转成字符串的值。
 * 输出：安全的 HTML 文本字符串。
 */
export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
