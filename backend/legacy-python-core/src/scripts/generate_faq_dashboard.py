import os
import re
from collections import Counter

FAQ_FILE = "AIGestion_FAQ_SUGERENCIAS.md"
DASHBOARD_FILE = "AIGestion_FAQ_DASHBOARD.md"

CATEGORIES = ["General", "Crítico", "Urgente", "Mejora", "Pregunta", "Sugerencia", "Bloqueante"]


def parse_suggestions():
    if not os.path.exists(FAQ_FILE):
        return []
    with open(FAQ_FILE, "r", encoding="utf-8") as f:
        lines = f.readlines()
    return lines

def categorize_suggestions(lines):
    counts = Counter()
    for line in lines:
        for cat in CATEGORIES:
            if re.search(cat, line, re.IGNORECASE):
                counts[cat] += 1
    return counts

def main():
    lines = parse_suggestions()
    total = len(lines)
    counts = categorize_suggestions(lines)
    with open(DASHBOARD_FILE, "w", encoding="utf-8") as f:
        f.write("# Dashboard de Métricas de FAQ\n\n")
        f.write(f"Total de sugerencias: {total}\n\n")
        f.write("## Sugerencias por categoría:\n")
        for cat in CATEGORIES:
            f.write(f"- {cat}: {counts.get(cat, 0)}\n")
        f.write("\n## Primeras 5 sugerencias:\n")
        for line in lines[:5]:
            f.write(f"- {line.strip()}\n")
    print(f"Dashboard generado en {DASHBOARD_FILE}")

if __name__ == "__main__":
    main()
