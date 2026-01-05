import json

import matplotlib.pyplot as plt

# Cargar resultados
with open("evaluation/textdistance_results.json", "r", encoding="utf-8") as f:
    results = json.load(f)

jaccard_scores = [item["jaccard"] for item in results]
levenshtein_scores = [item["levenshtein"] for item in results]
queries = [item["query"] for item in results]

plt.figure(figsize=(10, 5))
plt.plot(jaccard_scores, label="Jaccard", marker="o")
plt.plot(levenshtein_scores, label="Levenshtein", marker="x")
plt.xticks(range(len(queries)), [f"Q{i+1}" for i in range(len(queries))], rotation=45)
plt.xlabel("Consulta")
plt.ylabel("Similitud normalizada")
plt.title("Similitud entre consulta y respuesta (Jaccard vs Levenshtein)")
plt.legend()
plt.tight_layout()
plt.savefig("evaluation/textdistance_plot.png")
plt.show()
