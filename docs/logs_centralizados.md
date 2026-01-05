# Logs estructurados y centralizados en NEXUS V1

## ¿Por qué centralizar los logs?
Centralizar los logs permite monitorear, auditar y depurar el sistema de forma eficiente, especialmente en entornos distribuidos o en producción.

## ¿Cómo está implementado en NEXUS V1?
- Se utiliza Winston como logger principal en el backend (`server/src/utils/logger.ts`).
- En desarrollo, los logs se muestran en consola de forma legible y colorizada.
- En producción, los logs pueden enviarse en formato JSON a sistemas centralizados como Loki, ELK, Azure Monitor, etc.
- Si defines la variable de entorno `LOGS_HTTP_ENDPOINT`, Winston enviará los logs a ese endpoint vía HTTP (requiere el paquete `winston-http-transport`).

## Ejemplo de configuración para Loki/ELK
1. Instala el paquete necesario:
   ```sh
   pnpm add winston-http-transport
   # o npm install winston-http-transport
   ```
2. Define la variable de entorno en tu entorno de producción:
   ```sh
   export LOGS_HTTP_ENDPOINT="http://<tu-endpoint-logs>"
   ```
3. Los logs se enviarán automáticamente en formato JSON.

## Buenas prácticas
- Usa formato JSON en producción para facilitar el análisis automático.
- Añade metadatos relevantes (usuario, IP, requestId, etc.) en los logs.
- Configura alertas en tu sistema de logs ante errores críticos.

## Recursos útiles
- [Winston Logger](https://github.com/winstonjs/winston)
- [Grafana Loki](https://grafana.com/oss/loki/)
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
- [Azure Monitor Logs](https://learn.microsoft.com/en-us/azure/azure-monitor/logs/)

---

¿Dudas? Consulta el archivo de logger o contacta al equipo DevOps.

