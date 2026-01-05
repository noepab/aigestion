import json
import re
import unittest


class TestAgentResponses(unittest.TestCase):
    def setUp(self):
        with open("evaluation/responses.json", "r", encoding="utf-8") as f:
            self.responses = json.load(f)
        with open("aigestion_rules.json", "r", encoding="utf-8") as f:
            self.rules = json.load(f)

    def test_clima_responses(self):
        valid_conds = self.rules["clima"]["valid_conditions"]
        min_temp, max_temp = self.rules["clima"]["max_temp_range"]
        for item in self.responses:
            if "clima" in item["query"].lower():
                result = item["response"].lower()
                self.assertTrue(any(cond in result for cond in valid_conds))
                temp_match = re.search(r"(\d{1,2})°c", result)
                if temp_match:
                    temp = int(temp_match.group(1))
                    self.assertTrue(min_temp <= temp <= max_temp)


if __name__ == "__main__":
    unittest.main()
