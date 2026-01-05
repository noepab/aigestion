"""
Semantic Validator - Validación semántica con embeddings
=========================================================

Valida la coherencia semántica entre queries y respuestas
usando modelos de embeddings (sentence-transformers).

Características:
- Cálculo de similitud coseno entre query y respuesta
- Detección de outliers semánticos
- Reporte de métricas agregadas
- Exportación a CSV

Dependencias:
- sentence-transformers
- numpy

Uso:
    from src.validation.semantic import validate_context, SemanticValidator

    # Uso rápido
    results = validate_context()

    # Uso avanzado
    validator = SemanticValidator()
    results = validator.validate_file("context.json")
    validator.export_csv("semantic_metrics.csv")
"""

import json
import logging
from pathlib import Path
from typing import NamedTuple

import numpy as np

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_FILE = PROJECT_ROOT / "logs" / "validation.log"

# Archivos por defecto
CONTEXT_FILE = PROJECT_ROOT / "data" / "aigestion_context.json"
RESULTS_FILE = PROJECT_ROOT / "data" / "semantic_context_results.json"
METRICS_FILE = PROJECT_ROOT / "data" / "semantic_metrics.csv"

# Modelo de embeddings
DEFAULT_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"

# Umbrales
SIMILARITY_THRESHOLD = 0.5  # Mínima similitud aceptable
OUTLIER_THRESHOLD = 0.3     # Por debajo de esto es outlier

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [SemanticValidator] %(message)s",
)
logger = logging.getLogger("AIGestion.SemanticValidator")


# =============================================================================
# TIPOS
# =============================================================================

class SemanticResult(NamedTuple):
    """Resultado de validación semántica para un par query-response."""
    query: str
    response: str
    similarity: float
    is_outlier: bool


class SemanticReport(NamedTuple):
    """Reporte agregado de validación semántica."""
    results: list[SemanticResult]
    mean_similarity: float
    std_similarity: float
    min_similarity: float
    max_similarity: float
    outliers_count: int
    total_count: int


# =============================================================================
# CLASE PRINCIPAL
# =============================================================================

class SemanticValidator:
    """
    Validador semántico para queries y respuestas.

    Usa modelos de sentence-transformers para calcular
    embeddings y similitud coseno.
    """

    def __init__(self, model_name: str = DEFAULT_MODEL):
        """
        Inicializa el validador.

        Args:
            model_name: Nombre del modelo de sentence-transformers
        """
        self.model_name = model_name
        self._model = None
        self._results: list[SemanticResult] = []

    @property
    def model(self):
        """Carga lazy del modelo."""
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
                logger.info("Model loaded successfully")
            except ImportError:
                logger.error("sentence-transformers not installed")
                raise ImportError(
                    "Please install sentence-transformers: pip install sentence-transformers"
                )
        return self._model

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """
        Calcula similitud coseno entre dos textos.

        Args:
            text1: Primer texto
            text2: Segundo texto

        Returns:
            Similitud coseno (0-1)
        """
        try:
            from sentence_transformers import util

            emb1 = self.model.encode(text1, convert_to_tensor=True)
            emb2 = self.model.encode(text2, convert_to_tensor=True)

            similarity = float(util.pytorch_cos_sim(emb1, emb2).item())
            return max(0.0, min(1.0, similarity))  # Clamp a [0, 1]

        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0

    def validate_pair(self, query: str, response: str) -> SemanticResult:
        """
        Valida un par query-response.

        Args:
            query: Texto de la query
            response: Texto de la respuesta

        Returns:
            SemanticResult con métricas
        """
        similarity = self.calculate_similarity(query, response)
        is_outlier = similarity < OUTLIER_THRESHOLD

        result = SemanticResult(
            query=query,
            response=response,
            similarity=similarity,
            is_outlier=is_outlier
        )

        self._results.append(result)
        return result

    def validate_file(self, filepath: Path | str = None) -> SemanticReport:
        """
        Valida todos los pares en un archivo JSON.

        Args:
            filepath: Ruta al archivo JSON con formato [{query, response}]

        Returns:
            SemanticReport con métricas agregadas
        """
        filepath = Path(filepath) if filepath else CONTEXT_FILE

        if not filepath.exists():
            logger.error(f"File not found: {filepath}")
            raise FileNotFoundError(f"Archivo no encontrado: {filepath}")

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)

        if not data:
            logger.warning("Empty data file")
            return self._generate_report([])

        logger.info(f"Validating {len(data)} pairs from {filepath}")

        results = []
        for item in data:
            query = item.get("query", "")
            response = item.get("response", "")

            if query and response:
                result = self.validate_pair(query, response)
                results.append(result)

        return self._generate_report(results)

    def _generate_report(self, results: list[SemanticResult]) -> SemanticReport:
        """Genera reporte agregado."""
        if not results:
            return SemanticReport(
                results=[],
                mean_similarity=0.0,
                std_similarity=0.0,
                min_similarity=0.0,
                max_similarity=0.0,
                outliers_count=0,
                total_count=0
            )

        similarities = [r.similarity for r in results]

        return SemanticReport(
            results=results,
            mean_similarity=float(np.mean(similarities)),
            std_similarity=float(np.std(similarities)),
            min_similarity=float(np.min(similarities)),
            max_similarity=float(np.max(similarities)),
            outliers_count=sum(1 for r in results if r.is_outlier),
            total_count=len(results)
        )

    def save_results(self, filepath: Path | str = None):
        """Guarda resultados en JSON."""
        filepath = Path(filepath) if filepath else RESULTS_FILE

        data = [
            {
                "query": r.query,
                "response": r.response,
                "semantic_similarity": r.similarity,
                "is_outlier": r.is_outlier
            }
            for r in self._results
        ]

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        logger.info(f"Results saved to {filepath}")

    def export_csv(self, filepath: Path | str = None):
        """Exporta métricas a CSV."""
        filepath = Path(filepath) if filepath else METRICS_FILE

        with open(filepath, "w", encoding="utf-8") as f:
            f.write("query,response_preview,similarity,is_outlier\n")
            for r in self._results:
                response_preview = r.response[:50].replace(",", ";").replace("\n", " ")
                f.write(f'"{r.query}","{response_preview}",{r.similarity:.4f},{r.is_outlier}\n')

        logger.info(f"CSV exported to {filepath}")


# =============================================================================
# FUNCIONES DE CONVENIENCIA
# =============================================================================

def validate_context(filepath: Path | str = None) -> SemanticReport:
    """
    Valida el archivo de contexto por defecto.

    Args:
        filepath: Ruta opcional al archivo

    Returns:
        SemanticReport con métricas
    """
    validator = SemanticValidator()
    report = validator.validate_file(filepath)
    validator.save_results()

    return report


def print_report(report: SemanticReport):
    """Imprime reporte en consola."""
    print("\n" + "=" * 60)
    print("  REPORTE DE VALIDACIÓN SEMÁNTICA")
    print("=" * 60)

    print(f"\n📊 Métricas ({report.total_count} pares analizados):")
    print(f"   • Similitud promedio: {report.mean_similarity:.4f}")
    print(f"   • Desviación estándar: {report.std_similarity:.4f}")
    print(f"   • Mínimo: {report.min_similarity:.4f}")
    print(f"   • Máximo: {report.max_similarity:.4f}")
    print(f"   • Outliers: {report.outliers_count}")

    # Evaluación
    if report.mean_similarity >= 0.7:
        print("\n✅ Resultado: Coherencia semántica BUENA")
    elif report.mean_similarity >= 0.5:
        print("\n⚠️ Resultado: Coherencia semántica ACEPTABLE")
    else:
        print("\n❌ Resultado: Coherencia semántica BAJA - Considerar reentrenamiento")

    # Mostrar outliers
    if report.outliers_count > 0:
        print(f"\n🔍 Outliers detectados ({report.outliers_count}):")
        for r in report.results:
            if r.is_outlier:
                print(f"   • Query: {r.query[:40]}...")
                print(f"     Similitud: {r.similarity:.4f}")

    print()


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Validador semántico AIGestion")
    parser.add_argument("file", nargs="?", help="Archivo JSON a validar")
    parser.add_argument("--csv", action="store_true", help="Exportar a CSV")
    args = parser.parse_args()

    validator = SemanticValidator()

    try:
        report = validator.validate_file(args.file)
        validator.save_results()

        if args.csv:
            validator.export_csv()

        print_report(report)

    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
    except ImportError as e:
        print(f"❌ Error de dependencia: {e}")
