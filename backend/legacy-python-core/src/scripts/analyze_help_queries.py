from collections import Counter

LOG_FILE = "aigestion_help_queries.log"
SUGGESTED_FAQ = "AIGestion_FAQ_SUGERENCIAS.md"

with open(LOG_FILE, "r", encoding="utf-8") as f:
    queries = [line.strip().lower() for line in f if line.strip()]

counter = Counter(queries)

with open(SUGGESTED_FAQ, "w", encoding="utf-8") as f:
    f.write("# Sugerencias para nuevas preguntas frecuentes (FAQ)\n\n")
    for query, count in counter.most_common(10):
        f.write(f"- {query} (consultada {count} veces)\n")

print(f"Sugerencias de FAQ generadas en {SUGGESTED_FAQ}")
