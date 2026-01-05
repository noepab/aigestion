"""
Retrain Module - Generación de datasets de reentrenamiento
===========================================================

Recopila feedback de usuarios y métricas de satisfacción
para generar datasets que pueden usarse para fine-tuning
o mejora del sistema de prompts.

Formatos de salida:
- JSON: Para uso general
- JSONL: Compatible con OpenAI fine-tuning
- CSV: Para análisis

Uso:
    from src.training.retrain import generate_dataset, RetrainDatasetGenerator

    # Uso rápido
    dataset = generate_dataset()

    # Uso avanzado
    generator = RetrainDatasetGenerator()
    generator.load_feedback()
    generator.load_satisfaction()
    generator.save_all_formats()
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import NamedTuple

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_FILE = PROJECT_ROOT / "logs" / "training.log"

# Archivos de entrada
FEEDBACK_FILE = PROJECT_ROOT / "data" / "aigestion-feedback.json"
SATISFACTION_FILE = PROJECT_ROOT / "data" / "aigestion_satisfaction.json"

# Archivos de salida
OUTPUT_DIR = PROJECT_ROOT / "data" / "training"
OUTPUT_JSON = OUTPUT_DIR / "retrain_data.json"
OUTPUT_JSONL = OUTPUT_DIR / "retrain_data.jsonl"
OUTPUT_CSV = OUTPUT_DIR / "retrain_data.csv"

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [Retrain] %(message)s",
)
logger = logging.getLogger("AIGestion.Retrain")


# =============================================================================
# TIPOS
# =============================================================================

class FeedbackItem(NamedTuple):
    """Item de feedback."""
    query: str
    suggestion: str
    timestamp: str = ""


class SatisfactionItem(NamedTuple):
    """Item de satisfacción."""
    query: str
    response: str
    score: str | int
    timestamp: str = ""


class RetrainExample(NamedTuple):
    """Ejemplo para reentrenamiento."""
    query: str
    original_response: str
    corrected_response: str
    satisfaction_score: float | None
    source: str  # "feedback" | "satisfaction" | "both"


# =============================================================================
# CLASE PRINCIPAL
# =============================================================================

class RetrainDatasetGenerator:
    """
    Generador de datasets de reentrenamiento.

    Combina feedback de usuarios con métricas de satisfacción
    para crear datasets estructurados.
    """

    def __init__(self):
        self.feedback: list[FeedbackItem] = []
        self.satisfaction: list[SatisfactionItem] = []
        self.examples: list[RetrainExample] = []

    def load_feedback(self, filepath: Path | str = None) -> int:
        """
        Carga datos de feedback.

        Args:
            filepath: Ruta al archivo JSON

        Returns:
            Número de items cargados
        """
        filepath = Path(filepath) if filepath else FEEDBACK_FILE

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.feedback = [
                FeedbackItem(
                    query=item.get("query", ""),
                    suggestion=item.get("suggestion", ""),
                    timestamp=item.get("timestamp", "")
                )
                for item in data
                if item.get("query") and item.get("suggestion")
            ]

            logger.info(f"Loaded {len(self.feedback)} feedback items from {filepath}")
            return len(self.feedback)

        except FileNotFoundError:
            logger.warning(f"Feedback file not found: {filepath}")
            return 0
        except json.JSONDecodeError as e:
            logger.error(f"JSON error in feedback file: {e}")
            return 0

    def load_satisfaction(self, filepath: Path | str = None) -> int:
        """
        Carga datos de satisfacción.

        Args:
            filepath: Ruta al archivo JSON

        Returns:
            Número de items cargados
        """
        filepath = Path(filepath) if filepath else SATISFACTION_FILE

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.satisfaction = [
                SatisfactionItem(
                    query=item.get("query", ""),
                    response=item.get("response", ""),
                    score=item.get("score", ""),
                    timestamp=item.get("timestamp", "")
                )
                for item in data
                if item.get("query")
            ]

            logger.info(f"Loaded {len(self.satisfaction)} satisfaction items from {filepath}")
            return len(self.satisfaction)

        except FileNotFoundError:
            logger.warning(f"Satisfaction file not found: {filepath}")
            return 0
        except json.JSONDecodeError as e:
            logger.error(f"JSON error in satisfaction file: {e}")
            return 0

    def generate_examples(self) -> list[RetrainExample]:
        """
        Genera ejemplos de reentrenamiento combinando fuentes.

        Returns:
            Lista de RetrainExample
        """
        self.examples = []
        queries_seen = set()

        # Indexar satisfacción por query
        satisfaction_by_query = {}
        for s in self.satisfaction:
            if s.query not in satisfaction_by_query:
                satisfaction_by_query[s.query] = []
            satisfaction_by_query[s.query].append(s)

        # Procesar feedback
        for fb in self.feedback:
            sat_items = satisfaction_by_query.get(fb.query, [])
            score = None
            original_response = ""

            if sat_items:
                # Usar la satisfacción más reciente
                latest = sat_items[-1]
                original_response = latest.response
                try:
                    score = float(latest.score) if str(latest.score).isdigit() else None
                except (ValueError, TypeError):
                    score = None

            example = RetrainExample(
                query=fb.query,
                original_response=original_response,
                corrected_response=fb.suggestion,
                satisfaction_score=score,
                source="both" if sat_items else "feedback"
            )

            self.examples.append(example)
            queries_seen.add(fb.query)

        # Añadir satisfacción sin feedback (baja puntuación)
        for query, sat_list in satisfaction_by_query.items():
            if query in queries_seen:
                continue

            for s in sat_list:
                try:
                    score = float(s.score) if str(s.score).isdigit() else None
                except (ValueError, TypeError):
                    score = None

                # Solo incluir si tiene puntuación baja
                if score is not None and score < 7:
                    example = RetrainExample(
                        query=s.query,
                        original_response=s.response,
                        corrected_response="",  # Sin corrección
                        satisfaction_score=score,
                        source="satisfaction"
                    )
                    self.examples.append(example)

        logger.info(f"Generated {len(self.examples)} retrain examples")
        return self.examples

    def save_json(self, filepath: Path | str = None):
        """Guarda dataset en formato JSON."""
        filepath = Path(filepath) if filepath else OUTPUT_JSON
        filepath.parent.mkdir(parents=True, exist_ok=True)

        data = [
            {
                "query": e.query,
                "original_response": e.original_response,
                "corrected_response": e.corrected_response,
                "satisfaction_score": e.satisfaction_score,
                "source": e.source,
            }
            for e in self.examples
        ]

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"Saved JSON to {filepath}")
        print(f"📄 JSON guardado: {filepath}")

    def save_jsonl(self, filepath: Path | str = None):
        """
        Guarda dataset en formato JSONL.
        Compatible con OpenAI fine-tuning.
        """
        filepath = Path(filepath) if filepath else OUTPUT_JSONL
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "w", encoding="utf-8") as f:
            for e in self.examples:
                if e.corrected_response:
                    # Formato compatible con fine-tuning
                    entry = {
                        "messages": [
                            {"role": "user", "content": e.query},
                            {"role": "assistant", "content": e.corrected_response}
                        ]
                    }
                    f.write(json.dumps(entry, ensure_ascii=False) + "\n")

        logger.info(f"Saved JSONL to {filepath}")
        print(f"📄 JSONL guardado: {filepath}")

    def save_csv(self, filepath: Path | str = None):
        """Guarda dataset en formato CSV."""
        filepath = Path(filepath) if filepath else OUTPUT_CSV
        filepath.parent.mkdir(parents=True, exist_ok=True)

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("query,original_response,corrected_response,satisfaction_score,source\n")
            for e in self.examples:
                original = e.original_response.replace('"', '""').replace("\n", " ")[:100]
                corrected = e.corrected_response.replace('"', '""').replace("\n", " ")[:100]
                score = str(e.satisfaction_score) if e.satisfaction_score else ""
                f.write(f'"{e.query}","{original}","{corrected}",{score},{e.source}\n')

        logger.info(f"Saved CSV to {filepath}")
        print(f"📄 CSV guardado: {filepath}")

    def save_all_formats(self):
        """Guarda en todos los formatos."""
        self.save_json()
        self.save_jsonl()
        self.save_csv()

    def get_stats(self) -> dict:
        """Obtiene estadísticas del dataset."""
        scores = [e.satisfaction_score for e in self.examples if e.satisfaction_score is not None]

        return {
            "total_examples": len(self.examples),
            "from_feedback": sum(1 for e in self.examples if e.source in ["feedback", "both"]),
            "from_satisfaction": sum(1 for e in self.examples if e.source == "satisfaction"),
            "with_corrections": sum(1 for e in self.examples if e.corrected_response),
            "avg_satisfaction": sum(scores) / len(scores) if scores else 0,
            "low_satisfaction": sum(1 for s in scores if s < 7),
            "generated_at": datetime.now().isoformat(),
        }


# =============================================================================
# FUNCIONES DE CONVENIENCIA
# =============================================================================

def generate_dataset() -> list[RetrainExample]:
    """
    Genera dataset de reentrenamiento.

    Returns:
        Lista de ejemplos
    """
    generator = RetrainDatasetGenerator()

    print("\n📊 Generando dataset de reentrenamiento...")

    feedback_count = generator.load_feedback()
    satisfaction_count = generator.load_satisfaction()

    examples = generator.generate_examples()
    generator.save_all_formats()

    stats = generator.get_stats()

    print(f"\n✅ Dataset generado con {stats['total_examples']} ejemplos:")
    print(f"   • Desde feedback: {stats['from_feedback']}")
    print(f"   • Desde satisfacción: {stats['from_satisfaction']}")
    print(f"   • Con correcciones: {stats['with_corrections']}")
    if stats['avg_satisfaction']:
        print(f"   • Satisfacción promedio: {stats['avg_satisfaction']:.1f}")

    return examples


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    generate_dataset()
