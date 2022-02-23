const { spawn } = require('child_process');

module.exports = function(eleventyConfig) {

    eleventyConfig.addTemplateFormats("ink");

    const workingDirForInkCompiling = './ink-tmp'

    eleventyConfig.addExtension('ink', {
        compile: function(str, inputPath) {
            return async (data) => {

                // let's see if we can get the ink to convert to JSON and access it in here...
                console.log({inputPath})

                console.log(process.env.PATH)

                const inkToolsCommand = spawn('ink-tools', ['compile', inputPath], {
                    env: process.env
                })

                }
        },
        
    })
  };