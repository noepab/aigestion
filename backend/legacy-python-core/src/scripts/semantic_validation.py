import json

from sentence_transformers import SentenceTransformer, util

# Cargar historial de contexto
with open("aigestion_context.json", "r", encoding="utf-8") as f:
    context = json.load(f)

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

results = []
for item in context:
    query = item["query"]
    response = item["response"]
    emb_query = model.encode(query, convert_to_tensor=True)
    emb_response = model.encode(response, convert_to_tensor=True)
    cosine_sim = float(util.pytorch_cos_sim(emb_query, emb_response).item())
    results.append({"query": query, "response": response, "semantic_similarity": cosine_sim})

with open("semantic_context_results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Validación semántica avanzada completada. Resultados en semantic_context_results.json")
