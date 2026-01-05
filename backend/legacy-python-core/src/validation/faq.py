"""
FAQ Validator - Validador de formato FAQ
=========================================

Valida que los archivos FAQ sigan el formato esperado:
- Título principal válido
- Preguntas con formato Q#:
- Respuestas con formato A#:
- Estructura coherente

Uso:
    from src.validation.faq import validate, validate_file

    # Validar archivo por defecto
    validate()

    # Validar archivo específico
    validate_file("path/to/faq.md")
"""

import logging
import re
import sys
from pathlib import Path
from typing import NamedTuple

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
LOG_FILE = PROJECT_ROOT / "logs" / "validation.log"

# Archivos por defecto
DEFAULT_FAQ_FILE = PROJECT_ROOT / "docs" / "AIGestion_FAQ_SUGERENCIAS.md"

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [FAQValidator] %(message)s",
)
logger = logging.getLogger("AIGestion.FAQValidator")


# =============================================================================
# PATRONES DE VALIDACIÓN
# =============================================================================

# Patrones regex
PATTERNS = {
    "title": r"^# (?:FAQ|Sugerencias|Preguntas Frecuentes)",
    "question": r"^Q\d+:\s*.+",
    "answer": r"^A\d+:\s*.+",
    "section": r"^##\s+.+",
    "list_item": r"^[-*]\s+.+",
}


# =============================================================================
# TIPOS
# =============================================================================

class ValidationError(NamedTuple):
    """Representa un error de validación."""
    line_number: int
    message: str
    line_content: str
    severity: str  # "error" | "warning"


class ValidationResult(NamedTuple):
    """Resultado de validación."""
    valid: bool
    errors: list[ValidationError]
    warnings: list[ValidationError]
    stats: dict


# =============================================================================
# FUNCIONES DE VALIDACIÓN
# =============================================================================

def validate_file(filepath: Path | str = None) -> ValidationResult:
    """
    Valida un archivo FAQ.

    Args:
        filepath: Ruta al archivo (usa DEFAULT_FAQ_FILE si no se especifica)

    Returns:
        ValidationResult con estado y errores encontrados
    """
    filepath = Path(filepath) if filepath else DEFAULT_FAQ_FILE

    if not filepath.exists():
        return ValidationResult(
            valid=False,
            errors=[ValidationError(0, f"Archivo no encontrado: {filepath}", "", "error")],
            warnings=[],
            stats={}
        )

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            lines = f.readlines()
    except IOError as e:
        logger.error(f"Error reading file {filepath}: {e}")
        return ValidationResult(
            valid=False,
            errors=[ValidationError(0, f"Error leyendo archivo: {e}", "", "error")],
            warnings=[],
            stats={}
        )

    errors = []
    warnings = []
    stats = {
        "total_lines": len(lines),
        "questions": 0,
        "answers": 0,
        "sections": 0,
    }

    # Validar título
    if lines and not re.match(PATTERNS["title"], lines[0], re.IGNORECASE):
        warnings.append(ValidationError(
            1,
            "El título principal no sigue el formato recomendado (# FAQ o similar)",
            lines[0].strip(),
            "warning"
        ))

    # Validar cada línea
    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        if not stripped:
            continue

        # Contar elementos
        if re.match(PATTERNS["question"], stripped):
            stats["questions"] += 1
        elif re.match(PATTERNS["answer"], stripped):
            stats["answers"] += 1
        elif re.match(PATTERNS["section"], stripped):
            stats["sections"] += 1

        # Validar preguntas malformadas
        if stripped.startswith("Q") and stripped[1:2].isdigit():
            if not re.match(PATTERNS["question"], stripped):
                errors.append(ValidationError(
                    i,
                    "Pregunta mal formateada (debe ser: Q#: texto)",
                    stripped[:50],
                    "error"
                ))

        # Validar respuestas malformadas
        if stripped.startswith("A") and stripped[1:2].isdigit():
            if not re.match(PATTERNS["answer"], stripped):
                errors.append(ValidationError(
                    i,
                    "Respuesta mal formateada (debe ser: A#: texto)",
                    stripped[:50],
                    "error"
                ))

    # Validar coherencia Q/A
    if stats["questions"] != stats["answers"]:
        warnings.append(ValidationError(
            0,
            f"Número de preguntas ({stats['questions']}) no coincide con respuestas ({stats['answers']})",
            "",
            "warning"
        ))

    is_valid = len(errors) == 0

    logger.info(f"Validation completed for {filepath}: valid={is_valid}, errors={len(errors)}, warnings={len(warnings)}")

    return ValidationResult(
        valid=is_valid,
        errors=errors,
        warnings=warnings,
        stats=stats
    )


def validate(filepath: Path | str = None, exit_on_error: bool = True) -> bool:
    """
    Valida y muestra resultados en consola.

    Args:
        filepath: Ruta al archivo
        exit_on_error: Si True, termina con exit(1) si hay errores

    Returns:
        True si es válido, False en caso contrario
    """
    filepath = Path(filepath) if filepath else DEFAULT_FAQ_FILE

    print(f"\n📋 Validando: {filepath}\n")

    result = validate_file(filepath)

    # Mostrar estadísticas
    print("📊 Estadísticas:")
    print(f"   • Líneas: {result.stats.get('total_lines', 0)}")
    print(f"   • Preguntas: {result.stats.get('questions', 0)}")
    print(f"   • Respuestas: {result.stats.get('answers', 0)}")
    print(f"   • Secciones: {result.stats.get('sections', 0)}")
    print()

    # Mostrar warnings
    if result.warnings:
        print(f"⚠️ Advertencias ({len(result.warnings)}):")
        for w in result.warnings:
            print(f"   Línea {w.line_number}: {w.message}")
            if w.line_content:
                print(f"   → {w.line_content}")
        print()

    # Mostrar errores
    if result.errors:
        print(f"❌ Errores ({len(result.errors)}):")
        for e in result.errors:
            print(f"   Línea {e.line_number}: {e.message}")
            if e.line_content:
                print(f"   → {e.line_content}")
        print()

        if exit_on_error:
            sys.exit(1)
        return False

    print("✅ Formato de FAQ válido.\n")
    return True


# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Validador de formato FAQ")
    parser.add_argument("file", nargs="?", help="Archivo a validar")
    parser.add_argument("--no-exit", action="store_true", help="No terminar con error")
    args = parser.parse_args()

    validate(args.file, exit_on_error=not args.no_exit)
