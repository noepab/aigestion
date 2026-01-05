"""
Auto Evaluation Module - Evaluación automática de calidad
==========================================================

Evalúa automáticamente la calidad del agente usando:
- Métricas de similitud semántica
- Puntuaciones NPS/CSAT
- Umbrales configurables
- Alertas automáticas

Uso:
    from src.training.evaluation import run_auto_evaluation, AutoEvaluator

    # Uso rápido
    report = run_auto_evaluation()

    # Uso avanzado
    evaluator = AutoEvaluator()
    evaluator.evaluate_semantic()
    evaluator.evaluate_satisfaction()
    evaluator.print_report()
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import NamedTuple

import numpy as np

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_FILE = PROJECT_ROOT / "logs" / "training.log"

# Archivos de entrada
SEMANTIC_RESULTS_FILE = PROJECT_ROOT / "data" / "semantic_context_results.json"
SATISFACTION_FILE = PROJECT_ROOT / "data" / "aigestion_satisfaction.json"

# Umbrales
THRESHOLDS = {
    "semantic_min": 0.5,      # Mínima similitud semántica aceptable
    "semantic_good": 0.7,     # Similitud semántica buena
    "nps_min": 6,             # Mínimo NPS aceptable
    "nps_good": 8,            # NPS bueno
    "csat_ok_ratio": 0.7,     # Mínimo ratio de "ok" en CSAT
}

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [AutoEval] %(message)s",
)
logger = logging.getLogger("AIGestion.AutoEval")


# =============================================================================
# TIPOS
# =============================================================================

class EvaluationResult(NamedTuple):
    """Resultado de evaluación."""
    name: str
    value: float
    threshold: float
    status: str  # "good" | "warning" | "critical"
    recommendation: str


class EvaluationReport(NamedTuple):
    """Reporte completo de evaluación."""
    results: list[EvaluationResult]
    overall_status: str
    needs_retraining: bool
    generated_at: str


# =============================================================================
# CLASE PRINCIPAL
# =============================================================================

class AutoEvaluator:
    """
    Evaluador automático de calidad del agente.

    Analiza múltiples métricas y genera recomendaciones.
    """

    def __init__(self, thresholds: dict = None):
        """
        Inicializa el evaluador.

        Args:
            thresholds: Umbrales personalizados
        """
        self.thresholds = {**THRESHOLDS, **(thresholds or {})}
        self.results: list[EvaluationResult] = []

    def evaluate_semantic(self, filepath: Path | str = None) -> EvaluationResult | None:
        """
        Evalúa métricas de similitud semántica.

        Args:
            filepath: Ruta al archivo de resultados semánticos

        Returns:
            EvaluationResult o None si no hay datos
        """
        filepath = Path(filepath) if filepath else SEMANTIC_RESULTS_FILE

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"Error loading semantic results: {e}")
            return None

        if not data:
            return None

        scores = [item.get("semantic_similarity", 0) for item in data]
        mean_score = float(np.mean(scores))

        # Determinar estado
        if mean_score >= self.thresholds["semantic_good"]:
            status = "good"
            recommendation = "Coherencia semántica excelente. Mantener configuración actual."
        elif mean_score >= self.thresholds["semantic_min"]:
            status = "warning"
            recommendation = "Coherencia semántica aceptable. Considerar mejoras en prompts."
        else:
            status = "critical"
            recommendation = "⚠️ Coherencia semántica baja. Reentrenar agente recomendado."

        result = EvaluationResult(
            name="Similitud Semántica",
            value=mean_score,
            threshold=self.thresholds["semantic_min"],
            status=status,
            recommendation=recommendation
        )

        self.results.append(result)
        logger.info(f"Semantic evaluation: mean={mean_score:.4f}, status={status}")

        return result

    def evaluate_satisfaction(self, filepath: Path | str = None) -> list[EvaluationResult]:
        """
        Evalúa métricas de satisfacción (NPS/CSAT).

        Args:
            filepath: Ruta al archivo de satisfacción

        Returns:
            Lista de EvaluationResult
        """
        filepath = Path(filepath) if filepath else SATISFACTION_FILE

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            logger.warning(f"Error loading satisfaction data: {e}")
            return []

        if not data:
            return []

        results = []

        # Separar NPS (numérico) y CSAT (ok/nok)
        nps_scores = []
        csat_ok = 0
        csat_total = 0

        for item in data:
            score = item.get("score", "")

            if str(score).isdigit():
                nps_scores.append(int(score))
            elif str(score).lower() in ["ok", "nok"]:
                csat_total += 1
                if str(score).lower() == "ok":
                    csat_ok += 1

        # Evaluar NPS
        if nps_scores:
            nps_mean = float(np.mean(nps_scores))

            if nps_mean >= self.thresholds["nps_good"]:
                status = "good"
                recommendation = "NPS excelente. Los usuarios están muy satisfechos."
            elif nps_mean >= self.thresholds["nps_min"]:
                status = "warning"
                recommendation = "NPS aceptable. Hay margen de mejora."
            else:
                status = "critical"
                recommendation = "⚠️ NPS bajo. Revisar calidad de respuestas del agente."

            result = EvaluationResult(
                name="NPS (Net Promoter Score)",
                value=nps_mean,
                threshold=self.thresholds["nps_min"],
                status=status,
                recommendation=recommendation
            )
            results.append(result)
            self.results.append(result)
            logger.info(f"NPS evaluation: mean={nps_mean:.2f}, status={status}")

        # Evaluar CSAT
        if csat_total > 0:
            csat_ratio = csat_ok / csat_total

            if csat_ratio >= self.thresholds["csat_ok_ratio"]:
                status = "good"
                recommendation = "CSAT excelente. Alta tasa de respuestas satisfactorias."
            elif csat_ratio >= 0.5:
                status = "warning"
                recommendation = "CSAT moderado. Revisar casos de insatisfacción."
            else:
                status = "critical"
                recommendation = "⚠️ CSAT bajo. Mayoría de usuarios insatisfechos."

            result = EvaluationResult(
                name="CSAT (Customer Satisfaction)",
                value=csat_ratio,
                threshold=self.thresholds["csat_ok_ratio"],
                status=status,
                recommendation=recommendation
            )
            results.append(result)
            self.results.append(result)
            logger.info(f"CSAT evaluation: ratio={csat_ratio:.2%}, status={status}")

        return results

    def generate_report(self) -> EvaluationReport:
        """
        Genera reporte completo de evaluación.

        Returns:
            EvaluationReport con todos los resultados
        """
        # Determinar estado general
        critical_count = sum(1 for r in self.results if r.status == "critical")
        warning_count = sum(1 for r in self.results if r.status == "warning")

        if critical_count > 0:
            overall_status = "critical"
        elif warning_count > 0:
            overall_status = "warning"
        else:
            overall_status = "good"

        needs_retraining = critical_count > 0

        return EvaluationReport(
            results=self.results,
            overall_status=overall_status,
            needs_retraining=needs_retraining,
            generated_at=datetime.now().isoformat()
        )

    def print_report(self):
        """Imprime reporte en consola."""
        report = self.generate_report()

        print("\n" + "=" * 60)
        print("  EVALUACIÓN AUTOMÁTICA DE CALIDAD AIGESTION")
        print("=" * 60)

        status_emoji = {
            "good": "✅",
            "warning": "⚠️",
            "critical": "❌"
        }

        print(f"\n📊 Estado general: {status_emoji.get(report.overall_status, '❓')} {report.overall_status.upper()}")
        print(f"   Generado: {report.generated_at}")

        if not self.results:
            print("\n⚠️ No hay datos suficientes para evaluación.")
            return

        print("\n📋 Métricas evaluadas:")
        for r in self.results:
            emoji = status_emoji.get(r.status, "❓")
            print(f"\n   {emoji} {r.name}")
            print(f"      Valor: {r.value:.2f} (umbral: {r.threshold})")
            print(f"      {r.recommendation}")

        if report.needs_retraining:
            print("\n" + "=" * 60)
            print("  ⚠️ ACCIÓN REQUERIDA: REENTRENAR AGENTE")
            print("=" * 60)
            print("  Ejecutar: python -m src.training.retrain")

        print()


# =============================================================================
# FUNCIONES DE CONVENIENCIA
# =============================================================================

def run_auto_evaluation() -> EvaluationReport:
    """
    Ejecuta evaluación automática completa.

    Returns:
        EvaluationReport con resultados
    """
    print("\n🔍 Ejecutando evaluación automática...")

    evaluator = AutoEvaluator()
    evaluator.evaluate_semantic()
    evaluator.evaluate_satisfaction()
    evaluator.print_report()

    return evaluator.generate_report()


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    run_auto_evaluation()
