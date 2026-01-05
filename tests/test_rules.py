import json
import unittest


class TestBusinessRules(unittest.TestCase):
    def setUp(self):
        with open("aigestion_rules.json", "r", encoding="utf-8") as f:
            self.rules = json.load(f)

    def test_temp_range(self):
        min_temp, max_temp = self.rules["clima"]["max_temp_range"]
        for temp in [min_temp - 1, max_temp + 1]:
            self.assertFalse(min_temp <= temp <= max_temp)
        for temp in [min_temp, max_temp]:
            self.assertTrue(min_temp <= temp <= max_temp)

    def test_valid_conditions(self):
        valid_conds = self.rules["clima"]["valid_conditions"]
        for cond in valid_conds:
            self.assertIn(cond, valid_conds)
        self.assertNotIn("granizo", valid_conds)


if __name__ == "__main__":
    unittest.main()
