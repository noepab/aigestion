import time
import logging
from enum import Enum
from typing import Callable, Any

logger = logging.getLogger("CircuitBreaker")

class CircuitState(Enum):
    CLOSED = "CLOSED"  # Normal operation
    OPEN = "OPEN"      # Service failing, fail fast
    HALF_OPEN = "HALF_OPEN" # Testing if service recovered

class CircuitBreaker:
    """
    Circuit breaker to handle failures in external AI services.
    """
    def __init__(self,
                 failure_threshold: int = 5,
                 recovery_timeout: int = 60,
                 name: str = "LLMService"):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time = 0

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Executes the function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitState.HALF_OPEN
                logger.info(f"Circuit {self.name} is now HALF_OPEN")
            else:
                raise Exception(f"Circuit {self.name} is OPEN. Failing fast.")

        try:
            result = func(*args, **kwargs)

            # If successful and was HALF_OPEN, close the circuit
            if self.state == CircuitState.HALF_OPEN:
                self.reset()

            return result
        except Exception as e:
            self._handle_failure(e)
            raise e

    def _handle_failure(self, error: Exception):
        self.failure_count += 1
        self.last_failure_time = time.time()

        logger.warning(f"Failure in {self.name} ({self.failure_count}/{self.failure_threshold}): {error}")

        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.error(f"Circuit {self.name} is now OPEN. Service is likely down.")

    def reset(self):
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        logger.info(f"Circuit {self.name} reset to CLOSED")
