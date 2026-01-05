import json

import numpy as np

with open("semantic_context_results.json", "r", encoding="utf-8") as f:
    data = json.load(f)

scores = [item["semantic_similarity"] for item in data]
mean = np.mean(scores)
std = np.std(scores)

if mean < 0.7:
    print(
        f"⚠️ Alerta: La similitud semántica promedio es baja ({mean:.2f}). Reentrenar agente recomendado."
    )
else:
    print(f"Similitud semántica promedio OK: {mean:.2f}")

with open("aigestion_satisfaction.json", "r", encoding="utf-8") as f:
    satisfaction = json.load(f)

nps_scores = [int(s["score"]) for s in satisfaction if str(s["score"]).isdigit()]
if nps_scores:
    nps_mean = np.mean(nps_scores)
    if nps_mean < 7:
        print(f"⚠️ Alerta: NPS promedio bajo ({nps_mean:.2f}). Revisar calidad del agente.")
    else:
        print(f"NPS promedio OK: {nps_mean:.2f}")
else:
    print("No hay datos NPS suficientes.")
