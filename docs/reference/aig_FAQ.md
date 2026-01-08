# Preguntas Frecuentes (FAQ) NEXUS V1 Agent

## 1. ¿Cómo inicio el agente?
Ejecuta en consola:
```pwsh
python agente_base.py
```

## 2. ¿Cómo cambio el idioma?
Edita `.env` y pon:
```
NEXUS V1_LANG=es  # o en, fr
```

## 3. ¿Cómo consulto el clima real?
Configura tu API key en `.env`:
```
OPENWEATHER_API_KEY=tu_api_key
```

## 4. ¿Por qué recibo "Permiso denegado"?
Tu rol no permite esa acción. Pide al admin que cambie `NEXUS V1_ROLE` en `.env`.

## 5. ¿Cómo doy feedback o califico respuestas?
Después de cada respuesta, puedes escribir una corrección y calificar (1-10 o ok/nok).

## 6. ¿Dónde veo métricas y auditoría?
- Métricas: `semantic_metrics.csv`
- Auditoría: `audit_report.md`
- Logs: `agente_logs.log`

## 7. ¿Cómo reentreno el agente?
Ejecuta:
```pwsh
python retrain_agent.py
```
Usa `retrain_data.json` para entrenar el modelo.

## 8. ¿Cómo recibo notificaciones de calidad?
Configura Slack y ejecuta:
```pwsh
python notify_quality.py
```

## 9. ¿Qué hago si la respuesta es ambigua?
Aclara tu pregunta o pide más detalles. El agente te lo sugerirá automáticamente.

## 10. ¿Dónde encuentro ayuda?
- Guía rápida: `NEXUS V1_GUIA_RAPIDA.md`
- Soporte: `NEXUS V1_SOPORTE_USUARIOS.md`
- Documentación: `DOCUMENTACION_NEXUS V1.md`
- Email: soporte@NEXUS V1.com

---
**¿Tienes otra pregunta? Contacta al equipo NEXUS V1.**

