import json

import evaluate
from sentence_transformers import SentenceTransformer, util

# Cargar datos
with open("evaluation/data.jsonl", "r", encoding="utf-8") as f:
    data = [json.loads(line) for line in f]

# Modelo de embeddings
model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

semantic_scores = []
for item in data:
    query = item["query"]
    response = item["response"]
    emb_query = model.encode(query, convert_to_tensor=True)
    emb_response = model.encode(response, convert_to_tensor=True)
    cosine_sim = float(util.pytorch_cos_sim(emb_query, emb_response).item())
    semantic_scores.append(
        {"query": query, "response": response, "semantic_similarity": cosine_sim}
    )

# Métrica BLEU y ROUGE
bleu = evaluate.load("bleu")
rouge = evaluate.load("rouge")

bleu_scores = bleu.compute(
    predictions=[item["response"] for item in data], references=[[item["query"]] for item in data]
)
rouge_scores = rouge.compute(
    predictions=[item["response"] for item in data], references=[item["query"] for item in data]
)

with open("evaluation/semantic_results.json", "w", encoding="utf-8") as f:
    json.dump(
        {"semantic": semantic_scores, "bleu": bleu_scores, "rouge": rouge_scores},
        f,
        ensure_ascii=False,
        indent=2,
    )

print("Evaluación semántica y n-gram guardada en evaluation/semantic_results.json")
