# eleventy-plugin-ink

This plugin lets you work with `.ink` files in your Eleventy input directory, and they will be converted to JSON files in your output directory.

It uses the `ink-tools` CLI to do the converting behind the scenes.

When you're using `eleventy --watch`, Eleventy will rebuild your site each time you make a change to an `.ink` file.

## Installation

Use npm to add the package to your project:

```
npm add https://github.com/larryhudson/eleventy-plugin-ink
```

Add it to your .eleventy.js:

```
const InkPlugin = require('eleventy-plugin-ink')

module.exports = function (eleventyConfig) {

  eleventyConfig.addPlugin(InkPlugin, {
    temporaryCompilationFolder: `./ink-tmp` // temporary folder for compiled ink files. This should be added to your .gitignore
  });
```

Now you should be able to run `eleventy --watch` and edit `.ink` files as you go.
