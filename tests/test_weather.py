import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from agente_base import get_weather


class TestWeatherTool(unittest.TestCase):
    def test_weather_format(self):
        result = get_weather("Madrid")
        self.assertIn("Madrid", result)
        self.assertRegex(result, r"\d{2}°C")
        self.assertTrue(
            any(cond in result for cond in ["soleado", "nublado", "lluvioso", "tormentoso"])
        )


if __name__ == "__main__":
    unittest.main()
