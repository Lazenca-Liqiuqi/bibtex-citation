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
   * 输出：包含唯一条数与总次数的统计对象。
   */
  getCurrentDocumentCitationCount() {
    const markdown = window.editor?.getMarkdown?.() || "";
    return this.documentState.getCitationCount(markdown);
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
