# 🤖 Guía Premium: Configuración de Telegram para NEXUS V1

Para que el sistema de auditoría y alertas funcione, necesitamos dos valores en tu archivo `.env`. Aquí tienes cómo conseguirlos en 2 minutos:

### 1. Obtener el `TELEGRAM_BOT_TOKEN`
1. Abre Telegram y busca al usuario **@BotFather**.
2. Escribe el comando `/newbot`.
3. Sigue las instrucciones: dale un nombre (ej: `NexusV1_Bot`) y un nombre de usuario (ej: `my_nexus_v1_bot`).
4. **BotFather** te dará un **API Token**. Cópialo.
   - En tu `.env`: `TELEGRAM_BOT_TOKEN=copia_el_token_aqui`

### 2. Obtener tu `TELEGRAM_CHAT_ID`
1. Busca a tu nuevo bot en Telegram (por el nombre de usuario que elegiste) y presiona **START**.
2. Escribe cualquier mensaje al bot (ej: "Hola").
3. Abre tu navegador y pega esta URL (reemplazando `<BOT_TOKEN>` por el que copiaste antes):
   `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Busca en el texto JSON la parte que dice `"chat":{"id":12345678...}`. Ese número es tu ID.
   - En tu `.env`: `TELEGRAM_CHAT_ID=pega_el_numero_aqui`

---

### 🚀 Siguiente Paso
Una vez pegues estos dos valores en el archivo `.env`, avísame y lanzaré la auditoría "God-Level" para confirmar que todo está verde.
