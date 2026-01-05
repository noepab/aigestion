import json
import logging

# Simulación de retraining: recopila feedback y satisfacción
with open("aigestion-feedback.json", "r", encoding="utf-8") as f:
    feedback = json.load(f)
with open("aigestion_satisfaction.json", "r", encoding="utf-8") as f:
    satisfaction = json.load(f)

# Genera dataset para retraining
retrain_data = []
for fb in feedback:
    retrain_data.append({"query": fb["query"], "suggestion": fb["suggestion"]})
for sat in satisfaction:
    retrain_data.append({"query": sat["query"], "response": sat["response"], "score": sat["score"]})

with open("retrain_data.json", "w", encoding="utf-8") as f:
    json.dump(retrain_data, f, ensure_ascii=False, indent=2)

logging.info(f"Retraining dataset generado con {len(retrain_data)} ejemplos.")
print(f"Retraining dataset generado con {len(retrain_data)} ejemplos en retrain_data.json.")
