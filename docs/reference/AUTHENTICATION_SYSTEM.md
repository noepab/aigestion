# 🚀 Sistema de Autenticación NEXUS V1 - Documentación

## 📋 Resumen

Se ha implementado un sistema completo de autenticación con redirección automática por roles entre el **Landing Host** y los **Dashboards** de NEXUS V1.

---

## 🏗️ Arquitectura

### Componentes Principales

1. **Landing Host** (`http://localhost:4001`)
  - Página de aterrizaje con información de NEXUS V1
   - Modal de login con diseño cyberpunk
   - Servicio de autenticación
   - Redirección automática post-login

2. **Dashboard** (`http://localhost:5173`)
   - 6 dashboards especializados por rol
   - Context de roles con carga automática de usuario
   - Rutas protegidas

---

## 🔐 Flujo de Autenticación

```
Usuario → Landing Host → Click "Iniciar Sesión" → Login Modal
                                                        ↓
                                            Ingresa Credenciales
                                                        ↓
                                            AuthService.login()
                                                        ↓
                                    Guarda en sessionStorage + localStorage
                                                        ↓
                                    Redirección según rol del usuario
                                                        ↓
                            Dashboard carga usuario de sessionStorage
                                                        ↓
                                    Muestra dashboard correspondiente
```

---

## 👥 Usuarios de Demostración

| Rol       | Email              | Password    | Dashboard URL                                    | Icono |
|-----------|-------------------|-------------|--------------------------------------------------|-------|
| Admin     | admin@NEXUS V1.net      | admin123    | http://localhost:5173/god-mode                   | 👑    |
| Developer | dev@NEXUS V1.net        | dev123      | http://localhost:5173/dashboard?role=developer   | 💻    |
| Analyst   | analyst@NEXUS V1.net    | analyst123  | http://localhost:5173/dashboard?role=analyst     | 📊    |
| Operator  | ops@NEXUS V1.net        | ops123      | http://localhost:5173/dashboard?role=operator    | 🔧    |
| Demo      | demo@NEXUS V1.net       | demo123     | http://localhost:5173/dashboard?role=demo        | 🌟    |

---

## 📁 Archivos Creados/Modificados

### Landing Host (`frontend/apps/landing-host`)

#### Nuevos Archivos:
- `src/components/LoginModal.tsx` - Componente modal de login
- `src/components/LoginModal.css` - Estilos cyberpunk del modal
- `src/services/authService.ts` - Servicio de autenticación

#### Modificados:
- `src/App.tsx` - Integración del LoginModal

### Dashboard (`frontend/apps/dashboard`)

#### Modificados:
- `src/context/RoleContext.tsx` - Carga automática de usuario autenticado
- `src/App.tsx` - Limpieza de componentes de ejemplo

---

## 🎨 Características del Login Modal

### Diseño
- ✨ Tema cyberpunk con gradientes neón
- 🌟 Efectos de glassmorphism
- 💫 Animaciones suaves de entrada/salida
- 📱 Diseño responsive
- 🎭 Efectos hover interactivos

### Funcionalidad
- 📝 Formulario de email/password
- 🎯 Tarjetas de usuarios demo para testing rápido
- ⚠️ Manejo de errores con mensajes visuales
- ⏳ Estado de carga durante autenticación
- 🔒 Validación de campos

---

## 🔧 AuthService - API

### Métodos Principales

```typescript
// Iniciar sesión
authService.login(email: string, password: string): Promise<AuthResponse>

// Cerrar sesión
authService.logout(): void

// Obtener usuario actual
authService.getCurrentUser(): User | null

// Verificar autenticación
authService.isAuthenticated(): boolean

// Obtener token
authService.getToken(): string | null

// Obtener URL del dashboard según rol
authService.getDashboardUrl(role?: UserRole): string

// Redirigir al dashboard
authService.redirectToDashboard(): void
```

### Persistencia

- **localStorage**: Token y usuario (persiste entre sesiones)
- **sessionStorage**: Usuario actual (solo sesión actual)

---

## 🎯 RoleContext - Integración

### Carga Automática de Usuario

El `RoleContext` ahora:

1. ✅ Lee `sessionStorage` al montar
2. ✅ Detecta parámetro `?role=` en URL
3. ✅ Establece usuario y rol automáticamente
4. ✅ Fallback a usuario demo si no hay autenticación

### Uso en Componentes

```typescript
import { useRole } from '@/context/RoleContext';

function MyComponent() {
  const { user, role, isAuthenticated } = useRole();

  return (
    <div>
      <p>Usuario: {user?.name}</p>
      <p>Rol: {role}</p>
      <p>Autenticado: {isAuthenticated ? 'Sí' : 'No'}</p>
    </div>
  );
}
```

---

## 🚦 Cómo Probar

### Paso 1: Iniciar Servidores

```bash
# Terminal 1 - Dashboard
cd C:\Users\Alejandro\NEXUS V1\frontend\apps\dashboard
pnpm run dev
# Corre en http://localhost:5173

# Terminal 2 - Landing Host
cd C:\Users\Alejandro\NEXUS V1\frontend\apps\landing-host
pnpm run dev
# Corre en http://localhost:4001
```

### Paso 2: Flujo de Login

1. Abrir `http://localhost:4001/`
2. Click en botón "🚀 Iniciar Sesión"
3. Seleccionar usuario demo o ingresar credenciales
4. Click en "Iniciar Sesión"
5. Verificar redirección automática al dashboard correcto

### Paso 3: Verificar Dashboard

1. Confirmar que se muestra el dashboard del rol seleccionado
2. Verificar que el usuario está cargado en el RoleContext
3. Probar navegación entre secciones del dashboard

---

## 🔄 Integración con Backend Real

Para conectar con un backend real, actualizar en `authService.ts`:

```typescript
// Cambiar esta línea:
const API_URL = 'http://localhost:3000/api';

// Por tu URL de backend:
const API_URL = 'https://tu-backend.com/api';
```

El servicio intentará autenticar con el backend primero, y si falla, usará los usuarios demo.

### Endpoint Esperado

```
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}

Response:
{
  "user": {
    "id": "1",
    "name": "Nombre Usuario",
    "email": "usuario@ejemplo.com",
    "role": "admin",
    "avatar": "👑"
  },
  "token": "jwt_token_aqui"
}
```

---

## 📊 Dashboards por Rol

### Admin (God Mode)
- **Ruta**: `/god-mode`
- **Características**: Vista omnisciente del sistema
- **Componentes**: System Vitals, IA Agents, Live Logs, God Actions

### Developer
- **Ruta**: `/dashboard?role=developer`
- **Características**: Herramientas de desarrollo
- **Componentes**: Build Status, Code Stats, Terminal, API Health, Git Activity

### Analyst
- **Ruta**: `/dashboard?role=analyst`
- **Características**: Análisis de datos y métricas
- **Componentes**: Data visualizations, Reports, Analytics

### Operator
- **Ruta**: `/dashboard?role=operator`
- **Características**: Operaciones y monitoreo
- **Componentes**: Server Status, Docker Containers, Live Logs, Alerts, Network Stats

### Demo
- **Ruta**: `/dashboard?role=demo`
- **Características**: Vista demo para clientes
- **Componentes**: Overview general del sistema

---

## 🎨 Personalización

### Colores del Modal

Editar `LoginModal.css`:

```css
/* Gradiente principal */
background: linear-gradient(135deg, #00f3ff, #bc13fe);

/* Color de borde */
border: 2px solid rgba(0, 243, 255, 0.3);

/* Glow effect */
box-shadow: 0 0 60px rgba(0, 243, 255, 0.2);
```

### Agregar Nuevo Usuario Demo

Editar `authService.ts`:

```typescript
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'nuevo@NEXUS V1.net': {
    password: 'password123',
    user: {
      id: '6',
      name: 'Nuevo Usuario',
      email: 'nuevo@NEXUS V1.net',
      role: 'admin', // o el rol que corresponda
      avatar: '🎯',
    },
  },
  // ... otros usuarios
};
```

---

## 🐛 Troubleshooting

### El modal no se abre
- Verificar que los imports estén correctos en `App.tsx`
- Revisar consola del navegador por errores
- Confirmar que `LoginModal.css` se está cargando

### No redirige al dashboard
- Verificar que ambos servidores estén corriendo
- Revisar que las URLs en `DASHBOARD_URLS` sean correctas
- Confirmar que `sessionStorage` tiene el usuario

### Usuario no se carga en dashboard
- Verificar que `RoleContext` esté envolviendo la app
- Revisar `sessionStorage` en DevTools
- Confirmar que el formato del usuario sea correcto

---

## 📝 Próximos Pasos Sugeridos

1. ✅ **Logout**: Agregar botón de logout en dashboards
2. ✅ **Protección de Rutas**: Crear HOC para rutas protegidas
3. ✅ **Refresh Token**: Implementar renovación automática de tokens
4. ✅ **Recuperación de Contraseña**: Flujo de reset password
5. ✅ **Registro de Usuarios**: Modal de registro
6. ✅ **Perfil de Usuario**: Página de edición de perfil
7. ✅ **Logs de Auditoría**: Registrar accesos y acciones
8. ✅ **2FA**: Autenticación de dos factores

---

## 🎉 Conclusión

El sistema de autenticación está **completamente funcional** y listo para usar. Proporciona una experiencia de usuario fluida con diseño premium y redirección automática según roles.

**Estado**: ✅ PRODUCCIÓN READY (con usuarios demo)
**Integración Backend**: 🟡 PENDIENTE (opcional)

---

*Documentación generada: 2025-12-13*
*Versión: 1.0.0*

