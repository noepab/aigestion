import csv
import json

with open("semantic_context_results.json", "r", encoding="utf-8") as f:
    data = json.load(f)

with open("semantic_metrics.csv", "w", encoding="utf-8", newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["query", "response", "semantic_similarity"])
    for item in data:
        writer.writerow([item["query"], item["response"], item["semantic_similarity"]])

print("Exportación de métricas semánticas a CSV completada.")
