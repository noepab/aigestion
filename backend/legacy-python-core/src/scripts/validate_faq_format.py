import re
import sys

FAQ_PATH = "AIGestion_FAQ_SUGERENCIAS.md"

# Reglas básicas de formato: título, preguntas, respuestas, separación
FAQ_TITLE_PATTERN = r"^# Sugerencias de FAQ"
QUESTION_PATTERN = r"^Q[0-9]+:"
ANSWER_PATTERN = r"^A[0-9]+:"


def validate_faq():
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    errors = []
    if not re.match(FAQ_TITLE_PATTERN, lines[0]):
        errors.append("El título principal no es válido.")
    for i, line in enumerate(lines):
        if line.startswith("Q") and not re.match(QUESTION_PATTERN, line):
            errors.append(f"Pregunta mal formateada en línea {i+1}: {line.strip()}")
        if line.startswith("A") and not re.match(ANSWER_PATTERN, line):
            errors.append(f"Respuesta mal formateada en línea {i+1}: {line.strip()}")
    if errors:
        print("Errores de formato encontrados:")
        for err in errors:
            print(err)
        sys.exit(1)
    print("Formato de FAQ válido.")


if __name__ == "__main__":
    validate_faq()
