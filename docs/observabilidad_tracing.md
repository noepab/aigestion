# Observabilidad y Tracing Distribuido en NEXUS V1

## ¿Qué es el tracing distribuido?
El tracing distribuido permite seguir el recorrido de una petición a través de los distintos servicios y componentes de NEXUS V1, facilitando la detección de cuellos de botella y errores en producción.

## ¿Cómo está implementado en NEXUS V1?
- Se utiliza OpenTelemetry para instrumentar el backend (Node.js/Express/Mongoose/Socket.IO).
- Las trazas se exportan en formato OTLP, compatibles con Jaeger, Grafana Tempo, Azure Monitor, etc.
- La configuración se encuentra en `server/src/config/tracing.ts`.

## Visualización de trazas
1. Asegúrate de tener un backend de observabilidad (Jaeger, Grafana Tempo, Azure Monitor, etc.) corriendo y accesible desde NEXUS V1.
2. Configura la variable de entorno `OTEL_EXPORTER_OTLP_ENDPOINT` con la URL de tu colector (por ejemplo, `http://localhost:4318`).
3. Inicia NEXUS V1 normalmente. Verás en consola mensajes confirmando la inicialización de OpenTelemetry y el endpoint de exportación.
4. Accede a tu herramienta de observabilidad para visualizar las trazas.

## Personalización y buenas prácticas
- Puedes instrumentar manualmente funciones críticas usando la API de OpenTelemetry exportada desde `tracing.ts`.
- Excluye rutas de salud y estáticos para evitar ruido en las trazas.
- Añade atributos personalizados a las spans para enriquecer la información.

## Recursos útiles
- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Jaeger UI](https://www.jaegertracing.io/docs/1.41/getting-started/)
- [Grafana Tempo](https://grafana.com/oss/tempo/)
- [Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/)

---

¿Dudas? Consulta el archivo de configuración o contacta al equipo DevOps.

