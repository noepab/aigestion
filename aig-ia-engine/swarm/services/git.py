import logging
import subprocess
from datetime import datetime

logger = logging.getLogger("GitService")


class GitService:
    def __init__(self, repo_path="C:\\Users\\Alejandro\\AIG"):
        self.repo_path = repo_path

    def run_git(self, args):
        try:
            result = subprocess.run(
                ["git"] + args,
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,  # Raise error on failure
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            logger.error(
                f"Git execution failed: {e} \nOutput: {e.stderr} \nCmd: git {' '.join(args)}"
            )
            return None

    def create_branch(self, prefix="swarm/opt"):
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        branch_name = f"{prefix}-{timestamp}"

        logger.info(f"Creating branch {branch_name}...")

        # Checkout main first (to branch off latest)
        # self.run_git(["checkout", "main"]) # Risky if user has uncommitted changes active.
        # Safer: Just branch from current HEAD

        self.run_git(["checkout", "-b", branch_name])
        return branch_name

    def commit_changes(self, message="Swarm Optimization"):
        logger.info("Committing changes...")
        self.run_git(["add", "."])
        self.run_git(["commit", "-m", f"[AIGESTION-SWARM] {message}"])
        return True

    def get_current_branch(self):
        return self.run_git(["rev-parse", "--abbrev-ref", "HEAD"])
