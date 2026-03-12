const { Plugin } = window[Symbol.for("typora-plugin-core@v2")];

import { DEFAULT_SETTINGS, DISPLAY_LANGUAGE, PATH_BASE_MODE } from "./constants.js";
import { createI18n } from "./i18n.js";
import { BibEntryStore } from "./bibtex/store.js";
import { CurrentDocumentState } from "./document/state.js";
import { parseBibFileList, serializeBibFileList } from "./bibtex/settings.js";
import { BibCitationSettingTab } from "./settings/tab.js";
import { BibCitationSidebarPanel } from "./sidebar/panel.js";
import { BibCitationSuggest } from "./suggest/suggest.js";
import { registerSuggestInteractions } from "./suggest/interactions.js";
import { findFirstInvalidCitationProblem } from "./csl/citation-blocks.js";
import { summarizeText } from "./utils/html.js";

/**
 * 功能：作为插件主控类，组合设置页、BibTeX 存储与候选建议模块。
 * 输入：由 Typora Community Plugin Framework 在加载时实例化。
 * 输出：完成插件初始化与生命周期注册的插件对象。
 */
export default class BibCitationPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.i18n = createI18n();
    this.bibStore = new BibEntryStore(this);
    this.documentState = new CurrentDocumentState();
    this._sidebarRefreshScheduled = false;
    this._citationStateRefreshScheduled = false;
  }

  /**
   * 功能：根据当前设置重建国际化实例，供设置页与侧边栏即时切换语言。
   * 输入：无。
   * 输出：无返回值。
   */
  refreshI18n() {
    this.i18n = createI18n(
      this.settings?.get("displayLanguage") || DISPLAY_LANGUAGE.ZH_CN,
    );
  }

  /**
   * 功能：将 BibTeX 文献库标记为失效，等待下一次 `getBibEntries()` 懒加载时重新读取。
   * 说明：这个方法本身不会立即触发文件系统读取，适合设置项变更后的轻量失效通知。
   * 输入：无。
   * 输出：无返回值。
   */
  invalidateLibrary() {
    this.bibStore.clear();
  }

  /**
   * 功能：清空当前 Markdown 文档的轻量状态缓存。
   * 输入：无。
   * 输出：无返回值。
   */
  resetDocumentState() {
    this.documentState.clear();
  }

  /**
   * 功能：获取当前文档引用统计，并复用轻量状态缓存。
   * 输入：无。
   * 输出：包含唯一条数、总次数与错误信息的对象。
   */
  getCurrentDocumentCitationState() {
    const markdown = window.editor?.getMarkdown?.() || "";
    const validCitationKeys = this.bibStore.getEntryKeySet();
    return this.documentState.getCitationState(markdown, validCitationKeys);
  }

  /**
   * 功能：把当前文档中严格合法的 `[@key]` / `[@a; @b]` 引用块渲染为 CSL 文中引用。
   * 输入：无。
   * 输出：返回本次渲染结果与改写统计。
   */
  async renderCurrentDocumentCitations() {
    this.ensureNoInvalidCitationKeysForCslAction();
    const markdown = window.editor?.getMarkdown?.() || "";
    const entries = this.getBibEntries();
    const [{ ensureCslTemplate }, { renderCitationMarkdown }] = await Promise.all([
      import("./csl/assets.js"),
      import("./csl/render.js"),
    ]);
    const templateName = ensureCslTemplate(this);
    const result = renderCitationMarkdown(markdown, entries, templateName);
    if (!result.changed) {
      return result;
    }

    const reloadContent = window.File?.reloadContent;
    if (typeof reloadContent !== "function") {
      throw new Error(this.i18n.t.sidebar.renderReloadUnavailable);
    }

    reloadContent(result.markdown, false, true, false, true);
    this.resetDocumentState();
    this.sidebarPanel?.render?.();
    return result;
  }

  /**
   * 功能：把当前文档中的受控 citation 块恢复为原始 `[@key]` 文本。
   * 输入：无。
   * 输出：返回本次恢复结果与统计。
   */
  async restoreCurrentDocumentCitations() {
    const markdown = window.editor?.getMarkdown?.() || "";
    const { restoreCitationMarkdown } = await import("./csl/render.js");
    const result = restoreCitationMarkdown(markdown);
    if (!result.changed) {
      return result;
    }

    const reloadContent = window.File?.reloadContent;
    if (typeof reloadContent !== "function") {
      throw new Error(this.i18n.t.sidebar.renderReloadUnavailable);
    }

    reloadContent(result.markdown, false, true, false, true);
    this.resetDocumentState();
    this.sidebarPanel?.render?.();
    return result;
  }

  /**
   * 功能：根据当前文档中的合法 citation key 生成或更新参考文献块。
   * 输入：无。
   * 输出：返回本次插入结果与引用 key 统计。
   */
  async upsertCurrentDocumentBibliography() {
    this.ensureNoInvalidCitationKeysForCslAction();
    const markdown = window.editor?.getMarkdown?.() || "";
    const entries = this.getBibEntries();
    const [{ ensureCslTemplate }, { upsertBibliographyMarkdown }] = await Promise.all([
      import("./csl/assets.js"),
      import("./csl/bibliography.js"),
    ]);
    const templateName = ensureCslTemplate(this);
    const result = upsertBibliographyMarkdown(
      markdown,
      entries,
      templateName,
      this.i18n.t.sidebar.bibliographyHeading,
    );
    if (!result.changed) {
      return result;
    }

    const reloadContent = window.File?.reloadContent;
    if (typeof reloadContent !== "function") {
      throw new Error(this.i18n.t.sidebar.renderReloadUnavailable);
    }

    reloadContent(result.markdown, false, true, false, true);
    this.resetDocumentState();
    this.sidebarPanel?.render?.();
    return result;
  }

  /**
   * 功能：删除当前文档中由本插件生成的受控参考文献块。
   * 输入：无。
   * 输出：返回本次删除结果。
   */
  async removeCurrentDocumentBibliography() {
    const markdown = window.editor?.getMarkdown?.() || "";
    const { removeBibliographyMarkdown } = await import("./csl/bibliography.js");
    const result = removeBibliographyMarkdown(markdown);
    if (!result.changed) {
      return result;
    }

    const reloadContent = window.File?.reloadContent;
    if (typeof reloadContent !== "function") {
      throw new Error(this.i18n.t.sidebar.renderReloadUnavailable);
    }

    reloadContent(result.markdown, false, true, false, true);
    this.resetDocumentState();
    this.sidebarPanel?.render?.();
    return result;
  }

  /**
   * 功能：在执行 CSL 相关文档改写前，阻止包含非法 citation key 的文档继续处理。
   * 输入：无。
   * 输出：若发现非法 citation key，则抛出错误；否则无返回值。
   */
  ensureNoInvalidCitationKeysForCslAction() {
    const markdown = window.editor?.getMarkdown?.() || "";
    const entries = this.getBibEntries();
    const entryKeySet = new Set(entries.map((entry) => entry.key));
    const invalidProblem = findFirstInvalidCitationProblem(
      markdown,
      (key) => entryKeySet.has(key),
    );
    if (!invalidProblem) {
      return;
    }

    if (invalidProblem.type === "unknown-key") {
      throw new Error(
        this.i18n.t.sidebar.invalidCitationPrefix + invalidProblem.key,
      );
    }

    throw new Error(
      this.i18n.t.sidebar.invalidCitationBlockPrefix
        + summarizeText(invalidProblem.blockText),
    );
  }

  /**
   * 功能：立即重新加载 BibTeX 文献库，并刷新相关视图。
   * 说明：当前显式入口是侧边栏 `Refresh Cache` 按钮；它会先失效缓存，再主动调用
   * `getBibEntries()` 触发一次同步重读，和单纯的 `invalidateLibrary()` 不同。
   * 输入：无。
   * 输出：无返回值。
   */
  reloadLibraryNow() {
    this.invalidateLibrary();
    this.getBibEntries();
    this.sidebarPanel?.render?.();
  }

  /**
   * 功能：在文献库懒加载完成后，异步刷新一次侧边栏，避免状态停留在“待刷新”。
   * 输入：无。
   * 输出：无返回值。
   */
  scheduleSidebarRefresh() {
    if (this._sidebarRefreshScheduled) {
      return;
    }

    this._sidebarRefreshScheduled = true;
    window.requestAnimationFrame(() => {
      this._sidebarRefreshScheduled = false;
      this.sidebarPanel?.render?.();
    });
  }

  /**
   * 功能：在编辑器中的 `]` 发生输入或删除后，异步重算当前文档引用统计并刷新侧边栏。
   * 输入：无。
   * 输出：无返回值。
   */
  scheduleCitationStateRefresh() {
    if (this._citationStateRefreshScheduled) {
      return;
    }

    this._citationStateRefreshScheduled = true;
    window.requestAnimationFrame(() => {
      this._citationStateRefreshScheduled = false;
      this.resetDocumentState();
      this.sidebarPanel?.render?.();
    });
  }

  /**
   * 功能：获取当前可用于检索与展示的 BibTeX 条目列表。
   * 说明：如果文献库此前已被 `invalidateLibrary()` 标记失效，这里会触发一次懒加载重读。
   * 输入：无。
   * 输出：去重后的文献条目数组。
   */
  getBibEntries() {
    const hadMergedEntries = this.bibStore.hasMergedEntries();
    const entries = this.bibStore.getEntries();
    if (!hadMergedEntries && this.bibStore.hasMergedEntries()) {
      this.scheduleSidebarRefresh();
    }
    return entries;
  }

  /**
   * 功能：注册设置、建议器与交互事件，完成插件启动。
   * 输入：无，由宿主在加载阶段调用。
   * 输出：Promise<void>。
   */
  async onload() {
    this.registerSettings(
      new window[Symbol.for("typora-plugin-core@v2")].PluginSettings(
        this.app,
        this.manifest,
        { version: 1 },
      ),
    );
    this.settings.setDefault(DEFAULT_SETTINGS);
    this.settings.set(
      "bibFiles",
      serializeBibFileList(parseBibFileList(this.settings.get("bibFiles"))),
    );
    this.settings.set(
      "pathBase",
      this.settings.get("pathBase") || PATH_BASE_MODE.MARKDOWN,
    );
    this.settings.set(
      "displayLanguage",
      this.settings.get("displayLanguage") || DISPLAY_LANGUAGE.ZH_CN,
    );
    this.refreshI18n();

    this.registerSettingTab(new BibCitationSettingTab(this));
    this.sidebarPanel = new BibCitationSidebarPanel(this);
    this.register(this.app.workspace.sidebar.addPanel(this.sidebarPanel));

    this._suggest = null;
    registerSuggestInteractions(this);

    const suggest = new BibCitationSuggest(this.app, this);
    this._suggest = suggest;
    this.registerMarkdownSugguest(suggest);
  }
}
