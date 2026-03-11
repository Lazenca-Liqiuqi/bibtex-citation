/**
 * 功能：维护当前 Markdown 文档的轻量状态缓存，避免重复统计引用信息。
 * 输入：构造后通过 `getCitationCount(markdown)` 接收当前文档内容。
 * 输出：返回当前文档中的唯一引用条数与总引用次数。
 */
export class CurrentDocumentState {
  constructor() {
    this.clear();
  }

  /**
   * 功能：清空当前文档状态缓存。
   * 输入：无。
   * 输出：无返回值。
   */
  clear() {
    this.lastMarkdown = null;
    this.citationCount = { unique: 0, total: 0 };
  }

  /**
   * 功能：按当前 Markdown 内容统计引用信息，并复用最近一次结果。
   * 输入：当前文档 Markdown 文本。
   * 输出：包含唯一引用条数与总引用次数的对象。
   */
  getCitationCount(markdown) {
    if (!markdown) {
      this.lastMarkdown = markdown || "";
      this.citationCount = { unique: 0, total: 0 };
      return this.citationCount;
    }

    if (markdown === this.lastMarkdown) {
      return this.citationCount;
    }

    const keys = new Set();
    let total = 0;
    const bracketPattern = /\[[\s\S]*?\]/g;
    const citationPattern = /@([^\s\],;]+)/g;

    for (const block of markdown.match(bracketPattern) || []) {
      let match = citationPattern.exec(block);
      while (match) {
        keys.add(match[1]);
        total += 1;
        match = citationPattern.exec(block);
      }
      citationPattern.lastIndex = 0;
    }

    this.lastMarkdown = markdown;
    this.citationCount = { unique: keys.size, total };
    return this.citationCount;
  }
}
