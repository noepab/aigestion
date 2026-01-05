"""
Training Module - Reentrenamiento y evaluación AIGestion
===================================================

Contiene:
- retrain: Generación de datasets de reentrenamiento
- evaluation: Evaluación automática de calidad

Uso:
    from src.training import retrain, evaluation

    retrain.generate_dataset()
    evaluation.run_auto_evaluation()
"""

from src.training import evaluation, retrain

__all__ = ["retrain", "evaluation"]
