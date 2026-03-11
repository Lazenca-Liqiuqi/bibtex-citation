const { SettingTab, Notice } = window[Symbol.for("typora-plugin-core@v2")];

import { DISPLAY_LANGUAGE, PATH_BASE_MODE } from "../constants.js";
import { shouldRejectRelativePath } from "../bibtex/path-resolver.js";
import { parseBibFileList, serializeBibFileList } from "../bibtex/settings.js";

/**
 * 功能：渲染并维护插件设置页中的路径基准与 BibTeX 文件列表。
 * 输入：构造时接收插件实例。
 * 输出：供插件注册的 SettingTab 子类实例。
 */
export class BibCitationSettingTab extends SettingTab {
  constructor(plugin) {
    super();
    this.plugin = plugin;
  }

  get name() {
    return this.plugin.i18n.t.pluginName;
  }

  onload() {
    this.render();
  }

  render() {
    const t = this.plugin.i18n.t;
    const plugin = this.plugin;
    const container = this.containerEl || this.contentEl || this.tabContentEl;

    container.empty?.();
    if (!container.empty) {
      container.innerHTML = "";
    }

    this.addSetting((s) => {
      s.addName(t.settings.language.name);
      s.addDescription(t.settings.language.desc);
      s.addSelect((select) => {
        const options = [
          [DISPLAY_LANGUAGE.EN, t.settings.language.en],
          [DISPLAY_LANGUAGE.ZH_CN, t.settings.language.zhCn],
        ];
        const selectEl = $(select);
        options.forEach(([value, label]) => {
          selectEl.append(
            $("<option>")
              .attr("value", value)
              .text(label),
          );
        });
        selectEl.val(plugin.settings.get("displayLanguage"));
        selectEl.on("change", (event) => {
          const value = $(event.target).val();
          plugin.settings.set("displayLanguage", value);
          plugin.refreshI18n();
          plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
          this.render();
          new Notice(plugin.i18n.t.settingsSaved);
        });
      });
    });

    this.addSetting((s) => {
      s.addName(t.settings.pathBase.name);
      s.addDescription(t.settings.pathBase.desc);
      s.addSelect((select) => {
        const options = [
          [PATH_BASE_MODE.MARKDOWN, t.settings.pathBase.markdown],
          [PATH_BASE_MODE.TYPORA, t.settings.pathBase.typora],
          [PATH_BASE_MODE.ABSOLUTE, t.settings.pathBase.absolute],
        ];
        const selectEl = $(select);
        options.forEach(([value, label]) => {
          selectEl.append(
            $("<option>")
              .attr("value", value)
              .text(label),
          );
        });
        selectEl.val(plugin.settings.get("pathBase"));
        selectEl.on("change", (event) => {
          const value = $(event.target).val();
          plugin.settings.set("pathBase", value);
          plugin.invalidateLibrary();
          plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
          this.render();
          new Notice(t.settingsSaved);
        });
      });
    });

    this.addSetting((s) => {
      s.addName(t.settings.bibFiles.name);
      s.addDescription(t.settings.bibFiles.desc);
    });

    const listHost = document.createElement("div");
    listHost.className = "bibtex-setting-list";
    container.appendChild(listHost);

    const bibFiles = parseBibFileList(plugin.settings.get("bibFiles"));
    if (!bibFiles.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "bibtex-setting-empty";
      emptyState.textContent = t.settings.bibFiles.empty;
      listHost.appendChild(emptyState);
    }

    bibFiles.forEach((bibFile, index) => {
      const row = document.createElement("div");
      row.className = "bibtex-setting-row";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "bibtex-setting-input";
      input.value = bibFile;
      input.placeholder = t.settings.bibFiles.placeholder;
      input.addEventListener("change", () => {
        if (shouldRejectRelativePath(plugin, input.value)) {
          new Notice(t.absolutePathRequired);
          input.value = bibFile;
          return;
        }

        const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
        nextFiles[index] = input.value.trim();
        plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
        plugin.invalidateLibrary();
        plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
        this.render();
        new Notice(t.settingsSaved);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "bibtex-setting-remove";
      removeButton.textContent = t.settings.bibFiles.remove;
      removeButton.addEventListener("click", () => {
        const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
        nextFiles.splice(index, 1);
        plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
        plugin.invalidateLibrary();
        plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
        this.render();
        new Notice(t.settingsSaved);
      });

      row.appendChild(input);
      row.appendChild(removeButton);
      listHost.appendChild(row);
    });

    const addRow = document.createElement("div");
    addRow.className = "bibtex-setting-add-row";

    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.className = "bibtex-setting-input";
    addInput.placeholder = t.settings.bibFiles.placeholder;

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "bibtex-setting-add";
    addButton.textContent = t.settings.bibFiles.add;
    addButton.addEventListener("click", () => {
      const nextValue = addInput.value.trim();
      if (!nextValue) {
        new Notice(t.emptyPathWarning);
        return;
      }

      if (shouldRejectRelativePath(plugin, nextValue)) {
        new Notice(t.absolutePathRequired);
        return;
      }

      const nextFiles = parseBibFileList(plugin.settings.get("bibFiles"));
      nextFiles.push(nextValue);
      plugin.settings.set("bibFiles", serializeBibFileList(nextFiles));
      plugin.invalidateLibrary();
      plugin.sidebarPanel?.render?.({ allowLibraryLoad: false });
      this.render();
      new Notice(t.settingsSaved);
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addButton);
    container.appendChild(addRow);
  }
}
