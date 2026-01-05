import json

# Cargar resultados
with open("evaluation/textdistance_results.json", "r", encoding="utf-8") as f:
    results = json.load(f)

# Cargar métricas resumen
with open("evaluation/metrics_summary.json", "r", encoding="utf-8") as f:
    summary = json.load(f)

outliers = []
for idx, item in enumerate(results):
    for metric in ["jaccard", "levenshtein", "bleu", "rougeL"]:
        mean = summary[f"{metric}_mean"]
        std = summary[f"{metric}_std"]
        value = item[metric]
        # Outlier si está fuera de 2 desviaciones estándar
        if abs(value - mean) > 2 * std:
            outliers.append(
                {
                    "index": idx,
                    "metric": metric,
                    "value": value,
                    "mean": mean,
                    "std": std,
                    "query": item["query"],
                    "response": item["response"],
                }
            )

with open("evaluation/outliers.json", "w", encoding="utf-8") as f:
    json.dump(outliers, f, ensure_ascii=False, indent=2)

print(f"Detectados {len(outliers)} outliers. Guardados en evaluation/outliers.json.")
