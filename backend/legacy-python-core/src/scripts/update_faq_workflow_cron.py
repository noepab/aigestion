import re

import yaml

WORKFLOW_PATH = ".github/workflows/faq-suggestions.yml"
SETTINGS_PATH = "faq_workflow_settings.yml"


# Leer frecuencia del archivo de settings
def get_cron():
    with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)
    return config.get("cron_schedule", "0 6 * * 1")


def update_workflow_cron(cron):
    with open(WORKFLOW_PATH, "r", encoding="utf-8") as f:
        content = f.read()
    # Reemplazar la línea de cron
    new_content = re.sub(r'(cron: ")([^"]+)(")', f'cron: "{cron}"', content)
    with open(WORKFLOW_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"Workflow actualizado con cron: {cron}")


if __name__ == "__main__":
    cron = get_cron()
    update_workflow_cron(cron)
