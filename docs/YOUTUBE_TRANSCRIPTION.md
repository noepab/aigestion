# 📹 Sistema de Transcripción Automática de YouTube - NEXUS V1

## 🎯 Descripción

Sistema automatizado para transcribir videos de YouTube en español y enviar las transcripciones por email. El sistema detecta automáticamente nuevos archivos con URLs de YouTube, descarga la transcripción y la envía al destinatario configurado.

---

## ✨ Características

- ✅ **Detección automática** de archivos con URLs de YouTube
- 🎙️ **Transcripción en español** con soporte para subtítulos autogenerados
- 📧 **Envío automático por email** con formato HTML profesional
- 🔄 **Procesamiento asíncrono** mediante cola RabbitMQ
- 📁 **Organización automática** de archivos procesados
- 🖼️ **Miniaturas de video** incluidas en el email
- ⚡ **Escalable y robusto** con manejo de errores

---

## 🚀 Cómo usar

### 1. Configurar variables de entorno

Edita tu archivo `.env` con tus credenciales de email:

```bash
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=tu-email@gmail.com
EMAIL_PASSWORD=tu-contraseña-de-aplicación
EMAIL_FROM=noreply@NEXUS V1.com
YOUTUBE_TRANSCRIPTION_EMAIL=destinatario@example.com
```

> **Nota para Gmail**: Necesitas usar una "Contraseña de aplicación" en lugar de tu contraseña normal:
> 1. Ve a tu [Cuenta de Google](https://myaccount.google.com/)
> 2. Seguridad → Verificación en 2 pasos (actívala si no lo está)
> 3. Contraseñas de aplicaciones → Generar nueva
> 4. Usa esa contraseña en `EMAIL_PASSWORD`

### 2. Iniciar el sistema

Con Docker:
```bash
docker-compose up -d
```

Sin Docker (desarrollo local):
```bash
cd server
npm run dev
```

### 3. Guardar un video para transcribir

1. Crea un archivo `.txt` en la carpeta `youtube/Videos.Transcripcion/`
2. Escribe la URL del video de YouTube dentro del archivo
3. Guarda el archivo

**Ejemplo:**

Archivo: `youtube/Videos.Transcripcion/tutorial-interesante.txt`
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

### 4. ¡Listo! 🎉

El sistema automáticamente:
1. 🔍 Detectará el nuevo archivo
2. 📥 Extraerá la transcripción del video
3. 📧 Enviará el email con la transcripción
4. 📁 Moverá el archivo a `processed/`

---

## 📧 Formato del Email

El email incluye:
- **Título del video**
- **URL del video**
- **Miniatura del video**
- **Transcripción completa** formateada en párrafos
- **Fecha y hora de procesamiento**
- Versión HTML profesional y versión de texto plano

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│  Archivo .txt   │
│  con URL de YT  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  File Watcher   │ (Chokidar)
│  Detecta archivo│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  RabbitMQ Queue │
│  youtube.trans. │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Consumidor     │
│  Procesa job    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  YouTube API    │
│  Transcription  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email Service  │
│  Nodemailer     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  📧 Email enviado│
│  ✅ Procesado    │
└─────────────────┘
```

---

## 📂 Estructura de archivos

```
NEXUS V1/
├── youtube/
│   └── Videos.Transcripcion/
│       ├── README.md              # Instrucciones de uso
│       ├── processed/             # Archivos ya procesados
│       └── *.txt                  # Archivos con URLs (procesados automáticamente)
│
└── server/
    └── src/
        ├── queue/
        │   └── youtube-transcription.queue.ts   # Cola de procesamiento
        └── utils/
            ├── youtube-transcription.service.ts  # Servicio de transcripción
            ├── youtube-watcher.service.ts        # Vigilante de archivos
            └── email.service.ts                  # Servicio de email
```

---

## 🔧 Servicios implementados

### 1. **YoutubeTranscriptionService**
- Extrae ID de video desde URLs de YouTube
- Descarga transcripciones en español
- Formatea texto para mejor legibilidad

### 2. **EmailService**
- Envía emails con Nodemailer
- Plantillas HTML profesionales
- Soporte para attachments

### 3. **YoutubeWatcherService**
- Monitorea carpeta con Chokidar
- Detecta nuevos archivos .txt
- Mueve archivos procesados

### 4. **YoutubeTranscriptionQueue**
- Gestiona cola RabbitMQ
- Procesamiento asíncrono
- Manejo de errores y reintentos

---

## ⚙️ Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `EMAIL_HOST` | Servidor SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Puerto SMTP | `587` |
| `EMAIL_USERNAME` | Usuario del email | `tu-email@gmail.com` |
| `EMAIL_PASSWORD` | Contraseña de aplicación | `abcd efgh ijkl mnop` |
| `EMAIL_FROM` | Email del remitente | `noreply@NEXUS V1.com` |
| `YOUTUBE_TRANSCRIPTION_EMAIL` | Email del destinatario | `destinatario@example.com` |

---

## 🐛 Solución de problemas

### El sistema no detecta archivos

1. Verifica que la carpeta existe: `youtube/Videos.Transcripcion/`
2. Revisa los logs del servidor: `docker-compose logs -f app`
3. Asegúrate de usar extensión `.txt`

### No se reciben emails

1. Verifica las credenciales de email en `.env`
2. Para Gmail, usa una contraseña de aplicación
3. Revisa los logs: busca "Email enviado" o errores
4. Verifica que el email de destino sea correcto

### Error de transcripción

1. Verifica que el video tenga subtítulos en español
2. Comprueba que la URL sea válida
3. Algunos videos privados no tienen transcripciones disponibles

### La cola RabbitMQ no procesa

1. Verifica que RabbitMQ esté corriendo: `docker-compose ps rabbitmq`
2. Revisa la consola de RabbitMQ: `http://localhost:15672`
3. Usuario: `admin`, Password: `admin123` (por defecto)

---

## 📊 Monitoreo

### Ver logs del sistema
```bash
docker-compose logs -f app
```

### Ver estadísticas de RabbitMQ
```bash
docker-compose exec rabbitmq rabbitmqctl list_queues
```

### Verificar archivos procesados
```bash
ls youtube/Videos.Transcripcion/processed/
```

---

## 🧪 Pruebas

Para probar el sistema:

1. Guarda este archivo como `test-video.txt`:
```
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

2. Cópialo a `youtube/Videos.Transcripcion/`

3. Observa los logs:
```bash
docker-compose logs -f app | grep -i "youtube\|transcription\|email"
```

4. Revisa tu email

---

## 🎨 Ejemplo de email recibido

```
┌──────────────────────────────────────────┐
│  📹 Transcripción de YouTube             │
├──────────────────────────────────────────┤
│                                          │
│  📺 Título del Video                     │
│  🔗 https://youtube.com/watch?v=...      │
│  🆔 Video ID: dQw4w9WgXcQ                │
│  📅 07/12/2025, 10:30:25                 │
│                                          │
│  [Miniatura del video]                   │
│                                          │
│  📝 Transcripción completa:              │
│  ─────────────────────────────────────   │
│  Aquí aparece la transcripción           │
│  completa del video en español,          │
│  formateada en párrafos legibles...      │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🔐 Seguridad

- ✅ Las contraseñas se almacenan en `.env` (no en código)
- ✅ `.env` está en `.gitignore`
- ✅ Usar contraseñas de aplicación para Gmail
- ✅ Validación de URLs de YouTube
- ✅ Manejo seguro de archivos

---

## 🚀 Mejoras futuras

- [ ] Soporte para múltiples idiomas
- [ ] Resumen de transcripción con IA (Gemini)
- [ ] Interfaz web para gestionar transcripciones
- [ ] Notificaciones por Telegram/Discord
- [ ] Estadísticas de uso
- [ ] Búsqueda en transcripciones

---

## 📝 Notas

- Solo funciona con videos que tengan subtítulos/transcripciones disponibles
- Los subtítulos autogenerados también son soportados
- El sistema es tolerante a fallos y reintenta en caso de error
- Los archivos se archivan automáticamente en `processed/`

---

## 🤝 Soporte

Si tienes problemas:
1. Revisa los logs: `docker-compose logs -f app`
2. Verifica las configuraciones de email
3. Comprueba que RabbitMQ esté corriendo
4. Consulta la documentación del proyecto NEXUS V1

---

**¡Disfruta de tus transcripciones automáticas! 🎉**

