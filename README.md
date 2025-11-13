# Typora Zotero Citation Plugin

A Typora plugin that integrates with Zotero via SQLite for citation management.
Requires the [Typora Community Plugin Framework](https://github.com/typora-community-plugin/typora-community-plugin).

## Installation

### Required:

1. Typora community plugin [https://github.com/typora-community-plugin/typora-community-plugin](https://github.com/typora-community-plugin/typora-community-plugin)
2. Zotero [https://www.zotero.org/](https://www.zotero.org/)
3. Better bibtex for Zotero plugin [https://retorque.re/zotero-better-bibtex/](https://retorque.re/zotero-better-bibtex/)

### 1. Clone or download this repo into your Typora plugin folder:

#### Windows

```ps1
cd %UserProfile%\.typora\community-plugins\
git clone https://github.com/adam-coates/typora-plugin-zotero
```


#### MacOS & Linux

```bash
cd ~/.config/Typora/plugins/plugins/
git clone https://github.com/adam-coates/typora-plugin-zotero
```


### 2. Install 

The plugin depends upon the node module: `better-sqlite3`. This module is needed to be able to read Zotero `sqlite` database files. 
Currently, this plugin **is not** part of the typora-community-plugin repository. This means that you need to install the dependencies: 


#### Windows

```ps1
cd %UserProfile%\.typora\community-plugins\typora-plugin-zotero
npm install
```



#### MacOS & Linux

```bash
cd ~/.config/Typora/plugins/plugins/typora-plugin-zotero
npm install
```

---

### Enable the plugin

The plugin should be installed and show up in the list of installed plugins


1. Press <kbd>ctrl</kbd> + <kbd>.</kbd> to open the Global Settings

![](./assets/screenshot-2025-11-13_18-25-14.png)


2. Enable plugin

![](./assets/screenshot-2025-11-13_18-27-39.png)




## Configuration

- You have to specify the path to zotero.sqlite and better-bibtex.sqlite

![](./assets/screenshot-2025-11-13_18-29-26.png)


1. Open the plugin settings
2. Specify the path for Better BibTeX database
3. Specify the path for Zotero database


---

## Usage

- In Typora, typing the <kbd>@</kbd> symbol and typing out a reference should show suggestions.


- Use up and down arrow keys to select a reference and press enter to insert it


- If you have a `.bib` file in your current directory the plugin will add the reference to the file. 

> [!NOTE]
> The plugin will check the `.bib` file for the corresponding reference first. 
> If a reference already exists in the `.bib` file it will not add a duplicate




---

## Zotero

This plugin depends upon [zotero](https://www.zotero.org/) and the [better-bibtex zotero plugin](https://retorque.re/zotero-better-bibtex/). 

Once Zotero and better bibtex for zotero is setup then you should expect to find 2 sqlite databases for zotero and for better-bibtex

```bash
~/Zotero/zotero.sqlite
~/Zotero/better-bibtex.sqlite
```

