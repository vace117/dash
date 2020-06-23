/**
 * Executes shell command as it would happen in BASH script
 * @param {string} command
 * @param {Object} [options] Object with options. Set `capture` to TRUE, to capture and return stdout. 
 *                           Set `echo` to TRUE, to echo command passed.
 * @returns {Promise<{code: number, data: string | undefined, error: Object}>}
 */

const chalk = require('chalk');

module.exports.exec = function (command, {
                                  capture = true, 
                                  echo = false,
                                  terminateOnError = true
                                } = {}) {

  if (echo) {
    console.log(`Executing Command:\n    ${command}\n`);
  }
  
  const spawn = require('child_process').spawn;
  const childProcess = spawn('bash', ['-c', command], {stdio: capture ? 'pipe' : 'inherit'});

  return new Promise( (resolve, reject) => {
      let stdout = '';
      let stderr = '';
    
      if (capture) {
        childProcess.stdout.on('data', (data) => {
          stdout += data;
        });
        childProcess.stderr.on('data', (data) => {
          stderr += data;
        });
      }
    
      childProcess.on('error', function (error) {
        reject({code: 1, error: error});
      });
    
      childProcess.on('close', function (code) {
        if (code > 0) {
          if ( terminateOnError ) {
            printCommandExecutionErrorMessage(code, stdout, stderr)
            process.exit(code)
          }
          else {
            reject({code: code, stdout: stdout, stderr: stderr});
          }
        } else {
          resolve({code: code, stdout: stdout, stderr: stderr});
        }
      });
    }
  );
};

function printCommandExecutionErrorMessage(code, stdout, stderr) {
  console.error( chalk.redBright(`
Command failed with code ${code}

= stdout =
${stdout}

= stderr =
${stderr}
`))
}

