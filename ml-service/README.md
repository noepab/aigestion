# NEXUS V1 NeuroCore (ML Service)

Servicio de Inteligencia Artificial para RAG (Retrieval-Augmented Generation) y Deep Learning local.

## Capacidades

1. **Archivar (Ingest)**: Almacena texto y documentos vectorizados localmente.
2. **Memorizar (Recall)**: Busca información semánticamente relevante.
3. **Deep Learning**: Utiliza `sentence-transformers` (all-MiniLM-L6-v2) para embeddings de alta eficiencia.

## Instalación

```powershell
# Crear entorno virtual
python -m venv .venv

# Activar
.\.venv\Scripts\Activate

# Instalar dependencias
pip install -r requirements.txt
```

## Ejecución

```powershell
python -m app.main
```

## API

La documentación interactiva estará disponible en: `http://localhost:8000/docs`

### Endpoints

- `POST /archive`: Guardar conocimiento.
  ```json
  {
    "content": "El proyecto NEXUS V1 busca automatizar la gestión mediante IA.",
    "source": "manual",
    "tags": ["intro", "vision"]
  }
  ```

- `POST /recall`: Recuperar conocimiento.
  ```json
  {
    "query": "¿Cuál es el objetivo de NEXUS V1?"
  }
  ```

