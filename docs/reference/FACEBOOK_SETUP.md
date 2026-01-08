# ♾️ Cómo Conectar NEXUS V1 con Facebook (Meta)

Sigue estos pasos para obtener tu `FACEBOOK_PAGE_ID` y `FACEBOOK_ACCESS_TOKEN`.

---

## 1. Crear una App en Meta for Developers
1. Ve a [developers.facebook.com](https://developers.facebook.com) e inicia sesión con tu cuenta de Facebook.
2. Haz clic en **"Mis Apps"** (My Apps) -> **"Crear App"**.
3. Selecciona el tipo **"Negocios"** (Business) o "Otro". Dale un nombre (ej: "NEXUS V1 Manager") y crea la app.

## 2. Obtener el Token de Acceso (Access Token)
La forma más rápida para empezar es usar el **Graph API Explorer**:

1. Ve a: [Graph API Explorer](https://developers.facebook.com/tools/explorer/).
2. Asegúrate de que tu nueva App ("NEXUS V1 Manager") esté seleccionada en la esquina superior derecha.
3. En **"Usuario o Página"**, selecciona "Obtener token de acceso de usuario".
4. En **"Permisos"** (Add Permissions), añade estos claves:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
5. Haz clic en **"Generate Access Token"**. Acepta los permisos con tu cuenta.
6. **IMPORTANTE**: Ahora, en el desplegable "Usuario o Página", **cambia de "User Token" a tu Página de Facebook** (aparecerá en la lista).
7. El token en el cuadro de texto cambiará. **¡ESE ES TU PAGE ACCESS TOKEN!** Cópialo.

> *Nota: Este token temporal dura poco. Para producción real necesitarás un "Long-Lived Token", pero para probar hoy este sirve.*

## 3. Obtener el ID de la Página (Page ID)
1. Con el Token de Página seleccionado en el Graph API Explorer (paso anterior).
2. Haz una petición `GET` a `me?fields=id,name`.
3. En la respuesta JSON verás `"id": "123456789..."`. Ese es tu `FACEBOOK_PAGE_ID`.

## 4. Configurar NEXUS V1
1. Abre el archivo `NEXUS V1/server/.env`.
2. Añade o actualiza:

```env
FACEBOOK_PAGE_ID=tu_id_copiado
FACEBOOK_ACCESS_TOKEN=tu_token_copiado
```

3. Reinicia el servidor (`CTRL+C` y `npm run dev` en la carpeta `server`).

---

🎉 **¡Listo!** Ahora ve al Dashboard -> Growth Engine -> Meta Command y verás tus estadísticas reales.

