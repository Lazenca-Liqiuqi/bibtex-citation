const { Plugin, SettingTab, Component, EditorSuggest, I18n, Notice } =
  window[Symbol.for("typora-plugin-core@v2")];
const fs = window.reqnode("fs");
const os = window.reqnode("os");
const path = window.reqnode("path");

// Helper to require from plugin's local node_modules
function requireLocal(moduleName) {
  const pluginDir = path.join(
    process.env.HOME || process.env.USERPROFILE,
    ".config",
    "Typora",
    "plugins",
    "plugins",
    "zotero-citation",
  );
  const modulePath = path.join(pluginDir, "node_modules", moduleName);

  try {
    return require(modulePath);
  } catch (e) {
    try {
      return window.reqnode(modulePath);
    } catch (e2) {
      const Module = window.reqnode("module");
      const m = new Module(modulePath);
      m.filename = modulePath;
      m.paths = Module._nodeModulePaths(pluginDir);
      m.load(modulePath);
      return m.exports;
    }
  }
}

// i18n
const i18n = new I18n({
  resources: {
    en: {
      commandInsert: "Insert Zotero Citation",
      dbNotFound: "Database not found",
      bibNotFound:
        "No .bib file found in current document folder. Citation not appended.",
      exporting: "Exporting from database...",
      exportError: "Export failed: ",
      fileError: "Error reading citations file: ",
      settings: {
        dbPath: {
          name: "Better BibTeX DB Path",
          desc: "Path to better-bibtex.sqlite",
        },
        zoteroDbPath: { name: "Zotero DB Path", desc: "Path to zotero.sqlite" },
      },
    },
  },
});

// Settings Tab
class ZoteroSettingTab extends SettingTab {
  constructor(plugin) {
    super();
    this.plugin = plugin;
  }

  get name() {
    return "Zotero Citations";
  }

  onload() {
    this.render();
  }

  render() {
    const t = this.plugin.i18n.t;
    const plugin = this.plugin;

    this.addSetting((s) => {
      s.addName(t.settings.dbPath.name);
      s.addDescription(t.settings.dbPath.desc);
      s.addText((text) => {
        text.value = plugin.settings.get("dbPath");
        text.placeholder = "/home/adam/Zotero/better-bibtex.sqlite";
        text.onblur = () => plugin.settings.set("dbPath", text.value);
      });
    });

    this.addSetting((s) => {
      s.addName(t.settings.zoteroDbPath.name);
      s.addDescription(t.settings.zoteroDbPath.desc);
      s.addText((text) => {
        text.value = plugin.settings.get("zoteroDbPath");
        text.placeholder = "/home/adam/Zotero/zotero.sqlite";
        text.onblur = () => plugin.settings.set("zoteroDbPath", text.value);
      });
    });
  }
}

// Citation Suggest
class ZoteroCitationSuggest extends EditorSuggest {
  constructor(app, plugin) {
    super();
    this.app = app;
    this.plugin = plugin;
    this.triggerText = "@";
    this.bbtDb = null;
    this.zoteroDb = null;
  }

  ensureDbs() {
    if (!this.bbtDb) {
      const Database = requireLocal("better-sqlite3");
      this.bbtDb = new Database(this.plugin.settings.get("dbPath"), {
        readonly: true,
      });
    }
    if (!this.zoteroDb) {
      const Database = requireLocal("better-sqlite3");
      this.zoteroDb = new Database(this.plugin.settings.get("zoteroDbPath"), {
        readonly: true,
      });
    }
  }

  findQuery(text) {
    const match = text.match(/@([^@\s]*)$/);
    return { isMatched: !!match, query: match ? match[1] : "" };
  }

  getSuggestions(query) {
    if (!query) return [];
    this.ensureDbs();

    const stmt = this.bbtDb.prepare(`
      SELECT citationKey, itemKey
      FROM citationkey
      WHERE citationKey LIKE ?
      LIMIT 50
    `);
    const rows = stmt.all(`%${query}%`);

    return rows.map((r) => {
      let title = "",
        authors = "",
        year = "",
        type = "misc",
        doi = "",
        url = "",
        journal = "",
        publisher = "";
      try {
        // Get metadata from zotero.sqlite
        const metaStmt = this.zoteroDb.prepare(`
          SELECT items.key AS itemKey,
                 itemTypes.typeName AS typeName,
                 parentItemDataValues.value AS fieldValue,
                 fields.fieldName AS fieldName
          FROM items
            INNER JOIN itemTypes ON items.itemTypeID = itemTypes.itemTypeID
            INNER JOIN itemData AS parentItemData ON parentItemData.itemID = items.itemID
            INNER JOIN itemDataValues AS parentItemDataValues ON parentItemData.valueID = parentItemDataValues.valueID
            INNER JOIN fields ON parentItemData.fieldID = fields.fieldID
          WHERE items.key = ?
        `);
        const metaRows = metaStmt.all(r.itemKey);

        type = "misc";
        for (const row of metaRows) {
          switch (row.fieldName.toLowerCase()) {
            case "title":
              title = row.fieldValue;
              break;
            case "date":
              year = row.fieldValue.split("-")[0];
              break;
            case "author":
              authors = row.fieldValue;
              break;
            case "doi":
              doi = row.fieldValue;
              break;
            case "url":
              url = row.fieldValue;
              break;
            case "journal":
              journal = row.fieldValue;
              break;
            case "publisher":
              publisher = row.fieldValue;
              break;
          }
          type = row.typeName.toLowerCase() || "misc";
        }
      } catch (e) {
        console.warn("Zotero metadata error:", e.message);
      }

      return {
        key: r.citationKey,
        title,
        authors,
        year,
        type,
        doi,
        url,
        journal,
        publisher,
        itemKey: r.itemKey, // add itemKey so we can use it later
      };
    });
  }

  getSuggestionId(item) {
    return item.key;
  }

  renderSuggestion(item) {
    let label = `@${item.key}`;
    const meta = [item.title, item.authors, item.year]
      .filter(Boolean)
      .join(" ");
    if (meta) label += ` — ${meta}`;
    return label.trim();
  }
  beforeApply(item) {
    this.appendToBib(item);
    return `@${item.key}`;
  }

  getCurrentFilePath() {
    // Look for the active file node in Typora's file tree
    const activeNode = document.querySelector(
      ".file-library-node.file-library-file-node.active"
    );

    if (activeNode) {
      const path = activeNode.getAttribute("data-path");
      if (path && path.endsWith(".md")) {
        console.log("Detected current markdown file path:", path);
        return path;
      }
    }

    // Fallback: try to detect from window title (sometimes contains filename)
    const titleMatch = document.title.match(/(.+\.md)/);
    if (titleMatch) {
      console.log("Detected markdown path from title:", titleMatch[1]);
      return titleMatch[1];
    }

    alert("Could not detect the current file path. Try saving and reopening Typora.");
    return null;
  }

  /** NEW — get all fields for itemKey from zotero.sqlite */
 getFullItemData(itemKey) {
  if (!this.zoteroDb) return {};

  const data = {};

  try {
    // 1. Fetch standard itemData fields
    const stmtFields = this.zoteroDb.prepare(`
      SELECT f.fieldName, v.value
      FROM itemData d
      JOIN fields f ON d.fieldID = f.fieldID
      JOIN itemDataValues v ON d.valueID = v.valueID
      JOIN items i ON d.itemID = i.itemID
      WHERE i.key = ?
    `);
    const rows = stmtFields.all(itemKey);
    for (const row of rows) data[row.fieldName] = row.value;

    // 2. Fetch creators (authors)
    const stmtAuthors = this.zoteroDb.prepare(`
      SELECT c.firstName, c.lastName, ct.creatorType
      FROM itemCreators ic
      JOIN creators c ON ic.creatorID = c.creatorID
      JOIN creatorTypes ct ON ic.creatorTypeID = ct.creatorTypeID
      JOIN items i ON ic.itemID = i.itemID
      WHERE i.key = ?
      ORDER BY ic.orderIndex
    `);
    const authorRows = stmtAuthors.all(itemKey);
    if (authorRows.length) {
      // join authors in BibTeX "First Last and ..." format
      data.authors = authorRows
        .map(a => {
          const first = a.firstName || "";
          const last = a.lastName || "";
          return `${first} ${last}`.trim();
        })
        .join(" and ");
    }

  } catch (e) {
    console.error("Error fetching full item data:", e);
  }

  return data;
}

appendToBib(item) {
  const mdPath = this.getCurrentFilePath();
  if (!mdPath) return;

  const dir = path.dirname(mdPath);
  const bibFile = fs.readdirSync(dir).find(f => f.endsWith(".bib"));
  if (!bibFile) {
    console.warn(i18n.t.bibNotFound);
    return;
  }

  const fullBibPath = path.join(dir, bibFile);
  const existing = fs.readFileSync(fullBibPath, "utf8");
  if (existing.includes(`{${item.key},`)) return;

  // fetch all fields + authors from Zotero
  const fullData = this.getFullItemData(item.itemKey || item.key);

  let entry = `@${item.type || "article"}{${item.key},\n`;

  const add = (k, v) => { if (v) entry += `  ${k} = {${v}},\n`; };

  add("author", fullData.authors || item.authors);
  add("title", fullData.title || item.title);
  add("journal", fullData.publicationTitle || item.journal);
  add("volume", fullData.volume);
  add("issue", fullData.issue);
  add("pages", fullData.pages);
  add("year", fullData.date ? fullData.date.split("-")[0] : item.year);
  add("doi", fullData.DOI || item.doi);
  add("issn", fullData.ISSN);
  add("abstract", fullData.abstractNote);
  add("publisher", fullData.publisher || item.publisher);
  add("url", fullData.url || item.url);
  add("keywords", fullData.shortTitle);
  add("language", fullData.language);

  entry += `}\n\n`;

  fs.appendFileSync(fullBibPath, entry);
  console.log(`✅ Added ${item.key} to ${bibFile}`);
} 
  onunload() {
    if (this.bbtDb) this.bbtDb.close();
    if (this.zoteroDb) this.zoteroDb.close();
  }
}

// Suggestion Manager
class SuggestionManager extends Component {
  constructor(app, plugin) {
    super();
    this.app = app;
    this.plugin = plugin;
  }
  onload() {
    const suggest = new ZoteroCitationSuggest(this.app, this.plugin);
    this.register(this.app.workspace.activeEditor.suggestion.register(suggest));
  }
}

// Default settings
const DEFAULT_SETTINGS = {
  dbPath: "/home/adam/Zotero/better-bibtex.sqlite",
  zoteroDbPath: "/home/adam/Zotero/zotero.sqlite",
};

// Main Plugin
class ZoteroCitationPlugin extends Plugin {
  constructor() {
    super(...arguments);
    this.i18n = i18n;
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

    this.registerSettingTab(new ZoteroSettingTab(this));
    this.addChild(new SuggestionManager(this.app, this));
  }
}

export default ZoteroCitationPlugin;
