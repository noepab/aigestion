"""
Help Web - Servidor web de ayuda AIGestion
====================================

Interfaz web para el sistema de ayuda usando Flask.

Características:
- UI responsive con Bootstrap 5
- Búsqueda en FAQ con resaltado
- Logging de consultas
- Modo oscuro/claro
- Historial de preguntas recientes

Uso:
    python -m src.help.web

    O desde código:
    from src.help.web import app
    app.run(port=8080, debug=True)
"""

import logging
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, render_template_string, request

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

PROJECT_ROOT = Path(__file__).parent.parent.parent
FAQ_FILE = PROJECT_ROOT / "docs" / "AIG_FAQ.md"
LOG_FILE = PROJECT_ROOT / "logs" / "help_web.log"
SUPPORT_EMAIL = "soporte@aigestion.net"

# Configurar logging
logging.basicConfig(
    filename=str(LOG_FILE),
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [HelpWeb] %(message)s",
)
logger = logging.getLogger("AIGestion.HelpWeb")

# Flask app
app = Flask(__name__)

# Historial de preguntas recientes
recent_questions = []
MAX_RECENT = 10

# =============================================================================
# TEMPLATES
# =============================================================================

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="es" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIGestion Help Bot</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <style>
        :root {
            --aigestion-primary: #6366f1;
            --aigestion-secondary: #8b5cf6;
            --aigestion-success: #22c55e;
            --aigestion-gradient: linear-gradient(135deg, var(--aigestion-primary), var(--aigestion-secondary));
        }

        body {
            min-height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        .hero-gradient {
            background: var(--aigestion-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .card {
            background: rgba(30, 41, 59, 0.8);
            border: 1px solid rgba(99, 102, 241, 0.2);
            backdrop-filter: blur(10px);
        }

        .card:hover {
            border-color: rgba(99, 102, 241, 0.5);
            box-shadow: 0 0 30px rgba(99, 102, 241, 0.1);
        }

        .btn-aigestion {
            background: var(--aigestion-gradient);
            border: none;
            color: white;
            transition: all 0.3s ease;
        }

        .btn-aigestion:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
            color: white;
        }

        .answer-box {
            background: rgba(34, 197, 94, 0.1);
            border-left: 4px solid var(--aigestion-success);
            padding: 1rem;
            border-radius: 0.5rem;
        }

        .no-answer-box {
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
            padding: 1rem;
            border-radius: 0.5rem;
        }

        .search-input {
            background: rgba(15, 23, 42, 0.8);
            border: 2px solid rgba(99, 102, 241, 0.3);
            color: white;
            padding: 1rem 1.5rem;
            font-size: 1.1rem;
        }

        .search-input:focus {
            background: rgba(15, 23, 42, 0.9);
            border-color: var(--aigestion-primary);
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.2);
            color: white;
        }

        .recent-badge {
            background: rgba(99, 102, 241, 0.2);
            color: var(--aigestion-primary);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .recent-badge:hover {
            background: var(--aigestion-primary);
            color: white;
        }

        .loading-spinner {
            display: none;
        }

        .loading .loading-spinner {
            display: inline-block;
        }

        .loading .btn-text {
            display: none;
        }
    </style>
</head>
<body>
    <div class="container py-5">
        <!-- Header -->
        <div class="text-center mb-5">
            <h1 class="display-4 fw-bold mb-3">
                <i class="bi bi-robot me-2"></i>
                <span class="hero-gradient">AIGestion Help Bot</span>
            </h1>
            <p class="lead text-muted">
                Sistema de ayuda inteligente para el proyecto
            </p>
        </div>

        <!-- Search Card -->
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <div class="card rounded-4 p-4 mb-4">
                    <form method="post" id="searchForm">
                        <div class="input-group mb-3">
                            <input
                                type="text"
                                name="question"
                                id="questionInput"
                                class="form-control search-input rounded-start-4"
                                placeholder="Escribe tu pregunta..."
                                required
                                value="{{ question or '' }}"
                            >
                            <button type="submit" class="btn btn-aigestion btn-lg px-4 rounded-end-4">
                                <span class="loading-spinner spinner-border spinner-border-sm me-2"></span>
                                <span class="btn-text">
                                    <i class="bi bi-search me-2"></i>Buscar
                                </span>
                            </button>
                        </div>
                    </form>

                    {% if recent_questions %}
                    <div class="mb-3">
                        <small class="text-muted">Preguntas recientes:</small>
                        <div class="d-flex flex-wrap gap-2 mt-2">
                            {% for q in recent_questions[-5:] %}
                            <span class="badge recent-badge px-3 py-2" onclick="fillQuestion('{{ q }}')">
                                {{ q[:30] }}{% if q|length > 30 %}...{% endif %}
                            </span>
                            {% endfor %}
                        </div>
                    </div>
                    {% endif %}

                    {% if answer %}
                    <div class="answer-box mt-4">
                        <h5 class="mb-3">
                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                            Respuesta encontrada
                        </h5>
                        <p class="mb-0">{{ answer }}</p>
                    </div>
                    {% elif question %}
                    <div class="no-answer-box mt-4">
                        <h5 class="mb-3">
                            <i class="bi bi-question-circle-fill text-danger me-2"></i>
                            No encontré una respuesta directa
                        </h5>
                        <p class="mb-2">Puedes consultar la documentación o escribir a:</p>
                        <a href="mailto:{{ support_email }}" class="btn btn-outline-light btn-sm">
                            <i class="bi bi-envelope me-2"></i>{{ support_email }}
                        </a>
                    </div>
                    {% endif %}
                </div>

                <!-- Info Cards -->
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="card rounded-3 p-3 h-100">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-book fs-3 text-primary me-3"></i>
                                <div>
                                    <h6 class="mb-1">Documentación</h6>
                                    <small class="text-muted">Guías y tutoriales</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card rounded-3 p-3 h-100">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-lightning fs-3 text-warning me-3"></i>
                                <div>
                                    <h6 class="mb-1">Inicio rápido</h6>
                                    <small class="text-muted">AIGestion_GUIA_RAPIDA.md</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card rounded-3 p-3 h-100">
                            <div class="d-flex align-items-center">
                                <i class="bi bi-shield-check fs-3 text-success me-3"></i>
                                <div>
                                    <h6 class="mb-1">Soporte</h6>
                                    <small class="text-muted">24/7 disponible</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <footer class="text-center mt-5 pt-4 border-top border-secondary">
            <p class="text-muted mb-0">
                <i class="bi bi-gear me-2"></i>
                AIGestion Project &copy; {{ year }}
            </p>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        function fillQuestion(q) {
            document.getElementById('questionInput').value = q;
            document.getElementById('questionInput').focus();
        }

        document.getElementById('searchForm').addEventListener('submit', function() {
            this.classList.add('loading');
        });
    </script>
</body>
</html>
"""


# =============================================================================
# FUNCIONES
# =============================================================================

def load_faq() -> str:
    """Carga el contenido del archivo FAQ."""
    try:
        with open(FAQ_FILE, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.error(f"FAQ file not found: {FAQ_FILE}")
        return ""


def search_faq(query: str, faq_content: str) -> str | None:
    """Busca una respuesta en el FAQ."""
    if not query:
        return None

    for line in faq_content.splitlines():
        if query in line.lower():
            return line

    return None


# =============================================================================
# ROUTES
# =============================================================================

@app.route("/", methods=["GET", "POST"])
def help_bot():
    """Ruta principal del help bot."""
    global recent_questions

    answer = None
    question = None
    faq = load_faq()

    if request.method == "POST":
        question = request.form.get("question", "").strip()

        if question:
            # Guardar en historial
            if question not in recent_questions:
                recent_questions.append(question)
                if len(recent_questions) > MAX_RECENT:
                    recent_questions.pop(0)

            # Registrar consulta
            logger.info(f"Web query: {question}")

            # Buscar respuesta
            answer = search_faq(question.lower(), faq)

            if answer:
                logger.info(f"Answer found for: {question[:30]}...")
            else:
                logger.info(f"No answer for: {question[:30]}...")

    return render_template_string(
        HTML_TEMPLATE,
        answer=answer,
        question=question,
        support_email=SUPPORT_EMAIL,
        recent_questions=recent_questions,
        year=datetime.now().year,
    )


@app.route("/api/search", methods=["POST"])
def api_search():
    """API endpoint para búsqueda."""
    data = request.get_json() or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Question required"}), 400

    faq = load_faq()
    answer = search_faq(question.lower(), faq)

    logger.info(f"API query: {question[:30]}...")

    return jsonify({
        "question": question,
        "answer": answer,
        "found": answer is not None,
        "support_email": SUPPORT_EMAIL,
    })


@app.route("/health")
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "AIGestion HelpBot Web"})


# =============================================================================
# MAIN
# =============================================================================

def run(host="0.0.0.0", port=8080, debug=False):
    """Inicia el servidor web."""
    print(f"\n🚀 AIGestion Help Bot Web iniciando en http://{host}:{port}\n")
    app.run(host=host, port=port, debug=debug)


if __name__ == "__main__":
    run(debug=True)
