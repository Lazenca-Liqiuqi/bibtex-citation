# Typora Zotero Citation Plugin

A Typora plugin that integrates with Zotero via SQLite for citation management.
Requires the [Typora Community Plugin Framework](https://github.com/typora-community-plugin/typora-community-plugin).

## Installation

1. Clone or download this repo into your Typora plugin folder:
 
```bash
cd ~/.config/Typora/plugins/plugins/
git clone https://github.com/adam-coates/typora-plugin-zotero
cd zotero-citation
```


2. Install dependencies

The plugin depends upon the node module: `better-sqlite3`. This module is needed to be able to read Zotero `sqlite` database files. This plugin depends upon [zotero](https://www.zotero.org/) and the [better-bibtex zotero plugin](https://retorque.re/zotero-better-bibtex/). 

Once Zotero and better bibtex for zotero is setup then you should expect to find 2 sqlite databases for zotero and for better-bibtex

```bash
~/Zotero/zotero.sqlite
~/Zotero/better-bibtex.sqlite
```

Currently this plugin is not part of the typora-community-plugin repository. This means that you need to install the dependencies: 

```bash
cd ~/.config/Typora/plugins/plugins/zotero-citation
npm install
```


