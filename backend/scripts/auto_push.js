#!/usr/bin/env node

const { exec } = require('child_process');
const readline = require('readline');

function askAndPush() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Do you want to push the repository to GitHub now? (y/N) ', (answer) => {
    rl.close();
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      exec(
        'git add . && git commit -m "Auto update" && git push origin main',
        (err, stdout, stderr) => {
          if (err) {
            console.error('Error during push:', err);
          } else {
            console.log('Push result:', stdout);
          }
        }
      );
    } else {
      console.log('Skipping push.');
    }
  });
}

// Initial prompt
askAndPush();
// Repeat every hour
setInterval(askAndPush, 60 * 60 * 1000);
