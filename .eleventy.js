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

    if (!fs.existsSync(temporaryCompilationFolder)) {
      fs.mkdirSync(temporaryCompilationFolder);
    }

    const fileHash = md5(fileContents);
    const inputPath = path.join(temporaryCompilationFolder, `${fileHash}.ink`);
    const outputPath = path.join(
      temporaryCompilationFolder,
      `${fileHash}.json`
    );

    // write the file contents to the 'input path' for ink-tools
    await fs.promises.writeFile(inputPath, fileContents, {
      encoding: "utf-8",
    });

    // returns the rendered data
    return await new Promise((resolve) => {
      //   this executes the ink-tools CLI to compile the input file to the output
      const inkToolsCommand = spawn("ink-tools", ["compile", inputPath]);

      //   Uncomment these lines if you want to see what the ink-tools command is doing
      // inkToolsCommand.stdout.on("data", (data) => {
      //   console.log(`stdout: ${data}`);
      // });

      // inkToolsCommand.stderr.on("data", (data) => {
      //   console.log(`stderr: ${data}`);
      // });

      //   when the ink-tools command is finished, the promise is resolved with the data from the text file
      inkToolsCommand.on("close", (code) => {
        // we read the file that was just generated
        fs.readFile(
          outputPath,
          {
            encoding: "utf8",
          },
          function (err, data) {
            //   resolve the promise with the data from the compiled text file
            resolve(JSON.parse(data.trim()));
          }
        );
      });
    });
  });

  // This deletes the temporary folder when it finishes
  eleventyConfig.on("eleventy.after", function () {
    fs.rmSync(temporaryCompilationFolder, {
      recursive: true,
      force: true,
    });
  });
};
