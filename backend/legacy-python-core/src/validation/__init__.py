"""
Validation Module - Validadores para AIGestion
=========================================

Contiene:
- faq: Validador de formato FAQ
- semantic: Validación semántica con embeddings
- artifacts: Validador de integridad de artefactos
- scripts: Validador de permisos de scripts

Uso:
    from src.validation import faq, semantic

    faq.validate()
    semantic.validate_context()
"""

from src.validation import faq, semantic

__all__ = ["faq", "semantic"]
