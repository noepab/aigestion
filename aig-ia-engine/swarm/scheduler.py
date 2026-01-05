import logging
import subprocess
import time

import schedule

logging.basicConfig(level=logging.INFO, format="%(asctime)s - SCHEDULER - %(message)s")
logger = logging.getLogger("SwarmScheduler")


def job():
    logger.info("Starting scheduled Swarm Optimization Cycle...")
    try:
        # Run main.py as a subprocess
        result = subprocess.run(
            ["python", "main.py"],
            cwd="C:\\Users\\Alejandro\\AIG\\AIG-ia-engine\\swarm",
            capture_output=True,
            text=True,
        )

        if result.returncode == 0:
            logger.info("Cycle completed successfully.")
            logger.info(result.stdout)
        else:
            logger.error(f"Cycle failed with return code {result.returncode}")
            logger.error(result.stderr)

    except Exception as e:
        logger.error(f"Failed to run job: {e}")


# Schedule job every 60 minutes
schedule.every(60).minutes.do(job)

# Run once immediately for boot
job()

logger.info("Swarm Scheduler Active. Waiting for next cycle...")

while True:
    schedule.run_pending()
    time.sleep(1)
