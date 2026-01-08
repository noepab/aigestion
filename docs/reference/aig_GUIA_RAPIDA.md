# Guía Rápida NEXUS V1 Agent

## 1. Despliegue
- Construye y ejecuta:
  ```pwsh
  docker build -t NEXUS V1-agent -f Dockerfile .
  docker-compose up -d
  ```
- Configura `.env` con:
  - `NEXUS V1_USER_TONE=formal`
  - `NEXUS V1_LANG=es`
  - `NEXUS V1_ROLE=admin`
  - `OPENWEATHER_API_KEY=tu_api_key`

## 2. Uso Básico
- Ejecuta el agente:
  ```pwsh
  python agente_base.py
  ```
- Interactúa y responde a las preguntas en consola.
- Proporciona feedback y calificación tras cada respuesta.

## 3. Evaluación y Métricas
- Ejecuta autoevaluación:
  ```pwsh
  python auto_evaluation.py
  ```
- Exporta métricas para dashboards:
  ```pwsh
  python export_semantic_csv.py
  ```

## 4. Entrenamiento
- Genera dataset para reentrenar:
  ```pwsh
  python retrain_agent.py
  ```
- Usa `retrain_data.json` para entrenar tu modelo.

## 5. Integraciones
- Clima real: Configura `OPENWEATHER_API_KEY`.
- Notificaciones: Configura `NEXUS V1_SLACK_WEBHOOK` y ejecuta `python notify_quality.py`.

## 6. Seguridad y Roles
- Edita `roles.json` para definir permisos.
- Cambia el rol con `NEXUS V1_ROLE` en `.env`.

## 7. Documentación y Auditoría
- Consulta `DOCUMENTACION_NEXUS V1.md` y `audit_report.md` para detalles y estado del sistema.

---
**Listo para producción y mejora continua.**

