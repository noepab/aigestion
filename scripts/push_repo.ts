import { execSync } from "child_process";
import * as readline from "readline";

function gitAddCommitPush() {
  try {
    execSync("git add .", { stdio: "inherit" });
    const timestamp = new Date().toISOString();
    execSync(`git commit -m "Auto-commit: ${timestamp}"`, { stdio: "inherit" });
    execSync("git push origin main", { stdio: "inherit" });
    console.log("✅ Repository pushed to GitHub main.");
  } catch (e) {
    console.error("⚠️ Git operation failed. It may be that there are no changes to commit or a merge conflict exists.");
  }
}

function askAndPush() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("¿Quieres subir el repo a GitHub ahora? (s/n): ", answer => {
    if (answer.trim().toLowerCase() === "s") {
      gitAddCommitPush();
    } else {
      console.log("⏱️ No se realizó el push.");
    }
    rl.close();
  });
}

if (process.argv.includes("--hourly")) {
  // Hourly loop – runs once per hour until the process is stopped.
  askAndPush();
  setInterval(askAndPush, 60 * 60 * 1000);
} else {
  // Immediate push when the script is invoked directly.
  gitAddCommitPush();
}
