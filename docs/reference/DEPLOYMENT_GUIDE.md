# 🚀 Guía de Deployment - Jaeger y MongoDB Backups

**Fecha:** 6 de diciembre de 2025
**Estado:** Listo para deployment cuando Kubernetes esté disponible

---

## ⚙️ Prerequisitos

### 1. Habilitar Kubernetes en Docker Desktop

1. **Abrir Docker Desktop**
2. **Settings (⚙️) → Kubernetes**
3. **✅ Enable Kubernetes**
4. **Apply & Restart**
5. Esperar ~2-3 minutos hasta que aparezca "Kubernetes is running"

**Verificar instalación:**
```powershell
kubectl version --client
kubectl cluster-info
kubectl get nodes
```

**Output esperado:**
```
NAME             STATUS   ROLES           AGE   VERSION
docker-desktop   Ready    control-plane   Xd    vX.XX.X
```

### 2. Verificar Metrics Server (para HPA)

```powershell
kubectl get deployment metrics-server -n kube-system
```

**Si no está instalado:**
```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Para Docker Desktop, agregar --kubelet-insecure-tls
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

---

## 📦 Deployment Paso a Paso

### PASO 1: Crear Namespace

```powershell
cd C:\Users\Alejandro\NEXUS V1

# Crear namespace
kubectl apply -f k8s/namespace.yaml

# Verificar
kubectl get namespace NEXUS V1
```

**Output esperado:**
```
NAME   STATUS   AGE
NEXUS V1    Active   5s
```

---

### PASO 2: Deploy Jaeger (Observabilidad)

```powershell
# Aplicar deployment
kubectl apply -f k8s/jaeger-deployment.yaml

# Esperar deployment
kubectl wait --for=condition=available --timeout=300s deployment/jaeger -n NEXUS V1

# Verificar estado
kubectl get all -n NEXUS V1 -l app=jaeger
```

**Output esperado:**
```
NAME                         READY   STATUS    RESTARTS   AGE
pod/jaeger-xxxxxxxxxx-xxxxx  1/1     Running   0          30s

NAME             TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
service/jaeger   ClusterIP   10.96.xxx.xxx   <none>        14268/TCP,14250/TCP,16686/TCP,...

NAME                     READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/jaeger   1/1     1            1           30s
```

**Acceder a Jaeger UI:**
```powershell
# Port-forward para acceder localmente
kubectl port-forward -n NEXUS V1 svc/jaeger 16686:16686

# Abrir en navegador
Start-Process "http://localhost:16686"
```

**Jaeger UI estará disponible en:** http://localhost:16686

---

### PASO 3: Deploy MongoDB Backup Automation

```powershell
# Aplicar CronJob y PVC
kubectl apply -f k8s/mongodb-backup-cronjob.yaml

# Verificar CronJob
kubectl get cronjob -n NEXUS V1

# Verificar PVC
kubectl get pvc -n NEXUS V1 -l app=mongodb-backup
```

**Output esperado:**
```
NAME             SCHEDULE     SUSPEND   ACTIVE   LAST SCHEDULE   AGE
mongodb-backup   0 2 * * *    False     0        <none>          10s

NAME                    STATUS   VOLUME   CAPACITY   ACCESS MODES   STORAGECLASS   AGE
mongodb-backup-pvc      Bound    pvc-xxx  100Gi      RWO            standard       10s
```

**Ejecutar backup manualmente (testing):**
```powershell
# Crear Job desde CronJob
kubectl create job --from=cronjob/mongodb-backup mongodb-backup-manual -n NEXUS V1

# Ver logs del backup
kubectl logs -n NEXUS V1 -l app=mongodb-backup --follow
```

---

## 🔍 Verificación Completa

### Script de Validación Automática

```powershell
# Ejecutar health check
.\scripts\k8s-health-check.ps1 -Namespace NEXUS V1 -Detailed
```

### Verificación Manual

```powershell
# 1. Ver todos los recursos
kubectl get all -n NEXUS V1

# 2. Ver PVCs
kubectl get pvc -n NEXUS V1

# 3. Ver ConfigMaps
kubectl get configmap -n NEXUS V1

# 4. Ver Secrets (sin mostrar valores)
kubectl get secrets -n NEXUS V1

# 5. Ver NetworkPolicies
kubectl get networkpolicies -n NEXUS V1

# 6. Ver eventos recientes
kubectl get events -n NEXUS V1 --sort-by='.lastTimestamp' | Select-Object -Last 20
```

---

## 🔧 Integración con Aplicación

### Configurar App para enviar Traces a Jaeger

#### Opción 1: OpenTelemetry SDK (Recomendado)

**Instalar dependencias:**
```powershell
cd server
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-jaeger
```

**Crear `server/src/tracing.ts`:**
```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'NEXUS V1-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter: jaegerExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Deshabilitar para reducir ruido
      },
    }),
  ],
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('✅ Tracing shutdown'))
    .catch((error) => console.error('❌ Error shutting down tracing', error))
    .finally(() => process.exit(0));
});

export default sdk;
```

**Modificar `server/src/server.ts`:**
```typescript
// ⚠️ Debe ser la PRIMERA línea (antes de cualquier import)
import './tracing';

import express from 'express';
// ... resto de imports
```

**Agregar a `app-deployment.yaml`:**
```yaml
env:
  # ... variables existentes
  - name: JAEGER_ENDPOINT
    value: "http://jaeger:14268/api/traces"
  - name: OTEL_SERVICE_NAME
    value: "NEXUS V1-backend"
  - name: OTEL_LOG_LEVEL
    value: "info"
```

#### Opción 2: Sidecar de OpenTelemetry Collector

**Agregar al `app-deployment.yaml` en `spec.template.spec.containers`:**
```yaml
- name: otel-collector
  image: otel/opentelemetry-collector:0.91.0
  command:
    - "/otelcol"
    - "--config=/conf/otel-collector-config.yaml"
  ports:
    - containerPort: 4317
      name: otlp-grpc
      protocol: TCP
    - containerPort: 4318
      name: otlp-http
      protocol: TCP
  volumeMounts:
    - name: otel-collector-config
      mountPath: /conf
  resources:
    requests:
      memory: '128Mi'
      cpu: '100m'
    limits:
      memory: '256Mi'
      cpu: '200m'
```

**Agregar volumen:**
```yaml
volumes:
  # ... volúmenes existentes
  - name: otel-collector-config
    configMap:
      name: otel-collector-config
```

---

## 📊 Monitoreo y Troubleshooting

### Ver Logs de Jaeger

```powershell
# Logs en tiempo real
kubectl logs -n NEXUS V1 -l app=jaeger --follow

# Últimas 100 líneas
kubectl logs -n NEXUS V1 -l app=jaeger --tail=100
```

### Ver Logs del Backup

```powershell
# Listar jobs de backup
kubectl get jobs -n NEXUS V1 -l app=mongodb-backup

# Ver logs del último backup
$lastJob = kubectl get jobs -n NEXUS V1 -l app=mongodb-backup --sort-by=.metadata.creationTimestamp -o json | ConvertFrom-Json | Select-Object -Last 1
kubectl logs -n NEXUS V1 job/$($lastJob.metadata.name)
```

### Acceder a Jaeger Storage

```powershell
# Ver contenido del PVC
kubectl exec -it -n NEXUS V1 deployment/jaeger -- ls -lah /badger

# Ver tamaño usado
kubectl exec -it -n NEXUS V1 deployment/jaeger -- du -sh /badger
```

### Problemas Comunes

#### 1. Jaeger Pod en CrashLoopBackOff

**Diagnóstico:**
```powershell
kubectl describe pod -n NEXUS V1 -l app=jaeger
kubectl logs -n NEXUS V1 -l app=jaeger --previous
```

**Solución:**
- Verificar PVC está Bound: `kubectl get pvc -n NEXUS V1 jaeger-storage-pvc`
- Verificar recursos suficientes: `kubectl top nodes`
- Revisar permisos de storage

#### 2. Backup CronJob no ejecuta

**Diagnóstico:**
```powershell
# Ver schedule del CronJob
kubectl get cronjob -n NEXUS V1 mongodb-backup -o yaml | Select-String -Pattern "schedule"

# Ver si hay suspend
kubectl get cronjob -n NEXUS V1 mongodb-backup -o jsonpath='{.spec.suspend}'
```

**Solución:**
```powershell
# Unsuspend si está pausado
kubectl patch cronjob mongodb-backup -n NEXUS V1 -p '{"spec":{"suspend":false}}'

# Ejecutar manualmente
kubectl create job --from=cronjob/mongodb-backup test-backup -n NEXUS V1
```

#### 3. No llegan traces a Jaeger

**Verificar conexión desde app a Jaeger:**
```powershell
# Port-forward Jaeger collector
kubectl port-forward -n NEXUS V1 svc/jaeger 14268:14268

# Desde la app, enviar trace de prueba
curl -X POST http://localhost:14268/api/traces -H "Content-Type: application/json" -d @test-trace.json
```

**Verificar NetworkPolicy permite tráfico:**
```powershell
kubectl get networkpolicy -n NEXUS V1 jaeger-network-policy -o yaml
```

---

## 🎯 Próximos Pasos

### 1. Configurar Grafana para Visualización

```powershell
# Instalar Grafana
kubectl apply -f https://raw.githubusercontent.com/grafana/grafana/main/deploy/kubernetes/grafana.yaml

# Configurar datasource de Jaeger
# Ver: https://grafana.com/docs/grafana/latest/datasources/jaeger/
```

### 2. Configurar Alertas

**Crear AlertManager:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: alertmanager-config
  namespace: NEXUS V1
data:
  alertmanager.yml: |
    route:
      receiver: 'slack'
    receivers:
      - name: 'slack'
        slack_configs:
          - api_url: 'YOUR_SLACK_WEBHOOK'
            channel: '#NEXUS V1-alerts'
```

### 3. Implementar Service Mesh (Istio)

```powershell
# Istio incluye distributed tracing automático
istioctl install --set profile=demo

# Inyectar sidecar en namespace
kubectl label namespace NEXUS V1 istio-injection=enabled
```

### 4. Backup a Cloud Storage

**Modificar mongodb-backup-cronjob.yaml para usar S3/Azure Blob:**
```yaml
# Agregar container de sync a cloud
- name: cloud-sync
  image: amazon/aws-cli:latest
  command:
    - /bin/bash
    - -c
    - |
      aws s3 sync /backup s3://NEXUS V1-backups/mongodb/ \
        --exclude "*" \
        --include "$(date +%Y%m%d)*"
  volumeMounts:
    - name: backup-storage
      mountPath: /backup
  env:
    - name: AWS_ACCESS_KEY_ID
      valueFrom:
        secretKeyRef:
          name: aws-credentials
          key: access-key-id
    - name: AWS_SECRET_ACCESS_KEY
      valueFrom:
        secretKeyRef:
          name: aws-credentials
          key: secret-access-key
```

---

## 📚 Referencias

- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [OpenTelemetry Node.js](https://opentelemetry.io/docs/instrumentation/js/)
- [Kubernetes CronJobs](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)
- [MongoDB Backup and Restore](https://www.mongodb.com/docs/manual/tutorial/backup-and-restore-tools/)

---

## ✅ Checklist de Deployment

- [ ] Docker Desktop Kubernetes habilitado
- [ ] Metrics Server instalado
- [ ] Namespace `NEXUS V1` creado
- [ ] Jaeger deployado
- [ ] Jaeger UI accesible (port-forward)
- [ ] MongoDB backup CronJob deployado
- [ ] PVC para backups creado
- [ ] Backup manual ejecutado y validado
- [ ] App configurada para enviar traces
- [ ] NetworkPolicies aplicadas
- [ ] Health check ejecutado exitosamente
- [ ] Grafana configurado (opcional)
- [ ] Alertas configuradas (opcional)

---

**Siguiente acción:** Habilitar Kubernetes en Docker Desktop y ejecutar `.\scripts\deploy-k8s.ps1 -Environment dev`

