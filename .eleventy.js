const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const lodashMerge = require("lodash.merge");

const defaultOptions = {
  temporaryCompilationFolder: "./ink-tmp",
};

module.exports = function (eleventyConfig, suppliedOptions = {}) {
  let options = lodashMerge({}, defaultOptions, suppliedOptions);

  eleventyConfig.addTemplateFormats("ink");

  //   JSON files get written to this directory
  const { temporaryCompilationFolder } = options;

  //   before Eleventy builds, it makes sure that tmp folder exists.
  //   docs: https://www.11ty.dev/docs/events/
  eleventyConfig.on("eleventy.before", function () {
    if (!fs.existsSync(temporaryCompilationFolder)) {
      console.log(
        "[eleventy-plugin-ink] Creating temporary compilation folder"
      );
      fs.mkdirSync(temporaryCompilationFolder);
    }
  });

  // this extension means that eleventy will treat any files in the input directory as input
  // docs: https://www.11ty.dev/docs/languages/custom/
  eleventyConfig.addExtension("ink", {
    outputFileExtension: "json",
    compile: function (str, inputPath) {
      return async (data) => {
        const inkFilename = path.basename(inputPath);
        const outputPath = path.join(
          temporaryCompilationFolder,
          `${inkFilename}.json`
        );

        // returns the rendered data
        return await new Promise((resolve) => {
          //   this executes the ink-tools CLI to compile the input file to the output
          const inkToolsCommand = spawn("ink-tools", [
            "compile",
            inputPath,
            "--output",
            outputPath,
          ]);

          //   Uncomment these lines if you want to see what the ink-tools command is doing
          //   inkToolsCommand.stdout.on("data", (data) => {
          //     console.log(`stdout: ${data}`);
          //   });

          //   inkToolsCommand.stderr.on("data", (data) => {
          //     console.log(`stderr: ${data}`);
          //   });

          //   when the ink-tools command is finished, the promise is resolved with the data from the text file
          inkToolsCommand.on("close", (code) => {
            // we read the file that was just generated
            fs.readFile(
              outputPath,
              {
                encoding: "utf-8",
              },
              function (err, data) {
                //   resolve the promise with the data from the compiled text file
                resolve(data);
              }
            );
          });
        });
      };
    },
  });
};
