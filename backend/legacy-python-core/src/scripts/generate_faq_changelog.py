import difflib
import os

FAQ_FILE = "docs/AIGestion_FAQ.md"
CHANGELOG_FILE = "reports/AIGestion_FAQ_CHANGELOG.md"
HISTORY_DIR = "audit-data"
HISTORY_FILE = os.path.join(HISTORY_DIR, "faq-history-prev.md")


def read_file(path):
    if not os.path.exists(path):
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.readlines()

def write_file(path, lines):
    with open(path, "w", encoding="utf-8") as f:
        f.writelines(lines)

def main():
    current = read_file(FAQ_FILE)
    previous = read_file(HISTORY_FILE)
    if not current:
        print(f"No se encontró {FAQ_FILE}")
        return
    diff = difflib.unified_diff(previous, current, fromfile="Anterior", tofile="Actual", lineterm="\n")
    changelog = ["# Changelog de FAQ\n\n"]
    changelog.extend(diff)
    write_file(CHANGELOG_FILE, changelog)
    # Actualiza el historial para la próxima ejecución
    os.makedirs(HISTORY_DIR, exist_ok=True)
    write_file(HISTORY_FILE, current)
    print(f"Changelog generado en {CHANGELOG_FILE}")

if __name__ == "__main__":
    main()
