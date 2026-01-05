from datetime import datetime, timedelta

FAQ_PATH = "AIGestion_FAQ_SUGERENCIAS.md"
SUMMARY_PATH = "AIGestion_FAQ_RESUMEN_SEMANAL.md"

# Extrae preguntas y respuestas de la última semana

def extract_weekly_faq():
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        lines = f.readlines()
    # Suponiendo que cada pregunta tiene fecha en formato: Qn: [YYYY-MM-DD] texto
    today = datetime.today()
    week_ago = today - timedelta(days=7)
    resumen = ["# Resumen semanal de sugerencias FAQ\n"]
    for line in lines:
        if line.startswith("Q") and ": [" in line:
            try:
                fecha_str = line.split(": [")[1].split("]")[0]
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d")
                if fecha >= week_ago:
                    resumen.append(line)
            except Exception:
                continue
        elif line.startswith("A"):
            resumen.append(line)
    with open(SUMMARY_PATH, "w", encoding="utf-8") as f:
        f.writelines(resumen)
    print(f"Resumen semanal generado en {SUMMARY_PATH}")

if __name__ == "__main__":
    extract_weekly_faq()
