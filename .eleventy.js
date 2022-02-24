const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const lodashMerge = require("lodash.merge");
const md5 = require("md5");

const defaultOptions = {
  temporaryCompilationFolder: "./ink-tmp",
};

module.exports = function (eleventyConfig, suppliedOptions = {}) {
  let options = lodashMerge({}, defaultOptions, suppliedOptions);

  eleventyConfig.addTemplateFormats("ink");

  //   JSON files get written to this directory
  const { temporaryCompilationFolder } = options;

  eleventyConfig.addDataExtension("ink", async (fileContents) => {
    // This needs to write a temporary .ink file with the file contents
    // Then convert that .ink file to .json
    // Then return the contents of that rendered JSON file.
    const temporaryCompilationFolderIncludesSpace =
      temporaryCompilationFolder.indexOf(" ") !== -1;

    if (temporaryCompilationFolderIncludesSpace) {
      const spaceErrorMessage = `[eleventy-plugin-ink] temporaryCompilationFolder must not have a space in it`;
      throw new Error(spaceErrorMessage);
    }

    if (!fs.existsSync(temporaryCompilationFolder)) {
      fs.mkdirSync(temporaryCompilationFolder);
    }

    const fileHash = md5(fileContents);
    const inputPath = path.join(temporaryCompilationFolder, `${fileHash}.ink`);
    const outputPath = path.join(
      temporaryCompilationFolder,
      `${fileHash}.json`
    );

    try {
      // write the file contents to the 'input path' for ink-tools
      await fs.promises.writeFile(inputPath, fileContents, {
        encoding: "utf-8",
      });
    } catch (e) {
      console.error(
        "[eleventy-plugin-ink] Failed to write temporary JSON file"
      );
      throw new Error(e);
    }

    try {
      // returns the rendered data
      return await new Promise((resolve, reject) => {
        //   this executes the ink-tools CLI to compile the input file to the output
        const inkToolsCommand = spawn("ink-tools", ["compile", inputPath]);

        //   Uncomment these lines if you want to see what the ink-tools command is doing
        // inkToolsCommand.stdout.on("data", (data) => {
        //   console.log(`stdout: ${data}`);
        // });

        inkToolsCommand.stderr.on("data", (data) => {
          console.error(
            `[eleventy-plugin-ink] error from ink-tools command:${data}`
          );
          throw new Error(data);
        });

        //   when the ink-tools command is finished, the promise is resolved with the data from the text file
        inkToolsCommand.on("close", (code) => {
          // we read the file that was just generated
          fs.readFile(
            outputPath,
            {
              encoding: "utf8",
            },
            function (err, data) {
              if (err) throw err;
              resolve(JSON.parse(data.trim()));
            }
          );
        });
      });
    } catch (e) {
      console.error(`[eleventy-plugin-ink] Could not parse the rendered JSON`);
      throw e;
    }
  });

  // This deletes the temporary folder when it finishes
  eleventyConfig.on("eleventy.after", function () {
    fs.rmSync(temporaryCompilationFolder, {
      recursive: true,
      force: true,
    });
  });
};
