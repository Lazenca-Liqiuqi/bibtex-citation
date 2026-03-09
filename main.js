const { Plugin, SettingTab, Component, EditorSuggest, I18n, Notice } =
  window[Symbol.for("typora-plugin-core@v2")];
const fs = window.reqnode("fs");
const path = window.reqnode("path");

const MAX_SUGGESTIONS = 50;
const PATH_BASE_MODE = {
  MARKDOWN: "markdown",
  TYPORA: "typora",
  ABSOLUTE: "absolute",
};

// 设置层继续使用字符串存储，避免宿主对复杂结构兼容性不一致
function parseBibFileList(value) {
  return String(value || "")
    .split(/[\r\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeBibFileList(items) {
  return items.map((item) => String(item || "").trim()).filter(Boolean).join("\n");
}

function getActiveMarkdownPath() {
  const activeNode = document.querySelector(
    ".file-library-node.file-library-file-node.active",
  );
  if (activeNode) {
    const activePath = activeNode.getAttribute("data-path");
    if (activePath && activePath.endsWith(".md")) {
      return activePath;
    }
  }

  const titleMatch = document.title.match(/(.+\.md)/);
  if (titleMatch) {
    return titleMatch[1];
  }

  return null;
}

function getTyporaBasePath(plugin) {
  const vaultPath = plugin?.app?.vault?.path;
  if (vaultPath) {
    return vaultPath;
  }

  return process.cwd();
}

function shouldRejectRelativePath(plugin, filePath) {
  return (
    plugin.settings.get("pathBase") === PATH_BASE_MODE.ABSOLUTE &&
    !path.isAbsolute(String(filePath || "").trim())
  );
}

function resolveBibFilePath(rawPath, plugin) {
  const trimmedPath = String(rawPath || "").trim();
  if (!trimmedPath) return "";
  if (path.isAbsolute(trimmedPath)) return trimmedPath;

  const pathBase = plugin.settings.get("pathBase");

  if (pathBase === PATH_BASE_MODE.ABSOLUTE) {
    return "";
  }

  if (pathBase === PATH_BASE_MODE.MARKDOWN) {
    const activeMarkdownPath = getActiveMarkdownPath();
    if (activeMarkdownPath) {
      return path.resolve(path.dirname(activeMarkdownPath), trimmedPath);
    }
  }

  return path.resolve(getTyporaBasePath(plugin), trimmedPath);
}

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseBibValue(rawValue) {
  if (!rawValue) return "";

  const value = normalizeWhitespace(rawValue);
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith('"') && value.endsWith('"'))
  ) {
    return normalizeWhitespace(value.slice(1, -1));
  }

  return value;
}

// 这里使用轻量级 BibTeX 解析，只提取检索与展示所需的常见字段
function parseBibEntries(content, sourcePath) {
  const entries = [];
  const entryRegex = /@(\w+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)\n?\}\s*(?=@|$)/g;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const [, type, key, body] = match;
    const fields = {};
    const fieldRegex = /(\w+)\s*=\s*({(?:[^{}]|{[^{}]*})*}|"[^"]*"|[^,\n]+)\s*,?/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(body)) !== null) {
      fields[fieldMatch[1].toLowerCase()] = parseBibValue(fieldMatch[2]);
    }

    entries.push({
      key: key.trim(),
      type: type.toLowerCase(),
      title: fields.title || "",
      authors: fields.author || "",
      year: fields.year || fields.date || "",
      journal: fields.journal || fields.journaltitle || fields.booktitle || "",
      publisher: fields.publisher || "",
      sourcePath,
      searchText: normalizeWhitespace(
        [
          key,
          fields.title,
          fields.author,
          fields.year,
          fields.date,
          fields.journal,
          fields.journaltitle,
          fields.booktitle,
          fields.publisher,
        ].join(" "),
      ).toLowerCase(),
    });
  }

  return entries;
}

const i18n = new I18n({
  resources: {
    en: {
      commandInsert: "Insert BibTeX Citation",
      fileNotFound: "BibTeX file not found: ",
      noFilesConfigured: "Please configure at least one BibTeX file path.",
      loadError: "Failed to load BibTeX files: ",
      settingsSaved: "Settings updated.",
      emptyPathWarning: "Please enter a BibTeX file path first.",
      absolutePathRequired:
        "This path mode only accepts absolute BibTeX file paths.",
      settings: {
        pathBase: {
          name: "Path Base",
          desc: "Choose how non-absolute BibTeX file paths should be resolved.",
          markdown: "Relative to the current Markdown file",
          typora: "Relative to the folder currently opened in Typora",
          absolute: "Absolute paths only",
        },
        bibFiles: {
          name: "BibTeX Files",
          desc: "Manage BibTeX file paths one by one. The order controls duplicate citation key priority.",
          add: "Add BibTeX File",
          empty: "No BibTeX files configured yet.",
          placeholder: "./references.bib",
          remove: "Remove",
        },
      },
    },
  },
});

class BibCitationSettingTab extends SettingTab {
  constructor(plugin) {
    super();
    this.plugin = plugin;
  }

  get name() {
    return "BibTeX Citations";
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
          plugin.resetCache();
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
        plugin.resetCache();
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
        plugin.resetCache();
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
      plugin.resetCache();
      this.render();
      new Notice(t.settingsSaved);
    });

    addRow.appendChild(addInput);
    addRow.appendChild(addButton);
    container.appendChild(addRow);
  }
}

class BibCitationSuggest extends EditorSuggest {
  constructor(app, plugin) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.triggerText = "@";
  }

  findQuery(text) {
    const match = text.match(/@([^@\s]*)$/);
    return { isMatched: !!match, query: match ? match[1] : "" };
  }

  getSuggestions(query) {
    if (!query) return [];

    const normalizedQuery = query.toLowerCase();
    const entries = this.plugin.getBibEntries();

    return entries
      .filter((item) => item.searchText.includes(normalizedQuery))
      .sort((a, b) => {
        const aStarts = a.key.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        const bStarts = b.key.toLowerCase().startsWith(normalizedQuery) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.key.localeCompare(b.key);
      })
      .slice(0, MAX_SUGGESTIONS);
  }

  getSuggestionId(item) {
    return item.key;
  }

  renderSuggestion(item) {
    let label = `@${item.key}`;
    const meta = [item.title, item.authors, item.year].filter(Boolean).join(" ");
    if (meta) label += ` — ${meta}`;
    return label.trim();
  }

  beforeApply(item) {
    return `@${item.key}`;
  }
}

class SuggestionManager extends Component {
  constructor(app, plugin) {
    super();
    this.app = app;
    this.plugin = plugin;
  }

  onload() {
    const suggest = new BibCitationSuggest(this.app, this.plugin);
    this.register(this.app.workspace.activeEditor.suggestion.register(suggest));
  }
}

const DEFAULT_SETTINGS = {
  bibFiles: "",
  pathBase: PATH_BASE_MODE.MARKDOWN,
};

class BibCitationPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.i18n = i18n;
    this.bibCache = new Map();
  }

  resetCache() {
    this.bibCache.clear();
  }

  getBibEntries() {
    const bibFiles = parseBibFileList(this.settings.get("bibFiles"));

    if (!bibFiles.length) return [];

    const merged = [];
    const seenKeys = new Set();

    for (const bibFile of bibFiles) {
      const resolvedPath = resolveBibFilePath(bibFile, this);

      if (!resolvedPath) {
        console.warn(this.i18n.t.absolutePathRequired);
        continue;
      }

      if (!fs.existsSync(resolvedPath)) {
        console.warn(this.i18n.t.fileNotFound + resolvedPath);
        continue;
      }

      try {
        const stat = fs.statSync(resolvedPath);
        const cacheItem = this.bibCache.get(resolvedPath);

        if (!cacheItem || cacheItem.mtimeMs !== stat.mtimeMs) {
          const content = fs.readFileSync(resolvedPath, "utf8");
          this.bibCache.set(resolvedPath, {
            mtimeMs: stat.mtimeMs,
            entries: parseBibEntries(content, resolvedPath),
          });
        }

        const { entries } = this.bibCache.get(resolvedPath);
        for (const entry of entries) {
          if (seenKeys.has(entry.key)) continue;
          seenKeys.add(entry.key);
          merged.push(entry);
        }
      } catch (error) {
        console.error(this.i18n.t.loadError + resolvedPath, error);
      }
    }

    return merged;
  }

  async onload() {
    this.registerSettings(
      new window[Symbol.for("typora-plugin-core@v2")].PluginSettings(
        this.app,
        this.manifest,
        { version: 1 },
      ),
    );
    this.settings.setDefault(DEFAULT_SETTINGS);
    this.settings.set("bibFiles", serializeBibFileList(parseBibFileList(this.settings.get("bibFiles"))));
    this.settings.set(
      "pathBase",
      this.settings.get("pathBase") || PATH_BASE_MODE.MARKDOWN,
    );

    this.registerSettingTab(new BibCitationSettingTab(this));
    this.addChild(new SuggestionManager(this.app, this));
  }
}

export default BibCitationPlugin;
