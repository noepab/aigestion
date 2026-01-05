import json

import numpy as np

# Cargar resultados
with open("evaluation/textdistance_results.json", "r", encoding="utf-8") as f:
    results = json.load(f)

# Extraer métricas
jaccard = [item["jaccard"] for item in results]
levenshtein = [item["levenshtein"] for item in results]
bleu = [item["bleu"] for item in results]
rougeL = [item["rougeL"] for item in results]

# Calcular promedios
summary = {
    "jaccard_mean": float(np.mean(jaccard)),
    "levenshtein_mean": float(np.mean(levenshtein)),
    "bleu_mean": float(np.mean(bleu)),
    "rougeL_mean": float(np.mean(rougeL)),
    "jaccard_std": float(np.std(jaccard)),
    "levenshtein_std": float(np.std(levenshtein)),
    "bleu_std": float(np.std(bleu)),
    "rougeL_std": float(np.std(rougeL)),
}

with open("evaluation/metrics_summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)

print("Resumen de métricas guardado en evaluation/metrics_summary.json")
