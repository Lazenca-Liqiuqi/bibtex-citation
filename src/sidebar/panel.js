const { SidebarPanel } = window[Symbol.for("typora-plugin-core@v2")];

import { PATH_BASE_MODE } from "../constants.js";
import { parseBibFileList } from "../bibtex/settings.js";

/**
 * 功能：提供 BibTeX 配置概览侧边栏，并在活动栏注册入口按钮。
 * 输入：插件实例，用于读取设置与触发缓存刷新。
 * 输出：可注册到 Typora 侧边栏的面板实例。
 */
export class BibCitationSidebarPanel extends SidebarPanel {
  constructor(plugin) {
    super();
    this.plugin = plugin;
    this.containerEl = document.createElement("section");
    this.containerEl.className = "bibtex-sidebar-panel";

    this.addRibbonButton({
      id: `${plugin.manifest.id}.sidebar`,
      title: plugin.i18n.t.sidebar.title,
      icon: createRibbonIcon(),
      className: "bibtex-sidebar-ribbon-button",
    });
  }

  /**
   * 功能：在面板显示时按最新设置重新渲染概览内容。
   * 输入：无。
   * 输出：无返回值。
   */
  onshow() {
    this.render();
  }

  /**
   * 功能：根据当前配置、缓存状态与 BibTeX 解析结果构建面板内容。
   * 输入：无。
   * 输出：无返回值。
   */
  render(options = {}) {
    const { allowLibraryLoad = true } = options;
    const t = this.plugin.i18n.t.sidebar;
    const paths = parseBibFileList(this.plugin.settings.get("bibFiles"));
    const pathBase = this.plugin.settings.get("pathBase");
    const citedCount = this.plugin.getCurrentDocumentCitationCount();

    let entryCount = 0;
    let loadError = "";

    if (allowLibraryLoad) {
      try {
        entryCount = this.plugin.getBibEntries().length;
      } catch (error) {
        loadError = error?.message || String(error);
      }
    } else {
      entryCount = null;
    }

    const sections = [
      createHeading(t.heading, t.description),
      createSummaryGrid([
        [t.pathBaseLabel, getPathBaseLabel(pathBase, this.plugin.i18n.t.settings.pathBase)],
        [t.configuredFilesLabel, String(paths.length)],
        [t.indexedEntriesLabel, loadError || entryCount === null ? t.unavailable : String(entryCount)],
        [t.citedEntriesLabel, formatCitationCount(t.citationCountFormat, citedCount)],
      ]),
      createActions([[t.refreshButton, () => this.handleRefresh()]]),
      loadError ? createError(t.loadErrorPrefix + loadError) : null,
      paths.length ? createPathList(paths, t.filesTitle) : createEmpty(t.empty),
      createFootnote(t.triggerHint),
      createFootnote(t.duplicateHint),
      createFootnote(t.citationCountHint),
    ].filter(Boolean);

    this.containerEl.innerHTML = "";
    this.containerEl.append(...sections);
  }

  /**
   * 功能：清空缓存并立刻刷新面板展示。
   * 说明：这里走的是手动强制重读路径，会直接调用 `reloadLibraryNow()`。
   * 输入：无。
   * 输出：无返回值。
   */
  handleRefresh() {
    this.plugin.reloadLibraryNow();
  }
}

function createRibbonIcon() {
  const icon = document.createElement("i");
  icon.className = "fa fa-book";
  return icon;
}

function createHeading(title, description) {
  const wrapper = document.createElement("div");
  wrapper.className = "bibtex-sidebar-section";

  const heading = document.createElement("h3");
  heading.className = "bibtex-sidebar-title";
  heading.textContent = title;

  const desc = document.createElement("p");
  desc.className = "bibtex-sidebar-description";
  desc.textContent = description;

  wrapper.append(heading, desc);
  return wrapper;
}

function createSummaryGrid(items) {
  const wrapper = document.createElement("dl");
  wrapper.className = "bibtex-sidebar-summary";

  for (const [label, value] of items) {
    const row = document.createElement("div");
    row.className = "bibtex-sidebar-summary-row";

    const dt = document.createElement("dt");
    dt.textContent = label;

    const dd = document.createElement("dd");
    dd.textContent = value;

    row.append(dt, dd);
    wrapper.append(row);
  }

  return wrapper;
}

function createActions(actions) {
  const wrapper = document.createElement("div");
  wrapper.className = "bibtex-sidebar-actions";

  for (const [label, onClick] of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-default bibtex-sidebar-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    wrapper.append(button);
  }

  return wrapper;
}

function createError(text) {
  const el = document.createElement("p");
  el.className = "bibtex-sidebar-error";
  el.textContent = text;
  return el;
}

function createEmpty(text) {
  const el = document.createElement("p");
  el.className = "bibtex-sidebar-empty";
  el.textContent = text;
  return el;
}

function createPathList(paths, titleText) {
  const wrapper = document.createElement("div");
  wrapper.className = "bibtex-sidebar-section";

  const title = document.createElement("h4");
  title.className = "bibtex-sidebar-subtitle";
  title.textContent = titleText;

  const list = document.createElement("ol");
  list.className = "bibtex-sidebar-path-list";

  for (const path of paths) {
    const item = document.createElement("li");
    item.className = "bibtex-sidebar-path-item";
    item.textContent = path;
    item.title = path;
    list.append(item);
  }

  wrapper.append(title, list);
  return wrapper;
}

function createFootnote(text) {
  const el = document.createElement("p");
  el.className = "bibtex-sidebar-footnote";
  el.textContent = text;
  return el;
}

function getPathBaseLabel(pathBase, labels) {
  switch (pathBase) {
    case PATH_BASE_MODE.TYPORA:
      return labels.typora;
    case PATH_BASE_MODE.ABSOLUTE:
      return labels.absolute;
    case PATH_BASE_MODE.MARKDOWN:
    default:
      return labels.markdown;
  }
}

function formatCitationCount(template, counts) {
  return String(template)
    .replace("{unique}", String(counts.unique))
    .replace("{total}", String(counts.total));
}
