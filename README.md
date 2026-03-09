# Typora BibTeX Citation Plugin

A Typora plugin that searches citations from one or more configured BibTeX files.
Requires the [Typora Community Plugin Framework](https://github.com/typora-community-plugin/typora-community-plugin).

## Installation

### Required

1. Typora community plugin [https://github.com/typora-community-plugin/typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin)
2. One or more local `.bib` files

### 1. Clone or download this repo into your Typora plugin folder

#### Windows

```ps1
cd %UserProfile%\.typora\community-plugins\
git clone https://github.com/Lazenca-Liqiuqi/bibtex-citation.git bibtex-citation
```

#### MacOS & Linux

```bash
cd ~/.config/Typora/plugins/plugins/
git clone https://github.com/Lazenca-Liqiuqi/bibtex-citation.git bibtex-citation
```

### 2. Install

This trimmed plugin no longer depends on external reference managers, SQLite, native Node modules, or third-party npm packages.
There is no extra install or build step.

#### Windows

```ps1
cd %UserProfile%\.typora\community-plugins\bibtex-citation
```

#### MacOS & Linux

```bash
cd ~/.config/Typora/plugins/plugins/bibtex-citation
```

You can stop after cloning or copying the plugin folder into the Typora plugin directory.

---

### Enable the plugin

The plugin should be installed and show up in the list of installed plugins.

1. Press <kbd>ctrl</kbd> + <kbd>.</kbd> to open the Global Settings

![](./assets/screenshot-2025-11-13_18-25-14.png)

2. Enable plugin

![](./assets/screenshot-2025-11-13_18-27-39.png)

## Configuration

- Configure one or more BibTeX file paths in the plugin settings
- Separate multiple paths with commas, semicolons, or line breaks
- Relative paths are resolved from the current Markdown file directory

![](./assets/screenshot-2025-11-13_18-29-26.png)

1. Open the plugin settings
2. Fill in the `BibTeX Files` field
3. Save the setting by leaving the input box

Example:

```text
./references.bib
./bib/library.bib
/Users/name/references/shared.bib
```

---

## Usage

- In Typora, type the <kbd>@</kbd> symbol followed by part of a citation key, title, author, journal, or year
- Use the up and down arrow keys to select a reference and press enter to insert `@citationKey`
- The plugin only searches the configured BibTeX files and does not modify any `.bib` file

![](./assets/showcase.gif)

---

## Notes

- If the same citation key exists in multiple configured BibTeX files, the first file in the configured list wins
- Missing or unreadable BibTeX files are skipped with a console warning
- The current parser is designed for common BibTeX entries and fields such as `title`, `author`, `year`, `journal`, `journaltitle`, `booktitle`, and `publisher`

## Migration

- The repository and plugin now both use the `bibtex-citation` name
- For local installs, keep the plugin folder name as `bibtex-citation`
